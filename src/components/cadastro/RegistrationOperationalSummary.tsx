import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';
import { AlertTriangle, Clock, Users, Building2 } from 'lucide-react';

interface SummaryData {
  immediateAttention: number;
  idleOver7: number;
  awaitingPartner: number;
  awaitingBank: number;
}

interface Props {
  summary: SummaryData;
}

export default function RegistrationOperationalSummary({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-ds-xs">
      <AnimatedKpiCard
        icon={AlertTriangle}
        label="Atenção Imediata"
        value={summary.immediateAttention}
        color="text-destructive"
        delay={0}
        pulse={summary.immediateAttention > 0}
      />
      <AnimatedKpiCard
        icon={Clock}
        label="Parados >7 dias"
        value={summary.idleOver7}
        color="text-warning"
        delay={0.05}
      />
      <AnimatedKpiCard
        icon={Users}
        label="Aguardando Parceiro"
        value={summary.awaitingPartner}
        color="text-info"
        delay={0.1}
      />
      <AnimatedKpiCard
        icon={Building2}
        label="Aguardando Banco"
        value={summary.awaitingBank}
        color="text-primary"
        delay={0.15}
      />
    </div>
  );
}
