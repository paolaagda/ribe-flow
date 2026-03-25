import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Partner, Visit } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { formatCentavos } from '@/lib/currency';
import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface Stats {
  completed: number;
  prospections: number;
  totalVisits: number;
  lastVisit: string | null;
  avgFrequency: number;
  topStatus: string;
  conversionRate: number;
  banks: string[];
  products: string[];
}

interface Props {
  partner: Partner;
  visits: Visit[];
  stats: Stats;
}

interface Insight {
  icon: any;
  text: string;
  type: 'warning' | 'success' | 'info';
}

const typeStyles = {
  warning: 'text-warning bg-warning/10 border-warning/20',
  success: 'text-success bg-success/10 border-success/20',
  info: 'text-info bg-info/10 border-info/20',
};

export default function PartnerInsights({ partner, visits, stats }: Props) {
  const insights = useMemo(() => {
    const list: Insight[] = [];
    const today = new Date();

    // Days since last visit
    if (stats.lastVisit) {
      const daysSince = Math.floor((today.getTime() - new Date(stats.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 15) {
        list.push({ icon: Clock, text: `Este parceiro não recebe visitas há ${daysSince} dias`, type: 'warning' });
      }
    }

    // High reschedule rate
    const rescheduled = visits.filter(v => v.status === 'Reagendada').length;
    if (visits.length > 0 && (rescheduled / visits.length) > 0.3) {
      list.push({ icon: AlertTriangle, text: `Alta taxa de reagendamento (${Math.round((rescheduled / visits.length) * 100)}%)`, type: 'warning' });
    }

    // High potential but low frequency
    if (partner.potential === 'alto' && stats.avgFrequency > 14) {
      list.push({ icon: TrendingDown, text: 'Potencial alto com baixa frequência de visitas', type: 'warning' });
    }

    // Good conversion
    if (stats.conversionRate >= 70 && visits.length >= 3) {
      list.push({ icon: TrendingUp, text: `Boa taxa de conversão: ${stats.conversionRate}%`, type: 'success' });
    }

    // Recent growth
    const recentVisits = visits.filter(v => {
      const d = new Date(v.date);
      const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 14;
    });
    if (recentVisits.length >= 3) {
      list.push({ icon: TrendingUp, text: 'Boa evolução nas últimas semanas', type: 'success' });
    }

    // No visits
    if (visits.length === 0) {
      list.push({ icon: AlertTriangle, text: 'Nenhuma visita registrada — considere agendar uma prospecção', type: 'info' });
    }

    // Potential value insights
    const totalPotential = visits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
    if (totalPotential > 0) {
      const plannedPotential = visits.filter(v => v.status === 'Planejada').reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (plannedPotential >= 2000000) {
        list.push({ icon: DollarSign, text: `Agenda com alto valor potencial planejado: ${formatCentavos(plannedPotential)}`, type: 'info' });
      }
      // High potential, low frequency
      if (totalPotential >= 5000000 && stats.avgFrequency > 14) {
        list.push({ icon: DollarSign, text: `Alto potencial acumulado (${formatCentavos(totalPotential)}) com baixa frequência`, type: 'warning' });
      }
    }

    return list;
  }, [partner, visits, stats]);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={cn('flex items-start gap-2 p-3 rounded-lg border text-sm', typeStyles[insight.type])}>
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{insight.text}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
