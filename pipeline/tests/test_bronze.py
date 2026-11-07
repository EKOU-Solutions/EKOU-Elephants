from pathlib import Path

import httpx
import pyarrow.parquet as pq
import respx

from ekou_pipeline.bronze import SUCCESS_MARKER, dataset_dir, extract_dataset
from ekou_pipeline.catalog import DatasetSpec
from ekou_pipeline.socrata import SocrataClient

from .conftest import BASE

SPEC = DatasetSpec(
    key="prueba",
    socrata_id="abcd-1234",
    columns=("nombre", "fecha"),
    year_partition_column="fecha",
)
RESOURCE = f"{BASE}/resource/abcd-1234.json"


def _fake_api(request: httpx.Request) -> httpx.Response:
    params = request.url.params
    if "$group" in params:  # planificación de particiones
        return httpx.Response(200, json=[{"anio": "2024", "filas": "3"}, {"filas": "1"}])
    where = params.get("$where", "")
    if "IS NULL" in where:
        return httpx.Response(200, json=[{":id": "row-9", "nombre": "sin fecha"}])
    if ":id > 'row-2'" in where:
        return httpx.Response(200, json=[{":id": "row-3", "nombre": "c", "fecha": "2024-03-01"}])
    return httpx.Response(
        200,
        json=[
            {":id": "row-1", "nombre": "a", "fecha": "2024-01-01", "extra": {"url": "x"}},
            {":id": "row-2", "nombre": {"url": "https://ejemplo"}, "fecha": "2024-02-01"},
        ],
    )


@respx.mock
def test_extracts_partitions_to_parquet(client: SocrataClient, tmp_path: Path) -> None:
    respx.get(RESOURCE).mock(side_effect=_fake_api)

    report = extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=2)

    assert report.rows == 4
    assert report.expected_rows == 4
    by_name = {p.name: p for p in report.partitions}
    assert by_name["2024"].rows == 3
    assert by_name["2024"].files == 2
    assert by_name["sin_fecha"].rows == 1

    base = dataset_dir(tmp_path, "2026-11", SPEC)
    table = pq.read_table(base / "particion=2024")
    assert table.num_rows == 3
    assert table.column_names == ["_socrata_id", "nombre", "fecha", "_corte", "_extraido_en"]
    assert set(table.column("_corte").to_pylist()) == {"2026-11"}
    assert '{"url": "https://ejemplo"}' in table.column("nombre").to_pylist()


@respx.mock
def test_skips_completed_partitions_and_redoes_incomplete(
    client: SocrataClient, tmp_path: Path
) -> None:
    route = respx.get(RESOURCE).mock(side_effect=_fake_api)
    extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=1)
    calls_first_run = route.call_count

    base = dataset_dir(tmp_path, "2026-11", SPEC)
    (base / "particion=sin_fecha" / SUCCESS_MARKER).unlink()  # simula una falla a mitad
    (base / "particion=sin_fecha" / "basura.tmp").write_text("x")

    report = extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=1)

    by_name = {p.name: p for p in report.partitions}
    assert by_name["2024"].skipped
    assert not by_name["sin_fecha"].skipped
    assert not (base / "particion=sin_fecha" / "basura.tmp").exists()
    # solo se repiten la planificación y la partición incompleta
    assert route.call_count - calls_first_run == 2


@respx.mock
def test_single_partition_without_date_column(client: SocrataClient, tmp_path: Path) -> None:
    spec = DatasetSpec(key="simple", socrata_id="abcd-1234", columns=("nombre",))
    respx.get(RESOURCE).mock(return_value=httpx.Response(200, json=[{":id": "row-1"}]))

    report = extract_dataset(client, spec, data_dir=tmp_path, corte="2026-11", max_workers=1)

    assert [p.name for p in report.partitions] == ["todo"]
    assert report.rows == 1
    assert report.expected_rows is None
