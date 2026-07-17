import { describe, it, expect } from 'vitest';
import { getApiUrl } from './api';

describe('getApiUrl', () => {
  it('prefixes a leading slash when the path has none', () => {
    expect(getApiUrl('api/auth/login')).toBe('/api/auth/login');
  });

  it('keeps a path that already starts with a slash', () => {
    expect(getApiUrl('/api/modules')).toBe('/api/modules');
  });

  it('returns just the normalized slash for an empty path', () => {
    expect(getApiUrl('')).toBe('/');
  });
});
