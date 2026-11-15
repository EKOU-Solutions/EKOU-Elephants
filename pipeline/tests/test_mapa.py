import json
from datetime import UTC, datetime
from pathlib import Path

import duckdb
import pytest

from ekou_pipeline.cli import main
from ekou_pipeline.mapa import export_mapa, fecha_corte, nombre_visible


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


def test_cut_date_is_the_last_day_of_the_month() -> None:
    assert fecha_corte("2026-11") == "2026-11-30"
    assert fecha_corte("2028-02") == "2028-02-29"


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


def test_export_writes_the_contract_shape(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    out = tmp_path / "r2"
    with duckdb.connect(str(database), read_only=True) as conn:
        paths = export_mapa(
            conn, corte="2026-11", out_dir=out, publicado_en=datetime(2026, 11, 7, tzinfo=UTC)
        )

    assert [p.relative_to(out).as_posix() for p in paths] == [
        "2026-11/mapa/municipios.json",
        "2026-11/corte.json",
        "latest.json",
    ]
    municipios = json.loads((out / "2026-11/mapa/municipios.json").read_text("utf-8"))
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

    corte = json.loads((out / "2026-11/corte.json").read_text("utf-8"))
    assert corte["fechaCorte"] == "2026-11-30"
    assert corte["publicadoEn"] == "2026-11-07T00:00:00Z"
    assert corte["geometria"] == "mgn-2025"
    assert {f["id"] for f in corte["fuentes"]} >= {"jbjy-vk9h", "gdxc-w37w", "mgn-2025"}
    assert json.loads((out / "latest.json").read_text("utf-8")) == {"corte": "2026-11"}


def test_export_refuses_another_cut(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, corte="2026-10")
    with (
        duckdb.connect(str(database), read_only=True) as conn,
        pytest.raises(ValueError, match="2026-10"),
    ):
        export_mapa(conn, corte="2026-11", out_dir=tmp_path / "r2")
    assert not (tmp_path / "r2").exists()


def test_cli_exports_to_the_local_bucket(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _warehouse(tmp_path / "ekou.duckdb")
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    assert main(["export-mapa", "--corte", "2026-11"]) == 0
    assert (tmp_path / "r2/datos/latest.json").exists()
    assert len(capsys.readouterr().out.splitlines()) == 3
