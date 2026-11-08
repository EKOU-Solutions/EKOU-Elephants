from pathlib import Path

import httpx
import pyarrow.parquet as pq
import pytest
import respx

from ekou_pipeline.bronze import SUCCESS_MARKER, dataset_dir, extract_dataset
from ekou_pipeline.catalog import DatasetSpec
from ekou_pipeline.socrata import VERSION_HEADER, DatasetReplacedError, SocrataClient, SocrataError

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


@respx.mock
def test_restarts_partition_when_source_is_replaced(client: SocrataClient, tmp_path: Path) -> None:
    """SECOP se reconstruye a diario: si cambia a mitad, la partición se rehace completa."""
    versions = iter(["v1", "v2", "v2", "v2"])

    def api(request: httpx.Request) -> httpx.Response:
        params = request.url.params
        if "$group" in params:
            return httpx.Response(200, json=[{"anio": "2024", "filas": "3"}])
        response = _fake_api(request)
        response.headers[VERSION_HEADER] = next(versions)
        return response

    respx.get(RESOURCE).mock(side_effect=api)

    report = extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=1)

    assert report.rows == 3
    table = pq.read_table(dataset_dir(tmp_path, "2026-11", SPEC) / "particion=2024")
    assert sorted(table.column("_socrata_id").to_pylist()) == ["row-1", "row-2", "row-3"]


@respx.mock
def test_gives_up_when_source_keeps_changing(client: SocrataClient, tmp_path: Path) -> None:
    counter = iter(range(100))

    def api(request: httpx.Request) -> httpx.Response:
        if "$group" in request.url.params:
            return httpx.Response(200, json=[{"anio": "2024", "filas": "3"}])
        response = _fake_api(request)
        response.headers[VERSION_HEADER] = f"v{next(counter)}"
        return response

    respx.get(RESOURCE).mock(side_effect=api)
    with pytest.raises(DatasetReplacedError):
        extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=1)


@respx.mock
def test_reextracts_partitions_when_columns_change(client: SocrataClient, tmp_path: Path) -> None:
    route = respx.get(RESOURCE).mock(side_effect=_fake_api)
    extract_dataset(client, SPEC, data_dir=tmp_path, corte="2026-11", max_workers=1)

    wider = DatasetSpec(
        key=SPEC.key,
        socrata_id=SPEC.socrata_id,
        columns=(*SPEC.columns, "nueva"),
        year_partition_column="fecha",
    )
    calls = route.call_count
    report = extract_dataset(client, wider, data_dir=tmp_path, corte="2026-11", max_workers=1)

    assert not any(p.skipped for p in report.partitions)
    assert route.call_count > calls + 1
    table = pq.read_table(dataset_dir(tmp_path, "2026-11", wider) / "particion=2024")
    assert "nueva" in table.column_names


@respx.mock
def test_out_of_range_years_go_to_one_partition(client: SocrataClient, tmp_path: Path) -> None:
    spec = DatasetSpec(
        key="rango",
        socrata_id="abcd-1234",
        columns=("nombre",),
        year_partition_column="fecha",
        min_year=2014,
    )
    years = [("2001", "4"), ("2024", "3"), ("2099", "2")]

    def api(request: httpx.Request) -> httpx.Response:
        if "$group" in request.url.params:
            return httpx.Response(200, json=[{"anio": y, "filas": n} for y, n in years])
        return httpx.Response(200, json=[{":id": "row-1"}])

    respx.get(RESOURCE).mock(side_effect=api)
    report = extract_dataset(client, spec, data_dir=tmp_path, corte="2026-11", max_workers=1)

    by_name = {p.name: p for p in report.partitions}
    assert set(by_name) == {"2024", "fuera_de_rango"}
    assert by_name["fuera_de_rango"].expected_rows == 6


@respx.mock
def test_explicit_partitions_must_cover_the_dataset(client: SocrataClient, tmp_path: Path) -> None:
    spec = DatasetSpec(
        key="explicita",
        socrata_id="abcd-1234",
        columns=("id",),
        explicit_partitions=(("a", "starts_with(id, 'A')"), ("b", "starts_with(id, 'B')")),
    )
    counts = {"starts_with(id, 'A')": "2", "starts_with(id, 'B')": "1"}
    total = {"value": "3"}

    def api(request: httpx.Request) -> httpx.Response:
        params = request.url.params
        if params.get("$select") == "count(*) AS filas":
            where = params.get("$where")
            return httpx.Response(200, json=[{"filas": counts[where] if where else total["value"]}])
        return httpx.Response(200, json=[{":id": "row-1", "id": "A1"}])

    respx.get(RESOURCE).mock(side_effect=api)
    report = extract_dataset(client, spec, data_dir=tmp_path, corte="2026-11", max_workers=2)
    assert {p.name: p.expected_rows for p in report.partitions} == {"a": 2, "b": 1}

    total["value"] = "4"  # una fila que ninguna partición cubre
    with pytest.raises(SocrataError, match="cubren 3 filas de 4"):
        extract_dataset(client, spec, data_dir=tmp_path / "otra", corte="2026-11", max_workers=1)
