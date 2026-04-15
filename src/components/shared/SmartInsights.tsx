import { useMemo } from 'react';

import { Lightbulb, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Target, Calendar, X, ShieldAlert, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useVisibility } from '@/hooks/useVisibility';
import { formatCentavos } from '@/lib/currency';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
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
  filterView?: 'day' | 'week' | 'month';
  filterStatus?: string;
  filterType?: string;
  /** Pre-filtered partners scoped to the logged-in user's role */
  scopedPartners?: import('@/data/mock-data').Partner[];
}

export default function SmartInsights({ page, activeFilter, onFilterClick, onInsightClick, filterView, filterStatus, filterType, scopedPartners }: SmartInsightsProps) {
  const { visits } = useVisits();
  const { partners: allPartners } = usePartners();
  const { pendingTasks } = useTasks();
  const { user } = useAuth();

  const { filterVisits, filterPartners } = useVisibility();

  // Use scoped partners when provided, otherwise filter by role
  const roleFilteredPartners = useMemo(() => {
    if (scopedPartners) return scopedPartners;
    return filterPartners(allPartners);
  }, [scopedPartners, allPartners, filterPartners]);

  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const visibleVisits = filterVisits(visits);

    // Apply page-level filters if provided (for agenda)
    let contextVisits = visibleVisits;
    if (page === 'agenda') {
      if (filterStatus && filterStatus !== 'all') {
        contextVisits = contextVisits.filter(v => v.status === filterStatus);
      }
      if (filterType && filterType !== 'all') {
        contextVisits = contextVisits.filter(v => v.type === filterType);
      }
    }

    const concluded = contextVisits.filter(v => v.status === 'Concluída');
    const planned = contextVisits.filter(v => v.status === 'Planejada');

    // Current month visits
    const thisMonth = contextVisits.filter(v => {
      const d = parseISO(v.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    const thisMonthConcluded = thisMonth.filter(v => v.status === 'Concluída');

    if (page === 'agenda') {
      // Build last-visit map for all partners
      const lastVisitByPartner: Record<string, string> = {};
      visibleVisits
        .filter(v => v.status === 'Concluída')
        .forEach(v => {
          if (!lastVisitByPartner[v.partnerId] || v.date > lastVisitByPartner[v.partnerId]) {
            lastVisitByPartner[v.partnerId] = v.date;
          }
        });

      // 1. High potential value in planned visits (dynamic by date)
      const plannedWithValue = planned.filter(v => v.potentialValue && v.potentialValue > 0);
      if (plannedWithValue.length > 0) {
        const totalPlanned = plannedWithValue.reduce((s, v) => s + (v.potentialValue || 0), 0);
        const nextDate = plannedWithValue.sort((a, b) => a.date.localeCompare(b.date))[0];
        const dateLabel = nextDate ? format(parseISO(nextDate.date), 'dd/MM') : '';
        result.push({ id: 'agenda_valor_planejado', icon: <DollarSign className="h-3 w-3 shrink-0" />, text: `Alto valor potencial planejado${dateLabel ? ` em ${dateLabel}` : ''}: ${formatCentavos(totalPlanned)}`, variant: 'info' });
      }

      // 2. Partners without any visit in 15+ days
      const allNeglected = roleFilteredPartners.filter(p => {
        const last = lastVisitByPartner[p.id];
        return !last || differenceInDays(today, parseISO(last)) > 15;
      });
      if (allNeglected.length > 0) {
        result.push({ id: 'agenda_sem_visita_15d', icon: <Calendar className="h-3 w-3 shrink-0" />, text: `${allNeglected.length} parceiro${allNeglected.length > 1 ? 's' : ''} sem visita há mais de 15 dias`, variant: 'warning' });
      }

      // 3. Class A partners without visit in 15+ days
      const classANeglected = allNeglected.filter(p => p.partnerClass === 'A');
      if (classANeglected.length > 0) {
        result.push({ id: 'agenda_a_sem_visita', icon: <ShieldAlert className="h-3 w-3 shrink-0" />, text: `${classANeglected.length} parceiro${classANeglected.length > 1 ? 's' : ''} classe A sem visita há +15 dias`, variant: 'warning' });
      }

      // 4. Period visits to class A/B partners (uses view-filtered visits)
      const periodVisitsAB = contextVisits.filter(v => {
        const partner = roleFilteredPartners.find(p => p.id === v.partnerId);
        return partner && (partner.partnerClass === 'A' || partner.partnerClass === 'B');
      });
      if (periodVisitsAB.length > 0) {
        const concludedAB = periodVisitsAB.filter(v => v.status === 'Concluída').length;
        result.push({ id: 'agenda_visitas_ab_periodo', icon: <Star className="h-3 w-3 shrink-0" />, text: `${concludedAB} de ${periodVisitsAB.length} compromissos A/B concluídos no período`, variant: concludedAB >= periodVisitsAB.length * 0.5 ? 'success' : 'info' });
      }
    }

    if (page === 'campanhas') {
      const last30 = contextVisits.filter(v => {
        const d = parseISO(v.date);
        return differenceInDays(today, d) >= 0 && differenceInDays(today, d) <= 30;
      });
      const last30Concluded = last30.filter(v => v.status === 'Concluída');
      const concludedCount = last30Concluded.length;
      const plannedCount = planned.length;
      const visitsRemaining = Math.max(0, plannedCount);
      if (visitsRemaining > 0) {
        result.push({ id: 'camp_visitas_faltam', icon: <AlertTriangle className="h-3 w-3 shrink-0" />, text: `Faltam ${visitsRemaining} visitas para sua meta`, variant: 'warning' });
      }
      const canceladas = contextVisits.filter(v => v.status === 'Cancelada').length;
      if (canceladas > 3) {
        result.push({ id: 'camp_canceladas', icon: <AlertTriangle className="h-3 w-3 shrink-0" />, text: `${canceladas} compromissos cancelados — atenção ao deflator`, variant: 'warning' });
      }
      if (concludedCount >= 5) {
        result.push({ id: 'camp_acima_media', icon: <TrendingUp className="h-3 w-3 shrink-0" />, text: 'Você está acima da média da equipe!', variant: 'success' });
      } else if (concludedCount >= 1) {
        result.push({ id: 'camp_evolucao', icon: <TrendingUp className="h-3 w-3 shrink-0" />, text: `${concludedCount} visitas concluídas nos últimos 30 dias`, variant: 'info' });
      }
    }

    if (page === 'analises') {
      if (thisMonthConcluded.length >= 3) {
        result.push({ id: 'anal_tendencia', icon: <TrendingUp className="h-3 w-3 shrink-0" />, text: `Tendência positiva: ${thisMonthConcluded.length} conclusões neste mês`, variant: 'success' });
      }
      const visitas = contextVisits.filter(v => v.type === 'visita');
      const prosp = contextVisits.filter(v => v.type === 'prospecção');
      if (visitas.length > 0 && prosp.length > 0) {
        const ratio = (visitas.length / prosp.length).toFixed(1);
        result.push({ id: 'anal_proporcao', icon: <Target className="h-3 w-3 shrink-0" />, text: `Proporção visitas/prospecções: ${ratio}x`, variant: 'neutral' });
      }
      const avgValue = contextVisits.filter(v => v.potentialValue).reduce((s, v) => s + (v.potentialValue || 0), 0);
      const countWithValue = contextVisits.filter(v => v.potentialValue).length;
      if (countWithValue > 0) {
        result.push({ id: 'anal_ticket', icon: <DollarSign className="h-3 w-3 shrink-0" />, text: `Ticket médio: ${formatCentavos(Math.round(avgValue / countWithValue))}`, variant: 'info' });
      }
    }

    if (page === 'parceiros') {
      const highPotential = roleFilteredPartners.filter(p => p.potential === 'alto');
      if (highPotential.length > 0) {
        result.push({ id: 'parc_alto_potencial', icon: <TrendingUp className="h-3 w-3 shrink-0" />, text: `${highPotential.length} parceiro${highPotential.length > 1 ? 's' : ''} com alto potencial`, variant: 'success' });
      }
      const totalValue = contextVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
      if (totalValue > 0) {
        result.push({ id: 'parc_valor_total', icon: <DollarSign className="h-3 w-3 shrink-0" />, text: `Valor potencial total: ${formatCentavos(totalValue)}`, variant: 'info' });
      }
      const recentPartnerIds = new Set(thisMonth.filter(v => v.status === 'Concluída').map(v => v.partnerId));
      const withoutRecent = roleFilteredPartners.filter(p => !recentPartnerIds.has(p.id));
      if (withoutRecent.length > 0) {
        result.push({ id: 'parc_sem_visita_30d', icon: <Calendar className="h-3 w-3 shrink-0" />, text: `${withoutRecent.length} parceiros sem visita concluída neste mês`, variant: 'warning' });
      }
    }

    if (result.length === 0) {
      result.push({ id: 'fallback', icon: <CheckCircle2 className="h-3 w-3 shrink-0" />, text: 'Tudo em ordem por aqui!', variant: 'neutral' });
    }

    return result.slice(0, 4);
  }, [page, visits, roleFilteredPartners, pendingTasks, user, filterStatus, filterType, filterView]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.25 }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] cursor-pointer transition-all duration-200',
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
