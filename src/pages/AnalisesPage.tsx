import { useMemo, useState } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockVisits, mockUsers, mockPartners, getUserById, getPartnerById } from '@/data/mock-data';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, ShieldOff } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

const COLORS = ['hsl(142 76% 36%)', 'hsl(199 89% 48%)', 'hsl(45 93% 47%)', 'hsl(0 84% 60%)', 'hsl(262 83% 58%)'];

export default function AnalisesPage() {
  const [period, setPeriod] = useState('month');
  const { canRead } = usePermission();

  const periodVisits = useMemo(() => {
    const now = new Date();
    return mockVisits.filter(v => {
      const d = new Date(v.date);
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (period === 'week') return diff <= 7 && diff >= 0;
      if (period === 'month') return diff <= 30 && diff >= 0;
      if (period === 'year') return diff <= 365 && diff >= 0;
      return true;
    });
  }, [period]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    periodVisits.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [periodVisits]);

  const userPerformance = useMemo(() => {
    const commercials = mockUsers.filter(u => u.role === 'comercial');
    return commercials.map(u => {
      const userVisits = periodVisits.filter(v => v.userId === u.id);
      const completed = userVisits.filter(v => v.status === 'Concluída').length;
      const total = userVisits.length;
      return {
        name: u.name.split(' ')[0],
        total,
        completed,
        conversion: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [periodVisits]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { visits: number; prospections: number }> = {};
    mockVisits.forEach(v => {
      const month = v.date.substring(0, 7);
      if (!months[month]) months[month] = { visits: 0, prospections: 0 };
      if (v.status === 'Concluída') {
        if (v.type === 'visita') months[month].visits++;
        else months[month].prospections++;
      }
    });
    return Object.entries(months).sort().slice(-6).map(([name, data]) => ({
      name: name.substring(5),
      ...data,
    }));
  }, []);

  const mapPins = useMemo(() => {
    const commercials = mockUsers.filter(u => u.role === 'comercial');
    return commercials.map((u, i) => {
      const userVisits = mockVisits.filter(v => v.userId === u.id && v.status === 'Concluída');
      const visitedPartners = [...new Set(userVisits.map(v => v.partnerId))].map(id => getPartnerById(id)).filter(Boolean);
      return { user: u, partners: visitedPartners, color: COLORS[i % COLORS.length] };
    });
  }, []);

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
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análises</h1>
          <p className="text-muted-foreground text-sm">Métricas e performance da equipe</p>
        </div>
        {canRead('analysis.filterPeriod') && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{periodVisits.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-success">{periodVisits.filter(v => v.status === 'Concluída').length}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-info">{periodVisits.filter(v => v.type === 'visita').length}</p>
          <p className="text-xs text-muted-foreground">Visitas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-warning">{periodVisits.filter(v => v.type === 'prospecção').length}</p>
          <p className="text-xs text-muted-foreground">Prospecções</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendência mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="visits" name="Visitas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="prospections" name="Prospecções" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {canRead('analysis.ranking') && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Performance individual</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Concluídas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {canRead('analysis.partnerMap') && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Mapa de visitas</CardTitle></CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg h-[250px] overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                {mapPins.map((pin, i) => (
                  <div key={pin.user.id} className="absolute" style={{
                    left: `${15 + (i * 18) % 70}%`,
                    top: `${20 + (i * 25) % 60}%`,
                  }}>
                    <div className="relative group">
                      <MapPin className="h-6 w-6 drop-shadow-md cursor-pointer" style={{ color: pin.color }} />
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
    </PageTransition>
  );
}
