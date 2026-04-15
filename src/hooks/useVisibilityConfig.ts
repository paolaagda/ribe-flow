import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CompanyCargo, allCargos } from '@/data/mock-data';

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

function isValidConfig(value: unknown): value is VisibilityConfig {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return allCargos.every(
    cargo => obj[cargo] === 'global' || obj[cargo] === 'restrita',
  );
}

/**
 * Manages the persisted visibility configuration.
 * Falls back to DEFAULT_VISIBILITY if stored value is invalid.
 */
export function useVisibilityConfig() {
  const [raw, setRaw] = useLocalStorage<VisibilityConfig>(STORAGE_KEY, DEFAULT_VISIBILITY);

  // Validate on read — fallback to defaults if corrupted
  const config: VisibilityConfig = isValidConfig(raw) ? raw : DEFAULT_VISIBILITY;

  const updateCargo = (cargo: CompanyCargo, level: VisibilityLevel) => {
    setRaw(prev => {
      const safe = isValidConfig(prev) ? prev : DEFAULT_VISIBILITY;
      return { ...safe, [cargo]: level };
    });
  };

  const resetToDefaults = () => {
    setRaw(DEFAULT_VISIBILITY);
  };

  return { config, updateCargo, resetToDefaults };
}
