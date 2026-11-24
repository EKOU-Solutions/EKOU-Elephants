// Genera docs/datos-gov-co/ a partir del catálogo público de datos.gov.co (API de descubrimiento
// de Socrata). Sin dependencias: Node 20+.
//
//   node scripts/catalogo-datos-gov-co.mjs            descarga el catálogo y escribe la doc
//   node scripts/catalogo-datos-gov-co.mjs --cache    reutiliza .cache/datos-gov-co.json
//
// El catálogo trae nombre, descripción, columnas (nombre, tipo, descripción), categoría, entidad y
// fecha de actualización. No trae el número de filas: eso se consulta por dataset (ver README).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'docs', 'datos-gov-co');
const CACHE = join(RAIZ, '.cache', 'datos-gov-co.json');
const DOMINIO = 'www.datos.gov.co';
const PAGINA = 1000;

async function descargar() {
  const resultados = [];
  for (;;) {
    const url =
      `https://api.us.socrata.com/api/catalog/v1?domains=${DOMINIO}&only=dataset` +
      `&order=createdAt&limit=${PAGINA}&offset=${resultados.length}`;
    let datos;
    for (let intento = 1; ; intento++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        datos = await res.json();
        break;
      } catch (error) {
        if (intento === 4) throw error;
        await new Promise((r) => setTimeout(r, 2000 * intento));
      }
    }
    if (datos.results.length === 0) break;
    resultados.push(...datos.results);
    process.stderr.write(`\r${resultados.length}/${datos.resultSetSize} datasets`);
  }
  process.stderr.write('\n');
  return [...new Map(resultados.map((r) => [r.resource.id, r])).values()];
}

// ---------- utilidades ----------
const limpiar = (texto, max) => {
  const plano = String(texto ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
  return plano.length > max ? `${plano.slice(0, max - 1).trimEnd()}…` : plano;
};
const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const fecha = (iso) => (iso ? iso.slice(0, 10) : '—');
const meta = (d, ...claves) => {
  const lista = d.classification?.domain_metadata ?? [];
  for (const clave of claves) {
    const hallado = lista.find((m) => m.key === clave);
    if (hallado?.value) return hallado.value;
  }
  return '';
};

function normalizar(r) {
  const { resource: x, classification: c, owner } = r;
  const nombres = x.columns_field_name ?? [];
  const tipos = x.columns_datatype ?? [];
  return {
    id: x.id,
    nombre: x.name,
    descripcion: x.description ?? '',
    categoria: c?.domain_category || 'Sin categoría',
    etiquetas: c?.domain_tags ?? [],
    entidad: meta(r, 'Información de la Entidad_Nombre de la Entidad') || owner?.display_name || '',
    frecuencia: meta(
      r,
      'Información de Datos_Frecuencia de Actualización',
      'Common-Core_Update-Frequency',
    ),
    actualizado: x.data_updated_at ?? x.updatedAt,
    creado: x.createdAt,
    vistas: x.page_views?.page_views_total ?? 0,
    columnas: nombres.map((nombre, i) => ({
      nombre,
      tipo: tipos[i] ?? '',
      etiqueta: x.columns_name?.[i] ?? '',
    })),
    enlace: r.permalink ?? `https://${DOMINIO}/d/${x.id}`,
  };
}

// Datasets que el proyecto ya usa: cualquier id de 4+4 caracteres citado en estos documentos.
function idsEnUso() {
  const ids = new Set();
  for (const archivo of [
    'docs/fuentes-de-datos.md',
    'docs/investigacion-ingesta.md',
    'docs/adr/0002-ingesta-de-datos.md',
  ]) {
    const ruta = join(RAIZ, archivo);
    if (!existsSync(ruta)) continue;
    for (const [id] of readFileSync(ruta, 'utf8').matchAll(/\b[a-z0-9]{4}-[a-z0-9]{4}\b/g)) {
      ids.add(id);
    }
  }
  return ids;
}

// ---------- escritura ----------
function fichaDataset(d, enUso) {
  const columnas = d.columnas.map((c) => `\`${c.nombre}\` ${c.tipo}`).join(' · ');
  const lineas = [
    `### ${enUso.has(d.id) ? '✅ ' : ''}${limpiar(d.nombre, 160)}`,
    '',
    `\`${d.id}\` · ${limpiar(d.entidad, 120) || 'entidad sin registrar'} · actualizado ${fecha(d.actualizado)}` +
      `${d.frecuencia ? ` · ${limpiar(d.frecuencia, 40)}` : ''} · ${d.vistas.toLocaleString('es-CO')} vistas · ` +
      `[abrir](${d.enlace}) · \`/resource/${d.id}.json\``,
    '',
  ];
  const descripcion = limpiar(d.descripcion, 300);
  if (descripcion) lineas.push(descripcion, '');
  lineas.push(
    d.columnas.length > 0
      ? `**Columnas (${d.columnas.length}):** ${columnas}`
      : '**Columnas:** sin columnas tabulares (mapa, archivo o enlace).',
    '',
  );
  return lineas.join('\n');
}

function escribir(datasets) {
  const enUso = idsEnUso();
  rmSync(join(SALIDA, 'categorias'), { recursive: true, force: true });
  mkdirSync(join(SALIDA, 'categorias'), { recursive: true });

  const porCategoria = new Map();
  for (const d of datasets) {
    if (!porCategoria.has(d.categoria)) porCategoria.set(d.categoria, []);
    porCategoria.get(d.categoria).push(d);
  }
  const categorias = [...porCategoria.entries()].sort((a, b) => b[1].length - a[1].length);
  const generado = new Date().toISOString().slice(0, 10);

  for (const [nombre, lista] of categorias) {
    lista.sort((a, b) => b.vistas - a.vistas);
    const cuerpo = [
      `# ${nombre}`,
      '',
      `${lista.length} datasets, de más a menos consultados. Generado el ${generado} con \`npm run datos:catalogo\`. ` +
        '✅ = ya lo usa el proyecto. Volver al [índice](../indice.md).',
      '',
      ...lista.map((d) => fichaDataset(d, enUso)),
    ];
    writeFileSync(join(SALIDA, 'categorias', `${slug(nombre)}.md`), cuerpo.join('\n'));
  }

  // Índice rápido: categorías + los datasets más consultados + los que ya usamos.
  const fila = (d) =>
    `| \`${d.id}\` | ${limpiar(d.nombre, 90)} | ${limpiar(d.entidad, 50)} | ${fecha(d.actualizado)} | ${d.columnas.length} |`;
  const encabezado = ['| id | Nombre | Entidad | Actualizado | Cols |', '|---|---|---|---|---|'];
  const usados = datasets.filter((d) => enUso.has(d.id));
  const indice = [
    '# Índice del catálogo de datos.gov.co',
    '',
    `${datasets.length} datasets en ${categorias.length} categorías. Generado el ${generado}. ` +
      'Cómo consultarlos y qué cuidar: [README](README.md).',
    '',
    '## Por categoría',
    '',
    '| Categoría | Datasets | Ficha |',
    '|---|---|---|',
    ...categorias.map(
      ([nombre, lista]) =>
        `| ${nombre} | ${lista.length} | [categorias/${slug(nombre)}.md](categorias/${slug(nombre)}.md) |`,
    ),
    '',
    `## Los que ya usa o documenta el proyecto (${usados.length})`,
    '',
    ...encabezado,
    ...usados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(fila),
    '',
    '## Los 100 más consultados',
    '',
    ...encabezado,
    ...[...datasets]
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 100)
      .map(fila),
    '',
  ];
  writeFileSync(join(SALIDA, 'indice.md'), indice.join('\n'));

  // Tabla única para buscar con grep o abrir en una hoja de cálculo.
  const csv = ['id\tcategoria\tentidad\tactualizado\tcolumnas\tnombre'];
  for (const d of datasets) {
    csv.push(
      [d.id, d.categoria, d.entidad, fecha(d.actualizado), d.columnas.length, d.nombre]
        .map((v) => String(v).replace(/[\t\n\r]+/g, ' '))
        .join('\t'),
    );
  }
  writeFileSync(join(SALIDA, 'catalogo.tsv'), `${csv.join('\n')}\n`);
  console.log(
    `${datasets.length} datasets, ${categorias.length} categorías, ${usados.length} en uso`,
  );
}

const usarCache = process.argv.includes('--cache');
let crudo;
if (usarCache && existsSync(CACHE)) {
  crudo = JSON.parse(readFileSync(CACHE, 'utf8'));
} else {
  crudo = await descargar();
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(crudo));
}
mkdirSync(SALIDA, { recursive: true });
escribir(crudo.map(normalizar));
