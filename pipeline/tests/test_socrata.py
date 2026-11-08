import httpx
import pytest
import respx
from pydantic import SecretStr

from ekou_pipeline.config import Settings
from ekou_pipeline.socrata import (
    VERSION_HEADER,
    DatasetReplacedError,
    SocrataClient,
    SocrataError,
)

from .conftest import BASE

RESOURCE = f"{BASE}/resource/abcd-1234.json"


@respx.mock
def test_iter_pages_uses_keyset_pagination(client: SocrataClient) -> None:
    route = respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(200, json=[{":id": "row-1", "a": "1"}, {":id": "row-2", "a": "2"}]),
            httpx.Response(200, json=[{":id": "row-3", "a": "3"}]),
        ]
    )

    pages = list(client.iter_pages("abcd-1234", ("a",), where="a IS NOT NULL"))

    assert [len(p) for p in pages] == [2, 1]
    first, second = (call.request.url.params for call in route.calls)
    assert first["$order"] == ":id"
    assert first["$select"] == ":id,a"
    assert first["$where"] == "(a IS NOT NULL)"
    assert "$offset" not in first
    assert second["$where"] == "(a IS NOT NULL) AND (:id > 'row-2')"


@respx.mock
def test_iter_pages_stops_on_empty_page(client: SocrataClient) -> None:
    respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(200, json=[{":id": "row-1"}, {":id": "row-2"}]),
            httpx.Response(200, json=[]),
        ]
    )
    assert len(list(client.iter_pages("abcd-1234", ()))) == 1


@respx.mock
def test_retries_transient_errors(client: SocrataClient) -> None:
    route = respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(429),
            httpx.ConnectTimeout("timeout"),
            httpx.Response(200, json=[]),
        ]
    )
    assert client.query("abcd-1234", {}) == []
    assert route.call_count == 3


@respx.mock
def test_retries_truncated_json_body(client: SocrataClient) -> None:
    """Visto en producción: HTTP 200 con el JSON cortado a mitad de una página de 67 MB."""
    route = respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(200, content=b'[{":id": "row-1", "a": "trunc'),
            httpx.Response(200, json=[{":id": "row-1", "a": "1"}]),
        ]
    )
    assert client.query("abcd-1234", {}) == [{":id": "row-1", "a": "1"}]
    assert route.call_count == 2


@respx.mock
def test_gives_up_after_max_retries(client: SocrataClient) -> None:
    respx.get(RESOURCE).mock(return_value=httpx.Response(503))
    with pytest.raises(SocrataError, match="3 intentos"):
        client.query("abcd-1234", {})


@respx.mock
def test_does_not_retry_client_errors(client: SocrataClient) -> None:
    route = respx.get(RESOURCE).mock(return_value=httpx.Response(400, text="bad query"))
    with pytest.raises(SocrataError, match="HTTP 400"):
        client.query("abcd-1234", {})
    assert route.call_count == 1


@respx.mock
def test_query_rejects_non_list_payload(client: SocrataClient) -> None:
    respx.get(RESOURCE).mock(return_value=httpx.Response(200, json={"error": True}))
    with pytest.raises(SocrataError, match="se esperaba una lista"):
        client.query("abcd-1234", {})


@respx.mock
def test_rows_updated_at(client: SocrataClient) -> None:
    respx.get(f"{BASE}/api/views/abcd-1234.json").mock(
        return_value=httpx.Response(200, json={"rowsUpdatedAt": 1_700_000_000})
    )
    assert client.rows_updated_at("abcd-1234").year == 2023


@respx.mock
def test_rows_updated_at_missing(client: SocrataClient) -> None:
    respx.get(f"{BASE}/api/views/abcd-1234.json").mock(return_value=httpx.Response(200, json={}))
    with pytest.raises(SocrataError, match="rowsUpdatedAt"):
        client.rows_updated_at("abcd-1234")


@respx.mock
def test_sends_app_token(settings: Settings) -> None:
    route = respx.get(RESOURCE).mock(return_value=httpx.Response(200, json=[]))
    token_settings = settings.model_copy(update={"socrata_app_token": SecretStr("secreto")})
    with SocrataClient(token_settings) as c:
        c.query("abcd-1234", {})
    assert route.calls.last.request.headers["X-App-Token"] == "secreto"


@respx.mock
def test_retry_after_header_is_respected(settings: Settings) -> None:
    waits: list[float] = []
    respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(429, headers={"Retry-After": "30"}),
            httpx.Response(200, json=[]),
        ]
    )
    with SocrataClient(settings, sleep=waits.append) as c:
        c.query("abcd-1234", {})
    assert waits == [30.0]


@respx.mock
def test_slow_response_over_max_request_time_is_retried(settings: Settings) -> None:
    """Un servidor que envía datos muy lento no puede dejar una página colgada por horas."""
    ticks = iter([0.0, 10_000.0, 0.0, 1.0])
    route = respx.get(RESOURCE).mock(return_value=httpx.Response(200, json=[]))
    with SocrataClient(settings, sleep=lambda _: None, clock=lambda: next(ticks)) as c:
        assert c.query("abcd-1234", {}) == []
    assert route.call_count == 2


@respx.mock
def test_iter_pages_detects_dataset_replacement(client: SocrataClient) -> None:
    respx.get(RESOURCE).mock(
        side_effect=[
            httpx.Response(
                200,
                json=[{":id": "row-1"}, {":id": "row-2"}],
                headers={VERSION_HEADER: "2026-11-06T07:43:31Z"},
            ),
            httpx.Response(
                200, json=[{":id": "row-3"}], headers={VERSION_HEADER: "2026-11-07T07:43:31Z"}
            ),
        ]
    )
    pages = client.iter_pages("abcd-1234", ())
    next(pages)
    with pytest.raises(DatasetReplacedError, match="reemplazó"):
        next(pages)


@respx.mock
def test_sends_gzip_accept_encoding(client: SocrataClient) -> None:
    route = respx.get(RESOURCE).mock(return_value=httpx.Response(200, json=[]))
    client.query("abcd-1234", {})
    assert route.calls.last.request.headers["Accept-Encoding"] == "gzip"
