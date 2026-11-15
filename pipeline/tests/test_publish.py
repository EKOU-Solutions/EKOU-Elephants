from pathlib import Path

import duckdb
import pyarrow.parquet as pq
import pytest

from ekou_pipeline.cli import main
from ekou_pipeline.publish import CorteMismatchError, export_corte, publication_dir


def _warehouse(path: Path, corte: str = "2026-11") -> None:
    with duckdb.connect(str(path)) as conn:
        conn.execute("create table contratos as select 'CO1.1' as id_contrato, 1000 as valor")
        conn.execute("create table mapa_municipios as select '05001' as cod_mpio, 3 as contratos")
        conn.execute(
            f"""create table calidad_corte as select 'secop_ii' as fuente, '{corte}' as corte,
            10 as contratos, 0.875 as pct_en_mapa_municipal, 0.05 as pct_sin_ubicacion,
            1 as alertas_error_magnitud, 0 as contratos_firma_futura"""
        )


def test_export_writes_open_files(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _warehouse(tmp_path / "ekou.duckdb")
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))

    assert main(["export", "--corte", "2026-11"]) == 0

    out = publication_dir(tmp_path, "2026-11")
    names = sorted(p.name for p in out.iterdir())
    assert names == [
        "calidad_corte.csv",
        "calidad_corte.parquet",
        "contratos.parquet",
        "mapa_municipios.csv",
        "mapa_municipios.parquet",
        "resumen.md",
    ]
    assert pq.read_table(out / "contratos.parquet").num_rows == 1
    assert "| secop_ii | 10 | 87.50% | 5.00% | 1 | 0 |" in (out / "resumen.md").read_text("utf-8")
    assert len(capsys.readouterr().out.splitlines()) == 6


def test_export_refuses_a_different_corte(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, corte="2026-10")
    with (
        duckdb.connect(str(database), read_only=True) as conn,
        pytest.raises(CorteMismatchError),
    ):
        export_corte(conn, corte="2026-11", out_dir=tmp_path / "salida")
    assert not (tmp_path / "salida").exists()
