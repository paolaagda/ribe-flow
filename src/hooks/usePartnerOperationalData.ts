import { useMemo, useCallback } from 'react';
import { useVisits } from '@/hooks/useVisits';
import { useTasks } from '@/hooks/useTasks';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useInfoData } from '@/hooks/useInfoData';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { Partner } from '@/data/mock-data';
import { differenceInDays, parseISO } from 'date-fns';

export type Criticality = 'alta' | 'média' | 'baixa';

export interface PartnerOperationalData {
  pendingTasksCount: number;
  overdueTasksCount: number;
  pendingDocsCount: number;
  totalDocsCount: number;
  activeRegistrationsCount: number;
  lastVisitDate: string | null;
  daysSinceLastVisit: number | null;
  criticality: Criticality;
  nextAction: string;
}

export function usePartnerOperationalData(visiblePartners: Partner[]) {
  const { visits } = useVisits();
  const { getTasksByPartnerId } = useTasks();
  const { registrations } = useRegistrations();
  const { getActiveDocuments } = useInfoData();
  const [checkedDocs] = useLocalStorage<Record<string, string[]>>('ribercred_partner_docs_v1', {});

  const activeDocuments = useMemo(() => getActiveDocuments(), [getActiveDocuments]);
  const totalDocsCount = activeDocuments.length;

  const getPartnerData = useCallback((partnerId: string): PartnerOperationalData => {
    const today = new Date();

    // Tasks
    const tasks = getTasksByPartnerId(partnerId);
    const pendingTasks = tasks.filter(t => !t.task.taskCompleted);
    const overdueTasks = pendingTasks.filter(t => {
      const days = Math.floor((Date.now() - new Date(t.task.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return days >= 10;
    });

    // Documents — reuse existing checkedDocs localStorage
    const partnerChecked = checkedDocs[partnerId] || [];
    const pendingDocs = totalDocsCount - partnerChecked.filter(id => activeDocuments.some(d => d.id === id)).length;

    // Registrations
    const partnerRegs = registrations.filter(r => r.partnerId === partnerId);
    const activeRegs = partnerRegs.filter(r => !['Concluído', 'Cancelado'].includes(r.status));

    // Last visit (only type === 'visita')
    const partnerVisits = visits
      .filter(v => v.partnerId === partnerId && v.type === 'visita' && v.status === 'Concluída')
      .sort((a, b) => b.date.localeCompare(a.date));
    const lastVisitDate = partnerVisits[0]?.date || null;
    const daysSinceLastVisit = lastVisitDate ? differenceInDays(today, parseISO(lastVisitDate)) : null;

    // Criticality
    let criticality: Criticality = 'baixa';
    if (overdueTasks.length > 0 || (daysSinceLastVisit !== null && daysSinceLastVisit > 30) || (totalDocsCount > 0 && pendingDocs > totalDocsCount * 0.5)) {
      criticality = 'alta';
    } else if (pendingTasks.length > 0 || (daysSinceLastVisit !== null && daysSinceLastVisit > 15) || activeRegs.length > 0) {
      criticality = 'média';
    }

    // Next action
    let nextAction = 'Nenhuma ação pendente';
    if (overdueTasks.length > 0) {
      nextAction = 'Resolver tarefa atrasada';
    } else if (pendingDocs > 0 && totalDocsCount > 0) {
      nextAction = 'Enviar documento pendente';
    } else if (activeRegs.length > 0) {
      nextAction = 'Acompanhar cadastro em andamento';
    } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 15) {
      nextAction = 'Agendar nova visita';
    } else if (pendingTasks.length > 0) {
      nextAction = 'Concluir tarefa em aberto';
    }

    return {
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      pendingDocsCount: Math.max(0, pendingDocs),
      totalDocsCount,
      activeRegistrationsCount: activeRegs.length,
      lastVisitDate,
      daysSinceLastVisit,
      criticality,
      nextAction,
    };
  }, [visits, getTasksByPartnerId, registrations, checkedDocs, activeDocuments, totalDocsCount]);

  // Aggregated summaries for the listing page
  const summary = useMemo(() => {
    let withPendencies = 0;
    let totalPendingDocs = 0;
    let totalOpenTasks = 0;
    let totalActiveRegistrations = 0;

    visiblePartners.forEach(p => {
      const data = getPartnerData(p.id);
      if (data.criticality === 'alta' || data.criticality === 'média') withPendencies++;
      totalPendingDocs += data.pendingDocsCount;
      totalOpenTasks += data.pendingTasksCount;
      totalActiveRegistrations += data.activeRegistrationsCount;
    });

    return {
      total: visiblePartners.length,
      withPendencies,
      totalPendingDocs,
      totalOpenTasks,
      totalActiveRegistrations,
    };
  }, [visiblePartners, getPartnerData]);

  return { getPartnerData, summary };
}
