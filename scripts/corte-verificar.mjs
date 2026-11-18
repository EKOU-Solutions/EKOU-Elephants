// Bot de verificación del corte (ADR 0003, «Publicación del corte con PR y preview»). Revisa una
// publicación armada del Worker de datos (`npm run corte:armar` + `npm run paginas`) antes de que
// una persona apruebe el PR del corte, y deja un resumen en Markdown.
// Uso:
//   npm run corte:verificar -- [--carpeta <ruta>] [--anterior <ruta>] [--url <preview>]
//                              [--umbral 0.25] [--minimo 100]
// --carpeta   Publicación a revisar (por defecto datos-locales).
// --anterior  Publicación del corte anterior. Sin ella se usa el otro corte de la misma carpeta
//             (el Worker de datos publica el vigente y el anterior); si no hay, no se compara.
// --url       Además, el sitio desplegado (el preview del PR): páginas y API.
// --umbral    Variación relativa que se marca (0.25 = 25 %). --minimo: solo cifras desde ese valor.
// Sale con código 1 si algo falla. Con GITHUB_STEP_SUMMARY, también escribe el resumen ahí.
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

export const ESPERADO = { departamentos: 33, municipios: 1122, paginas: 1155 };
export const POR_DEFECTO = { umbral: 0.25, minimo: 100 };
const MEDELLIN = '05001';
const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
const CORTE = /^\d{4}-(0[1-9]|1[0-2])$/;

const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));
const numero = (n) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
const porcentaje = (r) =>
  `${r > 0 ? '+' : ''}${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(r * 100)} %`;

/** Los JSON de un corte de la publicación (`datos/<corte>/`). */
export function leerCorte(carpeta, corte) {
  const dir = join(carpeta, 'datos', corte);
  return {
    corte,
    info: leerJson(join(dir, 'corte.json')),
    departamentos: leerJson(join(dir, 'departamentos.json')),
    municipios: leerJson(join(dir, 'municipios.json')),
  };
}

/** El corte vigente (según `datos/latest.json`) y, si la carpeta lo trae, el anterior más reciente. */
export function leerPublicacion(carpeta) {
  const { corte } = leerJson(join(carpeta, 'datos', 'latest.json'));
  const otros = readdirSync(join(carpeta, 'datos'))
    .filter((d) => CORTE.test(d) && d < corte)
    .sort();
  return { vigente: leerCorte(carpeta, corte), anterior: otros.at(-1) };
}

/** Lugares y totales del corte: los 33 departamentos, los 1.122 municipios y que todo cuadre. */
export function revisarConteos({ info, departamentos, municipios }) {
  const deps = departamentos.departamentos;
  const munis = municipios.municipios;
  const codigosDep = new Set(deps.map((d) => d.codigo));
  const codigosMun = new Set(munis.map((m) => m.codigo));
  const n = departamentos.nacional;
  const sinDepartamento = munis.filter((m) => !codigosDep.has(m.departamento.codigo));
  const sumaDep = deps.reduce((s, d) => s + d.contratosEnMunicipios, 0);
  const sumaMun = munis.reduce((s, m) => s + (m.contratosUbicados ?? 0), 0);
  return [
    {
      ok: deps.length === ESPERADO.departamentos && codigosDep.size === deps.length,
      texto: `${deps.length} departamentos (se esperan ${ESPERADO.departamentos}, sin repetidos)`,
    },
    {
      ok: munis.length === ESPERADO.municipios && codigosMun.size === munis.length,
      texto: `${numero(munis.length)} municipios (se esperan ${numero(ESPERADO.municipios)}, sin repetidos)`,
    },
    {
      ok: sinDepartamento.length === 0,
      texto: sinDepartamento.length
        ? `Municipios con un departamento que no está: ${sinDepartamento.map((m) => m.codigo).join(', ')}`
        : 'Cada municipio tiene su departamento',
    },
    {
      ok:
        n.contratos ===
          n.contratosEnMunicipios + n.contratosSoloDepartamento + n.contratosSinLugar &&
        sumaDep === n.contratosEnMunicipios &&
        sumaMun === n.contratosEnMunicipios,
      texto: `El total nacional cuadra: ${numero(n.contratos)} contratos (municipios ${numero(sumaMun)}, departamentos ${numero(sumaDep)})`,
    },
    {
      ok:
        info.corte === departamentos.corte &&
        info.corte === municipios.corte &&
        departamentos.ventana.desde === municipios.ventana.desde,
      texto: `Los tres archivos son del corte ${info.corte}, datos al ${info.fechaCorte}`,
    },
  ];
}

/** Cada cifra comparable del corte, con su nombre: nacional, departamentos y municipios. */
function cifras({ departamentos, municipios }) {
  const m = new Map();
  const n = departamentos.nacional;
  m.set('nacional', { lugar: 'Colombia', campo: 'contratos', valor: n.contratos });
  m.set('nacional:sinLugar', {
    lugar: 'Colombia',
    campo: 'sin lugar identificado',
    valor: n.contratosSinLugar,
  });
  for (const d of departamentos.departamentos) {
    m.set(`dep:${d.codigo}`, {
      lugar: `${d.nombre} (${d.codigo})`,
      campo: 'en sus municipios',
      valor: d.contratosEnMunicipios,
    });
    m.set(`dep:${d.codigo}:solo`, {
      lugar: `${d.nombre} (${d.codigo})`,
      campo: 'sin municipio identificado',
      valor: d.contratosSoloDepartamento,
    });
  }
  for (const x of municipios.municipios)
    m.set(`mun:${x.codigo}`, {
      lugar: `${x.nombre}, ${x.departamento.nombre} (${x.codigo})`,
      campo: 'contratos ubicados',
      valor: x.contratosUbicados,
    });
  return m;
}

/**
 * Variaciones frente al corte anterior, de mayor a menor. Solo cuentan las cifras de al menos
 * `minimo` en alguno de los dos cortes (en un pueblo con 3 contratos, pasar a 6 es +100 % y no dice
 * nada). Pasar a «Sin datos» es −100 %; dejar de serlo, +100 %. Un lugar que falta es un fallo.
 */
export function variaciones(actual, anterior, { umbral, minimo } = POR_DEFECTO) {
  const antes = cifras(anterior);
  const ahora = cifras(actual);
  const faltan = [...antes.keys()].filter((k) => !ahora.has(k)).map((k) => antes.get(k).lugar);
  const lista = [];
  for (const [clave, a] of ahora) {
    const b = antes.get(clave);
    if (!b) continue;
    const viejo = b.valor;
    const nuevo = a.valor;
    if (viejo === nuevo) continue;
    const mayor = Math.max(viejo ?? 0, nuevo ?? 0);
    if (mayor < minimo) continue;
    const cambio =
      viejo === null || viejo === 0 ? 1 : nuevo === null ? -1 : (nuevo - viejo) / viejo;
    lista.push({ ...a, antes: viejo, ahora: nuevo, cambio, marcada: Math.abs(cambio) > umbral });
  }
  lista.sort(
    (x, y) =>
      Math.abs(y.cambio) - Math.abs(x.cambio) ||
      Math.abs((y.ahora ?? 0) - (y.antes ?? 0)) - Math.abs((x.ahora ?? 0) - (x.antes ?? 0)),
  );
  return { lista, marcadas: lista.filter((v) => v.marcada), faltan };
}

/**
 * Which places get a page and their paths, from the same TypeScript modules the pages are generated
 * with (`paginasDelSitio` in paginas/src/lib/sitio.ts, the routes of mapModel.ts), loaded through
 * Vite so the rule is never copied here. Takes about half a second.
 */
export async function loadPageRules() {
  const importar = async (ruta) =>
    (await runnerImport(join(RAIZ_REPO, ruta), { configFile: false, logLevel: 'silent' })).module;
  const [sitio, mapa] = await Promise.all([
    importar('paginas/src/lib/sitio.ts'),
    importar('src/modules/mapa/ui/mapModel.ts'),
  ]);
  return {
    paginasDelSitio: sitio.paginasDelSitio,
    departmentRoute: mapa.departmentRoute,
    routePath: mapa.routePath,
  };
}

/**
 * The paths of the pages the cut must have (`/mapa`, `/mapa/departamento/05`, `/mapa/05001`…).
 * `paginasDelSitio` only reads the cut's places, so the JSONs are enough (no map outlines needed).
 */
export function expectedPagePaths(rules, { departamentos, municipios }) {
  return rules
    .paginasDelSitio({ data: { departments: departamentos, municipalities: municipios } })
    .map((p) => p.ruta);
}

const archivosHtml = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath, e.name));

/**
 * The generated pages: one per path of `rutas` (`expectedPagePaths`, which must be the 1.155 of
 * `ESPERADO.paginas`), the sitemap with all of them, and unique titles and descriptions.
 */
export function revisarPaginas(carpeta, rutas) {
  const dir = join(carpeta, 'paginas');
  if (!existsSync(dir))
    return [{ ok: false, texto: 'No hay páginas generadas: falta `npm run paginas`' }];
  const esperadas = rutas.map((r) => `${r.slice(1)}.html`);
  const html = archivosHtml(dir);
  const presentes = new Set(html.map((f) => relative(dir, f).replaceAll('\\', '/')));
  const faltan = esperadas.filter((e) => !presentes.has(e));
  const sitemap = join(dir, 'sitemap.xml');
  const urls = existsSync(sitemap)
    ? (readFileSync(sitemap, 'utf8').match(/<url>/g) ?? []).length
    : 0;
  const titulos = new Map();
  const descripciones = new Map();
  for (const f of html) {
    const texto = readFileSync(f, 'utf8');
    const t = /<title>([^<]*)<\/title>/.exec(texto)?.[1] ?? '';
    const d = /<meta name="description" content="([^"]*)"/.exec(texto)?.[1] ?? '';
    titulos.set(t, (titulos.get(t) ?? 0) + 1);
    descripciones.set(d, (descripciones.get(d) ?? 0) + 1);
  }
  const repetidos = (m) => [...m].filter(([k, n]) => n > 1 || !k).map(([k]) => k || '(vacío)');
  const tRep = repetidos(titulos);
  const dRep = repetidos(descripciones);
  return [
    {
      ok: esperadas.length === ESPERADO.paginas,
      texto: `${numero(esperadas.length)} lugares con página (se esperan ${numero(ESPERADO.paginas)}: Colombia, los departamentos menos Bogotá, D.C. y los municipios)`,
    },
    {
      ok: html.length === esperadas.length && faltan.length === 0,
      texto: `${numero(html.length)} páginas (se esperan ${numero(esperadas.length)})${faltan.length ? `; faltan: ${faltan.slice(0, 5).join(', ')}${faltan.length > 5 ? '…' : ''}` : ''}`,
    },
    {
      ok: urls === esperadas.length,
      texto: `sitemap.xml con ${numero(urls)} URL (se esperan ${numero(esperadas.length)})`,
    },
    {
      ok: tRep.length === 0,
      texto: tRep.length
        ? `Títulos repetidos o vacíos: ${tRep.slice(0, 3).join(' | ')}`
        : 'Títulos únicos',
    },
    {
      ok: dRep.length === 0,
      texto: dRep.length
        ? `Descripciones repetidas o vacías: ${dRep.slice(0, 3).join(' | ')}`
        : 'Descripciones únicas',
    },
  ];
}

/** GET con reintentos: `npm run dev` y un preview recién desplegado a veces cortan la conexión. */
async function pedir(url, fetcher, intentos = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
      return { status: res.status, texto: await res.text() };
    } catch (error) {
      if (i >= intentos) return { status: 0, texto: '', error: error?.cause?.code ?? error.name };
      await new Promise((r) => setTimeout(r, 1_000 * i));
    }
  }
}

/**
 * El sitio desplegado: cada página trae en su HTML su nombre y su cifra (no la SPA vacía) y la API
 * sigue respondiendo con el mismo corte.
 */
export async function revisarSitio(
  url,
  { info, departamentos, municipios },
  rules,
  fetcher = fetch,
) {
  const muni = (c) => municipios.municipios.find((m) => m.codigo === c);
  // Medellín and the page Bogotá, D.C.'s link opens (11001, by the app's own rule).
  const bogota = rules.departmentRoute('11');
  const paginas = [
    { ruta: '/mapa', nombre: 'Colombia', cifra: departamentos.nacional.contratos },
    ...[{ view: 'municipality', code: MEDELLIN }, bogota].map((route) => ({
      ruta: rules.routePath(route),
      nombre: muni(route.code)?.nombre ?? route.code,
      cifra: muni(route.code)?.contratosUbicados,
    })),
  ];
  const revisiones = [];
  for (const p of paginas) {
    const r = await pedir(new URL(p.ruta, url).href, fetcher);
    const cifra = p.cifra === null || p.cifra === undefined ? 'Sin datos' : numero(p.cifra);
    const generada = r.texto.includes('<link rel="canonical"');
    revisiones.push({
      ok: r.status === 200 && generada && r.texto.includes(p.nombre) && r.texto.includes(cifra),
      texto: `${p.ruta}: ${r.status || r.error}${generada ? ', página generada' : ', sin página generada'}, «${p.nombre}» y «${cifra}» ${r.texto.includes(p.nombre) && r.texto.includes(cifra) ? 'en el HTML' : 'no están en el HTML'}`,
    });
  }
  const salud = await pedir(new URL('/api/salud', url).href, fetcher);
  revisiones.push({
    ok: salud.status === 200 && salud.texto.includes('"ok":true'),
    texto: `/api/salud: ${salud.status || salud.error}`,
  });
  const api = await pedir(new URL('/api/mapa/corte', url).href, fetcher);
  let corteApi;
  try {
    corteApi = JSON.parse(api.texto).corte;
  } catch {}
  revisiones.push({
    ok: api.status === 200 && corteApi === info.corte,
    texto: `/api/mapa/corte: ${api.status || api.error}, corte ${corteApi ?? '—'} (se espera ${info.corte})`,
  });
  return revisiones;
}

const lineas = (revisiones) => revisiones.map((r) => `- ${r.ok ? '✅' : '❌'} ${r.texto}`);

export function resumenMarkdown({ vigente, anterior, conteos, cambio, paginas, sitio, opciones }) {
  const fallos = [...conteos, ...paginas, ...(sitio ?? [])].filter((r) => !r.ok).length;
  const marcadas = cambio?.marcadas.length ?? 0;
  const faltan = cambio?.faltan.length ?? 0;
  const ok = fallos === 0 && marcadas === 0 && faltan === 0;
  const out = [
    `## Verificación del corte ${vigente.info.corte} ${ok ? '✅' : '❌'}`,
    '',
    `Datos al ${vigente.info.fechaCorte}, ventana desde ${vigente.departamentos.ventana.desde}. ${ok ? 'Todo en orden: falta la revisión de una persona en el preview.' : 'Hay algo que revisar antes de aprobar.'}`,
    '',
    '### Lugares y totales',
    ...lineas(conteos),
    '',
    '### Frente al corte anterior',
  ];
  if (!cambio) {
    out.push('- ⚪ Sin corte anterior en la publicación: no se compara.');
  } else {
    const u = porcentaje(opciones.umbral).replace('+', '±');
    if (anterior.departamentos.ventana.desde !== vigente.departamentos.ventana.desde)
      out.push(
        `- ⚠️ La ventana cambió (desde ${anterior.departamentos.ventana.desde} → ${vigente.departamentos.ventana.desde}): las cifras no son comparables una a una.`,
      );
    out.push(
      `- ${marcadas ? '❌' : '✅'} ${marcadas === 1 ? '1 cifra cambia' : `${marcadas} cifras cambian`} más de ${u} frente a ${anterior.info.corte} (solo cifras desde ${numero(opciones.minimo)}).`,
    );
    if (faltan)
      out.push(`- ❌ Lugares del corte anterior que ya no están: ${cambio.faltan.join(', ')}.`);
    if (cambio.lista.length) {
      out.push(
        '',
        'Las 10 mayores variaciones:',
        '',
        '| Lugar | Cifra | Antes | Ahora | Cambio |',
        '| --- | --- | ---: | ---: | ---: |',
      );
      for (const v of cambio.lista.slice(0, 10))
        out.push(
          `| ${v.lugar} | ${v.campo} | ${v.antes === null ? 'Sin datos' : numero(v.antes)} | ${v.ahora === null ? 'Sin datos' : numero(v.ahora)} | ${v.marcada ? '**' : ''}${porcentaje(v.cambio)}${v.marcada ? '**' : ''} |`,
        );
    }
  }
  out.push('', '### Páginas generadas', ...lineas(paginas));
  if (sitio) out.push('', `### Sitio desplegado (${opciones.url})`, ...lineas(sitio));
  return { ok, markdown: `${out.join('\n')}\n` };
}

export async function verificarCorte(opciones, fetcher = fetch, rules = undefined) {
  rules ??= await loadPageRules();
  const carpeta = resolve(opciones.carpeta);
  const { vigente, anterior: otro } = leerPublicacion(carpeta);
  let anterior;
  if (opciones.anterior) {
    const dir = resolve(opciones.anterior);
    anterior = leerCorte(dir, leerJson(join(dir, 'datos', 'latest.json')).corte);
  } else if (otro) {
    anterior = leerCorte(carpeta, otro);
  }
  const resultado = {
    vigente,
    anterior,
    conteos: revisarConteos(vigente),
    cambio: anterior ? variaciones(vigente, anterior, opciones) : undefined,
    paginas: revisarPaginas(carpeta, expectedPagePaths(rules, vigente)),
    sitio: opciones.url ? await revisarSitio(opciones.url, vigente, rules, fetcher) : undefined,
    opciones,
  };
  return resumenMarkdown(resultado);
}

export function leerArgs(argv) {
  const args = { carpeta: 'datos-locales', ...POR_DEFECTO };
  for (let i = 0; i < argv.length; i++) {
    const valor = argv[i + 1];
    if (argv[i] === '--carpeta') args.carpeta = valor;
    else if (argv[i] === '--anterior') args.anterior = valor;
    else if (argv[i] === '--url') args.url = valor;
    else if (argv[i] === '--umbral') args.umbral = Number(valor);
    else if (argv[i] === '--minimo') args.minimo = Number(valor);
    else throw new Error(`Argumento desconocido: ${argv[i]}`);
    i++;
  }
  if (!(args.umbral > 0) || !(args.minimo >= 0))
    throw new Error('--umbral debe ser mayor que 0 y --minimo, 0 o más.');
  if (args.url) new URL(args.url);
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { ok, markdown } = await verificarCorte(leerArgs(process.argv.slice(2)));
    console.log(markdown);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
    process.exitCode = ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
