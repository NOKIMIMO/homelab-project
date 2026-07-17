import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  getChallenge,
  loginWithPassword,
  registerUser,
  requestPasswordReset,
  fetchKeys,
} from './authHooks';

function stubFetch(impl: (url: string, options?: RequestInit) => unknown) {
  const fetchMock = vi.fn(async (url: string, options?: RequestInit) => impl(url, options));
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe('authHooks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getChallenge returns the challenge string from the response', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ challenge: 'chal-1' }) }));
    expect(await getChallenge()).toBe('chal-1');
  });

  it('getChallenge throws on a non-ok response', async () => {
    stubFetch(() => ({ ok: false }));
    await expect(getChallenge()).rejects.toThrow('Failed to obtain challenge');
  });

  it('fetchKeys throws on a non-ok response', async () => {
    stubFetch(() => ({ ok: false }));
    await expect(fetchKeys()).rejects.toThrow('Failed to fetch keys');
  });

  it('loginWithPassword posts credentials and returns the parsed result', async () => {
    const fetchMock = stubFetch(() => ({ ok: true, json: async () => ({ success: true, token: 't' }) }));

    const result = await loginWithPassword('a@example.com', 'pw');

    expect(result).toEqual({ success: true, token: 't' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(JSON.parse((options as RequestInit).body as string)).toEqual({ email: 'a@example.com', password: 'pw' });
  });

  it('registerUser falls back to success=ok when the body is not JSON', async () => {
    stubFetch(() => ({ ok: true, json: async () => { throw new Error('empty body'); } }));

    expect(await registerUser('a@example.com', 'pw')).toEqual({ success: true });
  });

  it('requestPasswordReset returns the parsed body on success', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ success: true, message: 'ok' }) }));

    expect(await requestPasswordReset('a@example.com')).toEqual({ success: true, message: 'ok' });
  });

  it('requestPasswordReset surfaces the error message from a failed JSON response', async () => {
    stubFetch(() => ({ ok: false, json: async () => ({ success: false, message: 'nope' }) }));

    expect(await requestPasswordReset('a@example.com')).toEqual({ success: false, message: 'nope' });
  });

  it('requestPasswordReset keeps a generic message when the error body is not JSON', async () => {
    stubFetch(() => ({ ok: false, json: async () => { throw new Error('html error page'); } }));

    expect(await requestPasswordReset('a@example.com')).toEqual({ success: false, message: 'Request failed' });
  });
});
