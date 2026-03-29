import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ShieldOff, CalendarIcon, TrendingUp, CheckCircle, Eye, Search, MapPin, BarChart3 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useVisits } from '@/hooks/useVisits';
import { mockUsers, getPartnerById, statusColors, VisitStatus } from '@/data/mock-data';
import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';
import { cn } from '@/lib/utils';
import SmartInsights from '@/components/shared/SmartInsights';
import AnimatedFilterContent from '@/components/shared/AnimatedFilterContent';
import PageHeader from '@/components/shared/PageHeader';

const STATUS_COLORS: Record<string, string> = statusColors;
const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)',
};

export default function AnalisesPage() {
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const { canRead } = usePermission();
  const { visits } = useVisits();

  const periodVisits = useMemo(() => {
    const now = new Date();
    let base = visits.filter(v => {
      const d = new Date(v.date);
      if (period === 'custom' && dateRange.from) {
        const to = dateRange.to || dateRange.from;
        return isWithinInterval(d, { start: startOfDay(dateRange.from), end: endOfDay(to) });
      }
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (period === 'week') return diff <= 7 && diff >= 0;
      if (period === 'month') return diff <= 30 && diff >= 0;
      if (period === 'year') return diff <= 365 && diff >= 0;
      return true;
    });

    // Insight filters
    if (activeInsight === 'anal_tendencia') {
      base = base.filter(v => {
        const diff = (now.getTime() - new Date(v.date).getTime()) / (1000 * 60 * 60 * 24);
        return v.status === 'Concluída' && diff >= 0 && diff <= 30;
      });
    } else if (activeInsight === 'anal_proporcao') {
      base = base.filter(v => v.type === 'visita' || v.type === 'prospecção');
    } else if (activeInsight === 'anal_ticket') {
      base = base.filter(v => (v.potentialValue || 0) > 0);
    }

    return base;
  }, [period, visits, dateRange, activeInsight]);

  const kpis = useMemo(() => {
    const total = periodVisits.length;
    const completed = periodVisits.filter(v => v.status === 'Concluída').length;
    const visitas = periodVisits.filter(v => v.type === 'visita').length;
    const prospections = periodVisits.filter(v => v.type === 'prospecção').length;
    return { total, completed, visitas, prospections, conversion: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [periodVisits]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    periodVisits.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name as VisitStatus] || CHART_COLORS[0] }));
  }, [periodVisits]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { visitas: number; prospecções: number; concluídas: number; total: number }> = {};
    visits.forEach(v => {
      const month = v.date.substring(0, 7);
      if (!months[month]) months[month] = { visitas: 0, prospecções: 0, concluídas: 0, total: 0 };
      months[month].total++;
      if (v.type === 'visita') months[month].visitas++;
      else months[month].prospecções++;
      if (v.status === 'Concluída') months[month].concluídas++;
    });
    return Object.entries(months).sort().slice(-6).map(([key, data]) => ({
      name: format(new Date(key + '-01'), 'MMM', { locale: ptBR }),
      ...data,
    }));
  }, [visits]);

  const userPerformance = useMemo(() => {
    const commercials = mockUsers.filter(u => u.active);
    return commercials.map(u => {
      const uv = periodVisits.filter(v => v.userId === u.id);
      const completed = uv.filter(v => v.status === 'Concluída').length;
      return { name: u.name.split(' ')[0], total: uv.length, completed, conversion: uv.length > 0 ? Math.round((completed / uv.length) * 100) : 0 };
    }).filter(u => u.total > 0).sort((a, b) => b.total - a.total);
  }, [periodVisits]);

  const createdVsCompleted = useMemo(() => {
    const months: Record<string, { criadas: number; concluídas: number }> = {};
    visits.forEach(v => {
      const month = v.date.substring(0, 7);
      if (!months[month]) months[month] = { criadas: 0, concluídas: 0 };
      months[month].criadas++;
      if (v.status === 'Concluída') months[month].concluídas++;
    });
    return Object.entries(months).sort().slice(-6).map(([key, data]) => ({
      name: format(new Date(key + '-01'), 'MMM', { locale: ptBR }),
      ...data,
    }));
  }, [visits]);

  const topPartners = useMemo(() => {
    const counts: Record<string, number> = {};
    periodVisits.forEach(v => {
      if (v.partnerId) counts[v.partnerId] = (counts[v.partnerId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ name: getPartnerById(id)?.name?.split(' ').slice(0, 2).join(' ') || 'N/A', visitas: count }));
  }, [periodVisits]);

  const mapPins = useMemo(() => {
    const commercials = mockUsers.filter(u => u.active);
    return commercials.map((u, i) => {
      const uv = visits.filter(v => v.userId === u.id && v.status === 'Concluída');
      const partners = [...new Set(uv.map(v => v.partnerId))].map(id => getPartnerById(id)).filter(Boolean);
      return { user: u, partners, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
  }, [visits]);

  if (!canRead('analysis.reports')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-8">
      <SmartInsights page="analises" activeFilter={activeInsight} onFilterClick={setActiveInsight} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análises</h1>
          <p className="text-muted-foreground text-sm">Métricas e performance da equipe</p>
        </div>
        {canRead('analysis.filterPeriod') && (
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={v => { setPeriod(v); if (v !== 'custom') setDateRange({}); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateRange.from ? (
                      dateRange.to ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}` : format(dateRange.from, 'dd/MM/yyyy')
                    ) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>

      <AnimatedFilterContent filterKey={activeInsight}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <AnimatedKpiCard icon={BarChart3} label="Total" value={kpis.total} color="text-foreground" delay={0} />
        <AnimatedKpiCard icon={CheckCircle} label="Concluídas" value={kpis.completed} color="text-success" delay={0.1} />
        <AnimatedKpiCard icon={Eye} label="Visitas" value={kpis.visitas} color="text-info" delay={0.2} />
        <AnimatedKpiCard icon={Search} label="Prospecções" value={kpis.prospections} color="text-warning" delay={0.3} />
      </div>

      {/* Conversion badge */}
      {kpis.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">Taxa de conversão:</span>
          <Badge variant="secondary" className="font-bold tabular-nums">{kpis.conversion}%</Badge>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendência mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="visitas" name="Visitas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="prospecções" name="Prospecções" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="concluídas" name="Concluídas" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution - Donut */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: s.fill }} />
                    <span className="text-muted-foreground truncate">{s.name}</span>
                    <span className="ml-auto font-medium tabular-nums">{s.value}</span>
                    <span className="text-xs text-muted-foreground">
                      ({kpis.total > 0 ? Math.round((s.value / kpis.total) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Created vs Completed */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Criadas vs Concluídas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={createdVsCompleted}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="criadas" name="Criadas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluídas" name="Concluídas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Partners */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top parceiros visitados</CardTitle></CardHeader>
          <CardContent>
            {topPartners.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Nenhum dado no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topPartners} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="visitas" name="Visitas" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Individual Performance */}
        {canRead('analysis.ranking') && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Performance individual</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: string, item: any) => {
                      if (name === 'Total') return [value, name];
                      return [`${value} (${item.payload.conversion}%)`, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Concluídas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Visit Map */}
        {canRead('analysis.partnerMap') && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Mapa de visitas</CardTitle></CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg h-[280px] overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                {mapPins.map((pin, i) => (
                  <div key={pin.user.id} className="absolute" style={{ left: `${15 + (i * 18) % 70}%`, top: `${20 + (i * 25) % 60}%` }}>
                    <div className="relative group">
                      <MapPin className="h-6 w-6 drop-shadow-md cursor-pointer transition-transform group-hover:scale-125" style={{ color: pin.color }} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border rounded-lg p-2 shadow-lg text-xs whitespace-nowrap z-10">
                        <p className="font-medium">{pin.user.name}</p>
                        <p className="text-muted-foreground">{pin.partners.length} parceiros visitados</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  {mapPins.map(pin => (
                    <div key={pin.user.id} className="flex items-center gap-2 text-[10px]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pin.color }} />
                      <span>{pin.user.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </AnimatedFilterContent>
    </PageTransition>
  );
}
