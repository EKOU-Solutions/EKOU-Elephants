// How the web reaches the API (ADR-0004). Two adapters behind one port:
// - service binding (production, and previews by default: a Preview's binding always reaches the
//   API's production deployment);
// - public URL (`API_URL`): only when a preview must use an API preview (this PR's or another PR's),
//   which a service binding cannot reach. One more request, in test environments only.

export interface ApiGateway {
  fetch(request: Request): Promise<Response>;
}

/** Calls the API Worker through the service binding: same thread, no extra billed request. */
export function bindingGateway(api: Fetcher): ApiGateway {
  return { fetch: (request) => api.fetch(request) };
}

/** Calls the API at its public URL, keeping the path, query, method, headers and body. */
export function urlGateway(base: string, send: typeof fetch = fetch): ApiGateway {
  const origin = new URL(base);
  return {
    fetch(request) {
      const from = new URL(request.url);
      const target = new URL(`${from.pathname}${from.search}`, origin);
      return send(new Request(target, request));
    },
  };
}

export interface ApiEnv {
  API?: Fetcher;
  API_URL?: string;
}

/** `API_URL` when the deploy sets it (a preview using an API preview); otherwise the binding. */
export function apiGateway(env: ApiEnv, send: typeof fetch = fetch): ApiGateway {
  if (env.API_URL?.trim()) return urlGateway(env.API_URL.trim(), send);
  if (!env.API) throw new Error('The web Worker has neither the API binding nor API_URL.');
  return bindingGateway(env.API);
}
