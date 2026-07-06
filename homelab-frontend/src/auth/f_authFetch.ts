import { getApiUrl } from "@lib/api";

export async function authFetch(
  url: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
) {
  const token = sessionStorage.getItem("homelab_token");

  const res = await fetch(getApiUrl(url), {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem("homelab_token");
    sessionStorage.removeItem("homelab_user_name");

    onUnauthorized?.();
    return null;
  }

  return res;
}