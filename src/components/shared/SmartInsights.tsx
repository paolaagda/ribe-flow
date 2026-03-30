import { useMemo } from 'react';

import { Lightbulb, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Target, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { formatCentavos } from '@/lib/currency';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export type InsightPage = 'agenda' | 'campanhas' | 'analises' | 'parceiros';

export interface Insight {
  id: string;
  icon: React.ReactNode;
  text: string;
  variant: 'success' | 'info' | 'warning' | 'neutral';
}

const variantStyles: Record<string, string> = {
  success: 'bg-success/5 text-success border-success/10 hover:bg-success/10 hover:border-success/20',
  info: 'bg-info/5 text-info border-info/10 hover:bg-info/10 hover:border-info/20',
  warning: 'bg-warning/5 text-warning border-warning/10 hover:bg-warning/10 hover:border-warning/20',
  neutral: 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/60 hover:border-border/50',
};

const activeVariantStyles: Record<string, string> = {
  success: 'bg-success/15 text-success border-success/30 ring-1 ring-success/15',
  info: 'bg-info/15 text-info border-info/30 ring-1 ring-info/15',
  warning: 'bg-warning/15 text-warning border-warning/30 ring-1 ring-warning/15',
  neutral: 'bg-muted/80 text-foreground border-foreground/15 ring-1 ring-foreground/5',
};

interface SmartInsightsProps {
  page: InsightPage;
  activeFilter?: string | null;
  onFilterClick?: (insightId: string | null) => void;
  /** @deprecated Use onFilterClick instead */
  onInsightClick?: (text: string, variant: string) => void;
}

export default function SmartInsights({ page, activeFilter, onFilterClick, onInsightClick }: SmartInsightsProps) {
  const { visits } = useVisits();
  const { partners } = usePartners();
  const { pendingTasks, completedTasks } = useTasks();
  const { user, profile } = useAuth();

  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const visibleVisits = profile === 'nao_gestor' && user
      ? visits.filter(v => v.userId === user.id || v.createdBy === user.id)
      : visits;

    const concluded = visibleVisits.filter(v => v.status === 'Concluída');
    const planned = visibleVisits.filter(v => v.status === 'Planejada');
    const last30 = visibleVisits.filter(v => {
      const d = parseISO(v.date);
      return differenceInDays(today, d) >= 0 && differenceInDays(today, d) <= 30;
    });
    const last30Concluded = last30.filter(v => v.status === 'Concluída');

    if (page === 'agenda') {
      if (last30Concluded.length >= 3) {
        result.push({ id: 'agenda_evolucao', icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: `${last30Concluded.length} visitas concluídas nos últimos 30 dias`, variant: 'success' });
      }
      const todayVisits = visibleVisits.filter(v => v.date === todayStr);
      const todayValue = todayVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (todayValue > 0) {
        result.push({ id: 'agenda_valor_hoje', icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Agenda com alto valor potencial planejado: ${formatCentavos(todayValue)}`, variant: 'info' });
      }
      const overdue = pendingTasks.filter(t => differenceInDays(today, parseISO(t.task.createdAt)) >= 10);
      if (overdue.length > 0) {
        result.push({ id: 'agenda_tarefas_atrasadas', icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />, text: `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} pendente${overdue.length > 1 ? 's' : ''} há mais de 10 dias`, variant: 'warning' });
      }
      if (visibleVisits.length > 10) {
        const rate = Math.round((concluded.length / visibleVisits.length) * 100);
        if (rate >= 70) {
          result.push({ id: 'agenda_taxa_conclusao', icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />, text: `Taxa de conclusão de ${rate}% — excelente!`, variant: 'success' });
        }
      }
    }

    if (page === 'campanhas') {
      // Visits remaining for goal
      const concludedCount = last30Concluded.length;
      const plannedCount = planned.length;
      const visitsRemaining = Math.max(0, plannedCount);
      if (visitsRemaining > 0) {
        result.push({ id: 'camp_visitas_faltam', icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />, text: `Faltam ${visitsRemaining} visitas para sua meta`, variant: 'warning' });
      }
      // Campaign end date proximity
      const canceladas = visibleVisits.filter(v => v.status === 'Cancelada').length;
      if (canceladas > 3) {
        result.push({ id: 'camp_canceladas', icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />, text: `${canceladas} agendas canceladas — atenção ao deflator`, variant: 'warning' });
      }
      // Performance vs average
      if (concludedCount >= 5) {
        result.push({ id: 'camp_acima_media', icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: 'Você está acima da média da equipe!', variant: 'success' });
      } else if (concludedCount >= 1) {
        result.push({ id: 'camp_evolucao', icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: `${concludedCount} visitas concluídas nos últimos 30 dias`, variant: 'info' });
      }
    }

    if (page === 'analises') {
      if (last30Concluded.length >= 3) {
        result.push({ id: 'anal_tendencia', icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: `Tendência positiva: ${last30Concluded.length} conclusões nos últimos 30 dias`, variant: 'success' });
      }
      const visitas = visibleVisits.filter(v => v.type === 'visita');
      const prosp = visibleVisits.filter(v => v.type === 'prospecção');
      if (visitas.length > 0 && prosp.length > 0) {
        const ratio = (visitas.length / prosp.length).toFixed(1);
        result.push({ id: 'anal_proporcao', icon: <Target className="h-3.5 w-3.5 shrink-0" />, text: `Proporção visitas/prospecções: ${ratio}x`, variant: 'neutral' });
      }
      const avgValue = visibleVisits.filter(v => v.potentialValue).reduce((s, v) => s + (v.potentialValue || 0), 0);
      const countWithValue = visibleVisits.filter(v => v.potentialValue).length;
      if (countWithValue > 0) {
        result.push({ id: 'anal_ticket', icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Ticket médio: ${formatCentavos(Math.round(avgValue / countWithValue))}`, variant: 'info' });
      }
    }

    if (page === 'parceiros') {
      const highPotential = partners.filter(p => p.potential === 'alto');
      if (highPotential.length > 0) {
        result.push({ id: 'parc_alto_potencial', icon: <TrendingUp className="h-3.5 w-3.5 shrink-0" />, text: `${highPotential.length} parceiro${highPotential.length > 1 ? 's' : ''} com alto potencial`, variant: 'success' });
      }
      const totalValue = visibleVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (totalValue > 0) {
        result.push({ id: 'parc_valor_total', icon: <DollarSign className="h-3.5 w-3.5 shrink-0" />, text: `Valor potencial total: ${formatCentavos(totalValue)}`, variant: 'info' });
      }
      const recentPartnerIds = new Set(last30.filter(v => v.status === 'Concluída').map(v => v.partnerId));
      const withoutRecent = partners.filter(p => !recentPartnerIds.has(p.id));
      if (withoutRecent.length > 0) {
        result.push({ id: 'parc_sem_visita_30d', icon: <Calendar className="h-3.5 w-3.5 shrink-0" />, text: `${withoutRecent.length} parceiros sem visita concluída nos últimos 30 dias`, variant: 'warning' });
      }
    }

    if (result.length === 0) {
      result.push({ id: 'fallback', icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />, text: 'Tudo em ordem por aqui!', variant: 'neutral' });
    }

    return result.slice(0, 3);
  }, [page, visits, partners, pendingTasks, completedTasks, user, profile]);

  const handleClick = (insight: Insight) => {
    if (onFilterClick) {
      onFilterClick(activeFilter === insight.id ? null : insight.id);
    } else if (onInsightClick) {
      onInsightClick(insight.text, insight.variant);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-warning/70" />
          <span className="text-ds-xs font-medium text-muted-foreground">Insights</span>
          {activeFilter && (
            <button
              onClick={() => onFilterClick?.(null)}
              className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
            >
              <X className="h-2.5 w-2.5" /> Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.25 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-ds-xs cursor-pointer transition-all duration-200',
                activeFilter === insight.id
                  ? activeVariantStyles[insight.variant]
                  : variantStyles[insight.variant],
              )}
              onClick={() => handleClick(insight)}
            >
              {insight.icon}
              <span className="leading-snug">{insight.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
