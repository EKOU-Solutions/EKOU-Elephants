import json
from pathlib import Path

import httpx
import pytest
import respx

from ekou_pipeline.cli import build_parser, main

from .conftest import BASE


@pytest.mark.parametrize("corte", ["2026-13", "26-11", "2026-1"])
def test_rejects_invalid_corte(corte: str) -> None:
    with pytest.raises(SystemExit):
        build_parser().parse_args(["extract", "divipola", "--corte", corte])


def test_rejects_unknown_dataset() -> None:
    with pytest.raises(SystemExit):
        build_parser().parse_args(["extract", "no_existe"])


@respx.mock
def test_extract_command(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    respx.get(f"{BASE}/resource/gdxc-w37w.json").mock(
        return_value=httpx.Response(200, json=[{":id": "row-1", "cod_mpio": "05001"}])
    )

    assert main(["extract", "divipola", "--corte", "2026-11"]) == 0

    report = json.loads(capsys.readouterr().out)
    assert report[0]["dataset"] == "divipola"
    assert report[0]["rows"] == 1


def test_catalog_partitions_and_privacy() -> None:
    """Las fuentes nuevas no deben traer datos bancarios ni de representantes legales."""
    from ekou_pipeline.catalog import CATALOG

    forbidden = ("cuenta", "banco", "representante", "represen", "domicilio", "supervisor")
    for spec in CATALOG.values():
        assert not [c for c in spec.columns if any(f in c for f in forbidden)], spec.key
        assert len(spec.schema_fingerprint) == 16
    assert len(CATALOG["secop_ubicaciones"].explicit_partitions) == 9


def test_transform_command_builds_dbt_args(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import ekou_pipeline.cli as cli
    from ekou_pipeline.config import Settings
    from ekou_pipeline.transform import TRANSFORM_DIR, dbt_args

    args = dbt_args(Settings(data_dir=tmp_path), corte="2026-11", select="contratos+")
    assert args[0] == "build"
    assert str(TRANSFORM_DIR) in args
    assert json.loads(args[args.index("--vars") + 1]) == {
        "corte": "2026-11",
        "data_dir": tmp_path.resolve().as_posix(),
    }
    assert args[-2:] == ["--select", "contratos+"]
    assert (TRANSFORM_DIR / "dbt_project.yml").exists()

    calls: list[str] = []
    monkeypatch.setattr(cli, "run_transform", lambda _s, corte, select: calls.append(corte))
    assert cli.main(["transform", "--corte", "2026-11"]) == 1
    assert calls == ["2026-11"]
