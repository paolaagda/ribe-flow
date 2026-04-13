import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';
import { Building2, AlertTriangle, FileText, CheckSquare, Landmark } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

interface SummaryData {
  total: number;
  withPendencies: number;
  totalPendingDocs: number;
  totalOpenTasks: number;
  totalActiveRegistrations: number;
}

export type SummaryFilterKey = 'withPendencies' | 'pendingDocs' | 'openTasks' | 'activeRegistrations';

interface Props {
  summary: SummaryData;
  activeFilter: SummaryFilterKey | null;
  onFilterToggle: (key: SummaryFilterKey) => void;
}

export default function PartnersOperationalSummary({ summary, activeFilter, onFilterToggle }: Props) {
  const { canRead } = usePermission();
  const canSeeRegistration = canRead('registration.view');

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${canSeeRegistration ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-ds-xs`}>
      <AnimatedKpiCard
        icon={Building2}
        label="Total Parceiros"
        value={summary.total}
        color="text-primary"
        delay={0}
      />
      <AnimatedKpiCard
        icon={AlertTriangle}
        label="Com Pendências"
        value={summary.withPendencies}
        color="text-warning"
        delay={0.05}
        pulse={summary.withPendencies > 0}
        onClick={() => onFilterToggle('withPendencies')}
        active={activeFilter === 'withPendencies'}
      />
      <AnimatedKpiCard
        icon={FileText}
        label="Docs Pendentes"
        value={summary.totalPendingDocs}
        color="text-destructive"
        delay={0.1}
        onClick={() => onFilterToggle('pendingDocs')}
        active={activeFilter === 'pendingDocs'}
      />
      <AnimatedKpiCard
        icon={CheckSquare}
        label="Tarefas Abertas"
        value={summary.totalOpenTasks}
        color="text-info"
        delay={0.15}
        onClick={() => onFilterToggle('openTasks')}
        active={activeFilter === 'openTasks'}
      />
      {canSeeRegistration && (
        <AnimatedKpiCard
          icon={Landmark}
          label="Cadastramentos"
          value={summary.totalActiveRegistrations}
          color="text-success"
          delay={0.2}
          onClick={() => onFilterToggle('activeRegistrations')}
          active={activeFilter === 'activeRegistrations'}
        />
      )}
    </div>
  );
}
