"""Línea de comandos del pipeline.

Ejemplo::

    ekou-pipeline extract secop_contratos --corte 2026-11
    ekou-pipeline transform --corte 2026-11
    ekou-pipeline compuertas --corte 2026-11 --anterior calidad_corte_anterior.csv
    ekou-pipeline export --corte 2026-11
"""

import argparse
import json
import re
import sys
from collections.abc import Sequence
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path

import duckdb

from ekou_pipeline.bronze import extract_dataset
from ekou_pipeline.catalog import CATALOG
from ekou_pipeline.compuertas import evaluar, reporte
from ekou_pipeline.config import Settings
from ekou_pipeline.log_config import configure_logging
from ekou_pipeline.publish import check_corte, export_corte, publication_dir
from ekou_pipeline.socrata import SocrataClient
from ekou_pipeline.transform import run_transform

_CORTE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _corte(value: str) -> str:
    if not _CORTE.match(value):
        raise argparse.ArgumentTypeError("el corte debe tener el formato AAAA-MM")
    return value


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ekou-pipeline", description=__doc__)
    parser.add_argument("--log-level", default="INFO")
    parser.add_argument("--pretty-logs", action="store_true", help="logs legibles en consola")
    commands = parser.add_subparsers(dest="command", required=True)

    extract = commands.add_parser("extract", help="extrae fuentes a la capa bronze")
    extract.add_argument("datasets", nargs="+", choices=sorted(CATALOG))
    _add_corte(extract)

    transform = commands.add_parser(
        "transform", help="construye las capas silver y gold con dbt y corre sus pruebas"
    )
    _add_corte(transform)
    transform.add_argument(
        "--select", help="modelos de dbt a construir (sintaxis de dbt; por defecto, todos)"
    )

    compuertas = commands.add_parser(
        "compuertas", help="verifica las compuertas de calidad del corte antes de publicarlo"
    )
    _add_corte(compuertas)
    compuertas.add_argument(
        "--anterior",
        type=Path,
        help="calidad_corte.csv del corte publicado anterior, para comparar contra él",
    )

    export = commands.add_parser(
        "export", help="exporta el corte transformado a Parquet, CSV y JSON para publicarlo"
    )
    _add_corte(export)
    return parser


def _add_corte(command: argparse.ArgumentParser) -> None:
    command.add_argument(
        "--corte",
        type=_corte,
        default=datetime.now(tz=UTC).strftime("%Y-%m"),
        help="corte mensual AAAA-MM (por defecto, el mes actual)",
    )


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    configure_logging(args.log_level, json=not args.pretty_logs)
    settings = Settings()

    if args.command == "extract":
        reports = []
        with SocrataClient(settings) as client:
            for key in args.datasets:
                report = extract_dataset(
                    client,
                    CATALOG[key],
                    data_dir=settings.data_dir,
                    corte=args.corte,
                    max_workers=settings.max_workers,
                )
                reports.append(
                    {**asdict(report), "rows": report.rows, "expected_rows": report.expected_rows}
                )
        json.dump(reports, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
        return 0

    database = settings.data_dir / "ekou.duckdb"
    if args.command == "compuertas":
        with duckdb.connect(str(database), read_only=True) as conn:
            check_corte(conn, args.corte)
            resultados = evaluar(conn, settings, anterior=args.anterior)
        sys.stdout.write(reporte(resultados, corte=args.corte))
        return 0 if all(r.aprobada for r in resultados) else 1

    if args.command == "export":
        with duckdb.connect(str(database), read_only=True) as conn:
            paths = export_corte(
                conn, corte=args.corte, out_dir=publication_dir(settings.data_dir, args.corte)
            )
        sys.stdout.write("".join(f"{p.as_posix()}\n" for p in paths))
        return 0

    return 0 if run_transform(settings, corte=args.corte, select=args.select) else 1


if __name__ == "__main__":
    raise SystemExit(main())
