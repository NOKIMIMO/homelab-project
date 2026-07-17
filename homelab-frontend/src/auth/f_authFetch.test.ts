import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authFetch } from './f_authFetch';

describe('authFetch', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the bearer token from sessionStorage when present', async () => {
    sessionStorage.setItem('homelab_token', 'jwt-abc');
    const fetchMock = vi.fn(async () => ({ status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    await authFetch('/api/modules', { method: 'GET' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/modules');
    expect((options as RequestInit).headers).toMatchObject({ Authorization: 'Bearer jwt-abc' });
    expect((options as RequestInit).method).toBe('GET');
  });

  it('omits the Authorization header when no token is stored', async () => {
    const fetchMock = vi.fn(async () => ({ status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    await authFetch('/api/modules');

    const [, options] = fetchMock.mock.calls[0];
    expect((options as RequestInit).headers).not.toHaveProperty('Authorization');
  });

  it('preserves caller-provided headers alongside the token', async () => {
    sessionStorage.setItem('homelab_token', 'jwt-abc');
    const fetchMock = vi.fn(async () => ({ status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    await authFetch('/api/x', { headers: { 'X-Custom': '1' } });

    const [, options] = fetchMock.mock.calls[0];
    expect((options as RequestInit).headers).toMatchObject({ 'X-Custom': '1', Authorization: 'Bearer jwt-abc' });
  });

  it('clears the stored session and calls onUnauthorized on a 401', async () => {
    sessionStorage.setItem('homelab_token', 'jwt-abc');
    sessionStorage.setItem('homelab_user_name', 'alice');
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 401 })) as unknown as typeof fetch);
    const onUnauthorized = vi.fn();

    const result = await authFetch('/api/x', {}, onUnauthorized);

    expect(result).toBeNull();
    expect(sessionStorage.getItem('homelab_token')).toBeNull();
    expect(sessionStorage.getItem('homelab_user_name')).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('returns the response untouched for a non-401 status', async () => {
    const response = { status: 200 };
    vi.stubGlobal('fetch', vi.fn(async () => response) as unknown as typeof fetch);

    const result = await authFetch('/api/x');

    expect(result).toBe(response);
  });
});
