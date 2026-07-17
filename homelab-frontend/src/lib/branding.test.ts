import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { appIconUrl, applyBranding, loadAndApplyBranding, DEFAULT_APP_NAME } from './branding';

describe('appIconUrl', () => {
  it('returns the icon endpoint without a cache-bust param by default', () => {
    expect(appIconUrl()).toBe('/api/auth/app-icon');
  });

  it('appends a version query when a cache-bust value is given', () => {
    expect(appIconUrl(42)).toBe('/api/auth/app-icon?v=42');
  });

  it('omits the cache-bust query when the value is zero (falsy)', () => {
    expect(appIconUrl(0)).toBe('/api/auth/app-icon');
  });
});

describe('applyBranding', () => {
  beforeEach(() => {
    document.title = '';
    document.head.querySelectorAll("link[rel~='icon']").forEach((n) => n.remove());
  });

  it('sets the document title to the trimmed app name', () => {
    applyBranding({ appName: '  My Lab  ' });
    expect(document.title).toBe('My Lab');
  });

  it('falls back to the default app name when the name is blank or missing', () => {
    applyBranding({ appName: '   ' });
    expect(document.title).toBe(DEFAULT_APP_NAME);

    applyBranding({});
    expect(document.title).toBe(DEFAULT_APP_NAME);
  });

  it('creates a favicon link pointing at the app icon endpoint when an icon exists', () => {
    applyBranding({ appName: 'X', hasAppIcon: true }, 7);
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link).not.toBeNull();
    expect(link!.href).toContain('/api/auth/app-icon?v=7');
  });

  it('uses the default favicon when no app icon is set', () => {
    applyBranding({ appName: 'X', hasAppIcon: false });
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link!.href).toContain('/favicon.svg');
  });

  it('reuses an existing favicon link element instead of creating duplicates', () => {
    applyBranding({ hasAppIcon: false });
    applyBranding({ hasAppIcon: true });
    expect(document.head.querySelectorAll("link[rel~='icon']").length).toBe(1);
  });
});

describe('loadAndApplyBranding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies branding fetched from the login-settings endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ appName: 'Fetched Lab', hasAppIcon: false }),
    })) as unknown as typeof fetch);

    await loadAndApplyBranding();

    expect(document.title).toBe('Fetched Lab');
  });

  it('keeps existing title on a non-ok response', async () => {
    document.title = 'Untouched';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch);

    await loadAndApplyBranding();

    expect(document.title).toBe('Untouched');
  });

  it('never throws when the fetch itself rejects', async () => {
    document.title = 'Still Here';
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch);

    await expect(loadAndApplyBranding()).resolves.toBeUndefined();
    expect(document.title).toBe('Still Here');
  });
});
