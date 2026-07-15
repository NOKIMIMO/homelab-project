import { getApiUrl } from '@lib/api';

export interface LoginResult {
  success: boolean;
  token?: string;
  keyName?: string;
  message?: string;
  mustResetPassword?: boolean;
}

export interface SimpleResult {
  success: boolean;
  message?: string;
}

export async function fetchKeys(): Promise<string[]> {
  const res = await fetch(getApiUrl('/api/auth/keys'));
  if (!res.ok) throw new Error('Failed to fetch keys');
  const data = (await res.json()) as string[];
  return data;
}

export async function getChallenge(): Promise<string> {
  const res = await fetch(getApiUrl('/api/auth/challenge'));
  if (!res.ok) throw new Error('Failed to obtain challenge');
  const data = (await res.json()) as { challenge: string };
  return data.challenge;
}

export async function loginWithKey(challenge: string, signatureBase64: string): Promise<LoginResult> {
  const res = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge, signature: signatureBase64 }),
  });
  const data = (await res.json()) as LoginResult;
  return data;
}

export async function authenticateWithPrivateKey(privateKeyPem: string): Promise<LoginResult> {
  const challengeRes = await fetch(getApiUrl('/api/auth/challenge'));
  if (!challengeRes.ok) throw new Error('Failed to fetch challenge');
  const { challenge } = (await challengeRes.json()) as { challenge: string };

  // dynamic import of authService helper to avoid circular deps and allow testing
  const { signChallengeWithPrivateKey } = await import('@lib/authService');
  const signatureBase64 = await signChallengeWithPrivateKey(privateKeyPem, challenge);

  return loginWithKey(challenge, signatureBase64);
}

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as LoginResult;
  return data;
}

export async function registerUser(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(getApiUrl('/api/auth/signup-requests'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  try {
    return (await res.json()) as LoginResult;
  } catch {
    // A 200 with an empty body still means the signup request was recorded successfully.
    return { success: res.ok };
  }
}

export async function requestPasswordReset(email: string): Promise<SimpleResult> {
  const res = await fetch(getApiUrl('/api/auth/password-reset-requests'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let message = 'Échec de la demande';
    try {
      const data = await res.json() as SimpleResult;
      message = data.message || message;
    } catch {
      // non-JSON error body (e.g. proxy error page): keep the generic message
    }
    return { success: false, message };
  }
  return (await res.json()) as SimpleResult;
}
