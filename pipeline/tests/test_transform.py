"""Prueba de integración: dbt construye silver y gold sobre un bronze mínimo de ejemplo."""

import csv
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from ekou_pipeline.catalog import CATALOG
from ekou_pipeline.config import Settings
from ekou_pipeline.transform import TRANSFORM_DIR, run_transform

CORTE = "2026-11"

FILAS: dict[str, list[dict[str, str]]] = {
    "divipola": [
        {"cod_dpto": "05", "dpto": "ANTIOQUIA", "cod_mpio": "05001", "nom_mpio": "MEDELLÍN"},
        {"cod_dpto": "05", "dpto": "ANTIOQUIA", "cod_mpio": "05576", "nom_mpio": "PUEBLORRICO"},
        {
            "cod_dpto": "76",
            "dpto": "VALLE DEL CAUCA",
            "cod_mpio": "76001",
            "nom_mpio": "SANTIAGO DE CALI",
        },
    ],
    "secop_contratos": [
        {  # obra de la gobernación que se ejecuta en otro municipio
            "id_contrato": "CO1.PCCNTR.1",
            "proceso_de_compra": "CO1.BDOS.1",
            "nombre_entidad": "DEPARTAMENTO DE ANTIOQUIA",
            "nit_entidad": "890900286",
            "departamento": "Antioquia",
            "ciudad": "Medellín",
            "tipo_de_contrato": "Obra",
            "modalidad_de_contratacion": "Licitación pública Obra Publica",
            "estado_contrato": "En ejecución",
            "fecha_de_firma": "2025-03-01T00:00:00.000",
            "fecha_de_inicio_del_contrato": "2025-03-10T00:00:00.000",
            "fecha_de_fin_del_contrato": "2025-12-31T00:00:00.000",
            "tipodocproveedor": "NIT",
            "documento_proveedor": "900123456",
            "proveedor_adjudicado": "CONSTRUCTORA S.A.S.",
            "valor_del_contrato": "150000000",
            "urlproceso": '{"url": "https://community.secop.gov.co/x"}',
            "ultima_actualizacion": "2025-06-01T00:00:00.000",
        },
        {  # persona natural, contratada por la alcaldía de Cali (alias del nombre)
            "id_contrato": "CO1.PCCNTR.2",
            "proceso_de_compra": "CO1.BDOS.2",
            "nombre_entidad": "ALCALDIA DE SANTIAGO DE CALI",
            "nit_entidad": "890399011",
            "departamento": "Valle del Cauca",
            "ciudad": "Cali",
            "tipo_de_contrato": "Prestación de servicios",
            "modalidad_de_contratacion": "Contratación directa",
            "estado_contrato": "terminado",
            "fecha_de_firma": "2025-02-01T00:00:00.000",
            "tipodocproveedor": "Cédula de Ciudadanía",
            "documento_proveedor": "1023456789",
            "proveedor_adjudicado": "JUAN PEREZ",
            "valor_del_contrato": "6453840000000000",
        },
        {  # su proceso declara una duración imposible, tomada del corte real
            "id_contrato": "CO1.PCCNTR.3",
            "proceso_de_compra": "CO1.BDOS.3",
            "nombre_entidad": "MUNICIPIO DE MEDELLIN",
            "nit_entidad": "890905211",
            "departamento": "Antioquia",
            "ciudad": "Medellín",
            "tipo_de_contrato": "Suministro",
            "modalidad_de_contratacion": "Selección abreviada de menor cuantía",
            "estado_contrato": "En ejecución",
            "fecha_de_firma": "2025-04-01T00:00:00.000",
            "fecha_de_inicio_del_contrato": "2025-04-02T00:00:00.000",
            "tipodocproveedor": "NIT",
            "documento_proveedor": "900654321",
            "proveedor_adjudicado": "SUMINISTROS S.A.S.",
            "valor_del_contrato": "20000000",
        },
        {  # $39.251 billones, respaldados por un proceso con el mismo error de origen
            "id_contrato": "CO1.PCCNTR.4",
            "proceso_de_compra": "CO1.BDOS.4",
            "nombre_entidad": "MUNICIPIO DE MEDELLIN",
            "nit_entidad": "890905211",
            "departamento": "Antioquia",
            "ciudad": "Medellín",
            "tipo_de_contrato": "Otro",
            "modalidad_de_contratacion": "Contratación directa",
            "estado_contrato": "En ejecución",
            "fecha_de_firma": "2021-06-01T00:00:00.000",
            "tipodocproveedor": "NIT",
            "documento_proveedor": "900777888",
            "proveedor_adjudicado": "OPERADOR S.A.S.",
            "valor_del_contrato": "39251534400000000",
        },
    ],
    "secop_procesos": [
        {
            "id_del_portafolio": "CO1.BDOS.1",
            "valor_total_adjudicacion": "100000000",
            "precio_base": "110000000",
            "duracion": "6",
            "unidad_de_duracion": "Mes(es)",
        },
        {
            "id_del_portafolio": "CO1.BDOS.2",
            "valor_total_adjudicacion": "0",
            "precio_base": "64538400",
        },
        {
            "id_del_portafolio": "CO1.BDOS.3",
            "valor_total_adjudicacion": "20000000",
            "duracion": "915430000",
            "unidad_de_duracion": "Dia(s)",
        },
        {
            "id_del_portafolio": "CO1.BDOS.4",
            "precio_base": "39251534400000000",
        },
    ],
    "secop_ubicaciones": [
        {"id_contrato": "CO1.PCCNTR.1", "ubicacion": "COLOMBIA»Antioquia»Pueblorrico"},
    ],
    "secop_i": [
        {
            "uid": "25-12-1",
            "nombre_entidad": "MUNICIPIO DE MEDELLIN",
            "departamento_entidad": "Antioquia",
            "municipio_entidad": "Medellín",
            "municipios_ejecucion": "Medellín",
            "tipo_de_contrato": "Obra",
            "fecha_de_firma_del_contrato": "2025-05-01T00:00:00.000",
            "tipo_identifi_del_contratista": "Cédula de Ciudadanía",
            "identificacion_del_contratista": "1023456789",
            "cuantia_contrato": "10000000",
            "valor_contrato_con_adiciones": "10000000",
            "ultima_actualizacion": "2025-06-01T00:00:00.000",
        },
        {  # fecha de firma digitada mal en origen
            "uid": "99-12-1",
            "nombre_entidad": "MUNICIPIO DE MEDELLIN",
            "departamento_entidad": "Antioquia",
            "municipio_entidad": "Medellín",
            "municipios_ejecucion": "Medellín",
            "tipo_de_contrato": "Obra",
            "fecha_de_firma_del_contrato": "2099-05-01T00:00:00.000",
            "tipo_identifi_del_contratista": "NIT",
            "identificacion_del_contratista": "900111222",
            "cuantia_contrato": "5000000",
            "valor_contrato_con_adiciones": "5000000",
        },
        {
            "uid": "25-12-1",
            "nombre_entidad": "MUNICIPIO DE MEDELLIN",  # repetido en origen
            "fecha_de_firma_del_contrato": "2025-05-01T00:00:00.000",
        },
    ],
}


def _divipola_de_los_alias() -> list[dict[str, str]]:
    """Los seeds verifican que cada alias apunte a un código de DIVIPOLA existente."""
    seeds = TRANSFORM_DIR / "seeds"
    rows = []
    with (seeds / "alias_municipios.csv").open(encoding="utf-8") as f:
        for alias in csv.DictReader(f):
            rows.append(
                {
                    "cod_dpto": alias["cod_dpto"],
                    "dpto": f"D{alias['cod_dpto']}",
                    "cod_mpio": alias["cod_mpio"],
                    "nom_mpio": alias["nota"],
                }
            )
    with (seeds / "alias_departamentos.csv").open(encoding="utf-8") as f:
        for alias in csv.DictReader(f):
            rows.append(
                {
                    "cod_dpto": alias["cod_dpto"],
                    "dpto": f"D{alias['cod_dpto']}",
                    "cod_mpio": f"{alias['cod_dpto']}999",
                    "nom_mpio": "OTRO",
                }
            )
    return rows


def _write_bronze(data_dir: Path) -> None:
    existentes = {r["cod_mpio"] for r in FILAS["divipola"]}
    extra = {r["cod_mpio"]: r for r in _divipola_de_los_alias() if r["cod_mpio"] not in existentes}
    filas = {**FILAS, "divipola": FILAS["divipola"] + list(extra.values())}
    for key, rows in filas.items():
        spec = CATALOG[key]
        columns: dict[str, list[str | None]] = {
            "_socrata_id": [f"row-{i}" for i in range(len(rows))]
        }
        for column in spec.columns:
            columns[column] = [row.get(column) for row in rows]
        columns["_corte"] = [CORTE] * len(rows)
        columns["_extraido_en"] = ["2026-11-07T00:00:00+00:00"] * len(rows)
        path = data_dir / "bronze" / f"corte={CORTE}" / f"fuente={key}" / "particion=todo"
        path.mkdir(parents=True)
        table = pa.table(columns, schema=pa.schema([(c, pa.string()) for c in columns]))
        pq.write_table(table, path / "part-00000.parquet")


@pytest.fixture(scope="module")
def warehouse(tmp_path_factory: pytest.TempPathFactory) -> duckdb.DuckDBPyConnection:
    data_dir = tmp_path_factory.mktemp("datos")
    _write_bronze(data_dir)
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("EKOU_PSEUDONYM_KEY", "k" * 32)
        assert run_transform(Settings(data_dir=data_dir), corte=CORTE)
    # dbt-duckdb deja su conexión abierta en este proceso: se abre con la misma configuración.
    return duckdb.connect(str(data_dir / "ekou.duckdb"))


def _contrato(conn: duckdb.DuckDBPyConnection, id_contrato: str) -> dict[str, object]:
    cursor = conn.execute("select * from contratos where id_contrato = ?", [id_contrato])
    names = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    assert row is not None
    return dict(zip(names, row, strict=True))


def test_execution_place_is_not_the_entity_seat(warehouse: duckdb.DuckDBPyConnection) -> None:
    obra = _contrato(warehouse, "CO1.PCCNTR.1")
    assert obra["cod_mpio_sede"] == "05001"
    assert obra["cod_mpio_ejecucion"] == "05576"
    assert obra["confianza_ubicacion"] == "media_alta"
    assert obra["valor_inicial"] == 100_000_000
    assert obra["adicion_supera_50pct"] is False
    assert obra["estado_ejecucion"] == "vencido_sin_cierre"
    assert obra["url_proceso"] == "https://community.secop.gov.co/x"
    assert obra["contratista_id"] == "nit:900123456"


def test_natural_persons_are_pseudonymized(warehouse: duckdb.DuckDBPyConnection) -> None:
    persona = _contrato(warehouse, "CO1.PCCNTR.2")
    assert persona["tipo_persona_contratista"] == "natural"
    assert persona["nombre_contratista"] is None
    assert str(persona["contratista_id"]).startswith("k1_")
    # El mismo documento tiene el mismo seudónimo en SECOP I y SECOP II.
    assert _contrato(warehouse, "25-12-1")["contratista_id"] == persona["contratista_id"]


def test_magnitude_error_is_flagged_not_deleted(warehouse: duckdb.DuckDBPyConnection) -> None:
    persona = _contrato(warehouse, "CO1.PCCNTR.2")
    assert persona["alerta_valor"] == "error_magnitud"
    assert persona["valor_confiable"] is False
    assert persona["valor_corregido_propuesto"] == 64_538_400


def test_impossible_value_is_excluded_even_if_the_process_matches(
    warehouse: duckdb.DuckDBPyConnection,
) -> None:
    contrato = _contrato(warehouse, "CO1.PCCNTR.4")
    assert contrato["valor_inicial"] == contrato["valor_actual"]
    assert contrato["alerta_valor"] == "error_magnitud"
    assert contrato["valor_confiable"] is False


def test_original_end_date_from_declared_duration(warehouse: duckdb.DuckDBPyConnection) -> None:
    assert str(_contrato(warehouse, "CO1.PCCNTR.1")["fecha_fin_original"]) == "2025-09-10"


def test_impossible_duration_leaves_no_end_date(warehouse: duckdb.DuckDBPyConnection) -> None:
    # 915 M de días sacaban la fecha del rango de DuckDB y tumbaban todo el corte.
    assert _contrato(warehouse, "CO1.PCCNTR.3")["fecha_fin_original"] is None


def test_source_duplicates_are_removed(warehouse: duckdb.DuckDBPyConnection) -> None:
    sql = "select count(*) from contratos where id_contrato = '25-12-1'"
    row = warehouse.execute(sql).fetchone()
    assert row == (1,)


def test_future_signing_dates_stay_out_of_the_map(warehouse: duckdb.DuckDBPyConnection) -> None:
    # El contrato se conserva en silver y se cuenta en calidad, pero no llega al mapa.
    assert _contrato(warehouse, "99-12-1")["anio_firma"] == 2099
    anios = warehouse.execute("select distinct anio_firma from mapa_municipios").fetchall()
    assert (2099,) not in anios
    row = warehouse.execute(
        "select contratos_firma_futura from calidad_corte where fuente = 'secop_i'"
    ).fetchone()
    assert row == (1,)


def test_gold_excludes_outliers_and_low_confidence(warehouse: duckdb.DuckDBPyConnection) -> None:
    rows = warehouse.execute(
        "select cod_mpio, contratos, valor_contratado from mapa_municipios order by cod_mpio"
    ).fetchall()
    assert ("05576", 1, 150_000_000) in rows
    cali = [r for r in rows if r[0] == "76001"]
    assert cali == [("76001", 1, None)]  # el contrato existe, pero su valor no se suma
