import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { useTaskRules } from '@/hooks/useTaskRules';
import { TaskItem } from '@/hooks/useTasks';
import { mockUsers, User, CompanyCargo } from '@/data/mock-data';
import { getStatusRules } from '@/hooks/useStatusRules';

export interface TaskPermissions {
  canConclude: boolean;
  canEdit: boolean;
  canAssign: boolean;
  canCancel: boolean;
  canChangeStatus: boolean;
  canReopen: boolean;
}

/**
 * Determine the "responsible commercial" for a task based on its context.
 */
function getContextResponsible(item: TaskItem): string {
  if (item.partner) return item.partner.responsibleUserId;
  if (item.visit.type === 'prospecção') return item.visit.userId;
  return item.task.userId;
}

function isTaskTerminal(item: TaskItem): boolean {
  const statusRules = getStatusRules();
  if (!statusRules.blockEditOnTerminalTask) return false;
  return !!item.task.taskCompleted || item.task.taskDocStatus === 'validated';
}

function isTaskCancelled(item: TaskItem): boolean {
  return item.task.taskReturnReason?.startsWith('CANCELLED:') ?? false;
}

export function useTaskPermissions() {
  const { user } = useAuth();
  const { getPartnerById } = usePartners();
  const { config: taskRules } = useTaskRules();

  const getPermissions = useCallback((item: TaskItem): TaskPermissions => {
    const none: TaskPermissions = {
      canConclude: false,
      canEdit: false,
      canAssign: false,
      canCancel: false,
      canChangeStatus: false,
      canReopen: false,
    };

    if (!user) return none;

    const terminal = isTaskTerminal(item);
    const cancelled = isTaskCancelled(item);
    const completed = !!item.task.taskCompleted;
    const validated = item.task.taskDocStatus === 'validated';

    // ── Reopen: only for completed (non-validated, non-cancelled) tasks ──
    let canReopen = false;
    if (completed && !validated && !cancelled) {
      const statusRules = getStatusRules();
      if (statusRules.allowTaskReopen) {
        const userRole = user.role as CompanyCargo;
        canReopen = statusRules.taskReopenAllowedRoles.includes(userRole);
      }
    }

    if (terminal || cancelled) {
      return { ...none, canReopen };
    }

    const role = user.role;
    const userId = user.id;
    const creatorId = item.task.userId;
    const responsibleId = getContextResponsible(item);
    const isResponsible = userId === responsibleId;
    const isCreator = userId === creatorId;
    const isCadastroRole = role === 'cadastro';
    const hasCadastroContext = item.task.taskCategory === 'document' || item.task.taskCategory === 'data';
    const hasPartner = !!item.partner;
    const isProspect = item.visit.type === 'prospecção';

    // ── Conclude ──
    const canConclude = isResponsible || isCreator;

    // ── Edit ──
    let canEdit = false;
    if (!hasPartner && !hasCadastroContext && !isProspect) {
      canEdit = isCreator;
    } else if (hasCadastroContext) {
      canEdit = isResponsible || isCadastroRole;
    } else if (isProspect) {
      canEdit = isResponsible;
    } else if (hasPartner) {
      canEdit = isResponsible;
    }

    // ── Assign ──
    let canAssign = false;
    if (!hasPartner && !hasCadastroContext && !isProspect) {
      canAssign = isCreator;
    } else if (hasCadastroContext) {
      canAssign = isResponsible || isCadastroRole;
    } else if (hasPartner || isProspect) {
      canAssign = isResponsible;
      if (!isResponsible && isCreator) canAssign = true;
    }

    // ── Cancel ──
    let canCancel = false;
    if (taskRules.globalCancelRoles.includes(role)) {
      canCancel = true;
    } else if (!hasPartner && !hasCadastroContext && !isProspect) {
      canCancel = isCreator;
    } else if (hasCadastroContext) {
      canCancel = isResponsible || isCadastroRole;
    } else {
      canCancel = isResponsible;
    }

    // ── Change status ──
    const canChangeStatus = canEdit || isResponsible || isCreator;

    return { canConclude, canEdit, canAssign, canCancel, canChangeStatus, canReopen };
  }, [user]);

  const getValidAssignees = useCallback((item: TaskItem): User[] => {
    if (!user) return [];
    const active = mockUsers.filter(u => u.active);
    const responsibleId = getContextResponsible(item);
    const hasPartner = !!item.partner;
    const hasCadastroContext = item.task.taskCategory === 'document' || item.task.taskCategory === 'data';
    const isProspect = item.visit.type === 'prospecção';

    if (!hasPartner && !hasCadastroContext && !isProspect) {
      return active;
    }

    if (hasCadastroContext) {
      return active.filter(u => u.id === responsibleId || u.role === 'cadastro');
    }

    if (user.id !== responsibleId && user.id === item.task.userId) {
      return active.filter(u => u.id === responsibleId);
    }

    return active.filter(u =>
      u.id === responsibleId || u.role === 'comercial' || u.role === 'cadastro'
    );
  }, [user]);

  return { getPermissions, getValidAssignees, isTaskCancelled };
}
