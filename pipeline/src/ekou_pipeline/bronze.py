"""Extracción a la capa bronze: los datos tal como llegan de la API, en Parquet particionado.

Estructura en disco::

    {data_dir}/bronze/corte=2026-11/fuente=secop_contratos/particion=2025/part-00000.parquet
                                                                      .../_SUCCESS.json

- **Paralelo por partición:** cada año se extrae en su propio hilo, con paginación keyset.
- **Reanudable e idempotente:** una partición con ``_SUCCESS.json`` se salta; una partición
  incompleta (una ejecución que falló a mitad) se borra y se vuelve a extraer.
- **Verificable:** cada partición registra cuántas filas esperaba según el origen y cuántas
  extrajo, para que las compuertas de calidad puedan comparar.
"""

import json
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
import structlog

from ekou_pipeline.catalog import DatasetSpec
from ekou_pipeline.socrata import Row, SocrataClient

log = structlog.get_logger(__name__)

SUCCESS_MARKER = "_SUCCESS.json"
NO_DATE_PARTITION = "sin_fecha"
SINGLE_PARTITION = "todo"


@dataclass(frozen=True, slots=True)
class Partition:
    name: str
    where: str | None
    expected_rows: int | None


@dataclass(frozen=True, slots=True)
class PartitionResult:
    name: str
    rows: int
    expected_rows: int | None
    files: int
    seconds: float
    skipped: bool

    @property
    def rows_per_second(self) -> float:
        return self.rows / self.seconds if self.seconds > 0 else 0.0


@dataclass(frozen=True, slots=True)
class ExtractionReport:
    dataset: str
    corte: str
    partitions: tuple[PartitionResult, ...]
    seconds: float

    @property
    def rows(self) -> int:
        return sum(p.rows for p in self.partitions)

    @property
    def expected_rows(self) -> int | None:
        expected = [p.expected_rows for p in self.partitions]
        return None if any(e is None for e in expected) else sum(e for e in expected if e)


def dataset_dir(data_dir: Path, corte: str, spec: DatasetSpec) -> Path:
    return data_dir / "bronze" / f"corte={corte}" / f"fuente={spec.key}"


def plan_partitions(client: SocrataClient, spec: DatasetSpec) -> list[Partition]:
    """Divide el dataset por año de la columna de fecha, con el conteo esperado de cada año."""
    column = spec.year_partition_column
    if column is None:
        return [Partition(SINGLE_PARTITION, None, None)]
    counts = client.query(
        spec.socrata_id,
        {
            "$select": f"date_extract_y({column}) AS anio, count(*) AS filas",
            "$group": "anio",
            "$order": "anio",
        },
    )
    partitions = []
    for row in counts:
        expected = int(row["filas"])
        if row.get("anio") is None:
            partitions.append(Partition(NO_DATE_PARTITION, f"{column} IS NULL", expected))
            continue
        year = int(row["anio"])
        where = f"{column} >= '{year}-01-01T00:00:00' AND {column} < '{year + 1}-01-01T00:00:00'"
        partitions.append(Partition(str(year), where, expected))
    return partitions


def extract_dataset(
    client: SocrataClient,
    spec: DatasetSpec,
    *,
    data_dir: Path,
    corte: str,
    max_workers: int,
) -> ExtractionReport:
    start = time.perf_counter()
    target = dataset_dir(data_dir, corte, spec)
    partitions = plan_partitions(client, spec)
    log.info("bronze.inicio", fuente=spec.key, corte=corte, particiones=len(partitions))

    # Las particiones grandes primero: el tiempo total queda limitado por la más lenta.
    ordered = sorted(partitions, key=lambda p: p.expected_rows or 0, reverse=True)
    results: list[PartitionResult] = []
    with ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="bronze") as pool:
        futures = [
            pool.submit(_extract_partition, client, spec, p, target / f"particion={p.name}", corte)
            for p in ordered
        ]
        for future in as_completed(futures):
            results.append(future.result())

    report = ExtractionReport(
        dataset=spec.key,
        corte=corte,
        partitions=tuple(sorted(results, key=lambda r: r.name)),
        seconds=time.perf_counter() - start,
    )
    log.info(
        "bronze.fin",
        fuente=spec.key,
        corte=corte,
        filas=report.rows,
        filas_esperadas=report.expected_rows,
        segundos=round(report.seconds, 1),
    )
    return report


def _extract_partition(
    client: SocrataClient, spec: DatasetSpec, partition: Partition, path: Path, corte: str
) -> PartitionResult:
    marker = path / SUCCESS_MARKER
    if marker.exists():
        done = json.loads(marker.read_text(encoding="utf-8"))
        log.info("bronze.particion_en_cache", fuente=spec.key, particion=partition.name)
        return PartitionResult(**{**done, "skipped": True})

    if path.exists():  # quedó a medias en una ejecución anterior
        shutil.rmtree(path)
    path.mkdir(parents=True)

    start = time.perf_counter()
    extracted_at = datetime.now(tz=UTC).isoformat()
    schema = _bronze_schema(spec)
    rows = files = 0
    for page in client.iter_pages(spec.socrata_id, spec.columns, where=partition.where):
        table = _to_table(page, spec, schema, corte=corte, extracted_at=extracted_at)
        pq.write_table(table, path / f"part-{files:05d}.parquet", compression="zstd")
        rows += len(page)
        files += 1
        log.debug("bronze.pagina", fuente=spec.key, particion=partition.name, filas=rows)

    result = PartitionResult(
        name=partition.name,
        rows=rows,
        expected_rows=partition.expected_rows,
        files=files,
        seconds=time.perf_counter() - start,
        skipped=False,
    )
    marker.write_text(json.dumps(asdict(result), ensure_ascii=False), encoding="utf-8")
    log.info(
        "bronze.particion_lista",
        fuente=spec.key,
        particion=partition.name,
        filas=rows,
        filas_esperadas=partition.expected_rows,
        segundos=round(result.seconds, 1),
        filas_por_segundo=round(result.rows_per_second),
    )
    return result


def _bronze_schema(spec: DatasetSpec) -> pa.Schema:
    """En bronze todo se guarda como texto, tal como llega. Los tipos se asignan en silver."""
    fields = [pa.field("_socrata_id", pa.string(), nullable=False)]
    fields += [pa.field(column, pa.string()) for column in spec.columns]
    fields += [pa.field("_corte", pa.string()), pa.field("_extraido_en", pa.string())]
    return pa.schema(fields)


def _to_table(
    page: list[Row], spec: DatasetSpec, schema: pa.Schema, *, corte: str, extracted_at: str
) -> pa.Table:
    columns: dict[str, list[str | None]] = {
        "_socrata_id": [str(row[":id"]) for row in page],
    }
    for column in spec.columns:
        columns[column] = [_as_text(row.get(column)) for row in page]
    columns["_corte"] = [corte] * len(page)
    columns["_extraido_en"] = [extracted_at] * len(page)
    return pa.table(columns, schema=schema)


def _as_text(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)  # campos anidados (por ejemplo, URLs)
