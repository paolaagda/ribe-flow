/**
 * Central audit logging for the Rules & Permissions module.
 * Persists to localStorage with a 100-event retention limit.
 * Uses shared persistence utilities from rules-persistence.
 */

import { readFromStorage, writeToStorage, isDeepEqual, generateId } from './rules-persistence';

export type RulesAuditModule = 'permissions' | 'visibility' | 'task_rules' | 'notifications' | 'status_rules' | 'sla_rules' | 'field_rules';
export type RulesAuditAction = 'update' | 'restore_defaults';

export interface RulesAuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: RulesAuditModule;
  action: RulesAuditAction;
  summary: string;
  snapshotBefore: unknown;
  snapshotAfter: unknown;
}

const STORAGE_KEY = 'ribercred_rules_audit_v1';
const MAX_EVENTS = 100;

/**
 * Logs a rules audit event. Returns the event if logged, null if skipped (no change).
 */
export function logRulesAuditEvent(params: {
  userId: string;
  userName: string;
  module: RulesAuditModule;
  action: RulesAuditAction;
  summary: string;
  snapshotBefore: unknown;
  snapshotAfter: unknown;
}): RulesAuditEvent | null {
  if (isDeepEqual(params.snapshotBefore, params.snapshotAfter)) {
    return null;
  }

  const event: RulesAuditEvent = {
    id: generateId('ra'),
    timestamp: new Date().toISOString(),
    userId: params.userId,
    userName: params.userName,
    module: params.module,
    action: params.action,
    summary: params.summary,
    snapshotBefore: params.snapshotBefore,
    snapshotAfter: params.snapshotAfter,
  };

  const events = readFromStorage<RulesAuditEvent[]>(STORAGE_KEY, []);
  events.unshift(event);
  writeToStorage(STORAGE_KEY, events.slice(0, MAX_EVENTS));

  return event;
}

/** Read the current audit log (most recent first). */
export function getRulesAuditLog(): RulesAuditEvent[] {
  return readFromStorage<RulesAuditEvent[]>(STORAGE_KEY, []);
}

export const MODULE_LABELS: Record<RulesAuditModule, string> = {
  permissions: 'Permissões por Perfil',
  visibility: 'Visibilidade de Dados',
  task_rules: 'Regras de Tarefas',
  notifications: 'Notificações por Evento',
  status_rules: 'Regras de Status e Bloqueios',
  sla_rules: 'SLA, Alertas e Criticidade',
};

export const ACTION_LABELS: Record<RulesAuditAction, string> = {
  update: 'Atualização',
  restore_defaults: 'Restauração ao padrão',
};
