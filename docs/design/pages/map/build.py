"""Build the Map page mockup (TASK-09, Build a page step 4).

Inputs (all versioned):
- sample/: our API's contract-shaped files for cut 2026-11 (corte, municipios,
  departamentos) and the MGN 2025 TopoJSON, copied from the pipeline export
  (`pipeline/data/r2/datos/`) on 2026-11-15. Real data, no natural persons.
- ../../guide/: tokens.css, components.css, the Public Sans font and Lucide.

Output: mockup.html (git-ignored), standalone and offline.
Run: python3 docs/design/pages/map/build.py   (on Windows: python -X utf8 ...)
To refresh the sample from a new pipeline export: python3 build.py --from <datos dir> <corte>
"""
import base64
import json
import math
import shutil
import sys
from pathlib import Path

folder = Path(__file__).resolve().parent
guide = folder.parent.parent / 'guide'
sample = folder / 'sample'

if len(sys.argv) == 4 and sys.argv[1] == '--from':
    src, cut = Path(sys.argv[2]), sys.argv[3]
    for name in ('corte.json', 'mapa/municipios.json', 'mapa/departamentos.json'):
        shutil.copy(src / cut / name, sample / Path(name).name)
    corte_src = json.loads((src / cut / 'corte.json').read_text(encoding='utf-8'))
    shutil.copy(src / 'geometria' / f"{corte_src['geometria']}.topojson", sample)


def read(name):
    return json.loads((sample / name).read_text(encoding='utf-8'))


corte = read('corte.json')
municipios = read('municipios.json')
departamentos = read('departamentos.json')
topo = read(f"{corte['geometria']}.topojson")

# --- contract checks (fail loudly instead of designing on a broken sample) -------
assert len(municipios['municipios']) == 1122, len(municipios['municipios'])
assert len(departamentos['departamentos']) == 33
n = departamentos['nacional']
assert n['contratos'] == n['contratosEnMunicipios'] + n['contratosSoloDepartamento'] + n['contratosSinLugar']
assert sum(d['contratosEnMunicipios'] for d in departamentos['departamentos']) == n['contratosEnMunicipios']
assert all(m['contratosUbicados'] is None or m['contratosUbicados'] > 0 for m in municipios['municipios'])

# --- geometry: decode TopoJSON, project (equirectangular, cos 4.5 deg), to paths --
sx, sy = topo['transform']['scale']
tx, ty = topo['transform']['translate']
arcs = []
for arc in topo['arcs']:
    x = y = 0
    points = []
    for dx, dy in arc:
        x += dx
        y += dy
        points.append((x * sx + tx, y * sy + ty))
    arcs.append(points)

K = math.cos(math.radians(4.5))
LON0, LAT1, S = -82.0, 14.0, 70.0  # projected units: about 1.6 km each


def project(lon, lat):
    return (lon - LON0) * K * S, (LAT1 - lat) * S


def ring(indexes):
    points = []
    for i in indexes:
        arc = arcs[i] if i >= 0 else arcs[~i][::-1]
        points.extend(arc if not points else arc[1:])
    return points


def polygons(geometry):
    if geometry['type'] == 'Polygon':
        return [geometry['arcs']]
    if geometry['type'] == 'MultiPolygon':
        return geometry['arcs']
    return []


def to_path(geometry, proj=project, off=(0, 0)):
    parts = []
    box = [math.inf, math.inf, -math.inf, -math.inf]
    for polygon in polygons(geometry):
        for r in polygon:
            pts, last = [], None
            for lon, lat in ring(r):
                x, y = proj(lon, lat)
                x, y = x + off[0], y + off[1]
                box = [min(box[0], x), min(box[1], y), max(box[2], x), max(box[3], y)]
                q = (round(x, 2), round(y, 2))
                if q != last:
                    pts.append(q)
                    last = q
            if len(pts) >= 3:
                parts.append('M' + 'L'.join(f'{x:g} {y:g}' for x, y in pts) + 'Z')
    return ''.join(parts), [round(v, 2) for v in box]


dep_paths, dep_box = {}, {}
for g in topo['objects']['departamentos']['geometries']:
    dep_paths[g['properties']['codigo']], dep_box[g['properties']['codigo']] = to_path(g)
mun_paths, mun_box = {}, {}
for g in topo['objects']['municipios']['geometries']:
    mun_paths[g['properties']['codigo']], mun_box[g['properties']['codigo']] = to_path(g)
assert set(mun_paths) == {m['codigo'] for m in municipios['municipios']}

# --- archipelago (88): both islands in ONE panel at the SAME scale -----------------
# San Andrés and Providencia are about 90 km apart, so at a shared true scale both are
# specks. Providencia is moved next to San Andrés (only the empty sea between them is
# removed; shapes and scale are untouched) and x uses cos(12.9 deg), the islands' own
# latitude, so neither island is stretched. The page says the distance is reduced.
K88 = math.cos(math.radians(12.9))


def project88(lon, lat):
    return (lon - LON0) * K88 * S, (LAT1 - lat) * S


geo88 = {g['properties']['codigo']: g for g in topo['objects']['municipios']['geometries']
         if g['properties']['codigo'].startswith('88')}
assert set(geo88) == {'88001', '88564'}, sorted(geo88)
sa_path, sa_box = to_path(geo88['88001'], project88)
_, pv_raw = to_path(geo88['88564'], project88)
GAP = 2.5  # projected units, about 4 km of sea between the two shapes
off = (sa_box[2] + GAP - pv_raw[0], sa_box[1] - pv_raw[1])  # Providencia to the upper right
pv_path, pv_box = to_path(geo88['88564'], project88, off)
archi = {'paths': {'88001': sa_path, '88564': pv_path}, 'boxes': {'88001': sa_box, '88564': pv_box},
         'box': [min(sa_box[0], pv_box[0]), min(sa_box[1], pv_box[1]), max(sa_box[2], pv_box[2]), max(sa_box[3], pv_box[3])]}

mainland = [min(b[0] for c, b in dep_box.items() if c != '88'), min(b[1] for c, b in dep_box.items() if c != '88'),
            max(b[2] for c, b in dep_box.items() if c != '88'), max(b[3] for c, b in dep_box.items() if c != '88')]

data = {
    'corte': corte, 'ventana': municipios['ventana'], 'nacional': n,
    'departamentos': departamentos['departamentos'], 'municipios': municipios['municipios'],
    'depPaths': dep_paths, 'depBox': dep_box, 'munPaths': mun_paths, 'munBox': mun_box, 'mainland': mainland, 'archi': archi,
}
data_json = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

# --- guide assets -------------------------------------------------------------------
tokens = json.loads((guide / 'tokens.json').read_text(encoding='utf-8'))
font_file = guide / 'assets/fonts' / tokens['typography']['family']['file']
font_face = ('@font-face{font-family:"%s";font-weight:200 900;font-style:normal;font-display:swap;'
             'src:url(data:font/woff2;base64,%s) format("woff2")}'
             % (tokens['typography']['family']['name'], base64.b64encode(font_file.read_bytes()).decode()))
lucide = ('/*' + (guide / 'assets/LUCIDE-LICENSE').read_text(encoding='utf-8') + '*/\n'
          + (guide / 'assets/lucide-0.468.0.min.js').read_text(encoding='utf-8'))

template = (folder / 'mockup.source.html').read_text(encoding='utf-8')
html = (template
        .replace('/*__FONT__*/', font_face)
        .replace('/*__TOKENS__*/', (guide / 'tokens.css').read_text(encoding='utf-8'))
        .replace('/*__COMPONENTS__*/', (guide / 'components.css').read_text(encoding='utf-8'))
        .replace('__GUIDE_VERSION__', tokens['version'])
        .replace('/*__DATA__*/null', data_json)
        .replace('/*__LUCIDE__*/', lucide))
for marker in ('/*__FONT__*/', '/*__TOKENS__*/', '/*__COMPONENTS__*/', '__GUIDE_VERSION__', '/*__DATA__*/', '/*__LUCIDE__*/'):
    assert marker not in html, marker
assert html.startswith('<!doctype html>') and '<meta charset="utf-8">' in html[:300]
(folder / 'mockup.html').write_text(html, encoding='utf-8')
print(f"Built mockup.html ({len(html.encode()) // 1024} KB) from cut {corte['corte']} with guide v{tokens['version']}.")
