"""Plugin de dbt-duckdb: registra ``ekou_seudonimo(documento)`` en cada conexión de DuckDB.

Se declara en ``transform/profiles.yml``. La clave se lee de ``EKOU_PSEUDONYM_KEY`` al cargar
el plugin: si falta, dbt falla antes de procesar una sola fila.
"""

from typing import Any

import pyarrow as pa
from dbt.adapters.duckdb.plugins import BasePlugin
from duckdb import DuckDBPyConnection
from duckdb.func import ARROW
from duckdb.sqltypes import VARCHAR

from ekou_pipeline.config import Settings
from ekou_pipeline.seudonimo import seudonimo, validate_key


class Plugin(BasePlugin):
    def initialize(self, plugin_config: dict[str, Any]) -> None:
        secret = Settings().pseudonym_key
        self._key = validate_key(secret.get_secret_value() if secret else None)

    def configure_connection(self, conn: DuckDBPyConnection) -> None:
        key = self._key

        # Modo Arrow: DuckDB entrega vectores completos en lugar de fila por fila.
        def seudonimizar(documentos: pa.Array) -> pa.Array:
            return pa.array([seudonimo(d, key) for d in documentos.to_pylist()], type=pa.string())

        conn.create_function("ekou_seudonimo", seudonimizar, [VARCHAR], VARCHAR, type=ARROW)
