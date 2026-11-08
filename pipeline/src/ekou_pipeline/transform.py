"""Capas silver y gold: ejecuta el proyecto dbt de ``pipeline/transform`` sobre DuckDB.

``dbt build`` construye los modelos y corre sus pruebas en orden: si una prueba de un modelo
falla, los modelos que dependen de él no se construyen. Así un dato malo no llega a gold.
"""

import json
import os
from pathlib import Path

import structlog

from ekou_pipeline.config import Settings

log = structlog.get_logger(__name__)

TRANSFORM_DIR = Path(__file__).resolve().parents[2] / "transform"


def dbt_args(settings: Settings, *, corte: str, select: str | None = None) -> list[str]:
    data_dir = settings.data_dir.resolve()
    variables = {"corte": corte, "data_dir": data_dir.as_posix()}
    args = [
        "build",
        "--project-dir",
        str(TRANSFORM_DIR),
        "--profiles-dir",
        str(TRANSFORM_DIR),
        "--target-path",
        (data_dir / "dbt" / "target").as_posix(),
        "--log-path",
        (data_dir / "dbt" / "logs").as_posix(),
        "--vars",
        json.dumps(variables),
    ]
    if select:
        args += ["--select", select]
    return args


def run_transform(settings: Settings, *, corte: str, select: str | None = None) -> bool:
    from dbt.cli.main import dbtRunner  # importación diferida: dbt tarda en cargar

    # profiles.yml ubica la base de DuckDB con esta variable.
    os.environ["EKOU_DATA_DIR"] = settings.data_dir.resolve().as_posix()
    os.environ.setdefault("DBT_SEND_ANONYMOUS_USAGE_STATS", "false")
    args = dbt_args(settings, corte=corte, select=select)
    log.info("transform.inicio", corte=corte, select=select)
    result = dbtRunner().invoke(args)
    log.info("transform.fin", corte=corte, exito=result.success)
    if result.exception is not None:
        log.error("transform.error", error=str(result.exception))
    return bool(result.success)
