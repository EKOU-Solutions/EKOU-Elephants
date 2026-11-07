"""Línea de comandos del pipeline.

Ejemplo::

    ekou-pipeline extract secop_contratos --corte 2026-11
"""

import argparse
import json
import re
import sys
from collections.abc import Sequence
from dataclasses import asdict
from datetime import UTC, datetime

from ekou_pipeline.bronze import extract_dataset
from ekou_pipeline.catalog import CATALOG
from ekou_pipeline.config import Settings
from ekou_pipeline.log_config import configure_logging
from ekou_pipeline.socrata import SocrataClient

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
    extract.add_argument(
        "--corte",
        type=_corte,
        default=datetime.now(tz=UTC).strftime("%Y-%m"),
        help="corte mensual AAAA-MM (por defecto, el mes actual)",
    )
    return parser


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


if __name__ == "__main__":
    raise SystemExit(main())
