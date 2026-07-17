import { describe, it, expect, afterEach, vi } from 'vitest';
import { createBindingHandler } from './Binding';
import type { Module } from '@app/types';

const module = { id: 'weather' } as unknown as Module;

function mockFetch(response: Partial<Response> & { ok?: boolean }) {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, headers: new Headers(), ...response }));
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe('createBindingHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no module is provided', async () => {
    const handler = createBindingHandler(undefined);
    expect(await handler({ binding: 'list' })).toBeNull();
  });

  it('targets the current module for a bare binding name', async () => {
    const fetchMock = mockFetch({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    });
    const handler = createBindingHandler(module);

    await handler({ binding: 'listWeather', method: 'GET' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/weather/listWeather');
  });

  it('routes to another module with the "module:binding" syntax', async () => {
    const fetchMock = mockFetch({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });
    const handler = createBindingHandler(module);

    await handler({ binding: 'photos:listPhotos' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/photos/listPhotos');
  });

  it('routes to another module with the "module/binding" syntax', async () => {
    const fetchMock = mockFetch({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });
    const handler = createBindingHandler(module);

    await handler({ binding: 'photos/listPhotos' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/photos/listPhotos');
  });

  it('sends the bearer token and JSON body for object params', async () => {
    const fetchMock = mockFetch({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });
    const handler = createBindingHandler(module, 'jwt-token');

    await handler({ binding: 'createWeather', method: 'POST', params: { city: 'Paris' } });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-token');
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(options.body).toBe(JSON.stringify({ city: 'Paris' }));
  });

  it('passes FormData as-is without setting a JSON content type', async () => {
    const fetchMock = mockFetch({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });
    const handler = createBindingHandler(module);
    const form = new FormData();
    form.append('file', 'x');

    await handler({ binding: 'uploadWeatherFile', method: 'POST', params: form });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.body).toBe(form);
    expect((options.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('throws when the response is not ok', async () => {
    mockFetch({ ok: false, statusText: 'Bad Request' });
    const handler = createBindingHandler(module);

    await expect(handler({ binding: 'listWeather' })).rejects.toThrow('Binding call failed: Bad Request');
  });

  it('returns null for a 204 no-content response', async () => {
    mockFetch({ status: 204, headers: new Headers() });
    const handler = createBindingHandler(module);

    expect(await handler({ binding: 'deleteWeather' })).toBeNull();
  });

  it('returns an object URL for an image response and registers it', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    mockFetch({
      headers: new Headers({ 'content-type': 'image/png' }),
      blob: async () => blob,
    });
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake-url') });
    const registerObjectUrl = vi.fn();
    const handler = createBindingHandler(module, undefined, registerObjectUrl);

    const result = await handler({ binding: 'getWeatherFile' });

    expect(result).toBe('blob:fake-url');
    expect(registerObjectUrl).toHaveBeenCalledWith('blob:fake-url');
  });

  it('returns plain text for a text response', async () => {
    mockFetch({
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'hello',
    });
    const handler = createBindingHandler(module);

    expect(await handler({ binding: 'listWeather' })).toBe('hello');
  });
});
