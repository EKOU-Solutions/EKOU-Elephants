// Genera con Astro las páginas de cada lugar del mapa (ADR 0003) dentro de la carpeta de publicación
// del Worker de datos: `<carpeta>/paginas/mapa.html`, `…/mapa/<código>.html`,
// `…/mapa/departamento/<código>.html` y `…/sitemap.xml`. El Worker de datos las sirve sin extensión
// (`/paginas/mapa/05001`) y el Worker de la app las pide por el binding DATOS.
// Uso:
//   npm run paginas -- --sitio https://<dominio> [--carpeta <ruta>]
// La URL del sitio también puede ir en EKOU_SITIO_URL. Carpeta por defecto: datos-locales.
// En el corte mensual: --carpeta pipeline/worker-datos/publicacion (docs/ci-cd.md).
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
export const SALIDA = 'paginas';

export function leerArgs(argv, env = process.env) {
  const args = { carpeta: 'datos-locales', sitio: env.EKOU_SITIO_URL, solo: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--carpeta') args.carpeta = argv[++i];
    else if (argv[i] === '--sitio') args.sitio = argv[++i];
    // Solo algunas rutas (pruebas): `--solo /mapa,/mapa/05001`. El sitemap lista siempre todas.
    else if (argv[i] === '--solo') args.solo = argv[++i];
    else throw new Error(`Argumento desconocido: ${argv[i]}`);
  }
  if (!args.sitio)
    throw new Error(
      'Falta la URL del sitio: --sitio https://<dominio> o EKOU_SITIO_URL (canonical, og:url y sitemap).',
    );
  return args;
}

/** Todos los archivos bajo `dir`, con su ruta relativa. */
function archivos(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
}

/**
 * Las páginas no llevan nada propio de Astro: se quitan sus hojas de estilo (el Worker de la app
 * enlaza las de la app, con los mismos nombres de clase) y se comprueba que no haya scripts que
 * ejecuten (solo el JSON-LD).
 */
export function limpiarHtml(html) {
  const limpio = html
    .replace(/<link rel="stylesheet"[^>]*>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  const scripts = [...limpio.matchAll(/<script\b[^>]*>/g)].filter(
    (m) => !m[0].includes('type="application/ld+json"'),
  );
  if (scripts.length) throw new Error(`La página trae un script propio: ${scripts[0][0]}`);
  return limpio;
}

export async function generarPaginas({ carpeta, sitio, solo }) {
  const publicacion = resolve(RAIZ_REPO, carpeta);
  if (!existsSync(join(publicacion, 'datos', 'latest.json')))
    throw new Error(`No hay datos/latest.json en ${publicacion}: primero arma la publicación.`);
  const salida = join(publicacion, SALIDA);
  Object.assign(process.env, {
    EKOU_PUBLICACION: publicacion,
    EKOU_GEOMETRIA: join(RAIZ_REPO, 'public', 'geometria'),
    EKOU_SITIO_URL: sitio,
    ASTRO_TELEMETRY_DISABLED: '1',
  });
  if (solo) process.env.EKOU_PAGINAS_SOLO = solo;
  else delete process.env.EKOU_PAGINAS_SOLO;

  const { build } = await import('astro');
  await build({
    root: join(RAIZ_REPO, 'paginas'),
    outDir: salida,
    logLevel: process.env.EKOU_ASTRO_LOG ?? 'warn',
  });

  // Lo que Astro deja aparte de las páginas (sus CSS) no se publica.
  rmSync(join(salida, '_astro'), { recursive: true, force: true });
  let paginas = 0;
  let bytes = 0;
  for (const archivo of archivos(salida)) {
    if (archivo.endsWith('.html')) {
      writeFileSync(archivo, limpiarHtml(readFileSync(archivo, 'utf8')));
      paginas++;
    } else if (!archivo.endsWith('sitemap.xml')) {
      throw new Error(`Archivo inesperado en la salida: ${relative(salida, archivo)}`);
    }
    bytes += statSync(archivo).size;
  }
  return { salida, paginas, bytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { salida, paginas, bytes } = await generarPaginas(leerArgs(process.argv.slice(2)));
    console.log(
      `${paginas} páginas y sitemap.xml en ${relative(process.cwd(), salida) || '.'} (${(bytes / 1024 / 1024).toFixed(1)} MB).`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
