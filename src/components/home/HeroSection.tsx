import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Handshake, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { initialCampaigns, getCampaignStatus, getCompletedVisitsForUser, getCompletedProspectionsForUser } from '@/data/campaigns';
import { mockVisits } from '@/data/mock-data';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % motivationalPhrases.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const campaignProgress = useMemo(() => {
    const activeCampaign = initialCampaigns.find(c => getCampaignStatus(c) === 'Ativa');
    if (!activeCampaign || !user) return null;
    const participant = activeCampaign.participants.find(p => p.userId === user.id);
    if (!participant) return null;
    const visits = getCompletedVisitsForUser(user.id, activeCampaign.startDate, activeCampaign.endDate);
    const prospections = getCompletedProspectionsForUser(user.id, activeCampaign.startDate, activeCampaign.endDate);
    return {
      visits,
      visitGoal: participant.visitGoal,
      visitPercent: participant.visitGoal > 0 ? Math.round((visits / participant.visitGoal) * 100) : 0,
      prospections,
      prospectionGoal: participant.prospectionGoal,
      prospectionPercent: participant.prospectionGoal > 0 ? Math.round((prospections / participant.prospectionGoal) * 100) : 0,
    };
  }, [user]);

  const fallbackStats = useMemo(() => {
    if (campaignProgress) return null;
    const isRestricted = user && ['comercial', 'cadastro'].includes(user.role);
    const userVisits = isRestricted && user
      ? mockVisits.filter(v => v.userId === user.id || v.createdBy === user.id || v.invitedUsers?.some(iu => iu.userId === user.id && iu.status === 'accepted'))
      : mockVisits;
    return {
      visitasConcluidas: userVisits.filter(v => v.type === 'visita' && v.status === 'Concluída').length,
      prospecoesConcluidas: userVisits.filter(v => v.type === 'prospecção' && v.status === 'Concluída').length,
    };
  }, [user, campaignProgress]);

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
          <div className="flex flex-col md:flex-row items-start md:items-center gap-ds-sm">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <Avatar className="h-16 w-16 border-2 border-primary/15 shadow-[var(--shadow-lg)] ring-4 ring-primary/5">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
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
              {/* Visitas */}
              <div className="stat-chip gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-info/12 flex items-center justify-center">
                  <Handshake className="h-4 w-4 text-info" />
                </div>
                <div className="flex flex-col min-w-[72px]">
                  <span className="font-bold tabular-nums text-ds-sm leading-tight">
                    {campaignProgress ? `${campaignProgress.visits} / ${campaignProgress.visitGoal}` : fallbackStats?.visitasConcluidas ?? 0}
                  </span>
                  <span className="text-muted-foreground text-ds-xs">visitas</span>
                  {campaignProgress && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700 ease-out',
                            campaignProgress.visitPercent >= 100 ? 'bg-success' : campaignProgress.visitPercent >= 60 ? 'bg-primary' : 'bg-warning',
                          )}
                          style={{ width: `${Math.min(campaignProgress.visitPercent, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-[9px] font-semibold tabular-nums whitespace-nowrap',
                        campaignProgress.visitPercent >= 100 ? 'text-success' : campaignProgress.visitPercent >= 60 ? 'text-primary' : 'text-warning',
                      )}>
                        {campaignProgress.visitPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Prospecções */}
              <div className="stat-chip gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-warning/12 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-warning" />
                </div>
                <div className="flex flex-col min-w-[72px]">
                  <span className="font-bold tabular-nums text-ds-sm leading-tight">
                    {campaignProgress ? `${campaignProgress.prospections} / ${campaignProgress.prospectionGoal}` : fallbackStats?.prospecoesConcluidas ?? 0}
                  </span>
                  <span className="text-muted-foreground text-ds-xs">prospecções</span>
                  {campaignProgress && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700 ease-out',
                            campaignProgress.prospectionPercent >= 100 ? 'bg-success' : campaignProgress.prospectionPercent >= 60 ? 'bg-primary' : 'bg-warning',
                          )}
                          style={{ width: `${Math.min(campaignProgress.prospectionPercent, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-[9px] font-semibold tabular-nums whitespace-nowrap',
                        campaignProgress.prospectionPercent >= 100 ? 'text-success' : campaignProgress.prospectionPercent >= 60 ? 'text-primary' : 'text-warning',
                      )}>
                        {campaignProgress.prospectionPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
