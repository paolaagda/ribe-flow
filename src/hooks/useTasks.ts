import { useMemo, useCallback } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { useNotificationContextSafe } from '@/contexts/NotificationContext';
import { getRandomMessage } from '@/data/notification-messages';
import { VisitComment, Visit, Partner, TaskHistoryEvent, mockUsers, mockPartners } from '@/data/mock-data';

export interface TaskItem {
  task: VisitComment;
  visit: Visit;
  partner: Partner | undefined;
}

const OVERDUE_DAYS = 10;

/** Compute automatic priority: document and data tasks are always priority */
function isAutoPriority(task: VisitComment): boolean {
  return task.taskCategory === 'document' || task.taskCategory === 'data';
}

/** Check if task is effectively priority (auto or manual) */
export function isTaskPriority(task: VisitComment): boolean {
  return !!task.taskPriority || isAutoPriority(task);
}

/** Create a history event */
function makeHistoryEvent(
  type: TaskHistoryEvent['type'],
  label: string,
  userId?: string,
): TaskHistoryEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label,
    date: new Date().toISOString(),
    userId,
  };
}

export function useTasks() {
  const { visits, setVisits } = useVisits();
  const { getPartnerById } = usePartners();
  const { user } = useAuth();
  const { submitForValidation, resetToPending } = useDocumentValidation();
  const { addNotification } = useNotificationContextSafe();

  const allTasks = useMemo<TaskItem[]>(() => {
    const tasks: TaskItem[] = [];
    const isRestricted = user && ['comercial', 'cadastro'].includes(user.role);
    const visibleVisits = isRestricted
      ? visits.filter(v =>
          v.userId === user.id ||
          v.createdBy === user.id ||
          v.invitedUsers?.some(iu => iu.userId === user.id && iu.status === 'accepted')
        )
      : visits;

    visibleVisits.forEach(visit => {
      visit.comments?.forEach(comment => {
        if (comment.type === 'task') {
          tasks.push({
            task: comment,
            visit,
            partner: getPartnerById(visit.partnerId),
          });
        }
      });
    });

    return tasks.sort((a, b) =>
      new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime()
    );
  }, [visits, getPartnerById, user]);

  const pendingTasks = useMemo(() => allTasks.filter(t => !t.task.taskCompleted), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.task.taskCompleted), [allTasks]);

  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return pendingTasks.filter(t => {
      const created = new Date(t.task.createdAt).getTime();
      return (now - created) / (1000 * 60 * 60 * 24) >= OVERDUE_DAYS;
    });
  }, [pendingTasks]);

  const getTasksByPartnerId = useCallback((partnerId: string) =>
    allTasks.filter(t => t.visit.partnerId === partnerId),
  [allTasks]);

  const getTasksByVisitId = useCallback((visitId: string) =>
    allTasks.filter(t => t.visit.id === visitId),
  [allTasks]);

  /** Send completion notifications */
  const notifyCompletion = useCallback((task: VisitComment, visit: Visit, partner: Partner | undefined) => {
    if (!user) return;
    const responsibleId = partner?.responsibleUserId || task.userId;
    const partnerName = partner?.name || '—';
    const today = new Date().toISOString().split('T')[0];

    // Notify responsible principal if completer is not the responsible
    if (user.id !== responsibleId) {
      addNotification({
        type: 'task_completed',
        visitId: visit.id,
        fromUserId: user.id,
        toUserId: responsibleId,
        partnerId: visit.partnerId,
        partnerName,
        date: today,
        time: '',
        status: 'pending',
        message: getRandomMessage('task_completed', {
          nome: user.name,
          parceiro: partnerName,
          documento: task.text,
        }),
      });
    }

    // For cadastro tasks, also notify all cadastro-role users
    const hasCadastroContext = task.taskCategory === 'document' || task.taskCategory === 'data';
    if (hasCadastroContext) {
      const cadastroUsers = mockUsers.filter(u => u.role === 'cadastro' && u.active && u.id !== user.id);
      cadastroUsers.forEach(cu => {
        addNotification({
          type: 'task_completed_cadastro',
          visitId: visit.id,
          fromUserId: user.id,
          toUserId: cu.id,
          partnerId: visit.partnerId,
          partnerName,
          date: today,
          time: '',
          status: 'pending',
          message: getRandomMessage('task_completed_cadastro', {
            nome: user.name,
            parceiro: partnerName,
            documento: task.text,
          }),
        });
      });
    }
  }, [user, addNotification]);

  const toggleTask = useCallback((visitId: string, commentId: string) => {
    setVisits(prev => {
      const visit = prev.find(v => v.id === visitId);
      if (!visit) return prev;
      
      const comment = visit.comments.find(c => c.id === commentId);
      if (!comment) return prev;

      const isNowCompleted = !comment.taskCompleted;

      // Document tasks: use validation flow instead of direct sync
      if (comment.taskCategory === 'document' && comment.taskSourceId) {
        const partnerId = visit.partnerId;
        if (isNowCompleted) {
          submitForValidation(partnerId, comment.taskSourceId);
        } else {
          resetToPending(partnerId, comment.taskSourceId);
        }
      }

      // Send notifications on completion
      if (isNowCompleted) {
        const partner = getPartnerById(visit.partnerId);
        notifyCompletion(comment, visit, partner);
      }

      return prev.map(v => {
        if (v.id !== visitId) return v;
        return {
          ...v,
          comments: v.comments.map(c => {
            if (c.id !== commentId) return c;

            const historyEvent = isNowCompleted
              ? makeHistoryEvent('completed', `Concluída por ${user?.name || 'Usuário'}`, user?.id)
              : makeHistoryEvent('status_change', 'Reaberta', user?.id);

            const updatedHistory = [...(c.taskHistory || []), historyEvent];

            if (c.taskCategory === 'document' && c.taskSourceId) {
              if (isNowCompleted) {
                return {
                  ...c,
                  taskCompleted: true,
                  taskCompletedBy: user?.id,
                  taskDocStatus: 'submitted_for_validation' as const,
                  taskReturnReason: undefined,
                  taskHistory: updatedHistory,
                };
              } else {
                return {
                  ...c,
                  taskCompleted: false,
                  taskCompletedBy: undefined,
                  taskDocStatus: 'pending' as const,
                  taskReturnReason: undefined,
                  taskHistory: updatedHistory,
                };
              }
            }
            // Non-document tasks: simple toggle
            return {
              ...c,
              taskCompleted: !c.taskCompleted,
              taskCompletedBy: isNowCompleted ? user?.id : undefined,
              taskHistory: updatedHistory,
            };
          }),
        };
      });
    });
  }, [setVisits, submitForValidation, resetToPending, user, getPartnerById, notifyCompletion]);

  // Called by Cadastro when rejecting a document - reverts the task
  const returnTaskForCorrection = useCallback((visitId: string, commentId: string, reason: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return {
        ...v,
        comments: v.comments.map(c => {
          if (c.id !== commentId) return c;
          const evt = makeHistoryEvent('returned', `Documento recusado: ${reason}`, user?.id);
          return {
            ...c,
            taskCompleted: false,
            taskCompletedBy: undefined,
            taskDocStatus: 'returned_for_correction' as const,
            taskReturnReason: reason,
            taskHistory: [...(c.taskHistory || []), evt],
          };
        }),
      };
    }));
  }, [setVisits, user]);

  // Called by Cadastro when validating a document - marks task as validated
  const markTaskValidated = useCallback((visitId: string, commentId: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return {
        ...v,
        comments: v.comments.map(c => {
          if (c.id !== commentId) return c;
          const evt = makeHistoryEvent('validated', 'Documento validado', user?.id);
          return {
            ...c,
            taskCompleted: true,
            taskDocStatus: 'validated' as const,
            taskReturnReason: undefined,
            taskHistory: [...(c.taskHistory || []), evt],
          };
        }),
      };
    }));
  }, [setVisits, user]);

  const getDaysPending = useCallback((createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  /**
   * Auto-create a pending document task for the Comercial when Cadastro rejects
   * a document and no active equivalent task exists.
   */
  const createDocPendingTask = useCallback((
    partnerId: string,
    docId: string,
    docName: string,
    reason: string,
    responsibleUserId: string,
  ): boolean => {
    const existing = allTasks.find(t =>
      t.visit.partnerId === partnerId &&
      t.task.taskCategory === 'document' &&
      t.task.taskSourceId === docId &&
      !t.task.taskCompleted
    );
    if (existing) return false;

    const partnerVisits = visits
      .filter(v => v.partnerId === partnerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const targetVisit = partnerVisits[0];
    if (!targetVisit) return false;

    const createdEvt = makeHistoryEvent('created', 'Tarefa criada automaticamente');
    const priorityEvt = makeHistoryEvent('priority_auto', 'Prioridade automática: pendência documental');
    const returnedEvt = makeHistoryEvent('returned', `Documento recusado: ${reason}`);

    const newTaskComment: VisitComment = {
      id: `auto-doc-${docId}-${Date.now()}`,
      userId: responsibleUserId,
      text: `Pendência documental: ${docName} — ${reason}`,
      type: 'task',
      taskCompleted: false,
      taskCategory: 'document',
      taskSourceId: docId,
      taskDocStatus: 'returned_for_correction',
      taskReturnReason: reason,
      taskPriority: true, // auto-priority
      taskHistory: [createdEvt, priorityEvt, returnedEvt],
      createdAt: new Date().toISOString(),
    };

    setVisits(prev => prev.map(v => {
      if (v.id !== targetVisit.id) return v;
      return { ...v, comments: [...v.comments, newTaskComment] };
    }));

    return true;
  }, [allTasks, visits, setVisits]);

  return {
    allTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    getTasksByPartnerId,
    getTasksByVisitId,
    toggleTask,
    returnTaskForCorrection,
    markTaskValidated,
    createDocPendingTask,
    getDaysPending,
    isTaskPriority,
  };
}
