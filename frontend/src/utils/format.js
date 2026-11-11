export function toArray(value) {
  if (Array.isArray(value)) return value;
  return String(value ?? "").split(",").filter(Boolean);
}

export function findLabel(options, code) {
  return options.find((option) => option.code === code)?.label;
}

export function formatDate(value, locale = "ko-KR") {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale);
}
