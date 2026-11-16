// Worker de datos para `npm run dev` (scripts/datos-local.wrangler.jsonc). Vite no admite archivos
// estáticos en Workers auxiliares, así que incluye los JSON de datos-locales/ al compilar y los
// sirve con la misma ruta que el Worker de producción (`/datos/...`). Vite lo recarga si cambian.
const archivos = import.meta.glob<string>('../datos-locales/datos/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const porRuta = new Map(
  Object.entries(archivos).map(([ruta, texto]) => [ruta.replace('../datos-locales', ''), texto]),
);

export default {
  fetch(request: Request) {
    const texto = porRuta.get(new URL(request.url).pathname);
    return texto === undefined
      ? new Response('no encontrado', { status: 404 })
      : new Response(texto, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  },
};
