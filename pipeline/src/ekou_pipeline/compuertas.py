"""Compuertas de calidad del corte (ADR 0002, decisión 5.3).

Las pruebas de dbt detienen el corte si un dato está mal. Las compuertas lo detienen si el
corte en conjunto se ve mal: una fuente que llega casi vacía, la cobertura del mapa por debajo
del umbral, o una caída brusca frente al corte anterior (por ejemplo, una vista de SECOP que
queda vacía sin dar error). Si alguna falla, el corte no se publica y se mantiene el anterior.
"""

import csv
from dataclasses import dataclass
from pathlib import Path

import duckdb
import structlog

from ekou_pipeline.bronze import extracted_rows
from ekou_pipeline.catalog import CATALOG
from ekou_pipeline.config import Settings

log = structlog.get_logger(__name__)

FUENTES = ("secop_i", "secop_ii")


@dataclass(frozen=True, slots=True)
class Resultado:
    compuerta: str
    detalle: str
    aprobada: bool


@dataclass(frozen=True, slots=True)
class _Fuente:
    contratos: int
    pct_en_mapa_municipal: float


def evaluar(
    conn: duckdb.DuckDBPyConnection,
    settings: Settings,
    *,
    corte: str,
    anterior: Path | None = None,
) -> list[Resultado]:
    """Evalúa todas las compuertas sobre el bronze y la base del corte; ``anterior`` es el
    ``calidad_corte.csv`` publicado del corte previo, si existe."""
    resultados = _filas_extraidas(settings, corte)
    actual = _fuentes_actuales(conn)

    for fuente in FUENTES:
        datos = actual.get(fuente)
        contratos = datos.contratos if datos else 0
        resultados.append(
            Resultado(f"{fuente}: contratos", f"{contratos:,} contratos", contratos > 0)
        )
        if datos is None:
            continue
        resultados.append(
            Resultado(
                f"{fuente}: ubicados en el mapa",
                f"{datos.pct_en_mapa_municipal:.1%} (mínimo {settings.gate_min_pct_mapa:.0%})",
                datos.pct_en_mapa_municipal >= settings.gate_min_pct_mapa,
            )
        )

    row = conn.execute("select count(distinct cod_mpio) from mapa_municipios").fetchone()
    municipios = int(row[0]) if row else 0
    resultados.append(
        Resultado(
            "municipios en el mapa",
            f"{municipios:,} (mínimo {settings.gate_min_municipios:,})",
            municipios >= settings.gate_min_municipios,
        )
    )

    if anterior is not None:
        resultados += _comparar(actual, _fuentes_anteriores(anterior), settings)
    return resultados


def _filas_extraidas(settings: Settings, corte: str) -> list[Resultado]:
    """Cada fuente debe traer al menos su mínimo del catálogo. Detecta un origen que se recargó
    a medias: su ``count(*)`` también cae, así que la extracción cuadra y no lo nota."""
    resultados = []
    for spec in CATALOG.values():
        filas = extracted_rows(settings.data_dir, corte, spec)
        resultados.append(
            Resultado(
                f"{spec.key}: filas extraídas",
                f"{filas:,} (mínimo {spec.min_rows:,})",
                filas >= spec.min_rows and filas > 0,
            )
        )
    return resultados


def _comparar(
    actual: dict[str, _Fuente], previo: dict[str, _Fuente], settings: Settings
) -> list[Resultado]:
    resultados: list[Resultado] = []
    for fuente in FUENTES:
        antes, ahora = previo.get(fuente), actual.get(fuente)
        if antes is None or ahora is None or antes.contratos == 0:
            continue
        caida = 1 - ahora.contratos / antes.contratos
        resultados.append(
            Resultado(
                f"{fuente}: contratos frente al corte anterior",
                f"{antes.contratos:,} → {ahora.contratos:,} ({-caida:+.2%}; "
                f"caída máxima {settings.gate_max_caida_contratos:.0%})",
                caida <= settings.gate_max_caida_contratos,
            )
        )
        puntos = antes.pct_en_mapa_municipal - ahora.pct_en_mapa_municipal
        resultados.append(
            Resultado(
                f"{fuente}: ubicados frente al corte anterior",
                f"{antes.pct_en_mapa_municipal:.1%} → {ahora.pct_en_mapa_municipal:.1%} "
                f"(caída máxima {settings.gate_max_caida_pct_mapa * 100:.0f} puntos)",
                puntos <= settings.gate_max_caida_pct_mapa,
            )
        )
    return resultados


def _fuentes_actuales(conn: duckdb.DuckDBPyConnection) -> dict[str, _Fuente]:
    rows = conn.execute(
        "select fuente, contratos, pct_en_mapa_municipal from calidad_corte"
    ).fetchall()
    return {str(f): _Fuente(int(c), float(p)) for f, c, p in rows}


def _fuentes_anteriores(path: Path) -> dict[str, _Fuente]:
    with path.open(encoding="utf-8", newline="") as f:
        return {
            row["fuente"]: _Fuente(int(row["contratos"]), float(row["pct_en_mapa_municipal"]))
            for row in csv.DictReader(f)
        }


def reporte(resultados: list[Resultado], *, corte: str) -> str:
    """Tabla en Markdown, para el resumen del workflow."""
    lines = [
        f"## Compuertas de calidad del corte {corte}",
        "",
        "| | Compuerta | Detalle |",
        "|---|---|---|",
    ]
    lines += [
        f"| {'✅' if r.aprobada else '❌'} | {r.compuerta} | {r.detalle} |" for r in resultados
    ]
    return "\n".join(lines) + "\n"
