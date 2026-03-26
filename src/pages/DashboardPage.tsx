import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/home/HeroSection';
import TodayAgenda from '@/components/home/TodayAgenda';
import VisitMap from '@/components/home/VisitMap';
import CampaignProgress from '@/components/home/CampaignProgress';
import StatusChart from '@/components/home/StatusChart';

export default function DashboardPage() {
  const { profile } = useAuth();
  const isGestor = profile === 'gestor';
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <HeroSection />

      {/* View toggle for gestors */}
      {isGestor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <Button
            size="sm"
            variant={viewMode === 'personal' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setViewMode('personal')}
          >
            <User className="h-3.5 w-3.5 mr-1" /> Minha visão
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'team' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setViewMode('team')}
          >
            <Users className="h-3.5 w-3.5 mr-1" /> Colaboradores
          </Button>
        </motion.div>
      )}

      {/* Agenda + Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <TodayAgenda viewMode={isGestor ? viewMode : 'personal'} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <VisitMap viewMode={isGestor ? viewMode : 'personal'} />
        </motion.div>
      </div>

      {/* Campaign + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <CampaignProgress />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <StatusChart viewMode={isGestor ? viewMode : 'personal'} />
        </motion.div>
      </div>
    </div>
  );
}
