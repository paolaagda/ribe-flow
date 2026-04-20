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
import { getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { formatCentavos } from '@/lib/currency';
import {
  ArrowLeft, Building2, MapPin, Phone, User, Calendar,
  TrendingUp, BarChart3, Clock, CalendarPlus, CalendarRange,
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
import { Criticality } from '@/hooks/usePartnerOperationalData';
import { format as formatDate, parseISO } from 'date-fns';
import NewVisitDialog from './NewVisitDialog';

interface Props {
  partnerId: string;
  onBack: () => void;
}

const potentialConfig = {
  alto: { color: 'text-success', bg: 'bg-success/10 border-success/20' },
  médio: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  baixo: { color: 'text-muted-foreground', bg: 'bg-muted/50 border-muted-foreground/20' },
};

const criticalityConfig: Record<Criticality, { label: string; className: string; bar: string; tile: string }> = {
  alta: {
    label: 'Crítico',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    bar: 'from-destructive/80 via-destructive/50 to-destructive/20',
    tile: 'bg-destructive/10 text-destructive',
  },
  média: {
    label: 'Atenção',
    className: 'bg-warning/10 text-warning border-warning/20',
    bar: 'from-warning/80 via-warning/50 to-warning/20',
    tile: 'bg-warning/10 text-warning',
  },
  baixa: {
    label: 'Regular',
    className: 'bg-success/10 text-success border-success/20',
    bar: 'from-success/80 via-success/50 to-success/20',
    tile: 'bg-success/10 text-success',
  },
};

// KPI card with lateral tonal bar — standard pattern from Agenda/Parceiros/Cadastro/Campanhas
interface KpiProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  tone: 'info' | 'warning' | 'success' | 'primary' | 'muted' | 'destructive';
  pulse?: boolean;
}

const toneMap = {
  info: { bar: 'from-info/70 via-info/40 to-info/10', tile: 'bg-info/10 text-info', text: 'text-info' },
  warning: { bar: 'from-warning/70 via-warning/40 to-warning/10', tile: 'bg-warning/10 text-warning', text: 'text-warning' },
  success: { bar: 'from-success/70 via-success/40 to-success/10', tile: 'bg-success/10 text-success', text: 'text-success' },
  primary: { bar: 'from-primary/70 via-primary/40 to-primary/10', tile: 'bg-primary/10 text-primary', text: 'text-primary' },
  muted: { bar: 'from-muted-foreground/40 via-muted-foreground/20 to-muted-foreground/5', tile: 'bg-muted text-muted-foreground', text: 'text-foreground' },
  destructive: { bar: 'from-destructive/70 via-destructive/40 to-destructive/10', tile: 'bg-destructive/10 text-destructive', text: 'text-destructive' },
};

function DetailKpiCard({ icon: Icon, label, value, secondaryValue, tone, pulse }: KpiProps) {
  const t = toneMap[tone];
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b', t.bar)} />
      <div className="flex items-start gap-2.5 pl-1.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', t.tile, pulse && 'animate-pulse')}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">{label}</p>
          <p className={cn('text-base font-bold leading-tight mt-0.5 truncate', t.text)}>
            {value}
            {secondaryValue !== undefined && (
              <span className="text-xs font-normal text-muted-foreground ml-1">/ {secondaryValue}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PartnerDetailView({ partnerId, onBack }: Props) {
  const { getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { getStoresByPartnerId } = useStores();
  const { canWrite, canRead } = usePermission();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showNewVisit, setShowNewVisit] = useState(false);

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
    const visitsWithPotential = partnerVisits.filter(v => v.type === 'visita' && (v.potentialValue || 0) > 0);
    const avgPotential = visitsWithPotential.length > 0
      ? Math.round(visitsWithPotential.reduce((sum, v) => sum + (v.potentialValue || 0), 0) / visitsWithPotential.length)
      : 0;
    return { completed, prospections, totalVisits, lastVisit, avgFrequency, conversionRate, banks, products, avgPotential, topStatus: '' };
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

  // Choose identity bar tone based on criticality (falls back to primary)
  const identityBar = cc?.bar ?? 'from-primary/70 via-primary/40 to-primary/10';
  const identityTile = cc?.tile ?? 'bg-primary/10 text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2 hover:bg-muted/60">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate('/agenda')}>
            <CalendarRange className="h-3.5 w-3.5" /> Ver agenda
          </Button>
          {canWrite('agenda.create') && (
            <Button size="sm" className="gap-1.5 text-xs h-8 shadow-sm" onClick={() => setShowNewVisit(true)}>
              <CalendarPlus className="h-3.5 w-3.5" /> Nova visita
            </Button>
          )}
        </div>
      </div>

      {/* Partner Identity Card — refined with lateral bar + larger tile */}
      <Card className="relative overflow-hidden border-border/60 shadow-sm">
        <div className={cn('absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b', identityBar)} />
        <CardContent className="p-4 sm:p-6 pl-5 sm:pl-7 space-y-4">
          {/* Row 1: Avatar + Name/CNPJ + Badges */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-border/40', identityTile)}>
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-bold leading-tight tracking-tight">{partner.name}</h2>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={cn(
                  'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
                  partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
                  partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
                  partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-muted text-muted-foreground border-muted-foreground/20'
                )}>{partner.partnerClass}</Badge>
                {cc && <Badge variant="outline" className={cn('text-[10px] font-medium', cc.className)}>{cc.label}</Badge>}
                <Badge variant="outline" className={cn('text-[10px] capitalize font-medium', pc.color, pc.bg)}>Potencial {partner.potential}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{partner.razaoSocial} • {partner.cnpj}</p>
              <div className="pt-1">
                <PartnerProductionEditor partner={partner} />
              </div>
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Row 2: Contact info — refined grid with subtle icon tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="truncate text-muted-foreground">{partner.address}</span>
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">{partner.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground truncate">Contato: <span className="text-foreground font-medium">{partner.contact}</span></span>
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-muted-foreground truncate">Comercial: <span className="text-foreground font-medium">{responsible?.name || '—'}</span></span>
            </div>
          </div>

          {/* Row 3: Structure tags */}
          {partner.structures.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {partner.structures.map(s => (
                <Badge key={s} variant="secondary" className="text-[10px] font-medium bg-muted/60 hover:bg-muted/80 transition-colors">{s}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Summary KPIs — lateral tonal bars, official pattern */}
      {opData && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <DetailKpiCard
              icon={CheckSquare}
              label="Tarefas"
              value={opData.pendingTasksCount}
              tone="warning"
              pulse={opData.overdueTasksCount > 0}
            />
            <DetailKpiCard
              icon={FileText}
              label="Documentos"
              value={opData.pendingDocsCount}
              secondaryValue={opData.totalDocsCount}
              tone="info"
            />
            <DetailKpiCard
              icon={Calendar}
              label="Última Visita"
              value={opData.lastVisitDate ? formatDate(parseISO(opData.lastVisitDate), 'dd/MM/yyyy') : '—'}
              tone="muted"
            />
            <DetailKpiCard
              icon={Landmark}
              label="Cadastros"
              value={opData.activeRegistrationsCount}
              tone="primary"
            />
            <DetailKpiCard
              icon={Clock}
              label="Dias s/ Visita"
              value={opData.daysSinceLastVisit ?? '—'}
              tone={opData.daysSinceLastVisit && opData.daysSinceLastVisit > 15 ? 'destructive' : 'muted'}
            />
          </div>

          {/* Próxima Ação — refined banner */}
          <div className="relative overflow-hidden flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/70 via-primary/40 to-primary/10" />
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 ml-1">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary shrink-0">Próxima Ação</span>
            <span className="text-xs text-foreground truncate font-medium">{opData.nextAction}</span>
          </div>
        </div>
      )}

      {/* Tabbed Content — refined with elevated active state */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="bg-muted/30 border border-border/60 rounded-lg p-1">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-0 gap-0.5 bg-transparent">
            <TabsTrigger
              value="overview"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
            >Visão Geral</TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
            >Tarefas</TabsTrigger>
            <TabsTrigger
              value="docs"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
            >Documentos</TabsTrigger>
            <TabsTrigger
              value="visits"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
            >Visitas</TabsTrigger>
            {canRead('registration.view') && (
              <TabsTrigger
                value="registration"
                className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
              >Cadastro</TabsTrigger>
            )}
            <TabsTrigger
              value="history"
              className="text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium"
            >Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* KPI summary — lateral tonal bar pattern */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <DetailKpiCard icon={BarChart3} label="Total Visitas" value={stats.totalVisits} tone="info" />
            <DetailKpiCard icon={TrendingUp} label="Conversão" value={`${stats.conversionRate}%`} tone="success" />
            <DetailKpiCard icon={Clock} label="Freq. Média" value={stats.avgFrequency ? `${stats.avgFrequency}d` : '—'} tone="warning" />
            <DetailKpiCard icon={DollarSign} label="Potencial Médio" value={stats.avgPotential ? formatCentavos(stats.avgPotential) : '—'} tone="success" />
          </div>
          <PartnerInsights partner={partner} visits={partnerVisits} stats={stats} />
          {partnerStores.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 bg-muted/30 border-b border-border/60 rounded-t-lg">
                <CardTitle className="text-sm flex items-center gap-2 font-semibold">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Store className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Lojas
                  <Badge variant="secondary" className="ml-1 text-[10px] font-medium">{partnerStores.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {partnerStores.map(s => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
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
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 opacity-60" />
                </div>
                <p className="text-sm font-medium">Nenhuma visita registrada</p>
                {canWrite('agenda.create') && (
                  <Button className="mt-3 gap-2 shadow-sm" size="sm" onClick={() => navigate('/agenda')}>
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

      {/* New Visit Dialog */}
      {partner && (
        <NewVisitDialog
          open={showNewVisit}
          onOpenChange={setShowNewVisit}
          partner={partner}
        />
      )}
    </motion.div>
  );
}
