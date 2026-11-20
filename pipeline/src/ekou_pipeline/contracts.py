"""Contract detail (TASK-12): exports the gold model ``contract_detail`` for the API.

API contract: ``docs/design/pages/contract-detail/contract.md``.

The data Worker holds at most 20,000 files, so the contracts (about 6.8 million) go in
``GROUPS`` files instead of one file per contract::

    <out_dir>/<group>.ndjson    one contract per line, as the API returns it (without ``cut``)

The group comes from the contract id alone (``group_of``), so the API opens exactly one file per
request. Every line starts with ``{"id":"<id>",``: the API finds its line by text search and
parses only that line. ``src/modules/contracts/adapters/data-worker`` mirrors both rules.

``pack`` puts the groups in a few ``.tar.gz`` files for the Release, which takes loose files
only. The monthly cut unpacks them into ``datos/<cut>/contratos/`` of the data Worker.
"""

import hashlib
import json
import shutil
import tarfile
from collections.abc import Iterator
from dataclasses import dataclass
from itertools import groupby
from pathlib import Path
from typing import Any

import duckdb
import structlog

from ekou_pipeline.mapa import nombre_visible
from ekou_pipeline.publish import check_corte

log = structlog.get_logger(__name__)

GROUPS = 16_384
"""Files per cut. Under the 20,000 files of a Worker version, with room for the other files."""

PACKAGES = 4
"""Release files. Each stays far below the 2 GiB limit of a Release asset."""

_BATCH = 20_000

# The group in SQL: the same rule as `group_of`, so DuckDB can sort by it.
_GROUP_SQL = f"(('0x' || substr(sha256(id), 1, 4))::int * {GROUPS} // 65536)"

_COLUMNS = (
    "id",
    "source",
    "source_url",
    "description",
    "contract_type",
    "is_public_works",
    "procurement_method",
    "method_justification",
    "status",
    "source_status",
    "provisional",
    "buyer_name",
    "buyer_tax_id",
    "supplier_kind",
    "supplier_name",
    "supplier_tax_id",
    "municipality_code",
    "municipality_name",
    "department_code",
    "department_name",
    "signed_on",
    "starts_on",
    "ends_on",
    "added_days",
    "current_cents",
    "initial_cents",
    "change_pct",
    "exceeds_legal_addition_limit",
    "amount_reliable",
    "paid_cents",
)


@dataclass(frozen=True, slots=True)
class ExportReport:
    contracts: int
    files: int
    bytes: int


def group_of(contract_id: str) -> str:
    """File of a contract: the first 16 bits of its SHA-256, scaled to ``GROUPS``, in hex."""
    prefix = int(hashlib.sha256(contract_id.encode()).hexdigest()[:4], 16)
    return f"{prefix * GROUPS // 65536:04x}"


def _iso(value: Any) -> str | None:
    return None if value is None else value.isoformat()


def _supplier(row: dict[str, Any]) -> dict[str, Any]:
    # TASK-08: only a company is identified. The model already blanks the rest; building the
    # object from `kind` keeps a name out of the file even if the model changes.
    if row["supplier_kind"] == "company" and row["supplier_name"]:
        return {"kind": "company", "name": row["supplier_name"], "taxId": row["supplier_tax_id"]}
    if row["supplier_kind"] == "natural_person":
        return {"kind": "natural_person"}
    return {"kind": "unknown"}


def contract_detail(row: dict[str, Any]) -> dict[str, Any]:
    """One row of ``contract_detail`` as the API returns it. ``id`` must stay the first key."""
    return {
        "id": row["id"],
        "source": row["source"],
        "sourceUrl": row["source_url"],
        "description": row["description"],
        "type": row["contract_type"],
        "isPublicWorks": row["is_public_works"],
        "procurementMethod": row["procurement_method"],
        "methodJustification": row["method_justification"],
        "status": row["status"],
        "sourceStatus": row["source_status"],
        "provisional": row["provisional"],
        "buyer": {"name": row["buyer_name"], "taxId": row["buyer_tax_id"]},
        "supplier": _supplier(row),
        "location": {
            "municipality": {
                "code": row["municipality_code"],
                "name": nombre_visible(row["municipality_name"]),
            },
            "department": {
                "code": row["department_code"],
                "name": nombre_visible(row["department_name"]),
            },
        },
        "dates": {
            "signed": _iso(row["signed_on"]),
            "start": _iso(row["starts_on"]),
            "end": _iso(row["ends_on"]),
            "addedDays": row["added_days"],
        },
        "amounts": {
            "currentCents": row["current_cents"],
            "initialCents": row["initial_cents"],
            "changePct": row["change_pct"],
            "exceedsLegalAdditionLimit": row["exceeds_legal_addition_limit"],
            "reliable": row["amount_reliable"],
            "paidCents": row["paid_cents"],
        },
    }


def _rows(conn: duckdb.DuckDBPyConnection) -> Iterator[tuple[int, dict[str, Any]]]:
    # Column names come from a constant, never from user input.
    cursor = conn.execute(
        f"select {_GROUP_SQL} as grp, {', '.join(_COLUMNS)} from contract_detail order by grp, id"  # noqa: S608
    )
    while batch := cursor.fetchmany(_BATCH):
        for grp, *values in batch:
            yield grp, dict(zip(_COLUMNS, values, strict=True))


def export_contracts(conn: duckdb.DuckDBPyConnection, *, corte: str, out_dir: Path) -> ExportReport:
    """Writes one file per group in ``out_dir``, replacing what was there."""
    check_corte(conn, corte)

    shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True)
    contracts = files = size = 0
    for grp, rows in groupby(_rows(conn), key=lambda item: item[0]):
        lines = [
            json.dumps(contract_detail(row), ensure_ascii=False, separators=(",", ":"))
            for _, row in rows
        ]
        data = ("\n".join(lines) + "\n").encode()
        (out_dir / f"{grp:04x}.ndjson").write_bytes(data)
        contracts += len(lines)
        files += 1
        size += len(data)
    report = ExportReport(contracts=contracts, files=files, bytes=size)
    log.info("contracts.export", corte=corte, contratos=contracts, archivos=files, bytes=size)
    return report


def pack(groups_dir: Path, out_dir: Path) -> list[Path]:
    """Packs the group files in ``PACKAGES`` archives, ``contratos-<n>.tar.gz``, by file name."""
    out_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(groups_dir.glob("*.ndjson"))
    written: list[Path] = []
    for n in range(PACKAGES):
        path = out_dir / f"contratos-{n}.tar.gz"
        with tarfile.open(path, "w:gz", compresslevel=6) as tar:
            for file in files:
                if int(file.stem, 16) * PACKAGES // GROUPS == n:
                    tar.add(file, arcname=file.name)
        written.append(path)
    log.info("contracts.pack", archivos=[p.name for p in written])
    return written
