import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Visit, statusColors } from '@/data/mock-data';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface Props {
  visits: Visit[];
}

export default function PartnerCharts({ visits }: Props) {
  const { byMonth, byStatus, byType, frequencyData } = useMemo(() => {
    // By month
    const monthMap: Record<string, number> = {};
    visits.forEach(v => {
      const m = v.date.slice(0, 7); // YYYY-MM
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    const byMonth = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month: month.slice(5), count }));

    // By status
    const statusMap: Record<string, number> = {};
    visits.forEach(v => { statusMap[v.status] = (statusMap[v.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap).map(([name, value]) => ({
      name, value, fill: statusColors[name as keyof typeof statusColors] || 'hsl(var(--primary))'
    }));

    // By type
    const typeMap: Record<string, number> = {};
    visits.forEach(v => { typeMap[v.type] = (typeMap[v.type] || 0) + 1; });
    const byType = Object.entries(typeMap).map(([name, value]) => ({
      name: name === 'visita' ? 'Visita' : 'Prospecção', value,
      fill: name === 'visita' ? 'hsl(199 89% 48%)' : 'hsl(262 83% 58%)'
    }));

    // Frequency over time (cumulative visits by date)
    const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date));
    const frequencyData = sorted.map((v, i) => ({ date: v.date.slice(5), total: i + 1 }));

    return { byMonth, byStatus, byType, frequencyData };
  }, [visits]);

  if (visits.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Gráficos e Análises
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visits by month */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Visitas por mês</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byMonth}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status distribution */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Distribuição por status</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Visit vs Prospection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Visita vs Prospecção</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {byType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Frequency over time */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Evolução de frequência</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={frequencyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
