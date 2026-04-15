/**
 * Central audit logging for the Rules & Permissions module.
 * Persists to localStorage with a 100-event retention limit.
 */

export type RulesAuditModule = 'permissions' | 'visibility' | 'task_rules' | 'notifications';
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

function readEvents(): RulesAuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: RulesAuditEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
}

/** Deep-equal comparison for JSON-serializable objects */
function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  // Skip if no real change
  if (isEqual(params.snapshotBefore, params.snapshotAfter)) {
    return null;
  }

  const event: RulesAuditEvent = {
    id: `ra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId: params.userId,
    userName: params.userName,
    module: params.module,
    action: params.action,
    summary: params.summary,
    snapshotBefore: params.snapshotBefore,
    snapshotAfter: params.snapshotAfter,
  };

  const events = readEvents();
  events.unshift(event);
  writeEvents(events);

  return event;
}

/** Read the current audit log (most recent first). */
export function getRulesAuditLog(): RulesAuditEvent[] {
  return readEvents();
}

export const MODULE_LABELS: Record<RulesAuditModule, string> = {
  permissions: 'Permissões por Perfil',
  visibility: 'Visibilidade de Dados',
  task_rules: 'Regras de Tarefas',
  notifications: 'Notificações por Evento',
};

export const ACTION_LABELS: Record<RulesAuditAction, string> = {
  update: 'Atualização',
  restore_defaults: 'Restauração ao padrão',
};
