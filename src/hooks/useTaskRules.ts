import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CompanyCargo, allCargos } from '@/data/mock-data';

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

function isValidConfig(value: unknown): value is TaskRulesConfig {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.cadastroDeadlineDays !== 'number' || obj.cadastroDeadlineDays < 1 || obj.cadastroDeadlineDays > 30) return false;

  if (!Array.isArray(obj.autoPriorityCategories)) return false;
  if (!obj.autoPriorityCategories.every((c: unknown) => VALID_CATEGORIES.includes(c as TaskCategory))) return false;

  if (!Array.isArray(obj.globalCancelRoles)) return false;
  if (!obj.globalCancelRoles.every((r: unknown) => allCargos.includes(r as CompanyCargo))) return false;

  return true;
}

/**
 * Manages persisted task rules configuration.
 * Falls back to DEFAULT_TASK_RULES if stored value is invalid.
 */
export function useTaskRules() {
  const [raw, setRaw] = useLocalStorage<TaskRulesConfig>(STORAGE_KEY, DEFAULT_TASK_RULES);

  const config: TaskRulesConfig = isValidConfig(raw) ? raw : DEFAULT_TASK_RULES;

  const updateConfig = (partial: Partial<TaskRulesConfig>) => {
    setRaw(prev => {
      const safe = isValidConfig(prev) ? prev : DEFAULT_TASK_RULES;
      return { ...safe, ...partial };
    });
  };

  const resetToDefaults = () => {
    setRaw(DEFAULT_TASK_RULES);
  };

  return { config, updateConfig, resetToDefaults };
}
