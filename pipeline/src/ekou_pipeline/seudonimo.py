"""Seudonimización de documentos de personas naturales (Ley 1581 de 2012).

Se usa HMAC-SHA256 con una clave secreta, no un hash simple: una cédula colombiana tiene a lo
sumo 10 dígitos, así que el SHA-256 de todas las cédulas posibles se calcula en minutos y el
hash simple no protege nada. Sin la clave, el seudónimo no se puede revertir.

- El prefijo ``k1_`` identifica la versión de la clave. Si la clave se compromete, se rota a
  ``k2_`` y los seudónimos de cortes anteriores dejan de ser comparables.
- El mismo documento produce el mismo seudónimo en todas las fuentes y todos los cortes: así
  se puede seguir a un contratista sin conocer su cédula.
"""

import hashlib
import hmac

KEY_VERSION = "k1"
MIN_KEY_LENGTH = 32


class MissingKeyError(RuntimeError):
    """No hay clave de seudonimización: la transformación no debe continuar."""


def validate_key(key: str | None) -> bytes:
    if key is None or len(key) < MIN_KEY_LENGTH:
        raise MissingKeyError(
            "EKOU_PSEUDONYM_KEY no está definida o tiene menos de "
            f"{MIN_KEY_LENGTH} caracteres. Sin ella no se pueden publicar datos de personas "
            'naturales. Genera una con: python -c "import secrets; print(secrets.token_hex(32))"'
        )
    return key.encode()


def seudonimo(documento: str | None, key: bytes) -> str | None:
    """Seudónimo estable de un documento ya normalizado (solo dígitos, sin ceros a la izquierda)."""
    if not documento:
        return None
    digest = hmac.new(key, documento.encode(), hashlib.sha256).hexdigest()
    return f"{KEY_VERSION}_{digest[:32]}"
