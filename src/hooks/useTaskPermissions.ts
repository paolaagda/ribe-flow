import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { useTaskRules } from '@/hooks/useTaskRules';
import { TaskItem } from '@/hooks/useTasks';
import { mockUsers, User, CompanyCargo } from '@/data/mock-data';

export interface TaskPermissions {
  canConclude: boolean;
  canEdit: boolean;
  canAssign: boolean;
  canCancel: boolean;
  canChangeStatus: boolean;
}

/**
 * Determine the "responsible commercial" for a task based on its context.
 * - Partner-linked task → partner's responsibleUserId
 * - Prospect visit → visit's userId (commercial who created the prospect)
 * - Standalone → task creator (userId on the comment)
 */
function getContextResponsible(item: TaskItem): string {
  if (item.partner) return item.partner.responsibleUserId;
  // For prospect visits the commercial is the visit owner
  if (item.visit.type === 'prospecção') return item.visit.userId;
  return item.task.userId; // standalone / fallback
}

function isTaskTerminal(item: TaskItem): boolean {
  return !!item.task.taskCompleted || item.task.taskDocStatus === 'validated';
}

function isTaskCancelled(item: TaskItem): boolean {
  // Convention: status label "Cancelada" — we check the text-based flag
  // In our current model cancelled tasks have taskDocStatus undefined and taskCompleted false
  // We'll use a simple convention: taskReturnReason starting with 'CANCELLED:'
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
    };

    if (!user) return none;

    const terminal = isTaskTerminal(item);
    const cancelled = isTaskCancelled(item);

    if (terminal || cancelled) return none;

    const role = user.role;
    const userId = user.id;
    const creatorId = item.task.userId;
    const responsibleId = getContextResponsible(item);
    const isResponsible = userId === responsibleId;
    const isCreator = userId === creatorId;
    const isAssigned = isResponsible || isCreator; // Simplified: assigned = responsible or creator
    const isCadastroRole = role === 'cadastro';
    const hasCadastroContext = item.task.taskCategory === 'document' || item.task.taskCategory === 'data';
    const hasPartner = !!item.partner;
    const isProspect = item.visit.type === 'prospecção';

    // ── Conclude: responsible principal or assigned ──
    const canConclude = isResponsible || isCreator;

    // ── Edit: depends on context ──
    let canEdit = false;
    if (!hasPartner && !hasCadastroContext && !isProspect) {
      // Standalone: creator only
      canEdit = isCreator;
    } else if (hasCadastroContext) {
      // Cadastro context: responsible commercial OR any cadastro-role user
      canEdit = isResponsible || isCadastroRole;
    } else if (isProspect) {
      // Prospect: responsible commercial of the prospect
      canEdit = isResponsible;
    } else if (hasPartner) {
      // Partner: responsible commercial
      canEdit = isResponsible;
    }

    // ── Assign/Reassign: same logic as edit with nuance ──
    let canAssign = false;
    if (!hasPartner && !hasCadastroContext && !isProspect) {
      canAssign = isCreator;
    } else if (hasCadastroContext) {
      canAssign = isResponsible || isCadastroRole;
    } else if (hasPartner || isProspect) {
      canAssign = isResponsible;
      // Non-responsible creator can only assign TO the responsible — handled in UI
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

    // ── Change status: editor, responsible or creator ──
    const canChangeStatus = canEdit || isResponsible || isCreator;

    return { canConclude, canEdit, canAssign, canCancel, canChangeStatus };
  }, [user]);

  /**
   * Get valid users for assignment based on task context.
   * Restricts the list so users can't freely pick anyone.
   */
  const getValidAssignees = useCallback((item: TaskItem): User[] => {
    if (!user) return [];
    const active = mockUsers.filter(u => u.active);
    const responsibleId = getContextResponsible(item);
    const hasPartner = !!item.partner;
    const hasCadastroContext = item.task.taskCategory === 'document' || item.task.taskCategory === 'data';
    const isProspect = item.visit.type === 'prospecção';

    if (!hasPartner && !hasCadastroContext && !isProspect) {
      // Standalone: creator can assign to anyone (small scope)
      return active;
    }

    if (hasCadastroContext) {
      // Cadastro: responsible commercial + all cadastro-role users
      return active.filter(u =>
        u.id === responsibleId || u.role === 'cadastro'
      );
    }

    // Partner / Prospect: responsible + team members
    // If current user is NOT the responsible but is the creator, they can only assign to the responsible
    if (user.id !== responsibleId && user.id === item.task.userId) {
      return active.filter(u => u.id === responsibleId);
    }

    // Responsible can assign to team: other commercials + cadastro
    return active.filter(u =>
      u.id === responsibleId || u.role === 'comercial' || u.role === 'cadastro'
    );
  }, [user]);

  return { getPermissions, getValidAssignees, isTaskCancelled };
}
