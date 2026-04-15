import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CompanyCargo, allCargos } from '@/data/mock-data';
import { readFromStorage } from '@/lib/rules-persistence';

export type VisibilityLevel = 'global' | 'restrita';

export type VisibilityConfig = Record<CompanyCargo, VisibilityLevel>;

export const DEFAULT_VISIBILITY: VisibilityConfig = {
  diretor: 'global',
  gerente: 'global',
  ascom: 'global',
  comercial: 'restrita',
  cadastro: 'restrita',
};

const STORAGE_KEY = 'ribercred_visibility_rules_v1';
const VALID_LEVELS: VisibilityLevel[] = ['global', 'restrita'];

export function validateVisibilityConfig(value: unknown): VisibilityConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_VISIBILITY };
  const obj = value as Record<string, unknown>;
  const result = { ...DEFAULT_VISIBILITY };
  for (const cargo of allCargos) {
    if (VALID_LEVELS.includes(obj[cargo] as VisibilityLevel)) {
      result[cargo] = obj[cargo] as VisibilityLevel;
    }
  }
  return result;
}

/**
 * Read visibility config directly from localStorage (no hooks).
 * Safe to call inside callbacks without affecting hook ordering.
 */
export function getVisibilityConfig(): VisibilityConfig {
  return validateVisibilityConfig(readFromStorage(STORAGE_KEY, DEFAULT_VISIBILITY));
}

/**
 * Manages the persisted visibility configuration.
 * Falls back to DEFAULT_VISIBILITY if stored value is invalid.
 */
export function useVisibilityConfig() {
  const [raw, setRaw] = useLocalStorage<VisibilityConfig>(STORAGE_KEY, DEFAULT_VISIBILITY);

  const config = validateVisibilityConfig(raw);

  const updateCargo = (cargo: CompanyCargo, level: VisibilityLevel) => {
    setRaw(prev => {
      const safe = validateVisibilityConfig(prev);
      return { ...safe, [cargo]: level };
    });
  };

  const resetToDefaults = () => {
    setRaw({ ...DEFAULT_VISIBILITY });
  };

  return { config, updateCargo, resetToDefaults };
}
