export function humanizeLabel(value) {
  if (value === null || value === undefined) return '';

  const normalized = String(value)
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
