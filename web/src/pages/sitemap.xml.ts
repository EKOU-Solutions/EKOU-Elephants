import { loadSite } from '../../../pages-site/src/lib/cut';
import { sitemap } from '../../../pages-site/src/lib/site';

export async function GET() {
  const { map, site, pages } = await loadSite();
  return new Response(sitemap(pages, site, map.data.cut.fechaCorte), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
