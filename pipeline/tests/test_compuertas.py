import json
from pathlib import Path

import duckdb
import pytest

from ekou_pipeline.bronze import SUCCESS_MARKER, dataset_dir
from ekou_pipeline.catalog import CATALOG
from ekou_pipeline.cli import main
from ekou_pipeline.compuertas import Resultado, evaluar, reporte
from ekou_pipeline.config import Settings


def _warehouse(
    path: Path,
    *,
    fuentes: dict[str, tuple[int, float]],
    municipios: int = 1_100,
    corte: str = "2026-12",
) -> None:
    with duckdb.connect(str(path)) as conn:
        conn.execute(
            "create table calidad_corte "
            "(fuente varchar, corte varchar, contratos bigint, pct_en_mapa_municipal double)"
        )
        for fuente, (contratos, pct) in fuentes.items():
            conn.execute(
                "insert into calidad_corte values (?, ?, ?, ?)", [fuente, corte, contratos, pct]
            )
        conn.execute(
            "create table mapa_municipios as select lpad(i::varchar, 5, '0') as cod_mpio "
            "from range(?) t(i)",
            [municipios],
        )


def _bronze(data_dir: Path, filas: dict[str, int | None] | None = None) -> None:
    """Bronze del corte 2026-12 con el mínimo de filas de cada fuente, salvo las indicadas en
    ``filas`` (``None``: fuente sin extraer)."""
    filas = filas or {}
    for key, spec in CATALOG.items():
        rows = filas.get(key, spec.min_rows)
        if rows is None:
            continue
        # Dos particiones, para comprobar que se suman.
        for nombre, parte in (("a", rows // 2), ("b", rows - rows // 2)):
            path = dataset_dir(data_dir, "2026-12", spec) / f"particion={nombre}"
            path.mkdir(parents=True)
            (path / SUCCESS_MARKER).write_text(json.dumps({"rows": parte}), encoding="utf-8")


def _anterior(path: Path, filas: dict[str, tuple[int, float]]) -> Path:
    lines = ["fuente,corte,contratos,pct_en_mapa_municipal"]
    lines += [f"{f},2026-11,{c},{p}" for f, (c, p) in filas.items()]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


SANO = {"secop_i": (5_729_913, 0.883), "secop_ii": (5_687_090, 0.843)}


def _fallidas(resultados: list[Resultado]) -> list[str]:
    return [r.compuerta for r in resultados if not r.aprobada]


def _evaluar(
    tmp_path: Path,
    anterior: Path | None = None,
    filas: dict[str, int | None] | None = None,
    **kwargs: object,
) -> list[Resultado]:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, **kwargs)  # type: ignore[arg-type]
    _bronze(tmp_path, filas)
    with duckdb.connect(str(database), read_only=True) as conn:
        return evaluar(conn, Settings(data_dir=tmp_path), corte="2026-12", anterior=anterior)


def test_healthy_corte_passes_every_gate(tmp_path: Path) -> None:
    anterior = _anterior(tmp_path / "anterior.csv", SANO)
    resultados = _evaluar(tmp_path, anterior, fuentes=SANO)
    assert _fallidas(resultados) == []
    # filas de cada fuente del catálogo, 2 por fuente de contratos, municipios y
    # 2 comparaciones por fuente de contratos
    assert len(resultados) == len(CATALOG) + 9


def test_source_reloaded_half_way_fails(tmp_path: Path) -> None:
    """15-nov-2026: SECOP II Procesos quedó con 1.000 filas en origen y su count(*) también."""
    resultados = _evaluar(tmp_path, fuentes=SANO, filas={"secop_procesos": 1_000})
    assert _fallidas(resultados) == ["secop_procesos: filas extraídas"]
    detalle = next(r.detalle for r in resultados if not r.aprobada)
    assert detalle == f"1,000 (mínimo {CATALOG['secop_procesos'].min_rows:,})"


def test_source_not_extracted_fails(tmp_path: Path) -> None:
    resultados = _evaluar(tmp_path, fuentes=SANO, filas={"divipola": None})
    assert _fallidas(resultados) == ["divipola: filas extraídas"]


def test_missing_source_fails(tmp_path: Path) -> None:
    resultados = _evaluar(tmp_path, fuentes={"secop_ii": SANO["secop_ii"]})
    assert _fallidas(resultados) == ["secop_i: contratos"]


def test_low_map_coverage_fails(tmp_path: Path) -> None:
    fuentes = {**SANO, "secop_ii": (5_687_090, 0.70)}
    assert _fallidas(_evaluar(tmp_path, fuentes=fuentes, municipios=900)) == [
        "secop_ii: ubicados en el mapa",
        "municipios en el mapa",
    ]


def test_drop_against_previous_corte_fails(tmp_path: Path) -> None:
    anterior = _anterior(tmp_path / "anterior.csv", SANO)
    # Una vista de origen que se vacía a medias: -5 % de contratos y -3 puntos de cobertura.
    fuentes = {**SANO, "secop_i": (5_443_417, 0.853)}
    assert _fallidas(_evaluar(tmp_path, anterior, fuentes=fuentes)) == [
        "secop_i: contratos frente al corte anterior",
        "secop_i: ubicados frente al corte anterior",
    ]


def test_growth_against_previous_corte_passes(tmp_path: Path) -> None:
    anterior = _anterior(tmp_path / "anterior.csv", SANO)
    fuentes = {**SANO, "secop_ii": (5_800_000, 0.85)}
    assert _fallidas(_evaluar(tmp_path, anterior, fuentes=fuentes)) == []


def test_report_marks_each_gate() -> None:
    texto = reporte(
        [Resultado("a", "bien", aprobada=True), Resultado("b", "mal", aprobada=False)],
        corte="2026-12",
    )
    assert "| ✅ | a | bien |" in texto
    assert "| ❌ | b | mal |" in texto


def test_cli_exit_code_follows_the_gates(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    _warehouse(tmp_path / "ekou.duckdb", fuentes=SANO)
    _bronze(tmp_path)
    assert main(["compuertas", "--corte", "2026-12"]) == 0
    assert "Compuertas de calidad del corte 2026-12" in capsys.readouterr().out

    anterior = _anterior(tmp_path / "anterior.csv", {**SANO, "secop_ii": (9_000_000, 0.843)})
    assert main(["compuertas", "--corte", "2026-12", "--anterior", str(anterior)]) == 1
    assert "❌ | secop_ii: contratos frente al corte anterior" in capsys.readouterr().out
