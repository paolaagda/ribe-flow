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

    return {
      visitasConcluidas,
      prospecoesConcluidas,
      campaignProgress,
    };
  }, [user, campaigns]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex-1 min-w-0 space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="text-muted-foreground text-sm italic"
                >
                  "{motivationalPhrases[phraseIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-info" />
                <span className="font-semibold tabular-nums">{stats.visitasConcluidas}</span>
                <span className="text-muted-foreground">visitas</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-warning" />
                <span className="font-semibold tabular-nums">{stats.prospecoesConcluidas}</span>
                <span className="text-muted-foreground">prospecções</span>
              </div>
              {stats.campaignProgress > 0 && (
                <div className="flex items-center gap-2 min-w-[120px]">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <Progress value={stats.campaignProgress} className="h-2 flex-1" />
                  <span className="font-semibold tabular-nums text-xs">{stats.campaignProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
