"""Cliente de la API Socrata (SODA 2.1) de datos.gov.co.

Decisiones de diseño (ver ADR 0002 y ``docs/investigacion-ingesta.md``):

- **Paginación keyset** (``:id > último`` con ``$order=:id``), recomendada por Socrata. El
  ``$offset`` se degrada con la profundidad: ~13 s solo para posicionarse en la fila 5 M.
- **Reintentos con espera exponencial y jitter** ante errores transitorios: 429 (respetando
  ``Retry-After``), 5xx, fallas de red, JSON truncado con HTTP 200 y páginas que superan el
  tiempo máximo total.
- **Tiempo máximo total por petición**: el timeout de httpx aplica a cada lectura, así que un
  servidor que envía datos muy lento podría mantener viva una petición durante horas.
- **Detección de reemplazos**: varios datasets de SECOP se reconstruyen completos a diario y
  sus ``:id`` cambian. Si la huella (cabecera ``X-SODA2-Truth-Last-Modified``) cambia en medio
  de un recorrido, se aborta para no mezclar dos versiones del dataset.
"""

import json
import random
import time
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx
import structlog

from ekou_pipeline.config import Settings

log = structlog.get_logger(__name__)

Row = dict[str, Any]

_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
VERSION_HEADER = "X-SODA2-Truth-Last-Modified"


class SocrataError(RuntimeError):
    """Error no recuperable de la API, o recuperable que agotó los reintentos."""


class DatasetReplacedError(SocrataError):
    """El dataset se reemplazó en origen durante el recorrido: hay que reiniciar la partición."""


class _RetryableError(Exception):
    def __init__(self, reason: str, retry_after_s: float | None = None) -> None:
        super().__init__(reason)
        self.retry_after_s = retry_after_s


@dataclass(frozen=True, slots=True)
class Response:
    data: Any
    version: str | None
    """Huella de la versión del dataset en origen (``X-SODA2-Truth-Last-Modified``)."""


class SocrataClient:
    def __init__(
        self,
        settings: Settings,
        *,
        transport: httpx.BaseTransport | None = None,
        sleep: Callable[[float], None] = time.sleep,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "User-Agent": "ekou-pipeline",
        }
        if settings.socrata_app_token is not None:
            headers["X-App-Token"] = settings.socrata_app_token.get_secret_value()
        self._settings = settings
        self._sleep = sleep
        self._clock = clock
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
        meta = self._get(f"/api/views/{dataset_id}.json", {}).data
        if not isinstance(meta, dict) or "rowsUpdatedAt" not in meta:
            raise SocrataError(f"{dataset_id}: los metadatos no traen rowsUpdatedAt")
        return datetime.fromtimestamp(int(meta["rowsUpdatedAt"]), tz=UTC)

    def query(self, dataset_id: str, params: dict[str, str]) -> list[Row]:
        """Consulta SoQL directa. Usar solo para consultas livianas (conteos, metadatos)."""
        return self._query(dataset_id, params).data  # type: ignore[no-any-return]

    def iter_pages(
        self,
        dataset_id: str,
        columns: tuple[str, ...],
        where: str | None = None,
        page_size: int | None = None,
    ) -> Iterator[list[Row]]:
        """Recorre el dataset por páginas, con paginación keyset sobre ``:id``.

        Cada fila incluye ``:id``, el identificador interno de Socrata. No es estable entre
        reemplazos del dataset: la deduplicación en silver usa llaves de negocio.

        Raises:
            DatasetReplacedError: si el dataset se reemplazó en origen durante el recorrido.
        """
        size = page_size or self._settings.page_size
        last_id: str | None = None
        version: str | None = None
        while True:
            conditions = [c for c in (where, f":id > '{last_id}'" if last_id else None) if c]
            params = {
                "$select": ",".join((":id", *columns)),
                "$order": ":id",
                "$limit": str(size),
            }
            if conditions:
                params["$where"] = " AND ".join(f"({c})" for c in conditions)
            response = self._query(dataset_id, params)
            if version is None:
                version = response.version
            elif response.version is not None and response.version != version:
                raise DatasetReplacedError(
                    f"{dataset_id}: el dataset se reemplazó en origen durante la extracción "
                    f"({version} → {response.version})"
                )
            page: list[Row] = response.data
            if not page:
                return
            yield page
            if len(page) < size:
                return
            last_id = str(page[-1][":id"])

    def _query(self, dataset_id: str, params: dict[str, str]) -> Response:
        response = self._get(f"/resource/{dataset_id}.json", params)
        if not isinstance(response.data, list):
            raise SocrataError(
                f"{dataset_id}: se esperaba una lista y llegó {type(response.data).__name__}"
            )
        return response

    def _get(self, path: str, params: dict[str, str]) -> Response:
        attempts = self._settings.max_retries + 1
        for attempt in range(1, attempts + 1):
            try:
                return self._get_once(path, params)
            except _RetryableError as exc:
                if attempt == attempts:
                    raise SocrataError(f"GET {path} falló tras {attempts} intentos: {exc}") from exc
                backoff = self._settings.backoff_base_s * 2 ** (attempt - 1)
                wait = max(backoff, exc.retry_after_s or 0) + random.uniform(0, backoff / 4)  # noqa: S311
                log.warning(
                    "socrata.reintento", path=path, intento=attempt, motivo=str(exc), espera_s=wait
                )
                self._sleep(wait)
        raise AssertionError("inalcanzable")  # pragma: no cover

    def _get_once(self, path: str, params: dict[str, str]) -> Response:
        deadline = self._clock() + self._settings.max_request_s
        try:
            with self._http.stream("GET", path, params=params) as response:
                if response.status_code != httpx.codes.OK:
                    response.read()
                    if response.status_code in _RETRYABLE_STATUS:
                        raise _RetryableError(
                            f"HTTP {response.status_code}",
                            _retry_after(response.headers.get("Retry-After")),
                        )
                    raise SocrataError(
                        f"GET {path} → HTTP {response.status_code}: {response.text[:500]}"
                    )
                body = bytearray()
                for chunk in response.iter_bytes():
                    body += chunk
                    if self._clock() > deadline:
                        raise _RetryableError(
                            f"la respuesta superó el máximo de "
                            f"{self._settings.max_request_s:.0f} s ({len(body)} bytes recibidos)"
                        )
                version = response.headers.get(VERSION_HEADER)
        except httpx.TransportError as exc:  # timeouts, conexión, DNS, cortes a mitad
            raise _RetryableError(f"{type(exc).__name__}: {exc}") from exc
        try:
            data = json.loads(body)
        except ValueError as exc:
            # Observado a escala: HTTP 200 con el JSON cortado a mitad de una página de 67 MB.
            raise _RetryableError(f"respuesta incompleta ({len(body)} bytes): {exc}") from exc
        return Response(data=data, version=version)


def _retry_after(value: str | None) -> float | None:
    try:
        return float(value) if value is not None else None
    except ValueError:
        return None
