import { getApiUrl } from '@lib/api';
import type { Module } from '@app/types';
import type { BindingRequest } from '@renderer/types';

export function createBindingHandler(
  module?: Module,
  token?: string,
  registerObjectUrl?: (url: string) => void
) {
  return async function handleBindingCall({ binding, method = 'GET', params }: BindingRequest) {
    if (!module) return null;

    // allow binding to target another module using syntax "module:binding" or "module/binding"
    let targetModuleId = module.id;
    let targetBinding = binding;
    if (typeof binding === 'string') {
      if (binding.includes(':')) {
        const parts = binding.split(':', 2);
        if (parts.length === 2 && parts[0] && parts[1]) {
          targetModuleId = parts[0];
          targetBinding = parts[1];
        }
      } else if (binding.includes('/')) {
        const parts = binding.split('/', 2);
        if (parts.length === 2 && parts[0] && parts[1]) {
          targetModuleId = parts[0];
          targetBinding = parts[1];
        }
      }
    }

    const url = getApiUrl(`/api/${targetModuleId}/${targetBinding}`);
    const isFormData = params instanceof FormData;

    const fetchOptions: RequestInit = {
      method,
      headers: {}
    };

    if (token) (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

    if (params) {
      if (isFormData) {
        fetchOptions.body = params;
      } else {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(params);
      }
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) throw new Error(`Binding call failed: ${res.statusText}`);

    if (res.status === 204) return null;

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
      return (await res.json()) as unknown;
    }

    if (contentType.startsWith('image/') || contentType.includes('application/octet-stream')) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      registerObjectUrl?.(objectUrl);
      return objectUrl;
    }

    const text = await res.text();
    return text || null;
  };
}