import { useMemo, useCallback } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { VisitComment, Visit, Partner } from '@/data/mock-data';
import { toast } from 'sonner';
export interface TaskItem {
  task: VisitComment;
  visit: Visit;
  partner: Partner | undefined;
}

const OVERDUE_DAYS = 10;

export function useTasks() {
  const { visits, setVisits } = useVisits();
  const { getPartnerById } = usePartners();
  const { user, profile } = useAuth();

  const allTasks = useMemo<TaskItem[]>(() => {
    const tasks: TaskItem[] = [];
    const visibleVisits = profile === 'nao_gestor' && user
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
  }, [visits, getPartnerById, user, profile]);

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
    // Find the task to check if it's a document task
    let docSynced = false;
    setVisits(prev => {
      const updated = prev.map(v => {
        if (v.id !== visitId) return v;
        return {
          ...v,
          comments: v.comments.map(c =>
            c.id === commentId ? { ...c, taskCompleted: !c.taskCompleted } : c
          ),
        };
      });

      // Sync document checkbox in localStorage
      const visit = updated.find(v => v.id === visitId);
      const task = visit?.comments.find(c => c.id === commentId);
      if (task && task.taskCategory === 'document' && task.taskSourceId && visit) {
        const STORAGE_KEY = 'ribercred_partner_docs_v1';
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const checkedDocs: Record<string, string[]> = raw ? JSON.parse(raw) : {};
          const partnerId = visit.partnerId;
          const current = checkedDocs[partnerId] || [];

          if (task.taskCompleted) {
            // Task was just completed → mark document as received
            if (!current.includes(task.taskSourceId)) {
              checkedDocs[partnerId] = [...current, task.taskSourceId];
              localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedDocs));
              docSynced = true;
            }
          } else {
            // Task was uncompleted → unmark document
            if (current.includes(task.taskSourceId)) {
              checkedDocs[partnerId] = current.filter(id => id !== task.taskSourceId);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedDocs));
              docSynced = true;
            }
          }
        } catch { /* ignore parse errors */ }
      }

      return updated;
    });

    // Show feedback after state update
    setTimeout(() => {
      if (docSynced) {
        toast.success('Documento atualizado automaticamente', {
          description: 'A documentação do parceiro foi sincronizada com a tarefa.',
        });
      }
    }, 100);
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
    getDaysPending,
  };
}
