import { getApiUrl } from '@lib/api';

export interface ModuleSettings {
  writeAdminOnly: boolean;
  deleteAdminOnly: boolean;
}

export async function fetchModuleSettings(headers: HeadersInit): Promise<Record<string, ModuleSettings> | null> {
  const res = await fetch(getApiUrl('/api/admin/module-settings'), { headers });
  return res.ok ? (await res.json() as Record<string, ModuleSettings>) : null;
}

export function updateModuleSettings(moduleId: string, settings: ModuleSettings, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/module-settings/${moduleId}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(settings),
  });
}
