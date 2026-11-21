import { defineMiddleware } from 'astro:middleware';
import { cacheKey, isContractPath } from './lib/contractPage';

/**
 * Contract pages (ADR-0004) are rendered once and kept in Cloudflare's cache (`caches.default`): the
 * next visits never call the API. Only what the page says may be kept goes in (a contract or a short
 * «no existe»; never «datos no disponibles»).
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  if (context.isPrerendered || request.method !== 'GET' || !isContractPath(url.pathname))
    return next();
  // Not in Node (tests, `astro dev` without workerd): render as always.
  const cache = (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default;
  if (!cache) return next();
  const key = cacheKey(url, import.meta.env.EKOU_CORTE, import.meta.env.EKOU_VERSION);
  const kept = await cache.match(key);
  if (kept) return kept;
  const response = await next();
  if (response.headers.get('Cache-Control')?.startsWith('public'))
    context.locals.cfContext.waitUntil(cache.put(key, response.clone()));
  return response;
});
