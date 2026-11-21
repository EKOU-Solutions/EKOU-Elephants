import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { apiGateway } from '../../lib/apiGateway';

// Rendered on demand: with the contract pages, the only routes that run the web Worker.
export const prerender = false;

/**
 * /api/* on workers.dev, which does not route by path: the API answers through the gateway (the
 * service binding, or the API preview's URL when the deploy sets API_URL). On the custom domain a
 * route sends /api/* to the API Worker first, so this never runs there (ADR-0004).
 */
export const ALL: APIRoute = ({ request }) => apiGateway(env).fetch(request);
