"""Configuración del pipeline, validada al arrancar.

Todos los valores se pueden sobrescribir con variables de entorno con el prefijo ``EKOU_``,
por ejemplo ``EKOU_SOCRATA_APP_TOKEN`` o ``EKOU_MAX_WORKERS``.
"""

from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EKOU_", env_file=".env", extra="ignore")

    socrata_domain: str = "www.datos.gov.co"
    socrata_app_token: SecretStr | None = None
    """App Token de datos.gov.co. Opcional, pero sin él la API aplica límites más estrictos."""

    pseudonym_key: SecretStr | None = None
    """Clave HMAC para seudonimizar documentos de personas naturales. Obligatoria para
    transformar; nunca se publica ni se versiona."""

    data_dir: Path = Path("data")
    """Raíz de las capas de datos (bronze, silver, gold)."""

    page_size: int = Field(default=20_000, ge=1, le=50_000)
    """Filas por página. Con 50.000 una página tarda ~52 s y el servidor llegó a cortar
    respuestas a mitad; 20.000 mantiene páginas cortas y reintentos baratos."""

    max_workers: int = Field(default=8, ge=1, le=32)
    """Particiones que se extraen en paralelo."""

    request_timeout_s: float = Field(default=120.0, gt=0)
    """Tiempo máximo de espera de cada lectura de red (conexión o fragmento de datos)."""

    max_request_s: float = Field(default=300.0, gt=0)
    """Tiempo máximo total de una petición. Evita que un servidor que envía datos muy lento
    mantenga viva una página durante horas."""

    max_retries: int = Field(default=6, ge=0)
    backoff_base_s: float = Field(default=2.0, ge=0)
    """Espera base de los reintentos; crece de forma exponencial: 2, 4, 8, 16… segundos."""
