import { useMemo, useCallback } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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
  const { user, profile } = useAuth();
  const [checkedDocs, setCheckedDocs] = useLocalStorage<Record<string, string[]>>(
    'ribercred_partner_docs_v1',
    {}
  );

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
    setVisits(prev => prev.map(v => {
      if (v.id !== visitId) return v;
      return {
        ...v,
        comments: v.comments.map(c =>
          c.id === commentId ? { ...c, taskCompleted: !c.taskCompleted } : c
        ),
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
    getDaysPending,
  };
}
