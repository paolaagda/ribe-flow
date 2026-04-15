/**
 * Status & Blocking rules for the Rules & Permissions module.
 * Manages configurable parameters around terminal status behavior.
 * Persistence key: ribercred_status_rules_v1
 */

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { readFromStorage } from '@/lib/rules-persistence';
import { CompanyCargo } from '@/data/mock-data';

export interface StatusRulesConfig {
  /** Whether completed tasks can be reopened (OFF by default — structural risk) */
  allowTaskReopen: boolean;
  /** Roles allowed to reopen completed tasks (only applies when allowTaskReopen is ON) */
  taskReopenAllowedRoles: CompanyCargo[];
  /** Whether terminal task status blocks ALL editing (ON by default) */
  blockEditOnTerminalTask: boolean;
  /** Whether agenda final actions (Concluída/Cancelada/Inconclusa) require confirmation dialog */
  requireAgendaFinalConfirmation: boolean;
}

export const DEFAULT_STATUS_RULES: StatusRulesConfig = {
  allowTaskReopen: false,
  taskReopenAllowedRoles: ['diretor', 'gerente'],
  blockEditOnTerminalTask: true,
  requireAgendaFinalConfirmation: true,
};

const STORAGE_KEY = 'ribercred_status_rules_v1';

const VALID_ROLES: CompanyCargo[] = ['diretor', 'gerente', 'ascom', 'comercial', 'cadastro'];

/** Validates and normalizes status rules, returning safe defaults for invalid fields. */
export function validateStatusRules(value: unknown): StatusRulesConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_STATUS_RULES };
  const obj = value as Record<string, unknown>;

  const rawRoles = Array.isArray(obj.taskReopenAllowedRoles) ? obj.taskReopenAllowedRoles : undefined;
  const validatedRoles = rawRoles
    ? rawRoles.filter((r): r is CompanyCargo => VALID_ROLES.includes(r as CompanyCargo))
    : [...DEFAULT_STATUS_RULES.taskReopenAllowedRoles];

  return {
    allowTaskReopen: typeof obj.allowTaskReopen === 'boolean' ? obj.allowTaskReopen : DEFAULT_STATUS_RULES.allowTaskReopen,
    taskReopenAllowedRoles: validatedRoles,
    blockEditOnTerminalTask: typeof obj.blockEditOnTerminalTask === 'boolean' ? obj.blockEditOnTerminalTask : DEFAULT_STATUS_RULES.blockEditOnTerminalTask,
    requireAgendaFinalConfirmation: typeof obj.requireAgendaFinalConfirmation === 'boolean' ? obj.requireAgendaFinalConfirmation : DEFAULT_STATUS_RULES.requireAgendaFinalConfirmation,
  };
}

/**
 * Read status rules directly from localStorage (no hooks).
 * Safe to call in callbacks, pure functions, and outside React lifecycle.
 */
export function getStatusRules(): StatusRulesConfig {
  return validateStatusRules(readFromStorage(STORAGE_KEY, DEFAULT_STATUS_RULES));
}

/**
 * React hook for managing status rules configuration.
 * Used only in the Settings UI — operational code should use getStatusRules().
 */
export function useStatusRules() {
  const [raw, setRaw] = useLocalStorage<StatusRulesConfig>(STORAGE_KEY, DEFAULT_STATUS_RULES);

  const config = validateStatusRules(raw);

  const updateConfig = (partial: Partial<StatusRulesConfig>) => {
    setRaw(prev => {
      const safe = validateStatusRules(prev);
      return { ...safe, ...partial };
    });
  };

  const resetToDefaults = () => {
    setRaw({ ...DEFAULT_STATUS_RULES });
  };

  return { config, updateConfig, resetToDefaults };
}
