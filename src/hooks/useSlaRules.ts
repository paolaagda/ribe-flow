/**
 * SLA, Alerts & Criticality rules for the Rules & Permissions module.
 * Persistence key: ribercred_sla_rules_v1
 */

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { readFromStorage } from '@/lib/rules-persistence';

export interface SlaRulesConfig {
  // Grupo 1 — Atenção Imediata
  /** Dias sem movimentação para entrar em atenção imediata */
  immediateAttentionDays: number;
  /** Documentos pendentes contam para atenção imediata */
  immediateAttentionPendingDocs: boolean;
  /** Marcação manual como crítico conta para atenção imediata */
  immediateAttentionManualCritical: boolean;

  // Grupo 2 — SLA por contexto (dias)
  slaComercial: number;
  slaParceiro: number;
  slaBanco: number;
  slaCadastro: number;

  // Grupo 3 — Criticidade automática
  /** Elevar criticidade por documento pendente */
  criticalityByPendingDoc: boolean;
  /** Elevar criticidade por tempo parado acima do limite */
  criticalityByStalledTime: boolean;
  /** Considerar criticidade manual */
  criticalityManual: boolean;
}

export const DEFAULT_SLA_RULES: SlaRulesConfig = {
  immediateAttentionDays: 30,
  immediateAttentionPendingDocs: true,
  immediateAttentionManualCritical: true,
  slaComercial: 7,
  slaParceiro: 7,
  slaBanco: 7,
  slaCadastro: 7,
  criticalityByPendingDoc: true,
  criticalityByStalledTime: true,
  criticalityManual: true,
};

const STORAGE_KEY = 'ribercred_sla_rules_v1';

const MIN_DAYS = 1;
const MAX_DAYS = 365;

function clampDays(val: unknown, fallback: number): number {
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.max(MIN_DAYS, Math.min(MAX_DAYS, Math.round(val)));
}

function parseBool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

/** Validates and normalizes SLA rules config. */
export function validateSlaRules(value: unknown): SlaRulesConfig {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SLA_RULES };
  const obj = value as Record<string, unknown>;

  return {
    immediateAttentionDays: clampDays(obj.immediateAttentionDays, DEFAULT_SLA_RULES.immediateAttentionDays),
    immediateAttentionPendingDocs: parseBool(obj.immediateAttentionPendingDocs, DEFAULT_SLA_RULES.immediateAttentionPendingDocs),
    immediateAttentionManualCritical: parseBool(obj.immediateAttentionManualCritical, DEFAULT_SLA_RULES.immediateAttentionManualCritical),
    slaComercial: clampDays(obj.slaComercial, DEFAULT_SLA_RULES.slaComercial),
    slaParceiro: clampDays(obj.slaParceiro, DEFAULT_SLA_RULES.slaParceiro),
    slaBanco: clampDays(obj.slaBanco, DEFAULT_SLA_RULES.slaBanco),
    slaCadastro: clampDays(obj.slaCadastro, DEFAULT_SLA_RULES.slaCadastro),
    criticalityByPendingDoc: parseBool(obj.criticalityByPendingDoc, DEFAULT_SLA_RULES.criticalityByPendingDoc),
    criticalityByStalledTime: parseBool(obj.criticalityByStalledTime, DEFAULT_SLA_RULES.criticalityByStalledTime),
    criticalityManual: parseBool(obj.criticalityManual, DEFAULT_SLA_RULES.criticalityManual),
  };
}

/**
 * Read SLA rules directly from localStorage (no hooks).
 * Safe to call in callbacks, pure functions, and outside React lifecycle.
 */
export function getSlaRules(): SlaRulesConfig {
  return validateSlaRules(readFromStorage(STORAGE_KEY, DEFAULT_SLA_RULES));
}

/**
 * React hook for managing SLA rules configuration.
 * Used in Settings UI. Operational code should use getSlaRules().
 */
export function useSlaRules() {
  const [raw, setRaw] = useLocalStorage<SlaRulesConfig>(STORAGE_KEY, DEFAULT_SLA_RULES);

  const config = validateSlaRules(raw);

  const updateConfig = (partial: Partial<SlaRulesConfig>) => {
    setRaw(prev => {
      const safe = validateSlaRules(prev);
      return { ...safe, ...partial };
    });
  };

  const resetToDefaults = () => {
    setRaw({ ...DEFAULT_SLA_RULES });
  };

  return { config, updateConfig, resetToDefaults };
}
