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
