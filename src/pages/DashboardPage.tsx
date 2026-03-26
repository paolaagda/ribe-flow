import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, User, CheckCircle, Clock, TrendingUp, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVisits } from '@/hooks/useVisits';
import { useTeamFilter } from '@/hooks/useTeamFilter';
import HeroSection from '@/components/home/HeroSection';
import TodayAgenda from '@/components/home/TodayAgenda';
import VisitMap from '@/components/home/VisitMap';
import CampaignProgress from '@/components/home/CampaignProgress';
import StatusChart from '@/components/home/StatusChart';
import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const isGestor = profile === 'gestor';
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const { visits } = useVisits();
  const { getVisibleUserIds } = useTeamFilter();

  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const userIds = viewMode === 'team' ? getVisibleUserIds() : [user?.id];
    const filtered = visits.filter(v => userIds.includes(v.userId));
    const todayVisits = filtered.filter(v => v.date === today);
    const completed = todayVisits.filter(v => v.status === 'Concluída').length;
    const pending = todayVisits.filter(v => v.status === 'Planejada').length;
    const total = todayVisits.length;
    return {
      today: total,
      completed,
      pending,
      conversion: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [visits, viewMode, user, getVisibleUserIds]);

  return (
    <div className="space-y-6">
      <HeroSection />

      {/* Mini-KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnimatedKpiCard icon={CalendarDays} label="Agendas hoje" value={kpis.today} color="text-info" delay={0.1} />
        <AnimatedKpiCard icon={CheckCircle} label="Concluídas" value={kpis.completed} color="text-success" delay={0.15} />
        <AnimatedKpiCard icon={Clock} label="Pendentes" value={kpis.pending} color="text-warning" delay={0.2} />
        <AnimatedKpiCard icon={TrendingUp} label="Conversão" value={kpis.conversion} suffix="%" color="text-primary" delay={0.25} />
      </div>

      {/* View toggle for gestors */}
      {isGestor && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-2">
          <Button size="sm" variant={viewMode === 'personal' ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => setViewMode('personal')}>
            <User className="h-3.5 w-3.5 mr-1" /> Minha visão
          </Button>
          <Button size="sm" variant={viewMode === 'team' ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => setViewMode('team')}>
            <Users className="h-3.5 w-3.5 mr-1" /> Colaboradores
          </Button>
        </motion.div>
      )}

      {/* Agenda + Map */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodayAgenda viewMode={isGestor ? viewMode : 'personal'} />
            <VisitMap viewMode={isGestor ? viewMode : 'personal'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CampaignProgress />
            <StatusChart viewMode={isGestor ? viewMode : 'personal'} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
