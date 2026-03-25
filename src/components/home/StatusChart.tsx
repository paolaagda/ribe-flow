import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { mockVisits, statusColors, VisitStatus } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamFilter } from '@/hooks/useTeamFilter';

type Period = 'today' | 'week' | 'month';

const periodLabels: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
};

const COLORS: Record<VisitStatus, string> = statusColors;

interface StatusChartProps {
  viewMode: 'personal' | 'team';
}

export default function StatusChart({ viewMode }: StatusChartProps) {
  const { user } = useAuth();
  const { getVisibleUserIds } = useTeamFilter();
  const [period, setPeriod] = useState<Period>('month');

  const data = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const filtered = mockVisits.filter(v => {
      if (viewMode === 'personal' && v.userId !== user?.id) return false;
      if (viewMode === 'team' && !getVisibleUserIds.includes(v.userId)) return false;

      if (period === 'today') return v.date === today;
      if (period === 'week') {
        const d = new Date(v.date);
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo && d <= now;
      }
      const d = new Date(v.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const counts: Record<VisitStatus, number> = {
      Planejada: 0, Concluída: 0, Reagendada: 0, Cancelada: 0,
    };
    filtered.forEach(v => { counts[v.status]++; });

    return (Object.entries(counts) as [VisitStatus, number][])
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value, color: COLORS[name] }));
  }, [period, user, viewMode, getVisibleUserIds]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Distribuição por status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4">
          {(Object.keys(periodLabels) as Period[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              className="h-7 text-xs"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {total === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para este período
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {data.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${Math.round((value / total) * 100)}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {total > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-semibold tabular-nums ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
