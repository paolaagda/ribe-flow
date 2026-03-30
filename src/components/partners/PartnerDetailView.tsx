import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { getUserById, Visit } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { formatCentavos } from '@/lib/currency';
import {
  ArrowLeft, Building2, MapPin, Phone, User, Calendar,
  TrendingUp, BarChart3, Target, Clock, Award, CalendarPlus, CalendarRange, DollarSign, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PartnerVisitHistory from './PartnerVisitHistory';
import PartnerTimeline from './PartnerTimeline';
import PartnerCharts from './PartnerCharts';
import PartnerInsights from './PartnerInsights';
import PartnerTasksSection from './PartnerTasksSection';
import PartnerRegistrations from './PartnerRegistrations';
import { useStores } from '@/hooks/useStores';
import { Store } from 'lucide-react';

interface Props {
  partnerId: string;
  onBack: () => void;
}

const potentialConfig = {
  alto: { color: 'text-success', bg: 'bg-success/10 border-success/20', width: 'w-full' },
  médio: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', width: 'w-2/3' },
  baixo: { color: 'text-muted-foreground', bg: 'bg-muted/50 border-muted-foreground/20', width: 'w-1/3' },
};

export default function PartnerDetailView({ partnerId, onBack }: Props) {
  const { getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { getStoresByPartnerId } = useStores();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const partner = getPartnerById(partnerId);

  const partnerVisits = useMemo(() => {
    return visits.filter(v => v.partnerId === partnerId).sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, partnerId]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Aggregate data
  const stats = useMemo(() => {
    const completed = partnerVisits.filter(v => v.status === 'Concluída').length;
    const prospections = partnerVisits.filter(v => v.type === 'prospecção').length;
    const totalVisits = partnerVisits.filter(v => v.type === 'visita').length;
    const dates = partnerVisits.map(v => v.date).sort();
    const lastVisit = dates[dates.length - 1] || null;

    // Frequency: avg days between visits
    let avgFrequency = 0;
    if (dates.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
        diffs.push(Math.abs(diff));
      }
      avgFrequency = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }

    // Most common status
    const statusCount: Record<string, number> = {};
    partnerVisits.forEach(v => { statusCount[v.status] = (statusCount[v.status] || 0) + 1; });
    const topStatus = Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Conversion rate
    const conversionRate = partnerVisits.length > 0 ? Math.round((completed / partnerVisits.length) * 100) : 0;

    // Banks & products aggregated
    const banks = [...new Set(partnerVisits.flatMap(v => v.banks))];
    const products = [...new Set(partnerVisits.flatMap(v => v.products))];

    // Potential aggregation
    const totalPotential = partnerVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
    const totalComments = partnerVisits.reduce((sum, v) => sum + (v.comments?.length || 0), 0);
    const pendingTasks = partnerVisits.reduce((sum, v) => sum + (v.comments?.filter(c => c.type === 'task' && !c.taskCompleted).length || 0), 0);

    return { completed, prospections, totalVisits, lastVisit, avgFrequency, topStatus, conversionRate, banks, products, totalPotential, totalComments, pendingTasks };
  }, [partnerVisits]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Parceiro não encontrado</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const responsible = getUserById(partner.responsibleUserId);
  const pc = potentialConfig[partner.potential];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/agenda')}>
            <CalendarRange className="h-4 w-4" /> Ver agenda
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/agenda')}>
            <CalendarPlus className="h-4 w-4" /> Nova visita
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>{partner.name}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">{partner.razaoSocial}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{partner.cnpj}</p>
            <div className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />{partner.address}</div>
            <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{partner.phone}</div>
            <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Contato:</span>{partner.contact}</div>
            <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Comercial:</span>{responsible?.name || 'Não definido'}</div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Potencial</span>
                <Badge variant="outline" className={cn('capitalize', pc.color, pc.bg)}>{partner.potential}</Badge>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', pc.width, partner.potential === 'alto' ? 'bg-success' : partner.potential === 'médio' ? 'bg-warning' : 'bg-muted-foreground/40')} />
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium mb-1.5">Estruturas</p>
              <div className="flex flex-wrap gap-1">
                {partner.structures.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:w-[420px]">
          <KpiCard icon={BarChart3} label="Total visitas" value={stats.totalVisits} color="text-info" />
          <KpiCard icon={Target} label="Prospecções" value={stats.prospections} color="text-primary" />
          <KpiCard icon={Calendar} label="Última visita" value={stats.lastVisit || '—'} color="text-muted-foreground" small />
          <KpiCard icon={Clock} label="Freq. média" value={stats.avgFrequency ? `${stats.avgFrequency}d` : '—'} color="text-warning" />
          <KpiCard icon={DollarSign} label="Potencial total" value={stats.totalPotential ? formatCentavos(stats.totalPotential) : '—'} color="text-success" small />
          <KpiCard icon={TrendingUp} label="Conversão" value={`${stats.conversionRate}%`} color="text-success" />
          {stats.totalComments > 0 && (
            <KpiCard icon={MessageSquare} label="Comentários" value={stats.totalComments} color="text-info" />
          )}
          {stats.pendingTasks > 0 && (
            <KpiCard icon={Award} label="Tarefas pendentes" value={stats.pendingTasks} color="text-warning" />
          )}
        </div>
      </div>

      {/* Insights */}
      <PartnerInsights partner={partner} visits={partnerVisits} stats={stats} />

      {/* Tasks */}
      <PartnerTasksSection partnerId={partnerId} />

      {/* Charts */}
      <PartnerCharts visits={partnerVisits} />

      {/* Timeline */}
      <PartnerTimeline visits={partnerVisits} />

      {/* Stores */}
      {(() => {
        const partnerStores = getStoresByPartnerId(partnerId);
        if (partnerStores.length === 0) return null;
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Lojas ({partnerStores.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {partnerStores.map(s => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.address}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{s.phone}</span>
                      <span>• {s.contact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* Visit History */}
      <PartnerVisitHistory visits={partnerVisits} />

      {/* Empty state */}
      {partnerVisits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Este parceiro ainda não possui visitas registradas</p>
            <p className="text-sm mt-1">Que tal agendar a primeira visita?</p>
            <Button className="mt-4 gap-2" onClick={() => navigate('/agenda')}>
              <CalendarPlus className="h-4 w-4" /> Agendar primeira visita
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function KpiCard({ icon: Icon, label, value, color, small }: { icon: any; label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex flex-col items-center text-center gap-1">
        <Icon className={cn('h-5 w-5', color)} />
        <p className={cn('font-bold tabular-nums', small ? 'text-sm' : 'text-2xl', color)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
