import { describe, expect, it, vi } from 'vitest';
import { apiGateway } from './apiGateway';

const ok = () => new Response('{"ok":true}');

describe('apiGateway', () => {
  it('uses the service binding when there is no API_URL', async () => {
    const binding = { fetch: vi.fn(async () => ok()) } as unknown as Fetcher;
    const send = vi.fn();
    const request = new Request('https://web.dev/api/salud');
    await apiGateway({ API: binding }, send).fetch(request);
    expect(binding.fetch).toHaveBeenCalledWith(request);
    expect(send).not.toHaveBeenCalled();
  });

  it('with API_URL calls the API preview, keeping path, query and method', async () => {
    const binding = { fetch: vi.fn() } as unknown as Fetcher;
    const send = vi.fn(async (_request: Request) => ok());
    const gateway = apiGateway(
      { API: binding, API_URL: 'https://pr-7-ekou-elephants-api.ekou.workers.dev' },
      send as unknown as typeof fetch,
    );
    await gateway.fetch(new Request('https://pr-7-web.dev/api/mapa/municipios?x=1', { method: 'HEAD' }));
    const sent = send.mock.calls[0]?.[0] as Request;
    expect(sent.url).toBe('https://pr-7-ekou-elephants-api.ekou.workers.dev/api/mapa/municipios?x=1');
    expect(sent.method).toBe('HEAD');
    expect(binding.fetch).not.toHaveBeenCalled();
  });

  it('fails clearly without either', () => {
    expect(() => apiGateway({})).toThrow('neither');
  });
});
