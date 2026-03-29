import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Handshake, UserPlus, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockVisits } from '@/data/mock-data';
import { initialCampaigns, getCampaignStatus, getCompletedVisitsForUser } from '@/data/campaigns';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Campaign } from '@/data/campaigns';

const motivationalPhrases = [
  "Hoje é um ótimo dia para abrir novas portas.",
  "Cada visita é uma oportunidade disfarçada.",
  "Bora bater meta e subir no ranking!",
  "O sucesso é a soma de pequenos esforços diários.",
  "Sua próxima grande conquista pode ser hoje.",
  "Consistência é o segredo dos campeões.",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HeroSection() {
  const { user } = useAuth();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [campaigns] = useLocalStorage<Campaign[]>('ribercred_campaigns', initialCampaigns);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % motivationalPhrases.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const isCommercial = user?.profile === 'nao_gestor';
    const userVisits = isCommercial && user
      ? mockVisits.filter(v => v.userId === user.id || v.createdBy === user.id || v.invitedUsers?.some(iu => iu.userId === user.id && iu.status === 'accepted'))
      : mockVisits;

    const visitasConcluidas = userVisits.filter(v => v.type === 'visita' && v.status === 'Concluída').length;
    const prospecoesConcluidas = userVisits.filter(v => v.type === 'prospecção' && v.status === 'Concluída').length;

    const activeCampaign = campaigns.find(c => getCampaignStatus(c) === 'Ativa');
    let campaignProgress = 0;
    if (activeCampaign && user) {
      const participant = activeCampaign.participants.find(p => p.userId === user.id);
      if (participant) {
        const completed = getCompletedVisitsForUser(user.id, activeCampaign.startDate, activeCampaign.endDate);
        campaignProgress = Math.min(100, Math.round((completed / participant.visitGoal) * 100));
      }
    }

    return { visitasConcluidas, prospecoesConcluidas, campaignProgress };
  }, [user, campaigns]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="border-border/40 overflow-hidden relative gradient-primary">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-primary/3 translate-y-1/2 blur-xl pointer-events-none" />
        
        <CardContent className="p-ds-md relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-ds-sm">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <Avatar className="h-16 w-16 border-2 border-primary/15 shadow-[var(--shadow-lg)] ring-4 ring-primary/5">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <h1 className="text-ds-xl font-bold text-foreground tracking-tight">
                {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="text-muted-foreground text-ds-sm italic"
                >
                  "{motivationalPhrases[phraseIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-3 text-ds-sm">
              <div className="stat-chip gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-info/12 flex items-center justify-center">
                  <Handshake className="h-4 w-4 text-info" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold tabular-nums text-ds-sm leading-tight">{stats.visitasConcluidas}</span>
                  <span className="text-muted-foreground text-ds-xs">visitas</span>
                </div>
              </div>
              <div className="stat-chip gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-warning/12 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-warning" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold tabular-nums text-ds-sm leading-tight">{stats.prospecoesConcluidas}</span>
                  <span className="text-muted-foreground text-ds-xs">prospecções</span>
                </div>
              </div>
              {stats.campaignProgress > 0 && (
                <div className="stat-chip min-w-[140px]">
                  <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  </div>
                  <Progress value={stats.campaignProgress} className="h-2 flex-1" />
                  <span className="font-bold tabular-nums text-ds-xs">{stats.campaignProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
