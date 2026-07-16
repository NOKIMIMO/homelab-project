import { getApiUrl } from '@lib/api';

export const DEFAULT_APP_NAME = 'Homelab Core';
const DEFAULT_FAVICON = '/public/icon.svg';

export interface BrandingSettings {
  appName?: string | null;
  hasAppIcon?: boolean;
}

export function appIconUrl(cacheBust?: number): string {
  return `${getApiUrl('/api/auth/app-icon')}${cacheBust ? `?v=${cacheBust}` : ''}`;
}

// Applies the app name/icon to the browser tab (title + favicon), falling back to the
// project defaults when unset. `cacheBust` forces the browser to refetch the favicon right
// after an upload/removal instead of reusing whatever it already cached for that URL.
export function applyBranding({ appName, hasAppIcon }: BrandingSettings, cacheBust?: number): void {
  document.title = appName?.trim() || DEFAULT_APP_NAME;

  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = hasAppIcon ? appIconUrl(cacheBust) : DEFAULT_FAVICON;
}

// Fetches the publicly-readable branding settings and applies them. Never throws: on failure
// the page keeps whatever title/favicon are already set (the static defaults from index.html).
export async function loadAndApplyBranding(): Promise<void> {
  try {
    const res = await fetch(getApiUrl('/api/auth/login-settings'));
    if (!res.ok) return;
    const data = await res.json() as BrandingSettings;
    applyBranding(data);
  } catch {
    // keep default title/favicon
  }
}
