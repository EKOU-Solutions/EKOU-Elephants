import { cargarSitio } from '../lib/corte';
import { sitemap } from '../lib/sitio';

export async function GET() {
  const { map, sitio, paginas } = await cargarSitio();
  return new Response(sitemap(paginas, sitio, map.data.cut.fechaCorte), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
