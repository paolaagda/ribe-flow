import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

const STORAGE_KEY = 'ribercred_notification_rules_v1';

export interface NotificationRules {
  taskCompletedNotifyResponsible: boolean;
  taskCadastroCompletedNotifyCadastro: boolean;
  docSubmittedNotifyCadastro: boolean;
  docRejectedNotifySender: boolean;
  regSubmittedNotifyCadastro: boolean;
  regRejectedNotifySender: boolean;
}

export const DEFAULT_NOTIFICATION_RULES: NotificationRules = {
  taskCompletedNotifyResponsible: true,
  taskCadastroCompletedNotifyCadastro: true,
  docSubmittedNotifyCadastro: true,
  docRejectedNotifySender: true,
  regSubmittedNotifyCadastro: true,
  regRejectedNotifySender: true,
};

const VALID_KEYS = Object.keys(DEFAULT_NOTIFICATION_RULES) as (keyof NotificationRules)[];

function validateRules(raw: unknown): NotificationRules {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATION_RULES };
  const obj = raw as Record<string, unknown>;
  const result = { ...DEFAULT_NOTIFICATION_RULES };
  for (const key of VALID_KEYS) {
    if (typeof obj[key] === 'boolean') {
      result[key] = obj[key] as boolean;
    }
  }
  return result;
}

/**
 * Read notification rules directly from localStorage (no hooks).
 * Safe to call inside callbacks without affecting hook ordering.
 */
export function getNotificationRules(): NotificationRules {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? validateRules(JSON.parse(raw)) : { ...DEFAULT_NOTIFICATION_RULES };
  } catch {
    return { ...DEFAULT_NOTIFICATION_RULES };
  }
}

export function useNotificationRules() {
  const [raw, setRaw] = useLocalStorage<NotificationRules>(
    STORAGE_KEY,
    DEFAULT_NOTIFICATION_RULES,
  );

  const rules = validateRules(raw);

  const updateRule = useCallback((key: keyof NotificationRules, value: boolean) => {
    setRaw(prev => ({ ...validateRules(prev), [key]: value }));
  }, [setRaw]);

  const resetToDefaults = useCallback(() => {
    setRaw({ ...DEFAULT_NOTIFICATION_RULES });
  }, [setRaw]);

  const setAll = useCallback((newRules: NotificationRules) => {
    setRaw({ ...newRules });
  }, [setRaw]);

  return { rules, updateRule, resetToDefaults, setAll };
}
