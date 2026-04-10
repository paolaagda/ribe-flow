import { useState, useEffect, useCallback } from 'react';

/**
 * Shared localStorage hook that syncs across all component instances
 * within the same tab via a custom DOM event.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Wrap setValue to also persist + broadcast
  const setAndBroadcast = useCallback(
    (action: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next = action instanceof Function ? action(prev) : action;
        localStorage.setItem(key, JSON.stringify(next));
        // Broadcast to other hooks using the same key in this tab
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
        return next;
      });
    },
    [key],
  );

  // Listen for broadcasts from other instances of this key
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key !== key) return;
      try {
        const item = localStorage.getItem(key);
        if (item) setValue(JSON.parse(item));
      } catch { /* ignore */ }
    };
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, [key]);

  return [value, setAndBroadcast] as const;
}
