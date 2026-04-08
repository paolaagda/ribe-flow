import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useStores } from '@/hooks/useStores';
import { usePartnerOperationalData } from '@/hooks/usePartnerOperationalData';
import { getUserById, Partner } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { formatCentavos } from '@/lib/currency';
import { useClassification } from '@/hooks/useClassification';
import {
  ArrowLeft, Building2, MapPin, Phone, User, Calendar,
  TrendingUp, BarChart3, Target, Clock, CalendarPlus, CalendarRange,
  DollarSign, CheckSquare, FileText, Landmark, ArrowRight, Store
} from 'lucide-react';
import PartnerProductionEditor from './PartnerProductionEditor';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PartnerVisitHistory from './PartnerVisitHistory';
import PartnerTimeline from './PartnerTimeline';
import PartnerCharts from './PartnerCharts';
import PartnerInsights from './PartnerInsights';
import PartnerTasksSection from './PartnerTasksSection';
import PartnerRegistrations from './PartnerRegistrations';
import PartnerDocuments from './PartnerDocuments';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { Criticality } from '@/hooks/usePartnerOperationalData';
import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  partnerId: string;
  onBack: () => void;
}

const potentialConfig = {
  alto: { color: 'text-success', bg: 'bg-success/10 border-success/20', width: 'w-full' },
  médio: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', width: 'w-2/3' },
  baixo: { color: 'text-muted-foreground', bg: 'bg-muted/50 border-muted-foreground/20', width: 'w-1/3' },
};

const criticalityConfig: Record<Criticality, { label: string; className: string }> = {
  alta: { label: 'Crítico', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  média: { label: 'Atenção', className: 'bg-warning/10 text-warning border-warning/20' },
  baixa: { label: 'Regular', className: 'bg-success/10 text-success border-success/20' },
};

export default function PartnerDetailView({ partnerId, onBack }: Props) {
  const { partners, getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { getStoresByPartnerId } = useStores();
  const { canWrite, canRead } = usePermission();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const partner = getPartnerById(partnerId);
  const { getPartnerData } = usePartnerOperationalData(partner ? [partner] : []);
  const opData = partner ? getPartnerData(partnerId) : null;
  const { getTasksByPartnerId } = useTasks();
  const partnerTasks = getTasksByPartnerId(partnerId);

  const partnerVisits = useMemo(() => {
    return visits.filter(v => v.partnerId === partnerId).sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, partnerId]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // Stats for insights/charts
  const stats = useMemo(() => {
    const completed = partnerVisits.filter(v => v.status === 'Concluída').length;
    const prospections = partnerVisits.filter(v => v.type === 'prospecção').length;
    const totalVisits = partnerVisits.filter(v => v.type === 'visita').length;
    const dates = partnerVisits.map(v => v.date).sort();
    const lastVisit = dates[dates.length - 1] || null;
    let avgFrequency = 0;
    if (dates.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
        diffs.push(Math.abs(diff));
      }
      avgFrequency = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
    const conversionRate = partnerVisits.length > 0 ? Math.round((completed / partnerVisits.length) * 100) : 0;
    const banks = [...new Set(partnerVisits.flatMap(v => v.banks))];
    const products = [...new Set(partnerVisits.flatMap(v => v.products))];
    const totalPotential = partnerVisits.reduce((sum, v) => sum + (v.potentialValue || 0), 0);
    return { completed, prospections, totalVisits, lastVisit, avgFrequency, conversionRate, banks, products, totalPotential, topStatus: '' };
  }, [partnerVisits]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
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
  const cc = opData ? criticalityConfig[opData.criticality] : null;
  const partnerStores = getStoresByPartnerId(partnerId);

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate('/agenda')}>
            <CalendarRange className="h-3.5 w-3.5" /> Ver agenda
          </Button>
          {canWrite('agenda.create') && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate('/agenda')}>
              <CalendarPlus className="h-3.5 w-3.5" /> Nova visita
            </Button>
          )}
        </div>
      </div>

      {/* Partner Identity Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Row 1: Avatar + Name/CNPJ + Badges */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate max-w-[70%]">{partner.name}</h2>
                <div className="flex gap-1 shrink-0">
                  <Badge variant="outline" className={cn(
                    'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
                    partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
                    partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
                    partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-muted text-muted-foreground border-muted-foreground/20'
                  )}>{partner.partnerClass}</Badge>
                  {cc && <Badge variant="outline" className={cn('text-[10px]', cc.className)}>{cc.label}</Badge>}
                  <Badge variant="outline" className={cn('text-[10px] capitalize', pc.color, pc.bg)}>{partner.potential}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{partner.razaoSocial} • {partner.cnpj}</p>
              <PartnerProductionEditor partner={partner} />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Row 2: Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{partner.address}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{partner.phone}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Contato: {partner.contact}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5 shrink-0" />Comercial: <span className="font-medium text-foreground truncate">{responsible?.name || '—'}</span></div>
          </div>

          {/* Row 3: Structure tags */}
          {partner.structures.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {partner.structures.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Summary Cards */}
      {opData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <AnimatedKpiCard icon={CheckSquare} label="Tarefas" value={opData.pendingTasksCount} color="text-warning" pulse={opData.overdueTasksCount > 0} />
          <AnimatedKpiCard icon={FileText} label="Docs" value={opData.pendingDocsCount} secondaryValue={opData.totalDocsCount} color="text-info" />
          <AnimatedKpiCard icon={Calendar} label="Última Visita" value={opData.lastVisitDate ? formatDistanceToNowStrict(parseISO(opData.lastVisitDate), { locale: ptBR }) : '—'} color="text-muted-foreground" />
          <AnimatedKpiCard icon={Landmark} label="Cadastros" value={opData.activeRegistrationsCount} color="text-primary" />
          <AnimatedKpiCard icon={Clock} label="Dias s/ Mov." value={opData.daysSinceLastVisit ?? '—'} color={opData.daysSinceLastVisit && opData.daysSinceLastVisit > 15 ? 'text-warning' : 'text-muted-foreground'} />
          <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-primary/5 border-primary/10">
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">Próxima Ação:</span>
            <span className="text-xs text-foreground truncate">{opData.nextAction}</span>
          </div>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 gap-0.5">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs">Documentos</TabsTrigger>
          <TabsTrigger value="visits" className="text-xs">Visitas</TabsTrigger>
          {canRead('registration.view') && <TabsTrigger value="registration" className="text-xs">Cadastro</TabsTrigger>}
          <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* KPI summary - operational priority first */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <AnimatedKpiCard icon={BarChart3} label="Total Visitas" value={stats.totalVisits} color="text-info" />
            <AnimatedKpiCard icon={TrendingUp} label="Conversão" value={`${stats.conversionRate}%`} color="text-success" />
            <AnimatedKpiCard icon={Clock} label="Freq. Média" value={stats.avgFrequency ? `${stats.avgFrequency}d` : '—'} color="text-warning" />
            <AnimatedKpiCard icon={DollarSign} label="Potencial" value={stats.totalPotential ? formatCentavos(stats.totalPotential) : '—'} color="text-success" />
          </div>
          <PartnerInsights partner={partner} visits={partnerVisits} stats={stats} />
          {partnerStores.length > 0 && (
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
                        <span>{s.phone}</span><span>• {s.contact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <PartnerCharts visits={partnerVisits} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <PartnerTasksSection partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <PartnerDocuments partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="visits" className="mt-4">
          <PartnerVisitHistory visits={partnerVisits} />
          {partnerVisits.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Calendar className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhuma visita registrada</p>
                {canWrite('agenda.create') && (
                  <Button className="mt-3 gap-2" size="sm" onClick={() => navigate('/agenda')}>
                    <CalendarPlus className="h-3.5 w-3.5" /> Agendar primeira visita
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canRead('registration.view') && (
          <TabsContent value="registration" className="mt-4">
            <PartnerRegistrations partnerId={partnerId} />
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4">
          <PartnerTimeline visits={partnerVisits} partnerId={partnerId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
