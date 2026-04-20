const ensureHttpScheme = (url: string): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `http://${url}`;
};

const stripTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "http://localhost:8080";
const normalizedBase = stripTrailingSlash(ensureHttpScheme(rawBase));

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutApiPrefix = normalizedPath.startsWith("/api/")
    ? normalizedPath.slice(4)
    : normalizedPath;

  if (normalizedBase.endsWith("/api")) {
    return `${normalizedBase}${pathWithoutApiPrefix}`;
  }

  return `${normalizedBase}${normalizedPath}`;
};
