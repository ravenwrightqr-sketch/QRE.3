export function safeJsonObject<T extends object>(value: unknown): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as T;
}

export function safeJsonArray<T = any>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value as T[];
}