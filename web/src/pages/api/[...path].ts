import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

// Rendered on demand: this is the only route that runs the web Worker until contracts arrive.
export const prerender = false;

/**
 * /api/* on workers.dev previews, which do not route by path: the API Worker answers through the
 * service binding (no extra billed request). On the custom domain a route sends /api/* to the API
 * Worker first, so this never runs there (ADR-0004).
 */
export const ALL: APIRoute = ({ request }) => env.API.fetch(request);
