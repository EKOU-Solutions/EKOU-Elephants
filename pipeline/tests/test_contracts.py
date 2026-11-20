import hashlib
import json
import tarfile
from datetime import date
from pathlib import Path

import duckdb
import pytest

from ekou_pipeline.cli import main
from ekou_pipeline.contracts import (
    GROUPS,
    PACKAGES,
    contract_detail,
    export_contracts,
    group_of,
    pack,
)
from ekou_pipeline.publish import CorteMismatchError

COMPANY = "CO1.PCCNTR.7954915"
PERSON = "25-12-14382349-13325351"

_ROW = {
    "id": COMPANY,
    "source": "secop_ii",
    "source_url": "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.1",
    "description": "Mantenimiento de vías rurales",
    "contract_type": "Obra",
    "is_public_works": True,
    "procurement_method": "Contratación directa",
    "method_justification": None,
    "status": "expired_unclosed",
    "source_status": "Modificado",
    "provisional": False,
    "buyer_name": "ALCALDIA DE PASTO",
    "buyer_tax_id": "891280000",
    "supplier_kind": "company",
    "supplier_name": "JAC Mojondinoy",
    "supplier_tax_id": "800167184",
    "municipality_code": "52001",
    "municipality_name": "PASTO",
    "department_code": "52",
    "department_name": "NARIÑO",
    "signed_on": date(2025, 6, 9),
    "starts_on": date(2025, 7, 9),
    "ends_on": date(2026, 9, 30),
    "added_days": 273,
    "current_cents": 6781538313,
    "initial_cents": 5609556600,
    "change_pct": 0.2089,
    "exceeds_legal_addition_limit": False,
    "amount_reliable": True,
    "paid_cents": None,
}


def test_group_is_the_scaled_sha256_prefix() -> None:
    prefix = int(hashlib.sha256(COMPANY.encode()).hexdigest()[:4], 16)
    assert group_of(COMPANY) == f"{prefix >> 2:04x}"
    assert all(int(group_of(f"CO1.PCCNTR.{n}"), 16) < GROUPS for n in range(500))


def test_detail_has_the_contract_shape() -> None:
    detail = contract_detail(_ROW)
    assert next(iter(detail)) == "id"  # the API finds a line by its `{"id":"…",` prefix
    assert detail["supplier"] == {"kind": "company", "name": "JAC Mojondinoy", "taxId": "800167184"}
    assert detail["location"] == {
        "municipality": {"code": "52001", "name": "Pasto"},
        "department": {"code": "52", "name": "Nariño"},
    }
    assert detail["dates"] == {
        "signed": "2025-06-09",
        "start": "2025-07-09",
        "end": "2026-09-30",
        "addedDays": 273,
    }
    assert detail["amounts"]["currentCents"] == 6781538313
    assert detail["amounts"]["paidCents"] is None


@pytest.mark.parametrize(
    ("kind", "expected"),
    [("natural_person", {"kind": "natural_person"}), ("unknown", {"kind": "unknown"})],
)
def test_only_a_company_is_identified(kind: str, expected: dict[str, str]) -> None:
    # Even if the model let a name through, the published line must not carry it (TASK-08).
    row = {**_ROW, "supplier_kind": kind, "supplier_name": "NOMBRE", "supplier_tax_id": "123"}
    assert contract_detail(row)["supplier"] == expected


def _warehouse(path: Path, corte: str = "2026-11") -> None:
    columns = ", ".join(_ROW)
    with duckdb.connect(str(path)) as conn:
        conn.execute("create table calidad_corte as select ? as corte", [corte])
        conn.execute(
            f"create table contract_detail as select {columns} from (select "  # noqa: S608
            + ", ".join(f"${name} as {name}" for name in _ROW)
            + ")",
            _ROW,
        )
        person = {
            **_ROW,
            "id": PERSON,
            "source": "secop_i",
            "supplier_kind": "natural_person",
            "supplier_name": None,
            "supplier_tax_id": None,
        }
        conn.execute(
            f"insert into contract_detail select {', '.join(f'${name}' for name in _ROW)}",
            person,
        )


@pytest.mark.parametrize("url", ["http://www.contratos.gov.co/x", "javascript:alert(1)", "", None])
def test_only_an_https_link_is_published(url: str | None) -> None:
    assert contract_detail({**_ROW, "source_url": url})["sourceUrl"] is None


def test_export_writes_each_contract_in_its_group(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    out = tmp_path / "contratos"
    out.mkdir()
    (out / "ffff.ndjson").write_text("old")  # a previous export is replaced
    (out / "corte.json").write_text("{}")  # and nothing else in the folder is touched

    with duckdb.connect(str(database), read_only=True) as conn:
        report = export_contracts(conn, corte="2026-11", out_dir=out)

    assert (report.contracts, report.files) == (2, 2)
    assert sorted(p.name for p in out.iterdir()) == sorted(
        ["corte.json", *(f"{group_of(i)}.ndjson" for i in (COMPANY, PERSON))]
    )
    line = (out / f"{group_of(PERSON)}.ndjson").read_text("utf-8")
    assert line.startswith(f'{{"id":"{PERSON}",') and line.endswith("\n")
    assert json.loads(line)["supplier"] == {"kind": "natural_person"}
    assert "cut" not in json.loads(line)


def test_export_refuses_another_cut(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, corte="2026-10")
    with (
        duckdb.connect(str(database), read_only=True) as conn,
        pytest.raises(CorteMismatchError),
    ):
        export_contracts(conn, corte="2026-11", out_dir=tmp_path / "out")
    assert not (tmp_path / "out").exists()


def test_pack_puts_every_group_in_one_archive(tmp_path: Path) -> None:
    groups = tmp_path / "grupos"
    groups.mkdir()
    names = ["0000.ndjson", "0fff.ndjson", "1000.ndjson", "3fff.ndjson"]
    for name in names:
        (groups / name).write_text("{}\n", "utf-8")

    packages = pack(groups, tmp_path / "publicacion")

    assert [p.name for p in packages] == [f"contratos-{n}.tar.gz" for n in range(PACKAGES)]
    packed = []
    for package in packages:
        with tarfile.open(package) as tar:
            packed.append(tar.getnames())
    assert packed == [["0000.ndjson", "0fff.ndjson"], ["1000.ndjson"], [], ["3fff.ndjson"]]


def test_cli_exports_and_packs(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _warehouse(tmp_path / "ekou.duckdb")
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    assert main(["export-contracts", "--corte", "2026-11", "--pack"]) == 0
    out = capsys.readouterr().out.splitlines()
    assert json.loads(out[0])["contracts"] == 2
    assert len(list((tmp_path / "contratos/2026-11").glob("*.ndjson"))) == 2
    assert (tmp_path / "publicacion/2026-11/contratos-0.tar.gz").exists()
