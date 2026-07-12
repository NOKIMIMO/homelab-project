import { getApiUrl } from '@lib/api';
import type { Module, ModuleBuilderRequest, ModuleBuilderSummary, ModuleSchemaResponse } from '@app/types';

export async function fetchModuleSummaries(headers: HeadersInit): Promise<ModuleBuilderSummary[] | null> {
  const res = await fetch(getApiUrl('/api/admin/module-builder'), { headers });
  return res.ok ? (await res.json() as ModuleBuilderSummary[]) : null;
}

export async function fetchModuleFullSpec(moduleId: string, headers: HeadersInit): Promise<ModuleBuilderRequest | null> {
  const res = await fetch(getApiUrl(`/api/admin/module-builder/${moduleId}/full`), { headers });
  return res.ok ? (await res.json() as ModuleBuilderRequest) : null;
}

export async function fetchModuleSchema(moduleId: string, headers: HeadersInit): Promise<ModuleSchemaResponse | null> {
  const res = await fetch(getApiUrl(`/api/admin/module-builder/${moduleId}/schema`), { headers });
  return res.ok ? (await res.json() as ModuleSchemaResponse) : null;
}

export async function fetchExistingModules(headers: HeadersInit): Promise<Module[] | null> {
  const res = await fetch(getApiUrl('/api/modules'), { headers });
  return res.ok ? (await res.json() as Module[]) : null;
}

export async function fetchAvailableActionTypes(headers: HeadersInit): Promise<string[] | null> {
  const res = await fetch(getApiUrl('/api/modules/actions'), { headers });
  return res.ok ? (await res.json() as string[]) : null;
}

export function createModule(body: ModuleBuilderRequest, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl('/api/admin/module-builder'), { method: 'POST', headers, body: JSON.stringify(body) });
}

export function updateModule(moduleId: string, body: ModuleBuilderRequest, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/module-builder/${moduleId}`), { method: 'PUT', headers, body: JSON.stringify(body) });
}

export function deleteModule(moduleId: string, dropData: boolean, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/module-builder/${moduleId}?dropData=${dropData}`), { method: 'DELETE', headers });
}

export function uploadModuleIcon(moduleId: string, file: File, headers: HeadersInit): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(getApiUrl(`/api/admin/module-builder/${moduleId}/icon`), { method: 'POST', headers, body: formData });
}

export function rescanModules(headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl('/api/modules/scan'), { method: 'POST', headers });
}

// Shared by install/ui-page/ui-build below: all three POST a single file as FormData and surface
// the same "parse error body, fall back to a default message" flow.
async function uploadFormData(
  path: string,
  file: File,
  headers: HeadersInit,
  errorFallback: string,
  checkMessageFallback: boolean
): Promise<{ id?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(getApiUrl(path), { method: 'POST', headers, body: formData });
  const body = await res.json().catch(() => null) as { error?: string; message?: string; id?: string } | null;
  if (!res.ok) {
    throw new Error((checkMessageFallback ? body?.error ?? body?.message : body?.error) ?? errorFallback);
  }
  return body ?? {};
}

export function installModuleZip(file: File, headers: HeadersInit): Promise<{ id?: string }> {
  return uploadFormData('/api/modules/install', file, headers, "Échec de l'installation du module", true);
}

export function uploadModuleUiPage(moduleId: string, file: File, headers: HeadersInit): Promise<{ id?: string }> {
  return uploadFormData(`/api/admin/module-builder/${moduleId}/ui-page`, file, headers, "Échec de l'envoi de la page UI", false);
}

export function uploadModuleUiBuild(moduleId: string, file: File, headers: HeadersInit): Promise<{ id?: string }> {
  return uploadFormData(`/api/admin/module-builder/${moduleId}/ui-build`, file, headers, "Échec de l'envoi du build", false);
}

// The export endpoint requires the Authorization header, so a plain <a href> download won't
// carry the JWT — fetch as a blob and trigger the download via a temporary object URL instead.
export async function exportModuleZip(moduleId: string, headers: HeadersInit): Promise<void> {
  const res = await fetch(getApiUrl(`/api/modules/${moduleId}/export`), { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? "Échec de l'export du module");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${moduleId}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
