import { useMemo, useCallback } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { VisitComment, Visit, Partner } from '@/data/mock-data';

export interface TaskItem {
  task: VisitComment;
  visit: Visit;
  partner: Partner | undefined;
}

const OVERDUE_DAYS = 10;

export function useTasks() {
  const { visits, setVisits } = useVisits();
  const { getPartnerById } = usePartners();
  const { user } = useAuth();
  const { submitForValidation, resetToPending } = useDocumentValidation();

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
          // Comercial marks done -> submit for validation (NOT auto-validate)
          submitForValidation(partnerId, comment.taskSourceId);
        } else {
          // Comercial unchecks -> reset to pending
          resetToPending(partnerId, comment.taskSourceId);
        }
      }

      return prev.map(v => {
        if (v.id !== visitId) return v;
        return {
          ...v,
          comments: v.comments.map(c => {
            if (c.id !== commentId) return c;
            if (c.taskCategory === 'document' && c.taskSourceId) {
              // Document task: set doc-specific status
              if (isNowCompleted) {
                return {
                  ...c,
                  taskCompleted: true,
                  taskDocStatus: 'submitted_for_validation' as const,
                  taskReturnReason: undefined,
                };
              } else {
                return {
                  ...c,
                  taskCompleted: false,
                  taskDocStatus: 'pending' as const,
                  taskReturnReason: undefined,
                };
              }
            }
            // Non-document tasks: simple toggle
            return { ...c, taskCompleted: !c.taskCompleted };
          }),
        };
      });
    });
  }, [setVisits, submitForValidation, resetToPending]);

  // Called by Cadastro when rejecting a document - reverts the task
  const returnTaskForCorrection = useCallback((visitId: string, commentId: string, reason: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return {
        ...v,
        comments: v.comments.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            taskCompleted: false,
            taskDocStatus: 'returned_for_correction' as const,
            taskReturnReason: reason,
          };
        }),
      };
    }));
  }, [setVisits]);

  // Called by Cadastro when validating a document - marks task as validated
  const markTaskValidated = useCallback((visitId: string, commentId: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return {
        ...v,
        comments: v.comments.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            taskCompleted: true,
            taskDocStatus: 'validated' as const,
            taskReturnReason: undefined,
          };
        }),
      };
    }));
  }, [setVisits]);

  const getDaysPending = useCallback((createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }, []);

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
    getDaysPending,
  };
}
