import json
from datetime import UTC, date, datetime
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from ekou_pipeline.cli import main
from ekou_pipeline.mapa import export_mapa, fecha_de_los_datos, nombre_visible


@pytest.mark.parametrize(
    ("oficial", "visible"),
    [
        ("MEDELLÍN", "Medellín"),
        ("VILLA DE SAN DIEGO DE UBATÉ", "Villa de San Diego de Ubaté"),
        ("BOGOTÁ, D.C.", "Bogotá, D.C."),
        ("EL CARMEN DE VIBORAL", "El Carmen de Viboral"),
        ("LA GUAJIRA", "La Guajira"),
        ("SOTARÁ - PAISPAMBA", "Sotará - Paispamba"),
        (
            "ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA",
            "Archipiélago de San Andrés, Providencia y Santa Catalina",
        ),
        ("GÜICÁN DE LA SIERRA", "Güicán de la Sierra"),
        ("NORTE DE  SANTANDER", "Norte de Santander"),
    ],
)
def test_official_names_become_readable(oficial: str, visible: str) -> None:
    assert nombre_visible(oficial) == visible


def _bronze(data_dir: Path, extracciones: dict[str, str], corte: str = "2026-11") -> None:
    for fuente, extraido_en in extracciones.items():
        ruta = data_dir / "bronze" / f"corte={corte}" / f"fuente={fuente}" / "particion=todo"
        ruta.mkdir(parents=True)
        pq.write_table(pa.table({"_extraido_en": [extraido_en]}), ruta / "part-00000.parquet")


def test_data_date_is_the_oldest_extraction_in_colombian_time(tmp_path: Path) -> None:
    # 00:30 UTC del 8 de noviembre son las 19:30 del 7 de noviembre en Colombia.
    _bronze(
        tmp_path,
        {
            "divipola": "2026-11-08T00:30:35+00:00",
            "secop_contratos": "2026-11-08T00:49:03+00:00",
            "secop_i": "2026-11-09T15:00:00+00:00",
        },
    )
    with duckdb.connect() as conn:
        assert fecha_de_los_datos(conn, tmp_path / "bronze", "2026-11") == date(2026, 11, 7)


def test_data_date_requires_bronze(tmp_path: Path) -> None:
    _bronze(tmp_path, {"divipola": "2026-10-02T00:00:00+00:00"}, corte="2026-10")
    with duckdb.connect() as conn, pytest.raises(ValueError, match="2026-11"):
        fecha_de_los_datos(conn, tmp_path / "bronze", "2026-11")


def _warehouse(path: Path, corte: str = "2026-11") -> None:
    with duckdb.connect(str(path)) as conn:
        conn.execute(
            """
            create table mapa_municipios_corte as
            select * from (values
                ('05001', 'MEDELLÍN', 'municipio', '05', 'CO-ANT', 'ANTIOQUIA', 2021, 2026, 640861),
                ('81001', 'ARAUCA', 'municipio', '81', 'CO-ARA', 'ARAUCA', 2021, 2026, null)
            ) t(cod_mpio, nom_mpio, tipo, cod_dpto, iso_3166_2, nom_dpto,
                ventana_desde, ventana_hasta, contratos_ubicados)
            """
        )
        conn.execute("alter table mapa_municipios_corte add column corte varchar")
        conn.execute("update mapa_municipios_corte set corte = ?", [corte])
        conn.execute(
            """
            create table mapa_niveles_corte as
            select *, 2021 as ventana_desde, 2026 as ventana_hasta, ? as corte from (values
                ('municipio', '05', 640861),
                ('departamento', '05', 25000),
                ('departamento', '81', 1200),
                ('sin_lugar', null, 300)
            ) t(nivel, cod_dpto, contratos)
            """,
            [corte],
        )


def test_export_writes_the_contract_shape(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    out = tmp_path / "publicacion" / "2026-11"
    with duckdb.connect(str(database), read_only=True) as conn:
        paths = export_mapa(
            conn,
            corte="2026-11",
            fecha_datos=date(2026, 11, 7),
            out_dir=out,
            publicado_en=datetime(2026, 11, 8, 2, tzinfo=UTC),
        )

    assert [p.relative_to(out).as_posix() for p in paths] == [
        "municipios.json",
        "departamentos.json",
        "corte.json",
    ]
    municipios = json.loads((out / "municipios.json").read_text("utf-8"))
    assert municipios["ventana"] == {"desde": 2021, "hasta": 2026}
    assert municipios["municipios"][0] == {
        "codigo": "05001",
        "nombre": "Medellín",
        "tipo": "municipio",
        "departamento": {"codigo": "05", "iso": "CO-ANT", "nombre": "Antioquia"},
        "contratosUbicados": 640861,
    }
    # Sin contratos ubicados: null, nunca 0.
    assert municipios["municipios"][1]["contratosUbicados"] is None

    departamentos = json.loads((out / "departamentos.json").read_text("utf-8"))
    assert departamentos["nacional"] == {
        "contratos": 667361,
        "contratosEnMunicipios": 640861,
        "contratosSoloDepartamento": 26200,
        "contratosSinLugar": 300,
    }
    assert departamentos["departamentos"] == [
        {
            "codigo": "05",
            "iso": "CO-ANT",
            "nombre": "Antioquia",
            "contratosEnMunicipios": 640861,
            "contratosSoloDepartamento": 25000,
        },
        {  # sin contratos ubicados en sus municipios: 0 medido, no "sin datos"
            "codigo": "81",
            "iso": "CO-ARA",
            "nombre": "Arauca",
            "contratosEnMunicipios": 0,
            "contratosSoloDepartamento": 1200,
        },
    ]

    corte = json.loads((out / "corte.json").read_text("utf-8"))
    assert corte["fechaCorte"] == "2026-11-07"
    assert corte["publicadoEn"] == "2026-11-08T02:00:00Z"
    assert corte["geometria"] == "mgn-2025"
    assert {f["id"] for f in corte["fuentes"]} >= {"jbjy-vk9h", "gdxc-w37w", "mgn-2025"}


def test_export_refuses_another_cut(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, corte="2026-10")
    with (
        duckdb.connect(str(database), read_only=True) as conn,
        pytest.raises(ValueError, match="2026-10"),
    ):
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=tmp_path / "out")
    assert not (tmp_path / "out").exists()


def test_cli_exports_to_the_publication_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _warehouse(tmp_path / "ekou.duckdb")
    _bronze(tmp_path, {"divipola": "2026-11-08T00:30:35+00:00"})
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    assert main(["export-mapa", "--corte", "2026-11"]) == 0
    corte = json.loads((tmp_path / "publicacion/2026-11/corte.json").read_text("utf-8"))
    assert corte["fechaCorte"] == "2026-11-07"
    assert len(capsys.readouterr().out.splitlines()) == 3
