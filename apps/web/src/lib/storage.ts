/**
 * Utilitário seguro para persistência em localStorage
 * com proteção contra falhas de SSR, QuotaExceeded e permissões.
 */

export const safeStorage = {
  getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  getString(key: string, fallback = ''): string {
    if (typeof window === 'undefined') return fallback;
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
