import { getApiUrl } from '@lib/api';

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  publicKey: string | null;
}

export interface SignupRequest {
  id: number;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
  publicKey: string | null;
}

export interface PasswordResetRequest {
  id: number;
  email: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export async function fetchUsers(headers: HeadersInit): Promise<AdminUser[] | null> {
  const res = await fetch(getApiUrl('/api/admin/users'), { headers });
  return res.ok ? (await res.json() as AdminUser[]) : null;
}

export function deleteUser(id: number, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/users/${id}`), { method: 'DELETE', headers });
}

export function setUserAdmin(id: number, isAdmin: boolean, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/users/${id}/admin/${isAdmin}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ isAdmin }),
  });
}

export async function fetchSignupRequests(headers: HeadersInit): Promise<SignupRequest[] | null> {
  const res = await fetch(getApiUrl('/api/admin/signup-requests'), { headers });
  return res.ok ? (await res.json() as SignupRequest[]) : null;
}

export function approveSignupRequest(id: number, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/signup-requests/${id}/approve`), { method: 'PUT', headers });
}

export function rejectSignupRequest(id: number, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/signup-requests/${id}/reject`), { method: 'PUT', headers });
}

export async function fetchPasswordResetRequests(headers: HeadersInit): Promise<PasswordResetRequest[] | null> {
  const res = await fetch(getApiUrl('/api/admin/password-reset-requests'), { headers });
  return res.ok ? (await res.json() as PasswordResetRequest[]) : null;
}

export function approvePasswordReset(id: number, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/password-reset-requests/${id}/approve`), { method: 'PUT', headers });
}

export function rejectPasswordReset(id: number, headers: HeadersInit): Promise<Response> {
  return fetch(getApiUrl(`/api/admin/password-reset-requests/${id}/reject`), { method: 'PUT', headers });
}
