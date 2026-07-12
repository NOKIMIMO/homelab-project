import { getApiUrl } from '@lib/api';

export interface AppConfig {
  appRoot: string;
  modulesScanPath: string;
  pluginsScanPath: string;
  logLevel: string;
}

export interface RecoveryCodeStatus {
  exists: boolean;
  createdAt: string | null;
}

export async function fetchAppConfig(headers: HeadersInit): Promise<AppConfig | null> {
  const res = await fetch(getApiUrl('/api/admin/config'), { headers });
  return res.ok ? (await res.json() as AppConfig) : null;
}

export function updateLogLevel(level: string, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl('/api/admin/config/log-level'), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ level }),
  });
}

export async function fetchRecoveryCodeStatus(headers: HeadersInit): Promise<RecoveryCodeStatus | null> {
  const res = await fetch(getApiUrl('/api/admin/recovery-code/status'), { headers });
  return res.ok ? (await res.json() as RecoveryCodeStatus) : null;
}

export function regenerateRecoveryCode(headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl('/api/admin/recovery-code/regenerate'), { method: 'POST', headers });
}

export async function fetchLoginDescription(): Promise<string | null> {
  const res = await fetch(getApiUrl('/api/auth/login-settings'));
  if (!res.ok) return null;
  const data = await res.json() as { description?: string | null };
  return data.description ?? '';
}

export function updateLoginDescription(description: string, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl('/api/admin/login-settings'), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ description }),
  });
}
