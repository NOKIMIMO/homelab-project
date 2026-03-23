export const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};
