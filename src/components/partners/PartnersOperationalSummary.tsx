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

interface Props {
  summary: SummaryData;
}

export default function PartnersOperationalSummary({ summary }: Props) {
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
      />
      <AnimatedKpiCard
        icon={FileText}
        label="Docs Pendentes"
        value={summary.totalPendingDocs}
        color="text-destructive"
        delay={0.1}
      />
      <AnimatedKpiCard
        icon={CheckSquare}
        label="Tarefas Abertas"
        value={summary.totalOpenTasks}
        color="text-info"
        delay={0.15}
      />
      {canSeeRegistration && (
        <AnimatedKpiCard
          icon={Landmark}
          label="Cadastro Ativo"
          value={summary.totalActiveRegistrations}
          color="text-success"
          delay={0.2}
        />
      )}
    </div>
  );
}
