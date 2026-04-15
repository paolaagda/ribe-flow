/**
 * Shared persistence utilities for the Rules & Permissions module.
 * Centralizes localStorage read/write, validation, and snapshot comparison.
 * Designed to decouple persistence from React — pure functions only.
 */

// ─── Generic Persistence Helpers ────────────────────────────────────

/** Safely read and parse JSON from localStorage with fallback. */
export function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Write JSON to localStorage. */
export function writeToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Deep-equal comparison for JSON-serializable values. */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Generate a unique ID for audit/log entries. */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Audit Helper ───────────────────────────────────────────────────

/**
 * Build audit event params from the common block pattern.
 * Extracts the repeated userId/userName logic from every block.
 */
export function buildAuditParams(
  user: { id?: string; name?: string } | null | undefined,
) {
  return {
    userId: user?.id || 'u1',
    userName: user?.name || 'Usuário',
  };
}
