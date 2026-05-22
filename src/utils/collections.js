export function readCollection(response) {
  return response?.data?.results || response?.data || [];
}
