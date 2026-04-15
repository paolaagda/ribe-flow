import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CompanyCargo, allCargos } from '@/data/mock-data';
import { readFromStorage } from '@/lib/rules-persistence';

export type TaskCategory = 'document' | 'data';

export interface TaskRulesConfig {
  /** Default deadline in business days for cadastro tasks */
  cadastroDeadlineDays: number;
  /** Categories that get automatic priority */
  autoPriorityCategories: TaskCategory[];
  /** Roles with global cancel permission */
  globalCancelRoles: CompanyCargo[];
}

export const DEFAULT_TASK_RULES: TaskRulesConfig = {
  cadastroDeadlineDays: 5,
  autoPriorityCategories: ['document', 'data'],
  globalCancelRoles: ['diretor', 'gerente', 'ascom'],
};

const STORAGE_KEY = 'ribercred_task_rules_v1';
const VALID_CATEGORIES: TaskCategory[] = ['document', 'data'];
const MAX_DEADLINE_DAYS = 30;
const MIN_DEADLINE_DAYS = 1;

/** Validates and normalizes task rules, returning safe defaults for invalid fields. */
export function validateTaskRules(value: unknown): TaskRulesConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_TASK_RULES };
  const obj = value as Record<string, unknown>;
  const result = { ...DEFAULT_TASK_RULES };

  if (typeof obj.cadastroDeadlineDays === 'number') {
    result.cadastroDeadlineDays = Math.max(MIN_DEADLINE_DAYS, Math.min(MAX_DEADLINE_DAYS, Math.round(obj.cadastroDeadlineDays)));
  }

  if (Array.isArray(obj.autoPriorityCategories)) {
    result.autoPriorityCategories = obj.autoPriorityCategories.filter(
      (c: unknown) => VALID_CATEGORIES.includes(c as TaskCategory),
    ) as TaskCategory[];
  }

  if (Array.isArray(obj.globalCancelRoles)) {
    result.globalCancelRoles = obj.globalCancelRoles.filter(
      (r: unknown) => allCargos.includes(r as CompanyCargo),
    ) as CompanyCargo[];
  }

  return result;
}

/**
 * Read task rules directly from localStorage (no hooks).
 * Safe to call inside callbacks without affecting hook ordering.
 */
export function getTaskRules(): TaskRulesConfig {
  return validateTaskRules(readFromStorage(STORAGE_KEY, DEFAULT_TASK_RULES));
}

export { MAX_DEADLINE_DAYS, MIN_DEADLINE_DAYS };

/**
 * Manages persisted task rules configuration.
 * Falls back to DEFAULT_TASK_RULES if stored value is invalid.
 */
export function useTaskRules() {
  const [raw, setRaw] = useLocalStorage<TaskRulesConfig>(STORAGE_KEY, DEFAULT_TASK_RULES);

  const config = validateTaskRules(raw);

  const updateConfig = (partial: Partial<TaskRulesConfig>) => {
    setRaw(prev => {
      const safe = validateTaskRules(prev);
      return { ...safe, ...partial };
    });
  };

  const resetToDefaults = () => {
    setRaw({ ...DEFAULT_TASK_RULES });
  };

  return { config, updateConfig, resetToDefaults };
}
