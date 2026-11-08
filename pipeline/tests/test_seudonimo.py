import duckdb
import pytest

from ekou_pipeline.seudonimo import MissingKeyError, seudonimo, validate_key

KEY = validate_key("x" * 32)


def test_is_stable_and_versioned() -> None:
    first = seudonimo("1023456789", KEY)
    assert first == seudonimo("1023456789", KEY)
    assert first is not None
    assert first.startswith("k1_")
    assert len(first) == 35
    assert "1023456789" not in first


def test_depends_on_the_key() -> None:
    """Sin la clave no se puede recalcular: un hash simple de cédulas sí se revierte."""
    other = validate_key("y" * 32)
    assert seudonimo("1023456789", KEY) != seudonimo("1023456789", other)


def test_empty_document_has_no_pseudonym() -> None:
    assert seudonimo(None, KEY) is None
    assert seudonimo("", KEY) is None


@pytest.mark.parametrize("key", [None, "", "corta"])
def test_missing_or_short_key_fails_closed(key: str | None) -> None:
    with pytest.raises(MissingKeyError, match="EKOU_PSEUDONYM_KEY"):
        validate_key(key)


def test_dbt_plugin_registers_sql_function(monkeypatch: pytest.MonkeyPatch) -> None:
    from ekou_pipeline.dbt_plugin import Plugin

    monkeypatch.setenv("EKOU_PSEUDONYM_KEY", "x" * 32)
    plugin = Plugin.__new__(Plugin)
    plugin.initialize({})
    conn = duckdb.connect()
    plugin.configure_connection(conn)

    row = conn.execute("select ekou_seudonimo(?), ekou_seudonimo(null)", ["1023456789"]).fetchone()
    assert row == (seudonimo("1023456789", KEY), None)


def test_dbt_plugin_without_key_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    from ekou_pipeline.dbt_plugin import Plugin

    monkeypatch.delenv("EKOU_PSEUDONYM_KEY", raising=False)
    monkeypatch.chdir("/")  # sin .env
    plugin = Plugin.__new__(Plugin)
    with pytest.raises(MissingKeyError):
        plugin.initialize({})
