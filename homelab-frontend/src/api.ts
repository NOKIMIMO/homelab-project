export const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  console.log(baseUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  console.log(normalizedPath)
  const finalUrl = `${baseUrl}${normalizedPath}`;
  console.log(`API URL: ${finalUrl}`); // Useful for debug
  return finalUrl;
};
