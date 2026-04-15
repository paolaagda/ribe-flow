/**
 * Status & Blocking rules for the Rules & Permissions module.
 * Manages configurable parameters around terminal status behavior.
 * Persistence key: ribercred_status_rules_v1
 */

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { readFromStorage } from '@/lib/rules-persistence';
import { CompanyCargo } from '@/data/mock-data';

export interface StatusRulesConfig {
  /** Whether completed tasks can be reopened (OFF by default) */
  allowTaskReopen: boolean;
  /** Roles allowed to reopen completed tasks */
  taskReopenAllowedRoles: CompanyCargo[];
  /** Whether terminal task status blocks ALL editing (ON by default) */
  blockEditOnTerminalTask: boolean;
  /** Whether agenda final actions require confirmation dialog */
  requireAgendaFinalConfirmation: boolean;
  /** Whether limited admin edit (note only) is allowed on terminal tasks */
  allowTerminalLimitedEdit: boolean;
  /** Roles allowed to perform limited edit on terminal tasks */
  terminalLimitedEditAllowedRoles: CompanyCargo[];
}

const VALID_ROLES: CompanyCargo[] = ['diretor', 'gerente', 'ascom', 'comercial', 'cadastro'];

export const DEFAULT_STATUS_RULES: StatusRulesConfig = {
  allowTaskReopen: false,
  taskReopenAllowedRoles: ['diretor', 'gerente'],
  blockEditOnTerminalTask: true,
  requireAgendaFinalConfirmation: true,
  allowTerminalLimitedEdit: false,
  terminalLimitedEditAllowedRoles: ['diretor', 'gerente'],
};

const STORAGE_KEY = 'ribercred_status_rules_v1';

/** Validates and normalizes status rules, returning safe defaults for invalid fields. */
export function validateStatusRules(value: unknown): StatusRulesConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_STATUS_RULES };
  const obj = value as Record<string, unknown>;

  const parseRoles = (raw: unknown, fallback: CompanyCargo[]): CompanyCargo[] => {
    if (!Array.isArray(raw)) return [...fallback];
    return raw.filter((r): r is CompanyCargo => VALID_ROLES.includes(r as CompanyCargo));
  };

  return {
    allowTaskReopen: typeof obj.allowTaskReopen === 'boolean' ? obj.allowTaskReopen : DEFAULT_STATUS_RULES.allowTaskReopen,
    taskReopenAllowedRoles: parseRoles(obj.taskReopenAllowedRoles, DEFAULT_STATUS_RULES.taskReopenAllowedRoles),
    blockEditOnTerminalTask: typeof obj.blockEditOnTerminalTask === 'boolean' ? obj.blockEditOnTerminalTask : DEFAULT_STATUS_RULES.blockEditOnTerminalTask,
    requireAgendaFinalConfirmation: typeof obj.requireAgendaFinalConfirmation === 'boolean' ? obj.requireAgendaFinalConfirmation : DEFAULT_STATUS_RULES.requireAgendaFinalConfirmation,
    allowTerminalLimitedEdit: typeof obj.allowTerminalLimitedEdit === 'boolean' ? obj.allowTerminalLimitedEdit : DEFAULT_STATUS_RULES.allowTerminalLimitedEdit,
    terminalLimitedEditAllowedRoles: parseRoles(obj.terminalLimitedEditAllowedRoles, DEFAULT_STATUS_RULES.terminalLimitedEditAllowedRoles),
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
