"""Cliente de la API Socrata (SODA) de datos.gov.co.

Decisiones de diseño (ver ADR 0001):

- **Paginación keyset** (``:id > último``) en lugar de ``$offset``: el offset se degrada con
  la profundidad (12,9 s por página en la fila 5 M) y el keyset se mantiene constante (~0,7 s).
- **Reintentos con espera exponencial** ante errores transitorios: 429, 5xx y tiempos agotados.
- **Sin agregaciones pesadas en el servidor**: Socrata se agota por tiempo con millones de filas.
"""

import time
from collections.abc import Callable, Iterator
from datetime import UTC, datetime
from typing import Any

import httpx
import structlog

from ekou_pipeline.config import Settings

log = structlog.get_logger(__name__)

Row = dict[str, Any]

_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})


class SocrataError(RuntimeError):
    """Error no recuperable de la API, o recuperable que agotó los reintentos."""


class SocrataClient:
    def __init__(
        self,
        settings: Settings,
        *,
        transport: httpx.BaseTransport | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        headers = {"Accept": "application/json", "User-Agent": "ekou-pipeline"}
        if settings.socrata_app_token is not None:
            headers["X-App-Token"] = settings.socrata_app_token.get_secret_value()
        self._settings = settings
        self._sleep = sleep
        self._http = httpx.Client(
            base_url=f"https://{settings.socrata_domain}",
            headers=headers,
            timeout=settings.request_timeout_s,
            transport=transport,
        )

    def __enter__(self) -> "SocrataClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def close(self) -> None:
        self._http.close()

    def rows_updated_at(self, dataset_id: str) -> datetime:
        """Última actualización de los datos en origen, para saltar fuentes sin cambios."""
        meta = self._get_json(f"/api/views/{dataset_id}.json", {})
        if not isinstance(meta, dict) or "rowsUpdatedAt" not in meta:
            raise SocrataError(f"{dataset_id}: los metadatos no traen rowsUpdatedAt")
        return datetime.fromtimestamp(int(meta["rowsUpdatedAt"]), tz=UTC)

    def query(self, dataset_id: str, params: dict[str, str]) -> list[Row]:
        """Consulta SoQL directa. Usar solo para consultas livianas (conteos, metadatos)."""
        data = self._get_json(f"/resource/{dataset_id}.json", params)
        if not isinstance(data, list):
            raise SocrataError(f"{dataset_id}: se esperaba una lista y llegó {type(data).__name__}")
        return data

    def iter_pages(
        self,
        dataset_id: str,
        columns: tuple[str, ...],
        where: str | None = None,
        page_size: int | None = None,
    ) -> Iterator[list[Row]]:
        """Recorre el dataset completo por páginas, con paginación keyset sobre ``:id``.

        Cada fila incluye ``:id``, el identificador interno de Socrata, que sirve como
        llave de deduplicación en la capa silver.
        """
        size = page_size or self._settings.page_size
        last_id: str | None = None
        while True:
            conditions = [c for c in (where, f":id > '{last_id}'" if last_id else None) if c]
            params = {
                "$select": ",".join((":id", *columns)),
                "$order": ":id",
                "$limit": str(size),
            }
            if conditions:
                params["$where"] = " AND ".join(f"({c})" for c in conditions)
            page = self.query(dataset_id, params)
            if not page:
                return
            yield page
            if len(page) < size:
                return
            last_id = str(page[-1][":id"])

    def _get_json(self, path: str, params: dict[str, str]) -> Any:
        attempts = self._settings.max_retries + 1
        for attempt in range(1, attempts + 1):
            try:
                response = self._http.get(path, params=params)
            except httpx.TransportError as exc:  # timeouts, conexión, DNS
                reason = f"{type(exc).__name__}: {exc}"
            else:
                if response.status_code == httpx.codes.OK:
                    return response.json()
                if response.status_code not in _RETRYABLE_STATUS:
                    raise SocrataError(
                        f"GET {path} → HTTP {response.status_code}: {response.text[:500]}"
                    )
                reason = f"HTTP {response.status_code}"
            if attempt == attempts:
                raise SocrataError(f"GET {path} falló tras {attempts} intentos: {reason}")
            wait = self._settings.backoff_base_s * 2 ** (attempt - 1)
            log.warning(
                "socrata.reintento", path=path, intento=attempt, motivo=reason, espera_s=wait
            )
            self._sleep(wait)
        raise AssertionError("inalcanzable")  # pragma: no cover
