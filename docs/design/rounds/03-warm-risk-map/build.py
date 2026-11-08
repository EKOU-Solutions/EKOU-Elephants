"""Build offline previews from repository-owned design sources. Python 3, no packages."""
import json
from html import escape
from pathlib import Path

folder = Path(__file__).resolve().parent
regions = json.loads((folder / 'assets/territories.json').read_text())
source = (folder / 'source.html').read_text()
fragment = source.replace('__MAP_PATHS__', (folder / 'assets/map-paths.svg').read_text())
fragment = fragment.replace('__TERRITORIES__', json.dumps(regions, ensure_ascii=False))
fragment = fragment.replace('__OPTIONS__', ''.join(
    f'<option value="{escape(r["id"])}">{escape(r["name"])}</option>' for r in regions))
assert '__MAP_PATHS__' not in fragment and '__TERRITORIES__' not in fragment
assert len(regions) == 33 and len({r['id'] for r in regions}) == 33
assert all(r['available'] >= r['analyzed'] >= 0 for r in regions)
assert all(r['flagged'] is None if r['analyzed'] == 0 else 0 <= r['flagged'] <= r['analyzed'] for r in regions)
assert len(fragment.encode()) < 1_000_000
(folder / 'mockup.html').write_text(fragment)
(folder / 'preview.html').write_text(
    '<!doctype html><html lang="es"><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>Elephants — Round 03</title>'
    '<body style="margin:0;padding:16px;background:#fff">' + fragment + '</body></html>')
print('Built mockup.html and preview.html; 33 territories; no runtime dependencies.')
