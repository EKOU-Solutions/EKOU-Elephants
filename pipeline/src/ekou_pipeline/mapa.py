"""Datos del mapa (TASK-09): exporta el corte a los JSON que sirve la API.

Contrato: ``docs/design/pages/map/contract.md``. Escribe en ``out_dir``::

    latest.json                     puntero al corte vigente: {"corte": "AAAA-MM"}
    <corte>/corte.json              CorteVigente
    <corte>/mapa/municipios.json    MunicipiosDelCorte
    <corte>/mapa/departamentos.json DepartamentosDelCorte (con el total nacional)

La estructura replica las rutas del bucket R2, así un mismo directorio sirve para cargar el
R2 local (``wrangler``) y el de producción.
"""

import json
import re
from datetime import UTC, date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import duckdb
import structlog

log = structlog.get_logger(__name__)

GEOMETRIA = "mgn-2025"
# Hora de Colombia (UTC-5, sin horario de verano): la fecha que ve la ciudadanía.
COLOMBIA = timezone(timedelta(hours=-5))

FUENTES: tuple[dict[str, str], ...] = (
    {
        "id": "jbjy-vk9h",
        "nombre": "SECOP II – Contratos",
        "entidad": "Colombia Compra Eficiente",
        "url": "https://www.datos.gov.co/d/jbjy-vk9h",
        "licencia": "CC BY-SA 4.0",
    },
    {
        "id": "f789-7hwg",
        "nombre": "SECOP I – Procesos de compra",
        "entidad": "Colombia Compra Eficiente",
        "url": "https://www.datos.gov.co/d/f789-7hwg",
        "licencia": "CC BY-SA 4.0",
    },
    {
        "id": "gdxc-w37w",
        "nombre": "DIVIPOLA – Municipios",
        "entidad": "DANE",
        "url": "https://www.datos.gov.co/d/gdxc-w37w",
        "licencia": "CC BY-SA 4.0",
    },
    {
        "id": GEOMETRIA,
        "nombre": "Marco Geoestadístico Nacional 2025",
        "entidad": "DANE",
        "url": "https://geoportal.dane.gov.co/servicios/descarga-y-metadatos/datos-geoestadisticos/",
        "licencia": "CC BY 4.0",
    },
)

# Palabras que van en minúscula dentro de un nombre propio ("Carmen de Viboral").
_MINUSCULAS = frozenset({"de", "del", "la", "las", "los", "el", "y", "e", "en"})
# Siglas que se conservan tal cual ("Bogotá, D.C.").
_SIGLAS = frozenset({"d.c.", "d.c"})
_PALABRA = re.compile(r"[^\s\-(),]+")


def nombre_visible(nombre: str) -> str:
    """Convierte un nombre oficial en mayúsculas a formato de lectura.

    ``"VILLA DE SAN DIEGO DE UBATÉ"`` → ``"Villa de San Diego de Ubaté"``.
    """
    texto = " ".join(nombre.split()).lower()
    primera = True

    def reemplazo(m: re.Match[str]) -> str:
        nonlocal primera
        palabra = m.group(0)
        es_primera, primera = primera, False
        if palabra in _SIGLAS:
            return palabra.upper()
        if palabra in _MINUSCULAS and not es_primera:
            return palabra
        return palabra[:1].upper() + palabra[1:]

    return _PALABRA.sub(reemplazo, texto)


def fecha_de_los_datos(conn: duckdb.DuckDBPyConnection, bronze_dir: Path, corte: str) -> date:
    """Día (hora de Colombia) en que se extrajo la fuente menos reciente del corte.

    Es la fecha hasta la que los datos están al día: no el último día del mes, que puede
    no haber llegado todavía.
    """
    patron = (bronze_dir / f"corte={corte}" / "*" / "*" / "*.parquet").as_posix()
    try:
        fila = conn.execute(
            """
            select min(extraido_en) from (
                select fuente, max(cast(_extraido_en as timestamptz)) as extraido_en
                from read_parquet(?, hive_partitioning = true)
                group by fuente
            )
            """,
            [patron],
        ).fetchone()
    except duckdb.IOException as error:
        raise ValueError(f"no hay datos de bronze para el corte {corte}") from error
    if fila is None or fila[0] is None:
        raise ValueError(f"no hay datos de bronze para el corte {corte}")
    extraido: datetime = fila[0]
    return extraido.astimezone(COLOMBIA).date()


def corte_vigente(corte: str, fecha_datos: date, publicado_en: datetime) -> dict[str, Any]:
    return {
        "corte": corte,
        "fechaCorte": fecha_datos.isoformat(),
        "publicadoEn": publicado_en.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "geometria": GEOMETRIA,
        "fuentes": list(FUENTES),
    }


def municipios_del_corte(conn: duckdb.DuckDBPyConnection, corte: str) -> dict[str, Any]:
    cursor = conn.execute(
        """
        select cod_mpio, nom_mpio, tipo, cod_dpto, iso_3166_2, nom_dpto,
               ventana_desde, ventana_hasta, contratos_ubicados, corte
        from mapa_municipios_corte
        order by cod_mpio
        """
    )
    rows = cursor.fetchall()
    cortes = {row[9] for row in rows}
    if cortes != {corte}:
        raise ValueError(f"mapa_municipios_corte tiene el corte {sorted(cortes)}, no {corte}")
    desde, hasta = rows[0][6], rows[0][7]
    return {
        "corte": corte,
        "ventana": {"desde": int(desde), "hasta": int(hasta)},
        "municipios": [
            {
                "codigo": cod_mpio,
                "nombre": nombre_visible(nom_mpio),
                "tipo": tipo,
                "departamento": {
                    "codigo": cod_dpto,
                    "iso": iso,
                    "nombre": nombre_visible(nom_dpto),
                },
                "contratosUbicados": None if contratos is None else int(contratos),
            }
            for (cod_mpio, nom_mpio, tipo, cod_dpto, iso, nom_dpto, _, _, contratos, _) in rows
        ],
    }


def departamentos_del_corte(conn: duckdb.DuckDBPyConnection, corte: str) -> dict[str, Any]:
    """Los 33 departamentos y el total nacional, por nivel de ubicación de los contratos."""
    niveles = conn.execute(
        "select nivel, cod_dpto, contratos, ventana_desde, ventana_hasta, corte "
        "from mapa_niveles_corte"
    ).fetchall()
    cortes = {fila[5] for fila in niveles}
    if cortes != {corte}:
        raise ValueError(f"mapa_niveles_corte tiene el corte {sorted(cortes)}, no {corte}")
    por_nivel: dict[tuple[str, str | None], int] = {
        (nivel, cod_dpto): int(contratos) for nivel, cod_dpto, contratos, *_ in niveles
    }
    departamentos = conn.execute(
        "select distinct cod_dpto, iso_3166_2, nom_dpto from mapa_municipios_corte order by 1"
    ).fetchall()

    def total(nivel: str) -> int:
        return sum(n for (nv, _), n in por_nivel.items() if nv == nivel)

    en_municipios, solo_departamento = total("municipio"), total("departamento")
    sin_lugar = total("sin_lugar")
    return {
        "corte": corte,
        "ventana": {"desde": int(niveles[0][3]), "hasta": int(niveles[0][4])},
        "nacional": {
            "contratos": en_municipios + solo_departamento + sin_lugar,
            "contratosEnMunicipios": en_municipios,
            "contratosSoloDepartamento": solo_departamento,
            "contratosSinLugar": sin_lugar,
        },
        "departamentos": [
            {
                "codigo": cod_dpto,
                "iso": iso,
                "nombre": nombre_visible(nom_dpto),
                "contratosEnMunicipios": por_nivel.get(("municipio", cod_dpto), 0),
                "contratosSoloDepartamento": por_nivel.get(("departamento", cod_dpto), 0),
            }
            for cod_dpto, iso, nom_dpto in departamentos
        ],
    }


def export_mapa(
    conn: duckdb.DuckDBPyConnection,
    *,
    corte: str,
    fecha_datos: date,
    out_dir: Path,
    publicado_en: datetime | None = None,
) -> list[Path]:
    """Escribe los JSON del mapa y devuelve las rutas escritas."""
    publicado_en = publicado_en or datetime.now(tz=UTC)
    archivos = {
        out_dir / corte / "mapa" / "municipios.json": municipios_del_corte(conn, corte),
        out_dir / corte / "mapa" / "departamentos.json": departamentos_del_corte(conn, corte),
        out_dir / corte / "corte.json": corte_vigente(corte, fecha_datos, publicado_en),
        # El puntero va de último: solo apunta al corte cuando sus archivos ya existen.
        out_dir / "latest.json": {"corte": corte},
    }
    for path, contenido in archivos.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(contenido, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    log.info("mapa.export", corte=corte, archivos=[p.as_posix() for p in archivos])
    return list(archivos)
