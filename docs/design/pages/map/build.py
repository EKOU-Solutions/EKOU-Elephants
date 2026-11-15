"""Build the map page mockup (TASK-09) from a dated sample of our API.

    python docs/design/pages/map/build.py

Reads ``sample/`` (responses of GET /api/mapa/corte, /departamentos, /municipios and
/geometria/mgn-2025 from the local API, cut 2026-11) and writes ``mockup.html``, which is
git-ignored. Uses only the guide's tokens.css and components.css plus page layout. Python
standard library only.
"""

import html
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
GUIDE = HERE.parent.parent / "guide"
SAMPLE = HERE / "sample"

corte = json.loads((SAMPLE / "corte.json").read_text(encoding="utf-8"))
deps = json.loads((SAMPLE / "departamentos.json").read_text(encoding="utf-8"))
mpios = json.loads((SAMPLE / "municipios.json").read_text(encoding="utf-8"))
topo = json.loads((SAMPLE / "mgn-2025.topojson").read_text(encoding="utf-8"))

DEP = {d["codigo"]: d for d in deps["departamentos"]}
MUN = {m["codigo"]: m for m in mpios["municipios"]}
VENTANA = f'{deps["ventana"]["desde"]} y {deps["ventana"]["hasta"]}'
MESES = "ene feb mar abr may jun jul ago sep oct nov dic".split()
MESES_LARGOS = (
    "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre"
).split()


def fecha_corta(iso: str) -> str:
    d = datetime.fromisoformat(iso[:10])
    return f"{d.day} {MESES[d.month - 1]} {d.year}"  # a date never breaks across lines


fecha_datos = datetime.fromisoformat(corte["fechaCorte"])
FECHA = fecha_corta(corte["fechaCorte"])
FECHA_LARGA = f"{fecha_datos.day} de {MESES_LARGOS[fecha_datos.month - 1]} de {fecha_datos.year}"
publicado = datetime.fromisoformat(corte["publicadoEn"].replace("Z", "+00:00"))
PUBLICADO = fecha_corta(publicado.astimezone(timezone(timedelta(hours=-5))).isoformat())
FUENTE = f"Fuente: SECOP I y II, Colombia Compra Eficiente · datos al {FECHA}"


def n(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def e(text: str) -> str:
    return html.escape(text, quote=True)


# --- TopoJSON → SVG paths ---------------------------------------------------------
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]
ARCS = []
for arc in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    ARCS.append(pts)

K = math.cos(math.radians(4.5))  # equirectangular, scaled for Colombia's mid latitude


def rings(geometry: dict) -> list[list[tuple[float, float]]]:
    polys = geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]
    out = []
    for poly in polys:
        for ring in poly:
            pts: list[tuple[float, float]] = []
            for i in ring:
                arc = ARCS[i] if i >= 0 else ARCS[~i][::-1]
                pts.extend(arc if not pts else arc[1:])
            out.append([(lon * K, -lat) for lon, lat in pts])
    return out


GEO_MUN = {g["properties"]["codigo"]: rings(g) for g in topo["objects"]["municipios"]["geometries"]}
GEO_DEP = {g["properties"]["codigo"]: rings(g) for g in topo["objects"]["departamentos"]["geometries"]}


def bbox(shapes: list[list[list[tuple[float, float]]]]) -> tuple[float, float, float, float]:
    xs = [x for s in shapes for r in s for x, _ in r]
    ys = [y for s in shapes for r in s for _, y in r]
    return min(xs), min(ys), max(xs), max(ys)


class Frame:
    """Fits a bounding box into a viewBox of fixed width."""

    def __init__(self, box: tuple[float, float, float, float], width: float, pad: float = 0.04,
                 min_ratio: float = 0.0, max_ratio: float = 0.0):
        x0, y0, x1, y1 = box
        w, h = x1 - x0, y1 - y0
        if h < w * min_ratio:  # wide territories: add vertical room, centred, so controls do not cover shapes
            extra = w * min_ratio - h
            y0, h = y0 - extra / 2, w * min_ratio
        if max_ratio and h > w * max_ratio:  # tall territories: add horizontal room, centred
            extra = h / max_ratio - w
            x0, w = x0 - extra / 2, h / max_ratio
        self.x0, self.y0 = x0 - w * pad, y0 - h * pad
        self.s = width / (w * (1 + 2 * pad))
        self.w, self.h = width, h * (1 + 2 * pad) * self.s

    def d(self, shape: list[list[tuple[float, float]]]) -> str:
        parts = []
        for ring in shape:
            pts = [(round((x - self.x0) * self.s, 1), round((y - self.y0) * self.s, 1)) for x, y in ring]
            dedup = [p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1]]
            if len(dedup) > 2:
                parts.append("M" + "L".join(f"{x:g},{y:g}" for x, y in dedup) + "Z")
        return "".join(parts)


def svg(frame: Frame, body: str, title: str, desc: str = "", cls: str = "el-map") -> str:
    descripcion = f"<desc>{e(desc)}</desc>" if desc else ""
    return (
        f'<svg class="{cls}" viewBox="0 0 {frame.w:.0f} {frame.h:.0f}" role="img" '
        f'aria-label="{e(title)}"><title>{e(title)}</title>{descripcion}{body}</svg>'
    )


SEL = ' data-selected="true"'
ISLAS = [("88001", "San Andrés"), ("88564", "Providencia y Santa Catalina")]


def _km(a: tuple[float, float], b: tuple[float, float]) -> float:
    (lo1, la1), (lo2, la2) = [(math.radians(x), math.radians(y)) for x, y in (a, b)]
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def _centro_geo(shape: list[list[tuple[float, float]]]) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox([shape])
    return ((x0 + x1) / 2 / K, -(y0 + y1) / 2)


DISTANCIA_ISLAS = round(_km(_centro_geo(GEO_MUN["88001"]), _centro_geo(GEO_MUN["88564"])) / 10) * 10


def islas_lado_a_lado(gap: float = 0.4) -> list[tuple[str, list[list[tuple[float, float]]]]]:
    """San Andrés and Providencia side by side at the same scale, vertically centred.

    They are ~100 km apart and 5-13 km long: at true position both become specks. The same scale
    keeps their real shapes and relative size; the distance is stated in text.
    """
    out, cursor = [], None
    boxes = [bbox([GEO_MUN[c]]) for c, _ in ISLAS]
    alto = max(b[3] - b[1] for b in boxes)
    ancho = max(b[2] - b[0] for b in boxes)
    for (codigo, _), (x0, y0, x1, y1) in zip(ISLAS, boxes):
        dx = (0 if cursor is None else cursor) - x0
        dy = -y0 + (alto - (y1 - y0)) / 2
        out.append((codigo, [[(x + dx, y + dy) for x, y in ring] for ring in GEO_MUN[codigo]]))
        cursor = x1 + dx + ancho * gap
    return out


def lienzo(frame: Frame, body: str, title: str, overlay: str = "", desc: str = "", recorte: bool = False) -> str:
    """The map svg in a box with its exact aspect ratio, so HTML overlays can be placed in %.

    `recorte`: the view crops neighbouring territories, so the frame gets a rule and the cut reads
    as intentional.
    """
    estilo = f"--ar:{frame.w / frame.h:.4f}"
    clase = "el-map-canvas el-map-canvas-crop" if recorte else "el-map-canvas"
    return f'<div class="{clase}" style="{estilo}">{svg(frame, body, title, desc)}{overlay}</div>'


def etiqueta(frame: Frame, shape: list[list[tuple[float, float]]], nombre: str, clase: str = "") -> str:
    """A territory name centred on its shape (HTML overlay, so it stays legible at any map size)."""
    x0, y0, x1, y1 = bbox([shape])
    lx = ((x0 + x1) / 2 - frame.x0) * frame.s / frame.w
    # Inside the shape when it has room (a quarter of the frame); otherwise just below it, so the
    # name never covers a small selected outline.
    if (y1 - y0) * frame.s > frame.h * 0.25 and (x1 - x0) * frame.s > frame.w * 0.25:
        ly, debajo = ((y0 + y1) / 2 - frame.y0) * frame.s / frame.h, ""
    else:
        ly, debajo = (y1 - frame.y0) * frame.s / frame.h, " el-map-label-below"
    extra = f" {clase}" if clase else ""
    return (f'<span class="el-map-label el-map-label-on{debajo}{extra}" style="--x:{lx:.2%};--y:{ly:.2%}" '
            f'aria-hidden="true">{e(nombre)}</span>')


def seleccion_svg(frame: Frame, shape: list[list[tuple[float, float]]]) -> str:
    """Selected outline drawn on top: a halo in the surface colour, then a 3 px text-colour line."""
    d = frame.d(shape)
    return f'<path class="el-sel-halo" d="{d}"/><path class="el-sel" d="{d}"/>'


def recuadro_islas() -> str:
    """The archipelago at its own scale, OUTSIDE the map (user decision 2026-11-15): it never covers
    the mainland, keeps the islands' shape and is a 44 px control that opens the department."""
    islas = islas_lado_a_lado()
    mini = Frame(bbox([sh for _, sh in islas]), 100, pad=0.06)
    dibujo = "".join(f'<path class="el-fill-neutral" d="{mini.d(sh)}"/>' for _, sh in islas)
    return (
        '<a class="el-map-inset" href="#" aria-label="Ver el Archipiélago de San Andrés, Providencia y Santa Catalina">'
        f'<svg viewBox="0 0 {mini.w:.0f} {mini.h:.0f}" aria-hidden="true">{dibujo}</svg>'
        '<span>San Andrés y Providencia<small>Ver las islas</small></span></a>'
    )


def mapa_colombia(seleccion: str | None = None) -> str:
    tierra = [c for c in GEO_DEP if c != "88"]
    frame = Frame(bbox([GEO_DEP[c] for c in tierra]), 600, pad=0.03)
    body = "".join(
        f'<path class="el-fill-neutral"{SEL if c == seleccion else ""} d="{frame.d(GEO_DEP[c])}"/>'
        for c in sorted(tierra, key=lambda c: c == seleccion)
    )
    return marco(lienzo(frame, body, "Mapa de Colombia por departamento", desc="Sin selección."), nivel="pais",
                 extra=recuadro_islas(), pie="Elige un departamento en el mapa para ver sus municipios.",
                 pie_arriba=True)


def mapa_islas(seleccion: str | None = None) -> str:
    islas = islas_lado_a_lado(gap=0.5)
    frame = Frame(bbox([sh for _, sh in islas]), 600, pad=0.1, min_ratio=RATIO_MIN, max_ratio=RATIO_MAX)
    body, etiquetas = "", ""
    for (codigo, nombre), (_, sh) in zip(ISLAS, islas):
        clase = "unknown" if MUN[codigo]["contratosUbicados"] is None else "neutral"
        body += f'<path class="el-fill-{clase}" d="{frame.d(sh)}"/>'
        x0, _, x1, y1 = bbox([sh])
        lx = ((x0 + x1) / 2 - frame.x0) * frame.s / frame.w
        ly = (y1 - frame.y0) * frame.s / frame.h
        etiquetas += f'<span class="el-map-label el-map-label-below" style="--x:{lx:.2%};--y:{ly:.2%}">{e(nombre)}</span>'
    if seleccion:
        body += seleccion_svg(frame, dict(islas)[seleccion])
    pie = f"Las dos islas están a la misma escala; en la realidad las separan unos {DISTANCIA_ISLAS} km de mar."
    desc = f"Seleccionado: {MUN[seleccion]['nombre']}." if seleccion else "Sin selección."
    return marco(lienzo(frame, body, "Mapa del Archipiélago de San Andrés, Providencia y Santa Catalina por municipio",
                        etiquetas, desc=desc), nivel="departamento", pie=pie)


# One frame proportion for every department view (height/width between 1 and 1.25, as Colombia is
# about 1.25), so the panel below does not jump between levels.
RATIO_MIN, RATIO_MAX = 1.0, 1.25


def mapa_departamento(dep: str, seleccion: str | None = None) -> str:
    if dep == "88":
        return mapa_islas(seleccion)
    frame = Frame(bbox([GEO_DEP[dep]]), 600, pad=0.08, min_ratio=RATIO_MIN, max_ratio=RATIO_MAX)
    contexto = "".join(f'<path class="el-fill-context" d="{frame.d(g)}"/>' for c, g in GEO_DEP.items() if c != dep)
    codigos = [c for c in GEO_MUN if c.startswith(dep)]
    municipios = "".join(
        f'<path class="el-fill-{"unknown" if MUN[c]["contratosUbicados"] is None else "neutral"}" d="{frame.d(GEO_MUN[c])}"/>'
        for c in codigos
    )
    borde = f'<path class="el-dpto" d="{frame.d(GEO_DEP[dep])}"/>'
    sel = seleccion_svg(frame, GEO_MUN[seleccion]) if seleccion else ""
    nombres = ""
    if dep == "25":  # Bogotá is a hole inside Cundinamarca: name it
        nombres += etiqueta(frame, GEO_DEP["11"], "Bogotá, D.C.", "el-map-label-context")
    if seleccion:
        nombres += etiqueta(frame, GEO_MUN[seleccion], MUN[seleccion]["nombre"])
    titulo = f'Mapa de {DEP[dep]["nombre"]} por municipio'
    desc = (f"Seleccionado: {MUN[seleccion]['nombre']}, departamento de {DEP[dep]['nombre']}." if seleccion
            else "Sin selección.")
    return marco(lienzo(frame, contexto + municipios + borde + sel, titulo, nombres, desc=desc, recorte=True),
                 nivel="departamento")


ICON = {
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "minus": '<path d="M5 12h14"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "error": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
}


def icon(name: str, cls: str = "") -> str:
    return (f'<svg{" class=" + chr(34) + cls + chr(34) if cls else ""} viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
            f'aria-hidden="true">{ICON[name]}</svg>')


def marco(lienzo_html: str, nivel: str, extra: str = "", pie: str = "", pie_arriba: bool = False) -> str:
    # Controls sit under the map, never over the shapes (editorial: the data is not covered).
    # «Ver todo el país» exists only when there is somewhere to go back to; at country level that
    # place holds the archipelago at its own scale.
    if nivel == "pais":
        izquierda = extra
    else:
        izquierda = (f'<button class="el-btn el-btn-text el-map-back" type="button">{icon("arrow-left")}'
                     'Ver todo el país</button>')
    zoom = (
        '<div class="el-map-zoom" role="group" aria-label="Zoom del mapa">'
        f'<button class="el-btn el-btn-secondary" type="button" aria-label="Alejar"{" disabled" if nivel == "pais" else ""}>'
        f'{icon("minus")}</button>'
        f'<button class="el-btn el-btn-secondary" type="button" aria-label="Acercar">{icon("plus")}</button></div>'
    )
    caption = f'<figcaption class="el-map-hint">{e(pie)}</figcaption>' if pie else ""
    if pie_arriba:
        return (f'<figure class="el-map-frame">{caption}{lienzo_html}<div class="el-map-tools">{izquierda}{zoom}</div>'
                '</figure>')
    return (f'<figure class="el-map-frame">{lienzo_html}<div class="el-map-tools">{izquierda}{zoom}</div>'
            f'{caption}</figure>')


def leyenda(sin_datos: bool, seleccionado: bool) -> str:
    items = ['<li><span class="el-key el-key-neutral" aria-hidden="true"></span>Territorio con contratos ubicados</li>']
    if sin_datos:
        items.append('<li><span class="el-key el-key-unknown" aria-hidden="true"></span>Sin datos</li>')
    if seleccionado:
        items.append('<li><span class="el-key el-key-selected" aria-hidden="true"></span>Seleccionado</li>')
    return f'<div class="el-legend"><h3>Cómo leer el mapa</h3><ul>{"".join(items)}</ul></div>'


def ruta(*niveles: str) -> str:
    if len(niveles) == 1:  # at Colombia level the panel heading already says where you are
        return ""
    items = [f'<li><a href="#">{e(x)}</a></li>' for x in niveles[:-1]]
    items.append(f'<li><span aria-current="page">{e(niveles[-1])}</span></li>')
    return f'<nav class="el-breadcrumb" aria-label="Ubicación"><ol>{"".join(items)}</ol></nav>'


def busqueda(valor: str = "", sugerencias: list[tuple[str, str]] | None = None, ayuda: str = "",
             deshabilitada: bool = False, uid: str = "b") -> str:
    lista = ""
    if sugerencias:
        ops = "".join(
            f'<li role="option" id="{uid}-{i}" aria-selected="{"true" if i == 0 else "false"}">'
            f'<span>{nombre}</span><span class="meta">{e(meta)}</span></li>'
            for i, (nombre, meta) in enumerate(sugerencias)
        )
        lista = f'<ul class="el-search-list" id="{uid}-list" role="listbox" aria-label="Sugerencias">{ops}</ul>'
    attrs = f'aria-expanded="{"true" if sugerencias else "false"}"'
    if sugerencias:
        attrs += f' aria-controls="{uid}-list" aria-activedescendant="{uid}-0"'
    if ayuda:
        attrs += f' aria-describedby="{uid}-help"'
    help_html = f'<span class="help" id="{uid}-help" role="status">{e(ayuda)}</span>' if ayuda else ""
    if deshabilitada and not ayuda:
        attrs += f' aria-describedby="{uid}-help"'
        help_html = f'<span class="help" id="{uid}-help">La búsqueda se activa cuando cargue el mapa.</span>'
    return (
        f'<div class="el-search"><label for="{uid}">Busca un departamento o municipio</label>'
        f'<div class="el-search-box"><input id="{uid}" role="combobox" autocomplete="off" placeholder="Por ejemplo: Arauca, Ubaté" '
        f'value="{e(valor)}" {attrs}{" disabled" if deshabilitada else ""}>{icon("search", "icon")}</div>'
        f'{lista}{help_html}</div>'
    )


METODO = "https://github.com/EKOU-Solutions/EKOU-Elephants/blob/main/docs/investigacion-ingesta.md"
COMO_UBICAMOS = ("Ubicamos cada contrato por el lugar de ejecución que declara la entidad; si no lo declara, "
                 "por la sede de la alcaldía.")
AYUDA = {
    "pais": (COMO_UBICAMOS + " Los que cubren varios municipios quedan en el departamento, y los que no tienen "
             "ninguno de los dos datos quedan sin lugar."),
    "departamento": ("Suma los contratos ubicados en sus municipios y los del departamento que no se pueden ubicar "
                     "en uno solo, por ejemplo los que cubren varios municipios. " + COMO_UBICAMOS),
    "municipio": (COMO_UBICAMOS + " No incluye los contratos que cubren varios municipios: esos quedan en "
                  "el departamento."),
}
_uid = [0]


def ayuda(nivel: str, abierta: bool = False) -> tuple[str, str]:
    """Toggletip: an (i) button right after the label it explains, and the live region it fills.

    Opens on tap, click or Enter, closes with Esc or a second tap: nothing depends on hover. The
    region is role=status, so screen readers announce the text when it appears.
    """
    _uid[0] += 1
    uid = f"ayuda-{_uid[0]}"
    texto = f'{e(AYUDA[nivel])} <a href="{METODO}">Cómo lo calculamos</a>'
    boton = (f'<button class="el-toggletip-btn" type="button" aria-expanded="{"true" if abierta else "false"}" '
             f'aria-controls="{uid}" aria-label="Cómo ubicamos estos contratos">{icon("info")}</button>')
    region = (f'<div class="el-toggletip" id="{uid}" role="status">{texto if abierta else ""}</div>'
              f'<template data-for="{uid}">{texto}</template>')
    return boton, region


def reparto(filas: list[tuple[int, str]]) -> str:
    """Counts as rows with their share of the total: reads at 320 px and says what part is what."""
    total = sum(v for v, _ in filas)
    items = "".join(
        f'<div class="el-count"><span>{e(etiqueta)}</span><span class="nums"><strong>{n(v)}</strong>'
        f'<span class="share">{f"{v / total * 100:.1f}".replace(".", ",")}%</span></span></div>'
        for v, etiqueta in filas
    )
    return f'<div class="el-counts el-counts-rows">{items}</div>'


def panel_colombia(ayuda_abierta: bool = False) -> str:
    nac = deps["nacional"]
    boton, region = ayuda("pais", ayuda_abierta)
    aviso = anuncio(f'Colombia: {n(nac["contratos"])} contratos públicos.')
    return (
        f'<section class="el-panel"><h2 tabindex="-1">Colombia</h2>{aviso}'
        f'<div class="el-figure"><p class="label">Contratos públicos</p><p class="value">{n(nac["contratos"])}</p>'
        f'<p class="context">firmados entre {VENTANA}</p><p class="source">{FUENTE}</p></div>'
        f'<div ><p class="el-panel-subtitle">Dónde quedó cada contrato{boton}</p>{region}'
        f'{reparto([(nac["contratosEnMunicipios"], "En un municipio"), (nac["contratosSoloDepartamento"], "Solo en un departamento"), (nac["contratosSinLugar"], "Sin lugar registrado")])}</div>'
        f'</section>'
    )


def panel_departamento(dep: str, ayuda_abierta: bool = False) -> str:
    d = DEP[dep]
    boton, region = ayuda("departamento", ayuda_abierta)
    total = d["contratosEnMunicipios"] + d["contratosSoloDepartamento"]
    propios = [m for m in mpios["municipios"] if m["departamento"]["codigo"] == dep]
    nulos = sum(m["contratosUbicados"] is None for m in propios)
    sin = (f'<p class="el-panel-note"><span class="el-key el-key-unknown" aria-hidden="true"></span>'
           f'{nulos} de {len(propios)} municipios y áreas sin datos</p>') if nulos else ""
    aviso = anuncio(f'{d["nombre"]}: {n(total)} contratos ubicados.')
    return (
        f'<section class="el-panel"><h2 tabindex="-1">{e(d["nombre"])}</h2>{aviso}'
        '<p class="el-panel-kind">Departamento</p>'
        f'<div class="el-figure"><p class="label">Contratos ubicados en {e(d["nombre"])}{boton}</p>{region}<p class="value">{n(total)}</p>'
        f'<p class="context">firmados entre {VENTANA}</p><p class="source">{FUENTE}</p></div>'
        f'{reparto([(d["contratosEnMunicipios"], "En sus municipios"), (d["contratosSoloDepartamento"], "Sin municipio asignado")])}'
        f'{sin}</section>'
    )


TIPO = {"area_no_municipalizada": "Área no municipalizada", "isla": "Isla"}
EN_TIPO = {"area_no_municipalizada": "en el área", "isla": "en la isla", "municipio": "en el municipio"}
ESTA_TIPO = {"area_no_municipalizada": "esta área", "isla": "esta isla", "municipio": "este municipio"}


def anuncio(texto: str) -> str:
    """The one short sentence a screen reader hears when the level changes (spec §7)."""
    return f'<p class="el-sr-only" role="status">{e(texto)}</p>'


def panel_municipio(codigo: str, ayuda_abierta: bool = False) -> str:
    m = MUN[codigo]
    boton, region = ayuda("municipio", ayuda_abierta)
    dep = DEP[m["departamento"]["codigo"]]
    linea_dep = "Distrito Capital" if codigo == "11001" else f'Departamento de {m["departamento"]["nombre"]}'
    tipo = f'<p class="el-panel-kind">{TIPO[m["tipo"]]}</p>' if m["tipo"] in TIPO else ""
    if m["contratosUbicados"] is None:
        cifra = (f'<div class="el-figure"><p class="label">Contratos ubicados {EN_TIPO[m["tipo"]]}{boton}</p>{region}'
                 f'<p class="value value-empty">Sin datos</p>'
                 f'<p class="context"><span class="el-key el-key-unknown" aria-hidden="true"></span>No encontramos contratos '
                 f'ubicados en {ESTA_TIPO[m["tipo"]]} entre {VENTANA}.</p><p class="source">{FUENTE}</p></div>')
    else:
        cifra = (f'<div class="el-figure"><p class="label">Contratos ubicados {EN_TIPO[m["tipo"]]}{boton}</p>{region}'
                 f'<p class="value">{n(m["contratosUbicados"])}</p><p class="context">firmados entre {VENTANA}</p>'
                 f'<p class="source">{FUENTE}</p></div>')
    extra = ""
    if dep["contratosSoloDepartamento"]:
        extra = (f'<p class="el-panel-note">Además, {n(dep["contratosSoloDepartamento"])} contratos del departamento de '
                 f'{e(dep["nombre"])} no se pueden ubicar en un solo municipio. <a href="#">Ver {e(dep["nombre"])}</a></p>')
    valor = "sin datos" if m["contratosUbicados"] is None else f'{n(m["contratosUbicados"])} contratos ubicados'
    return (f'<section class="el-panel"><h2 tabindex="-1">{e(m["nombre"])}</h2>'
            f'{anuncio(m["nombre"] + ", " + m["departamento"]["nombre"] + ": " + valor + ".")}'
            f'<p class="el-panel-kind">{e(linea_dep)}</p>{tipo}{cifra}{extra}</section>')


def tabla(dep: str | None, abierta: bool = False, filas: int = 8) -> str:
    if dep is None:
        cab = '<tr><th scope="col">Departamento</th><th scope="col" class="el-num">En municipios</th><th scope="col" class="el-num">Solo departamento</th></tr>'
        datos = [(d["nombre"], n(d["contratosEnMunicipios"]), n(d["contratosSoloDepartamento"])) for d in deps["departamentos"]]
        cap = f"Contratos firmados entre {VENTANA}, por departamento."
        cuerpo = "".join(f'<tr><th scope="row"><a href="#">{e(a)}</a></th><td class="el-num">{b}</td><td class="el-num">{c}</td></tr>' for a, b, c in datos[:filas])
    else:
        cab = '<tr><th scope="col">Municipio</th><th scope="col" class="el-num">Contratos ubicados</th></tr>'
        propios = [m for m in mpios["municipios"] if m["departamento"]["codigo"] == dep]
        cap = f"Contratos firmados entre {VENTANA}, por municipio de {DEP[dep]['nombre']}."
        cuerpo = "".join(
            f'<tr><th scope="row"><a href="#">{e(m["nombre"])}</a></th><td class="el-num">'
            f'{"<span class=" + chr(34) + "el-key el-key-unknown" + chr(34) + " aria-hidden=" + chr(34) + "true" + chr(34) + "></span>Sin datos" if m["contratosUbicados"] is None else n(m["contratosUbicados"])}</td></tr>'
            for m in propios[:filas]
        )
    total = len(deps["departamentos"]) if dep is None else sum(m["departamento"]["codigo"] == dep for m in mpios["municipios"])
    resto = total - filas
    mas = (f'<p><button class="el-btn el-btn-secondary" type="button">Mostrar los {resto} restantes</button></p>'
           if resto > 0 else "")
    return (f'<details class="el-disclosure"{" open" if abierta else ""}><summary>Ver en una tabla'
            f'{icon("chevron-down")}</summary>'
            f'<div class="el-table-scroll"><table class="el-table"><caption>{e(cap)}</caption><thead>{cab}</thead>'
            f'<tbody>{cuerpo}</tbody></table></div>{mas}</details>')


def fuentes() -> str:
    items = "".join(
        f'<li><a href="{e(f["url"])}">{e(f["nombre"])}</a> · {e(f["entidad"])} · {e(f["licencia"])}'
        f'{USO.get(f["id"], "")}</li>' for f in corte["fuentes"]
    )
    # Each source once. The figure carries its own source line (guide rule), the dek carries the date,
    # and this footer is the only place with licences and the publication date.
    return (f'<footer class="el-sources"><h2>Fuentes y licencias</h2><ul>{items}</ul>'
            f'<p>Datos al {FECHA} · publicado el {PUBLICADO}</p></footer>')


USO = {"mgn-2025": ". Límites simplificados para mostrarlos en pantalla"}


nac = deps["nacional"]["contratos"]
TITULAR = f'{nac / 1e6:.1f}'.replace(".", ",") + " millones de contratos públicos: dónde quedaron"
DEK = (f"Contratos firmados entre {VENTANA} por entidades nacionales, departamentales y municipales, ubicados en el mapa. "
       f"Datos de SECOP al {FECHA_LARGA}.")


NEUTRO = "Contratación pública en Colombia, departamento por departamento"
DEK_NEUTRO = ("Contratos públicos de entidades nacionales, departamentales y municipales, ubicados en el mapa. "
              "Fuente: SECOP, Colombia Compra Eficiente.")


def cabecera(titular: str = TITULAR, dek: str = DEK) -> str:
    # Before /corte and /departamentos answer, the page cannot state figures or dates: neutral texts.
    return f'<header class="el-page-head"><h1>{e(titular)}</h1><p class="dek">{e(dek)}</p></header>'


def pantalla(*, mapa: str, panel: str, ruta_html: str, tabla_html: str, buscar: str | None = None,
             banner: str = "", con_leyenda: bool = True) -> str:
    # Mobile order (spec §5): search, breadcrumb, map + legend, panel, table. Desktop: map on the
    # left spanning all rows, the rest on the right (grid areas in PAGE_CSS).
    return (
        f'<div class="page">{banner}{cabecera()}<div class="layout">'
        f'<div class="a-search">{buscar or busqueda()}</div><div class="a-ruta">{ruta_html}</div>'
        f'<div class="a-map"><h2 class="el-sr-only">Mapa</h2>{mapa}</div>'
        f'<div class="a-legend">{leyenda("el-fill-unknown" in mapa, "el-sel" in mapa) if con_leyenda else ""}</div>'
        f'<div class="a-panel">{panel}</div><div class="a-table">{tabla_html}</div>'
        f'</div>{fuentes()}</div>'
    )


ubate = next(m for m in mpios["municipios"] if m["nombre"] == "Villa de San Diego de Ubaté")
cacahual = next(m for m in mpios["municipios"] if m["nombre"] == "Cacahual")
la_union = [m for m in mpios["municipios"] if m["nombre"] == "La Unión"]

PANTALLAS = [
    ("phone", "Colombia (sin selección)", pantalla(
        mapa=mapa_colombia(), panel=panel_colombia(), ruta_html=ruta("Colombia"), tabla_html=tabla(None))),
    ("phone", "Departamento · Arauca (58 % solo a nivel departamento; ayuda del dato abierta)", pantalla(
        mapa=mapa_departamento("81"), panel=panel_departamento("81", ayuda_abierta=True), ruta_html=ruta("Colombia", "Arauca"),
        tabla_html=tabla("81"))),
    ("phone", "Municipio · Arauca (ayuda del dato abierta)", pantalla(
        mapa=mapa_departamento("81", "81001"), panel=panel_municipio("81001", ayuda_abierta=True), ruta_html=ruta("Colombia", "Arauca", "Arauca"),
        tabla_html=tabla("81"))),
    ("phone", "Caso extremo · Sin datos (Cacahual, Guainía)", pantalla(
        mapa=mapa_departamento("94", cacahual["codigo"]), panel=panel_municipio(cacahual["codigo"]),
        ruta_html=ruta("Colombia", "Guainía", "Cacahual"), tabla_html=tabla("94"))),
    ("phone", "Departamento con «Sin datos» (Guainía)", pantalla(
        mapa=mapa_departamento("94"), panel=panel_departamento("94"), ruta_html=ruta("Colombia", "Guainía"),
        tabla_html=tabla("94"))),
    ("phone", "Bogotá, D.C. (departamento con un municipio)", pantalla(
        mapa=mapa_departamento("11"), panel=panel_departamento("11"), ruta_html=ruta("Colombia", "Bogotá, D.C."),
        tabla_html=tabla("11"))),
    ("phone", "Caso extremo · nombre más largo (Villa de San Diego de Ubaté)", pantalla(
        mapa=mapa_departamento("25", ubate["codigo"]), panel=panel_municipio(ubate["codigo"]),
        ruta_html=ruta("Colombia", "Cundinamarca", ubate["nombre"]), tabla_html=tabla("25"))),
    ("phone", "Caso extremo · departamento de nombre más largo (San Andrés)", pantalla(
        mapa=mapa_departamento("88"), panel=panel_departamento("88"),
        ruta_html=ruta("Colombia", DEP["88"]["nombre"]), tabla_html=tabla("88"))),
    ("phone", "Búsqueda abierta · nombres repetidos («la uni»)", pantalla(
        mapa=mapa_colombia(), panel=panel_colombia(), ruta_html=ruta("Colombia"), tabla_html=tabla(None),
        buscar=busqueda("la uni", [("<mark>La Unión</mark>", m["departamento"]["nombre"]) for m in la_union], uid="b-u"))),
    ("phone", "Búsqueda sin resultados", pantalla(
        mapa=mapa_colombia(), panel=panel_colombia(), ruta_html=ruta("Colombia"), tabla_html=tabla(None),
        buscar=busqueda("Ubatte", ayuda="No encontramos ese lugar. Revisa la tilde o escribe solo una parte, por ejemplo «Ubaté».", uid="b-v"))),
    ("phone", "Enlace con código inexistente (/mapa/99999)", pantalla(
        mapa=mapa_colombia(), panel=panel_colombia(), ruta_html=ruta("Colombia"), tabla_html=tabla(None),
        banner=(f'<div class="el-banner el-alert-warning" role="status">{icon("alert")}<p class="msg"><strong>El enlace apunta al '
                'código 99999, que no es un lugar de Colombia.</strong> Búscalo por su nombre.</p></div>'))),
    ("phone", "Cargando", (
        f'<div class="page">{cabecera(NEUTRO, DEK_NEUTRO)}<div class="layout"><div class="a-search">{busqueda(deshabilitada=True, uid="b-l")}</div>'
        f'<div class="a-map"><div class="el-map-status" role="status">Cargando el mapa…</div></div></div></div>')),
    ("phone", "Datos del mes sin publicar (503)", (
        f'<div class="page">{cabecera(NEUTRO, DEK_NEUTRO)}'
        f'<div class="el-alert el-alert-warning" role="alert"><span class="badge">{icon("alert")}</span>'
        '<strong>Los datos de este mes todavía no están publicados.</strong><p>Vuelve a intentarlo en unos minutos. '
        'Mientras tanto, los contratos están en <a href="https://www.datos.gov.co/d/jbjy-vk9h">SECOP II, en datos.gov.co</a>.</p>'
        '<div class="actions"><button class="el-btn el-btn-secondary" type="button">Reintentar</button></div></div></div>')),
    ("phone", "Error de red o del servidor", (
        f'<div class="page">{cabecera(NEUTRO, DEK_NEUTRO)}'
        f'<div class="el-alert el-alert-danger" role="alert"><span class="badge">{icon("error")}</span>'
        '<strong>Algo falló al cargar los datos.</strong><p>Revisa tu conexión y vuelve a intentarlo.</p>'
        '<div class="actions"><button class="el-btn el-btn-secondary" type="button">Reintentar</button></div></div></div>')),
    ("phone", "Error al cargar el mapa (el resto funciona)", pantalla(
        mapa=(f'<div class="el-alert el-alert-danger" role="alert"><span class="badge">{icon("error")}</span>'
              '<strong>No pudimos cargar el mapa.</strong><p>Puedes buscar tu departamento o municipio, o ver la tabla.</p>'
              '<div class="actions"><button class="el-btn el-btn-secondary" type="button">Reintentar</button></div></div>'),
        panel=panel_colombia(), ruta_html=ruta("Colombia"), tabla_html=tabla(None), con_leyenda=False)),
    ("desktop", "Escritorio · Colombia (tabla abierta)", pantalla(
        mapa=mapa_colombia(), panel=panel_colombia(), ruta_html=ruta("Colombia"),
        tabla_html=tabla(None, abierta=True, filas=10))),
    ("desktop", "Escritorio · Municipio · Arauca (ayuda del dato abierta)", pantalla(
        mapa=mapa_departamento("81", "81001"), panel=panel_municipio("81001", ayuda_abierta=True), ruta_html=ruta("Colombia", "Arauca", "Arauca"),
        tabla_html=tabla("81"))),
]

PAGE_CSS = """
/* Review gallery (scaffolding, not the page) */
body{margin:0;background:var(--el-color-surface-subtle);color:var(--el-color-text);font-family:var(--el-font-ui);font-size:var(--el-size-body);line-height:var(--el-line-body);font-variant-numeric:var(--el-numbers)}
h1,h2,h3,h4,p,ul,ol,figure,dl{margin:0}
*,*::before,*::after{box-sizing:border-box}
.bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:var(--el-space-12) var(--el-space-24);align-items:center;padding:var(--el-space-12) var(--el-space-16);background:var(--el-color-surface);border-bottom:var(--el-rule) solid var(--el-color-line)}
.bar h1{font-size:var(--el-size-subsection)}.bar p{font-size:var(--el-size-small);color:var(--el-color-text-muted)}
.bar .theme{display:flex;gap:var(--el-space-8);margin-left:auto}
.gallery{display:flex;flex-wrap:wrap;gap:var(--el-space-32);padding:var(--el-space-24) var(--el-space-16);align-items:flex-start}
.shot>h2{font-size:var(--el-size-small);font-weight:var(--el-weight-emphasis);margin-bottom:var(--el-space-8);max-width:390px;color:var(--el-color-text-muted)}
.device{background:var(--el-color-surface);border:var(--el-rule) solid var(--el-color-line);container-type:inline-size;overflow:clip}
.device.phone{width:390px;max-width:calc(100vw - 2 * var(--el-space-16))}.device.desktop{width:1280px}
.desktops{display:grid;gap:var(--el-space-32);padding:0 var(--el-space-16) var(--el-space-48)}
/* the frames simulate viewport widths: the page heading's 900 px media query is replayed per frame */
.device .el-page-head h1{font-size:var(--el-size-title-mobile)}
.device.desktop .el-page-head h1{font-size:var(--el-size-title)}
/* The page: grid placement only. Everything else comes from the catalogue. */
.page{padding:var(--el-space-16);display:grid;gap:var(--el-space-16)}
.layout{display:grid;gap:var(--el-space-16);grid-template-columns:minmax(0,1fr);grid-template-areas:"search" "ruta" "map" "legend" "panel" "table"}
.a-search{grid-area:search}.a-ruta{grid-area:ruta}.a-map{grid-area:map}.a-legend{grid-area:legend}.a-panel{grid-area:panel}.a-table{grid-area:table}
.a-legend:empty,.a-ruta:empty{display:none}
.page .el-alert,.page .el-banner{max-width:none}
@container (min-width: 900px){
  .page{padding:var(--el-space-24) var(--el-space-32);gap:var(--el-space-24)}
  .layout{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);grid-template-rows:auto auto auto auto 1fr;grid-template-areas:"map search" "map ruta" "map legend" "map panel" "map table";gap:var(--el-space-12) var(--el-space-32);align-items:start}
  .a-map{position:sticky;top:72px}
  .a-map .el-map-frame{--map-max-h:min(640px,calc(100vh - 160px))}
}
"""


def build() -> Path:
    fonts = ('@font-face{font-family:"Public Sans";font-weight:200 900;font-style:normal;font-display:swap;'
             'src:url("../../guide/assets/fonts/public-sans-5.3.0-latin-wght.woff2") format("woff2")}')
    phones = "".join(f'<section class="shot"><h2>{e(t)}</h2><div class="device phone">{h}</div></section>'
                     for kind, t, h in PANTALLAS if kind == "phone")
    desktops = "".join(f'<section class="shot"><h2>{e(t)}</h2><div class="device desktop">{h}</div></section>'
                       for kind, t, h in PANTALLAS if kind == "desktop")
    hatch = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
             '<pattern id="el-hatch" width="7" height="7" patternUnits="userSpaceOnUse">'
             '<rect width="7" height="7" class="el-hatch-bg"/><path d="M0 7L7 0" class="el-hatch-line"/></pattern></defs></svg>')
    page = f"""<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapa · mockup (TASK-09)</title>
<link rel="stylesheet" href="../../guide/tokens.css">
<link rel="stylesheet" href="../../guide/components.css">
<style>{fonts}{PAGE_CSS}</style>
</head>
<body>
{hatch}
<div class="bar"><h1>Mapa · mockup</h1><p>Muestra de la API local, corte {corte["corte"]} (datos al {FECHA}). Guía v1.1. Generado por build.py.</p>
<div class="theme"><button class="el-btn el-btn-secondary" type="button" data-t="">Sistema</button><button class="el-btn el-btn-secondary" type="button" data-t="light">Claro</button><button class="el-btn el-btn-secondary" type="button" data-t="dark">Oscuro</button></div></div>
<main><div class="gallery">{phones}</div><div class="desktops">{desktops}</div></main>
<script>
document.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{{const t=b.dataset.t;if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme;}}));
document.addEventListener('click',ev=>{{const b=ev.target.closest('.el-toggletip-btn');if(!b)return;const open=b.getAttribute('aria-expanded')!=='true';ayuda(b,open);}});
document.addEventListener('keydown',ev=>{{if(ev.key!=='Escape')return;document.querySelectorAll('.el-toggletip-btn[aria-expanded=true]').forEach(b=>{{ayuda(b,false);b.focus();}});}});
function ayuda(b,open){{const r=document.getElementById(b.getAttribute('aria-controls'));b.setAttribute('aria-expanded',open);r.innerHTML=open?document.querySelector('template[data-for='+r.id+']').innerHTML:'';}}
const t=new URLSearchParams(location.search).get('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;
</script>
</body>
</html>
"""
    out = HERE / "mockup.html"
    out.write_text(page, encoding="utf-8", newline="\n")
    return out


if __name__ == "__main__":
    path = build()
    print(f"{path.name}: {path.stat().st_size // 1024} KB, {len(PANTALLAS)} pantallas")
