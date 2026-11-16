"""Build the visual guide from repository-owned sources (Python standard library)."""
import json
import re
from html import escape
from pathlib import Path

folder = Path(__file__).resolve().parent
tokens = json.loads((folder / 'tokens.json').read_text())
colors = tokens['colors']
template = (folder / 'source.html').read_text().replace('§', '#elephants-visual-guide')
import base64

def luminance(hex_color):
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    channels = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(a*b for a,b in zip(channels, [.2126, .7152, .0722]))

def contrast(a, b):
    low, high = sorted([luminance(colors[a]), luminance(colors[b])])
    return (high + .05) / (low + .05)

pairs = [
    ('Texto principal / blanco', 'text', 'surface', 4.5),
    ('Texto secundario / fondo suave', 'text-muted', 'surface-subtle', 4.5),
    ('Botón principal', 'on-action', 'action', 4.5),
    ('Botón principal al pasar el cursor', 'on-action', 'action-hover', 4.5),
    ('Aviso informativo', 'action', 'action-soft', 4.5),
    ('Aviso de advertencia', 'warning', 'warning-soft', 4.5),
    ('Aviso de error', 'danger', 'danger-soft', 4.5),
    ('Confirmación de éxito', 'success', 'success-soft', 4.5),
    ('Borde de control / blanco', 'control-border', 'surface', 3),
    ('Foco / blanco', 'action', 'surface', 3)
]
report = [{'usage': name, 'foreground': colors[a], 'background': colors[b], 'ratio': round(contrast(a,b), 3), 'minimum': minimum, 'passes': contrast(a,b) >= minimum} for name,a,b,minimum in pairs]
assert all(row['passes'] for row in report), report
(folder / 'contrast-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')

def swatch(name, token, why, hatched=False):
    fill = 'repeating-linear-gradient(135deg,var(--eg-surface-subtle) 0 5px,var(--eg-unknown) 5px 6px)' if hatched else f'var(--eg-{token})'
    return f'<article class="eg-color"><div class="eg-color-block" style="background:{fill}"></div><h4>{escape(name)}</h4><code>{colors[token]}</code><p>{escape(why)}</p></article>'

risk = [
    ('Riesgo bajo', 'risk-low', 'Azul: permite distinguir una situación de menor riesgo sin prometer seguridad.'),
    ('Riesgo intermedio', 'risk-medium', 'Amarillo: dirige la atención hacia señales que requieren revisión.'),
    ('Riesgo alto', 'risk-high', 'Rojo cálido: mayor énfasis, con una etiqueta que explica su significado.'),
    ('Datos insuficientes', 'unknown', 'Trama gris: no se puede asignar una categoría con la información disponible.')
]
ui = [
    ('Superficie', 'surface', 'Blanco para concentrarse en mapas, cifras y lectura.'),
    ('Fondo secundario', 'surface-subtle', 'Agrupa ejemplos o contenido auxiliar sin competir con el dato.'),
    ('Texto principal', 'text', 'Azul muy oscuro para títulos, cifras y contenido esencial.'),
    ('Texto secundario', 'text-muted', 'Fuentes, fechas y explicaciones; sigue siendo legible.'),
    ('Acción principal', 'action', 'Botones y enlaces: diferencia lo que se puede hacer de lo que se observa.'),
    ('Acción al pasar el cursor', 'action-hover', 'El tono más oscuro confirma la interacción sin movimiento decorativo.'),
    ('Separador', 'line', 'Organiza grupos. No identifica por sí solo un control.'),
    ('Borde de control', 'control-border', 'Delimita campos y controles con contraste respecto al blanco.')
]
semantic = [('Información','action','action-soft','Explica un dato o una condición.'),('Advertencia','warning','warning-soft','Comunica cobertura parcial o algo que requiere atención.'),('Error','danger','danger-soft','Explica qué falló y ofrece un siguiente paso.'),('Éxito','success','success-soft','Confirma una acción completada, no la ausencia de riesgo.')]
icons = [('search','Buscar'),('map-pin','Ubicación'),('sliders-horizontal','Filtros'),('chevron-down','Desplegar'),('info','Información'),('triangle-alert','Advertencia'),('circle-alert','Error'),('circle-check','Confirmación'),('loader-circle','Carga'),('external-link','Fuente externa')]
f = tokens['fixture']
assert 0 <= f['flagged-contracts'] <= f['analyzed-contracts'] <= f['available-contracts']
percentage = 100 * f['flagged-contracts'] / f['analyzed-contracts']
coverage = 100 * f['analyzed-contracts'] / f['available-contracts']
def number(value):
    return f'{value:,.1f}'.rstrip('0').rstrip('.').replace(',', '|').replace('.', ',').replace('|', '.')
territories = json.loads((folder.parent / 'rounds/02-risk-signals/assets/territories.json').read_text())
def level(item):
    # Illustrative example split for the hero only; these are NOT agreed risk thresholds (TASK-07).
    if not item['analyzed']:
        return 'unknown'
    share = 100 * item['flagged'] / item['analyzed']
    return 'risk-low' if share <= 12 else 'risk-medium' if share <= 30 else 'risk-high'
fills = {t['id']: level(t) for t in territories}
raw = (folder.parent / 'rounds/02-risk-signals/assets/map-paths.svg').read_text()
elements = re.findall(r'<path data-region="[^"]+".*?(?:</path>|/>)', raw, flags=re.S)
assert len(elements) == 33, len(elements)
names = {t['id']: t['name'] for t in territories}
ordered = sorted(elements, key=lambda e: 'CO-ANT' in e)
def paint(element):
    region = re.search(r'data-region="([^"]+)"', element).group(1)
    fill = 'url(#eg-no-data)' if fills[region] == 'unknown' else colors[fills[region]]
    element = re.sub(r'\sfill="[^"]*"', '', element)
    selected = ' data-selected="true"' if region == 'CO-ANT' else ''
    element = element.replace('<path ', f'<path fill="{fill}"{selected} ', 1)
    return re.sub(r'<title>.*?</title>', '', element, flags=re.S)
map_svg = ('<svg viewBox="0 0 600 560" role="img" aria-labelledby="eg-map-title"><title id="eg-map-title">Mapa de ejemplo de Colombia por departamento, con Antioquia seleccionado</title>'
           '<defs><pattern id="eg-no-data" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#F5F7F9"/><path d="M0 7L7 0" stroke="#8B9499" stroke-width="1"/></pattern></defs>'
           + ''.join(paint(e) for e in ordered) + '</svg>')
legend = ''.join(f'<li><i class="eg-key {cls}" aria-hidden="true"></i>{label}</li>' for cls,label in [('eg-key-low','Riesgo bajo'),('eg-key-medium','Riesgo intermedio'),('eg-key-high','Riesgo alto'),('eg-key-unknown','Sin datos suficientes')])
variants = {
    'atkinson': dict(
        family='"Atkinson Hyperlegible Next",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        face='@font-face{font-family:"Atkinson Hyperlegible Next";font-weight:200 800;font-style:normal;font-display:swap;src:url(data:font/woff2;base64,' + base64.b64encode((folder / 'assets/atkinson-hyperlegible-next-5.3.0-latin-wght.woff2').read_bytes()).decode() + ') format("woff2")}',
        note='Atkinson Hyperlegible Next: letras muy distinguibles, pensada para baja visión. Se aloja con la aplicación (licencia OFL).'),
    'system': dict(
        family=tokens['typography']['family-system'],
        face='',
        note='Sans serif del sistema: familiar y sin descargas. La apariencia exacta varía según el dispositivo.'),
}
replacements = {
    '__MAP__': map_svg, '__LEGEND__': legend,
    '__TOKENS__': ''.join(f'--eg-{name}:{value};' for name,value in colors.items()),
    '__SPACING__': ''.join(f'<span><i style="height:{n}px"></i>{n} px</span>' for n in tokens['spacing']),
    '__RISK_SWATCHES__': ''.join(swatch(name, token, why, token=='unknown') for name,token,why in risk),
    '__UI_SWATCHES__': ''.join(swatch(*item) for item in ui),
    '__SEMANTIC_SWATCHES__': ''.join(f'<article class="eg-semantic-sample" style="color:var(--eg-{fg});background:var(--eg-{bg})"><strong>{name}</strong><p>{why}</p><p><code>{colors[fg]} / {colors[bg]}</code></p></article>' for name,fg,bg,why in semantic),
    '__CONTRAST_ROWS__': ''.join(f'<tr><th scope="row">{row["usage"]}</th><td>{row["ratio"]:.2f}:1</td><td>≥ {row["minimum"]}:1</td></tr>' for row in report),
    '__ICONS__': ''.join(f'<div class="eg-icon-item"><i data-lucide="{name}" aria-hidden="true"></i><span>{label}</span></div>' for name,label in icons),
    '__PERCENT__': number(percentage), '__COVERAGE__': number(coverage),
    '__FLAGGED__': number(f['flagged-contracts']), '__ANALYZED__': number(f['analyzed-contracts']), '__AVAILABLE__': number(f['available-contracts']),
    '__COUNT__': number(f['contract-count']), '__MILLIONS__': number(f['money-cop']/1_000_000),
    '__PREVIOUS__': number(f['previous-percent']), '__DELTA__': number(percentage-f['previous-percent'])
}
library = (folder / 'assets/lucide-0.468.0.min.js').read_text()
license_text = (folder / 'assets/LUCIDE-LICENSE').read_text()
outputs = {'atkinson': ('guide.html', 'preview.html'), 'system': ('guide-system.html', 'preview-system.html')}
for name, variant in variants.items():
    source = template
    for placeholder, value in {**replacements, '__FONTFACE__': variant['face'], '__FONTFAMILY__': variant['family'], '__FONTNOTE__': variant['note']}.items():
        source = source.replace(placeholder, value)
    assert not re.findall(r'__[A-Z_]+__', source), re.findall(r'__[A-Z_]+__', source)
    assert '<html' not in source and '<body' not in source
    assert len(source.encode()) < 1_000_000
    fragment_name, preview_name = outputs[name]
    (folder / fragment_name).write_text(source)
    preview = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elephants · Guía visual</title><body style="margin:0;padding:16px;background:#fff"><script>/*'+license_text+'*/\n'+library+'</script>'+source+'</body></html>'
    (folder / preview_name).write_text(preview)
print(f'Built visual guide variants (atkinson, system); {len(report)} contrast pairs passed; previews include offline Lucide.')
