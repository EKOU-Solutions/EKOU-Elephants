// Worker de datos para `npm run dev` (scripts/datos-local.wrangler.jsonc). Vite no admite archivos
// estáticos en Workers auxiliares, así que incluye los JSON de datos-locales/ al compilar y los
// sirve con la misma ruta que el Worker de producción (`/datos/...`). Vite lo recarga si cambian.
// Los contratos (`contratos/*.ndjson`, TASK-12) también: en local van solo unos pocos grupos de
// muestra, porque el corte completo pesa varios GB.
const archivos = import.meta.glob<string>('../datos-locales/datos/**/*.{json,ndjson}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const porRuta = new Map(
  Object.entries(archivos).map(([ruta, texto]) => [ruta.replace('../datos-locales', ''), texto]),
);

// Las páginas de cada lugar (`npm run paginas`, ADR 0003) se cargan solo cuando se piden: son 1.155.
// Como el Worker de producción, sirve `x.html` en `x` y `sitemap.xml` con su nombre.
const paginas = import.meta.glob<string>('../datos-locales/paginas/**/*.{html,xml}', {
  query: '?raw',
  import: 'default',
});
const paginaPorRuta = new Map(
  Object.entries(paginas).map(([ruta, cargar]) => [
    ruta.replace('../datos-locales', '').replace(/\.html$/, ''),
    cargar,
  ]),
);

export default {
  async fetch(request: Request) {
    const ruta = new URL(request.url).pathname;
    const texto = porRuta.get(ruta);
    if (texto !== undefined)
      return new Response(texto, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    const pagina = paginaPorRuta.get(ruta);
    if (pagina)
      return new Response(await pagina(), {
        headers: {
          'Content-Type': ruta.endsWith('.xml')
            ? 'application/xml; charset=utf-8'
            : 'text/html; charset=utf-8',
        },
      });
    return new Response('no encontrado', { status: 404 });
  },
};
