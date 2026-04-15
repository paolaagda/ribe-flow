/**
 * Field validation rules for the Rules & Permissions module.
 * Governs required fields and simple validations by context.
 * Persistence key: ribercred_field_rules_v1
 */

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { readFromStorage } from '@/lib/rules-persistence';

export interface FieldRulesConfig {
  // Grupo 1 — Agenda: conclusão de visita
  /** Potencial de produção obrigatório ao concluir visita */
  visitRequirePotential: boolean;
  /** Resumo/observação obrigatório ao concluir visita */
  visitRequireSummary: boolean;

  // Grupo 2 — Agenda: conclusão de prospecção
  /** Resumo/observação obrigatório ao concluir prospecção */
  prospectRequireSummary: boolean;
  /** Contato do prospect obrigatório ao concluir prospecção */
  prospectRequireContact: boolean;

  // Grupo 3 — Cadastro: campos operacionais
  /** Observação obrigatória ao criar solicitação de cadastro */
  registrationRequireObservation: boolean;

  // Grupo 4 — Observações em ações administrativas
  /** Observação obrigatória ao reabrir tarefa concluída */
  taskReopenRequireNote: boolean;
}

export const DEFAULT_FIELD_RULES: FieldRulesConfig = {
  visitRequirePotential: false,
  visitRequireSummary: false,
  prospectRequireSummary: false,
  prospectRequireContact: false,
  registrationRequireObservation: false,
  taskReopenRequireNote: false,
};

const STORAGE_KEY = 'ribercred_field_rules_v1';

function parseBool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

/** Validates and normalizes field rules config. */
export function validateFieldRules(value: unknown): FieldRulesConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_FIELD_RULES };
  const obj = value as Record<string, unknown>;

  return {
    visitRequirePotential: parseBool(obj.visitRequirePotential, DEFAULT_FIELD_RULES.visitRequirePotential),
    visitRequireSummary: parseBool(obj.visitRequireSummary, DEFAULT_FIELD_RULES.visitRequireSummary),
    prospectRequireSummary: parseBool(obj.prospectRequireSummary, DEFAULT_FIELD_RULES.prospectRequireSummary),
    prospectRequireContact: parseBool(obj.prospectRequireContact, DEFAULT_FIELD_RULES.prospectRequireContact),
    registrationRequireObservation: parseBool(obj.registrationRequireObservation, DEFAULT_FIELD_RULES.registrationRequireObservation),
    taskReopenRequireNote: parseBool(obj.taskReopenRequireNote, DEFAULT_FIELD_RULES.taskReopenRequireNote),
  };
}

/**
 * Read field rules directly from localStorage (no hooks).
 * Safe to call in callbacks, pure functions, and outside React lifecycle.
 */
export function getFieldRules(): FieldRulesConfig {
  return validateFieldRules(readFromStorage(STORAGE_KEY, DEFAULT_FIELD_RULES));
}

/**
 * React hook for managing field rules configuration.
 * Used in Settings UI. Operational code should use getFieldRules().
 */
export function useFieldRules() {
  const [raw, setRaw] = useLocalStorage<FieldRulesConfig>(STORAGE_KEY, DEFAULT_FIELD_RULES);

  const config = validateFieldRules(raw);

  const updateConfig = (partial: Partial<FieldRulesConfig>) => {
    setRaw(prev => {
      const safe = validateFieldRules(prev);
      return { ...safe, ...partial };
    });
  };

  const resetToDefaults = () => {
    setRaw({ ...DEFAULT_FIELD_RULES });
  };

  return { config, updateConfig, resetToDefaults };
}
