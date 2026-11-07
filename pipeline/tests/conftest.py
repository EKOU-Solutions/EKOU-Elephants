from collections.abc import Iterator
from pathlib import Path

import pytest

from ekou_pipeline.config import Settings
from ekou_pipeline.socrata import SocrataClient

BASE = "https://www.datos.gov.co"


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(data_dir=tmp_path, page_size=2, max_workers=2, max_retries=2, backoff_base_s=0)


@pytest.fixture
def client(settings: Settings) -> Iterator[SocrataClient]:
    with SocrataClient(settings, sleep=lambda _: None) as c:
        yield c
