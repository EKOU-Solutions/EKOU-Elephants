"""Publicación: exporta las tablas de un corte ya transformado a archivos abiertos.

Escribe en ``<data_dir>/publicacion/<corte>/``:

- ``contratos.parquet``: la capa silver completa (las cédulas ya van seudonimizadas).
- ``mapa_municipios`` y ``calidad_corte`` en Parquet y CSV.
- ``resumen.md``: el reporte de calidad en una tabla, para las notas del release.
"""

from pathlib import Path

import duckdb
import structlog

log = structlog.get_logger(__name__)

TABLES: dict[str, tuple[str, ...]] = {
    "contratos": ("parquet",),
    "mapa_municipios": ("parquet", "csv"),
    "calidad_corte": ("parquet", "csv"),
}

_FORMAT_OPTIONS = {
    "parquet": "(format parquet, compression zstd)",
    "csv": "(format csv, header true)",
}

_SUMMARY_COLUMNS = (
    "fuente",
    "contratos",
    "pct_en_mapa_municipal",
    "pct_sin_ubicacion",
    "alertas_error_magnitud",
    "contratos_firma_futura",
)


class CorteMismatchError(RuntimeError):
    """La base de DuckDB contiene un corte distinto al que se quiere publicar."""


def publication_dir(data_dir: Path, corte: str) -> Path:
    return data_dir / "publicacion" / corte


def export_corte(conn: duckdb.DuckDBPyConnection, *, corte: str, out_dir: Path) -> list[Path]:
    """Exporta las tablas del corte y devuelve las rutas escritas."""
    cortes = {row[0] for row in conn.execute("select distinct corte from calidad_corte").fetchall()}
    if cortes != {corte}:
        raise CorteMismatchError(f"la base tiene el corte {sorted(cortes)}, no {corte}")

    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for table, formats in TABLES.items():
        for fmt in formats:
            path = out_dir / f"{table}.{fmt}"
            # Los nombres de tabla y formato salen de constantes, nunca de la entrada del usuario.
            conn.execute(
                f"copy (select * from {table}) to '{path.as_posix()}' {_FORMAT_OPTIONS[fmt]}"  # noqa: S608
            )
            written.append(path)

    summary = out_dir / "resumen.md"
    summary.write_text(_summary_markdown(conn, corte), encoding="utf-8")
    written.append(summary)
    log.info("publicacion.fin", corte=corte, archivos=[p.name for p in written])
    return written


def _summary_markdown(conn: duckdb.DuckDBPyConnection, corte: str) -> str:
    columns = ", ".join(_SUMMARY_COLUMNS)
    rows = conn.execute(f"select {columns} from calidad_corte order by fuente").fetchall()  # noqa: S608
    lines = [
        f"## Corte {corte}",
        "",
        "Reporte de calidad por fuente (completo en `calidad_corte.csv`).",
        "",
        "| " + " | ".join(_SUMMARY_COLUMNS) + " |",
        "|" + "---|" * len(_SUMMARY_COLUMNS),
    ]
    for row in rows:
        cells = (_format(c, v) for c, v in zip(_SUMMARY_COLUMNS, row, strict=True))
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def _format(column: str, value: object) -> str:
    if column.startswith("pct_") and value is not None:
        return f"{float(value):.2%}"  # type: ignore[arg-type]
    return "" if value is None else str(value)
