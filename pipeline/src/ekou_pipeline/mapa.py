"""Datos del mapa (TASK-09): exporta el corte a los JSON que sirve la API.

Contrato: ``docs/design/pages/map/contract.md``. Escribe en ``out_dir``, por defecto la carpeta
de publicación del corte (``<data_dir>/publicacion/<corte>/``)::

    corte.json          CorteVigente
    municipios.json     MunicipiosDelCorte
    departamentos.json  DepartamentosDelCorte (con el total nacional)
    resumen.tar.gz      un JSON por municipio (resumen/<codigo>.json) y por departamento
                        (resumen-departamento/<codigo>.json), con todos los años

Esos archivos van en el Release ``corte-AAAA-MM`` con el mismo nombre (los ~1.150 resúmenes
van en un solo ``resumen.tar.gz``: un Release admite 1.000 archivos), y el corte mensual los
despliega en el Worker de datos como ``datos/<corte>/<archivo>``, junto al puntero
``datos/latest.json`` (docs/ci-cd.md). La geometría no es parte del corte: es un archivo estático
de la app (``public/geometria/``, scripts/geometria-mgn.mjs).
"""

import gzip
import io
import json
import re
import tarfile
from calendar import monthrange
from datetime import UTC, date, datetime, timedelta, timezone
from decimal import Decimal
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
        "id": "4f7r-epif",
        "nombre": "CUIPO – Ejecución de gastos",
        "entidad": "Contaduría General de la Nación (CUIPO)",
        "url": "https://www.datos.gov.co/d/4f7r-epif",
        "licencia": "CC BY-SA 4.0",
    },
    {
        "id": "9axr-9gnb",
        "nombre": "CUIPO – Ejecución de ingresos",
        "entidad": "Contaduría General de la Nación (CUIPO)",
        "url": "https://www.datos.gov.co/d/9axr-9gnb",
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


RUBROS = ("funcionamiento", "deuda", "inversion")
_CARPETAS = {"municipio": "resumen", "departamento": "resumen-departamento"}

# ``(nivel, código)`` → año → bloque del contrato.
_PorTerritorio = dict[tuple[str, str], dict[int, dict[str, Any]]]


def _fuentes_del_resumen(fecha_secop: date, fecha_cuipo: date | None) -> list[dict[str, str]]:
    """Una fuente por uso, cada una con su fecha de corte (la interfaz toma una por uso)."""
    por_id = {f["id"]: f for f in FUENTES}
    fuentes: list[dict[str, str]] = []
    if fecha_cuipo is not None:
        gasto = {"fechaCorte": fecha_cuipo.isoformat(), "usadoPara": "gastoPublico"}
        fuentes.append({**por_id["4f7r-epif"], **gasto})
    contratos = {"fechaCorte": fecha_secop.isoformat(), "usadoPara": "contratado"}
    # Los contratos de SECOP I también cuentan: el corte los suma a los de SECOP II.
    fuentes.append({**por_id["jbjy-vk9h"], "nombre": "SECOP I y II – Contratos", **contratos})
    return fuentes


def _pesos(valor: Decimal | None) -> int:
    return 0 if valor is None else int(valor.to_integral_value())


def _etapas(valores: list[int]) -> dict[str, int]:
    comprometido, obligado, pagado = valores
    return {"comprometido": comprometido, "obligado": obligado, "pagado": pagado}


def _desglose(filas: dict[str, tuple[Decimal | None, ...]]) -> dict[str, Any]:
    """Los tres rubros en orden fijo; el que la entidad no reportó va en 0/0/0 dentro del bloque."""
    rubros = []
    total = [0, 0, 0]
    for clave in RUBROS:
        etapas = [_pesos(v) for v in filas.get(clave, (None, None, None))]
        total = [a + b for a, b in zip(total, etapas, strict=True)]
        rubros.append({"clave": clave, "etapas": _etapas(etapas)})
    return {"rubros": rubros, "total": _etapas(total)}


def _gasto_por_territorio(conn: duckdb.DuckDBPyConnection) -> _PorTerritorio:
    """El ``gastoPublico`` del contrato por territorio y año, desde el gold de CUIPO."""
    filas = conn.execute(
        """
        select nivel, coalesce(cod_mpio, cod_dpto), alcance, anio, periodo, vigencia, rubro,
               comprometido, obligado, pagado, recibido
        from resumen_gasto_cuipo
        """
    ).fetchall()
    crudo: dict[tuple[str, str, int], dict[str, Any]] = {}
    for nivel, codigo, alcance, anio, periodo, vigencia, rubro, c, o, p, recibido in filas:
        entrada = crudo.setdefault(
            (nivel, codigo, int(anio)),
            {"periodo": periodo, "alcance": alcance, "recibido": recibido, "vigencias": {}},
        )
        entrada["vigencias"].setdefault(vigencia, {})[rubro] = (c, o, p)
    resultado: _PorTerritorio = {}
    for (nivel, codigo, anio), e in crudo.items():
        vigencias = e["vigencias"]
        actual = _desglose(vigencias.get(1, {}))
        corte_gasto: date = e["periodo"]
        es_isla = nivel == "municipio" and e["alcance"] == "departamento-isla"
        resultado.setdefault((nivel, codigo), {})[anio] = {
            "periodo": f"{corte_gasto.year}-{corte_gasto.month:02d}",
            "alcance": "departamento-isla" if es_isla else "municipio",
            "completo": corte_gasto.month == 12,
            "recibido": None if e["recibido"] is None else _pesos(e["recibido"]),
            "rubros": actual["rubros"],
            "total": actual["total"],
            "reservas": _desglose(vigencias[2]) if 2 in vigencias else None,
            "cuentasPorPagar": _desglose(vigencias[3]) if 3 in vigencias else None,
        }
    return resultado


def _contratado_por_territorio(conn: duckdb.DuckDBPyConnection) -> _PorTerritorio:
    consultas = {
        "municipio": "select cod_mpio, anio, contratos, valor_contratado from resumen_municipal",
        "departamento": (
            "select cod_dpto, anio, contratos, valor_contratado from resumen_departamento"
        ),
    }
    resultado: _PorTerritorio = {}
    for nivel, sql in consultas.items():
        for codigo, anio, contratos, valor in conn.execute(sql).fetchall():
            resultado.setdefault((nivel, codigo), {})[int(anio)] = {
                "valor": None if valor is None else _pesos(valor),
                "contratos": int(contratos),
            }
    return resultado


def resumenes_del_corte(
    conn: duckdb.DuckDBPyConnection, corte: str, fecha_datos: date
) -> dict[str, dict[str, Any]]:
    """``ruta dentro del paquete → contenido``: un archivo por municipio y departamento con datos.

    Cada archivo trae todos los años (``porAnio``); la API elige el año con ``?anio=``. Un año sin
    gasto ni contratos no aparece: «sin información» es la ausencia, nunca un cero.
    """
    ventana = conn.execute(
        "select any_value(ventana_desde), any_value(ventana_hasta), any_value(corte) "
        "from mapa_niveles_corte"
    ).fetchone()
    if ventana is None or ventana[2] != corte:
        raise ValueError(f"mapa_niveles_corte no es del corte {corte}")
    anios = list(range(int(ventana[0]), int(ventana[1]) + 1))
    fila = conn.execute("select max(periodo) from resumen_gasto_cuipo").fetchone()
    ultimo: date | None = fila[0] if fila else None
    fecha_cuipo = ultimo and ultimo.replace(day=monthrange(ultimo.year, ultimo.month)[1])
    fuentes = _fuentes_del_resumen(fecha_datos, fecha_cuipo)

    gasto = _gasto_por_territorio(conn)
    contratado = _contratado_por_territorio(conn)
    nombres = {
        ("municipio", cod): nombre_visible(nombre)
        for cod, nombre in conn.execute(
            "select cod_mpio, nom_mpio from mapa_municipios_corte"
        ).fetchall()
    } | {
        ("departamento", cod): nombre_visible(nombre)
        for cod, nombre in conn.execute(
            "select distinct cod_dpto, nom_dpto from mapa_municipios_corte"
        ).fetchall()
    }
    archivos: dict[str, dict[str, Any]] = {}
    for clave in sorted(set(gasto) | set(contratado)):
        if clave not in nombres:
            continue
        nivel, codigo = clave
        por_anio = {}
        for anio in anios:
            g = gasto.get(clave, {}).get(anio)
            c = contratado.get(clave, {}).get(anio)
            if g is not None or c is not None:
                por_anio[str(anio)] = {"gastoPublico": g, "contratado": c}
        if por_anio:
            archivos[f"{_CARPETAS[nivel]}/{codigo}.json"] = {
                "corte": corte,
                "codigo": codigo,
                "nombre": nombres[clave],
                "nivel": nivel,
                "anios": anios,
                "porAnio": por_anio,
                "fuentes": fuentes,
            }
    return archivos


def escribir_paquete(archivos: dict[str, dict[str, Any]], destino: Path) -> None:
    """Empaqueta los JSON en un ``.tar.gz`` reproducible: mismo contenido, mismos bytes."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    with (
        destino.open("wb") as salida,
        gzip.GzipFile(fileobj=salida, mode="wb", mtime=0) as comprimido,
        tarfile.open(fileobj=comprimido, mode="w") as paquete,
    ):
        for ruta in sorted(archivos):
            datos = json.dumps(archivos[ruta], ensure_ascii=False, separators=(",", ":"))
            contenido = datos.encode("utf-8")
            info = tarfile.TarInfo(ruta)
            info.size = len(contenido)
            info.mtime = 0
            info.mode = 0o644
            paquete.addfile(info, io.BytesIO(contenido))


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
        out_dir / "municipios.json": municipios_del_corte(conn, corte),
        out_dir / "departamentos.json": departamentos_del_corte(conn, corte),
        out_dir / "corte.json": corte_vigente(corte, fecha_datos, publicado_en),
    }
    resumenes = resumenes_del_corte(conn, corte, fecha_datos)
    for path, contenido in archivos.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(contenido, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    paquete = out_dir / "resumen.tar.gz"
    escribir_paquete(resumenes, paquete)
    rutas = [*archivos, paquete]
    log.info(
        "mapa.export", corte=corte, archivos=[p.as_posix() for p in rutas], resumenes=len(resumenes)
    )
    return rutas
