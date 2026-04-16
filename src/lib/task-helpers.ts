/**
 * Centralized task helpers — shared across GestaoTarefasPage, TaskDetailModal,
 * useTaskPermissions, and any future consumer.
 *
 * Eliminates duplicated logic for cancelled detection, overdue calculation,
 * status display and deadline labels.
 */
import { TaskItem } from '@/hooks/useTasks';

// ── Constants ──────────────────────────────────────────────────────

/** Prefix used to mark a task as cancelled via taskReturnReason. */
export const TASK_CANCELLED_PREFIX = 'CANCELLED:';

/** Number of days after which a pending task is considered overdue. */
export const TASK_OVERDUE_DAYS = 10;

// ── Pure Helpers ───────────────────────────────────────────────────

/** Check if a task item is cancelled. */
export function isTaskCancelled(item: TaskItem): boolean {
  return item.task.taskReturnReason?.startsWith(TASK_CANCELLED_PREFIX) ?? false;
}

/** Days elapsed since a given ISO date string. */
export function daysSinceDate(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/** Check if a task is overdue based on its creation date. */
export function isTaskOverdue(createdAt: string): boolean {
  return daysSinceDate(createdAt) >= TASK_OVERDUE_DAYS;
}

/** Build a cancellation reason string. */
export function buildCancelReason(userName: string): string {
  return `${TASK_CANCELLED_PREFIX}${userName}`;
}

// ── Status Display ─────────────────────────────────────────────────

export interface TaskStatusDisplay {
  label: string;
  className: string;
}

/** Derive the visual status badge for a task item. */
export function getTaskStatusDisplay(item: TaskItem): TaskStatusDisplay {
  if (isTaskCancelled(item))
    return { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-border' };
  if (item.task.taskCompleted) {
    if (item.task.taskDocStatus === 'validated')
      return { label: 'Validada', className: 'bg-primary/10 text-primary border-primary/20' };
    return { label: 'Concluída', className: 'bg-primary/10 text-primary border-primary/20' };
  }
  if (item.task.taskDocStatus === 'submitted_for_validation')
    return { label: 'Aguardando terceiro', className: 'bg-accent text-accent-foreground border-accent' };
  if (item.task.taskDocStatus === 'returned_for_correction')
    return { label: 'Devolvida', className: 'bg-destructive/10 text-destructive border-destructive/20' };
  return { label: 'Pendente', className: 'bg-muted text-muted-foreground border-border' };
}

// ── Deadline Display ───────────────────────────────────────────────

export interface TaskDeadlineDisplay {
  label: string;
  variant: 'default' | 'warning' | 'overdue';
}

/** Derive the deadline label for a task. */
export function getTaskDeadlineLabel(createdAt: string, completed: boolean): TaskDeadlineDisplay {
  if (completed) return { label: 'Concluída', variant: 'default' };
  const days = daysSinceDate(createdAt);
  if (days >= TASK_OVERDUE_DAYS) {
    const overdueDays = days - TASK_OVERDUE_DAYS;
    if (overdueDays === 0) return { label: 'Vence hoje', variant: 'warning' };
    return { label: `Atrasada há ${overdueDays}d`, variant: 'overdue' };
  }
  const remaining = TASK_OVERDUE_DAYS - days;
  if (remaining === 0) return { label: 'Vence hoje', variant: 'warning' };
  if (remaining === 1) return { label: 'Vence amanhã', variant: 'warning' };
  if (remaining <= 3) return { label: `Vence em ${remaining} dias`, variant: 'warning' };
  return { label: `${remaining}d restantes`, variant: 'default' };
}

// ── Return Reason ──────────────────────────────────────────────────

/** Get display text for task return reason (excludes cancelled prefix). */
export function getTaskReturnText(item: TaskItem): string | null {
  if (item.task.taskReturnReason && !item.task.taskReturnReason.startsWith(TASK_CANCELLED_PREFIX))
    return item.task.taskReturnReason;
  if (item.task.taskDocStatus === 'submitted_for_validation')
    return 'Aguardando validação do cadastro';
  if (item.task.taskDocStatus === 'returned_for_correction')
    return 'Devolvida para ajuste';
  return null;
}
