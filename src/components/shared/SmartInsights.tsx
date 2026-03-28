import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Users, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { formatCentavos } from '@/lib/currency';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

export type InsightPage = 'agenda' | 'campanhas' | 'analises' | 'parceiros';

interface Insight {
  icon: React.ReactNode;
  text: string;
  variant: 'success' | 'info' | 'warning' | 'neutral';
}

const variantStyles: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-info/10 text-info border-info/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const iconByVariant = {
  success: <TrendingUp className="h-3.5 w-3.5 shrink-0" />,
  info: <DollarSign className="h-3.5 w-3.5 shrink-0" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
  neutral: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
};

interface SmartInsightsProps {
  page: InsightPage;
}

export default function SmartInsights({ page }: SmartInsightsProps) {
  const { visits } = useVisits();
  const { partners } = usePartners();
  const { pendingTasks, completedTasks } = useTasks();
  const { user, profile } = useAuth();

  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Filter visible visits
    const visibleVisits = profile === 'nao_gestor' && user
      ? visits.filter(v => v.userId === user.id || v.createdBy === user.id)
      : visits;

    const concluded = visibleVisits.filter(v => v.status === 'Concluída');
    const planned = visibleVisits.filter(v => v.status === 'Planejada');
    const last7 = visibleVisits.filter(v => {
      const d = parseISO(v.date);
      return differenceInDays(today, d) >= 0 && differenceInDays(today, d) <= 7;
    });
    const last7Concluded = last7.filter(v => v.status === 'Concluída');

    if (page === 'agenda') {
      // Evolução recente
      if (last7Concluded.length >= 3) {
        result.push({ icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: 'Boa evolução nas últimas semanas', variant: 'success' });
      }

      // Valor potencial do dia
      const todayVisits = visibleVisits.filter(v => v.date === todayStr);
      const todayValue = todayVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (todayValue > 0) {
        result.push({ icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Agenda com alto valor potencial planejado: ${formatCentavos(todayValue)}`, variant: 'info' });
      }

      // Tarefas atrasadas
      const overdue = pendingTasks.filter(t => differenceInDays(today, parseISO(t.task.createdAt)) >= 10);
      if (overdue.length > 0) {
        result.push({ icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />, text: `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} pendente${overdue.length > 1 ? 's' : ''} há mais de 10 dias`, variant: 'warning' });
      }

      // Taxa de conclusão
      if (visibleVisits.length > 10) {
        const rate = Math.round((concluded.length / visibleVisits.length) * 100);
        if (rate >= 70) {
          result.push({ icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />, text: `Taxa de conclusão de ${rate}% — excelente!`, variant: 'success' });
        }
      }
    }

    if (page === 'campanhas') {
      if (last7Concluded.length >= 5) {
        result.push({ icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: 'Boa evolução nas últimas semanas', variant: 'success' });
      }

      const totalValue = visibleVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (totalValue > 0) {
        result.push({ icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Valor potencial acumulado: ${formatCentavos(totalValue)}`, variant: 'info' });
      }

      const canceladas = visibleVisits.filter(v => v.status === 'Cancelada').length;
      if (canceladas > 3) {
        result.push({ icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />, text: `${canceladas} agendas canceladas — atenção ao deflator`, variant: 'warning' });
      }
    }

    if (page === 'analises') {
      if (last7Concluded.length >= 3) {
        result.push({ icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: 'Tendência positiva de conclusões recentes', variant: 'success' });
      }

      const visitas = visibleVisits.filter(v => v.type === 'visita');
      const prosp = visibleVisits.filter(v => v.type === 'prospecção');
      if (visitas.length > 0 && prosp.length > 0) {
        const ratio = (visitas.length / prosp.length).toFixed(1);
        result.push({ icon: <Target className="h-3.5 w-3.5 shrink-0" />, text: `Proporção visitas/prospecções: ${ratio}x`, variant: 'neutral' });
      }

      const avgValue = visibleVisits.filter(v => v.potentialValue).reduce((s, v) => s + (v.potentialValue || 0), 0);
      const countWithValue = visibleVisits.filter(v => v.potentialValue).length;
      if (countWithValue > 0) {
        result.push({ icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Ticket médio: ${formatCentavos(Math.round(avgValue / countWithValue))}`, variant: 'info' });
      }
    }

    if (page === 'parceiros') {
      const highPotential = partners.filter(p => p.potential === 'alto');
      if (highPotential.length > 0) {
        result.push({ icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: `${highPotential.length} parceiro${highPotential.length > 1 ? 's' : ''} com alto potencial`, variant: 'success' });
      }

      const totalValue = visibleVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (totalValue > 0) {
        result.push({ icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Valor potencial total: ${formatCentavos(totalValue)}`, variant: 'info' });
      }

      // Parceiros sem visita recente
      const recentPartnerIds = new Set(last7.map(v => v.partnerId));
      const withoutRecent = partners.filter(p => !recentPartnerIds.has(p.id));
      if (withoutRecent.length > 3) {
        result.push({ icon: <Calendar className="h-3.5 w-3.5 shrink-0" />, text: `${withoutRecent.length} parceiros sem visita nos últimos 7 dias`, variant: 'warning' });
      }
    }

    // Fallback if no insights generated
    if (result.length === 0) {
      result.push({ icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />, text: 'Tudo em ordem por aqui!', variant: 'neutral' });
    }

    return result.slice(0, 3); // Max 3 insights
  }, [page, visits, partners, pendingTasks, completedTasks, user, profile]);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold">Insights Inteligentes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium',
                variantStyles[insight.variant],
              )}
            >
              {insight.icon}
              <span className="leading-snug">{insight.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
