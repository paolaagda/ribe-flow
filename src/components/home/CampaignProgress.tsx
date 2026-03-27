import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Medal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  initialCampaigns, getCampaignStatus, getCompletedVisitsForUser,
  getCompletedProspectionsForUser, calculateUserScore, getGamificationConfig,
} from '@/data/campaigns';
import { mockUsers } from '@/data/mock-data';
import type { Campaign } from '@/data/campaigns';

export default function CampaignProgress() {
  const { user } = useAuth();
  const [campaigns] = useLocalStorage<Campaign[]>('ribercred_campaigns', initialCampaigns);

  const activeCampaign = useMemo(() => campaigns.find(c => getCampaignStatus(c) === 'Ativa'), [campaigns]);

  const progress = useMemo(() => {
    if (!activeCampaign || !user) return null;
    const participant = activeCampaign.participants.find(p => p.userId === user.id);
    if (!participant) return null;

    const visits = getCompletedVisitsForUser(user.id, activeCampaign.startDate, activeCampaign.endDate);
    const prospections = getCompletedProspectionsForUser(user.id, activeCampaign.startDate, activeCampaign.endDate);
    const visitPct = Math.min(100, Math.round((visits / participant.visitGoal) * 100));
    const prospPct = Math.min(100, Math.round((prospections / participant.prospectionGoal) * 100));

    return { visits, prospections, visitGoal: participant.visitGoal, prospectionGoal: participant.prospectionGoal, visitPct, prospPct };
  }, [activeCampaign, user]);

  const ranking = useMemo(() => {
    if (!activeCampaign) return [];
    return activeCampaign.participants
      .map(p => {
        const u = mockUsers.find(mu => mu.id === p.userId);
        const score = calculateUserScore(activeCampaign, p.userId);
        return { userId: p.userId, name: u?.name || '?', score, goal: p.visitGoal };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [activeCampaign]);

  const userPosition = useMemo(() => {
    if (!activeCampaign || !user) return null;
    const sorted = activeCampaign.participants
      .map(p => ({
        userId: p.userId,
        score: calculateUserScore(activeCampaign, p.userId),
      }))
      .sort((a, b) => b.score - a.score);
    const idx = sorted.findIndex(s => s.userId === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [activeCampaign, user]);

  if (!activeCampaign) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Campanha ativa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Target className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma campanha ativa no momento</p>
        </CardContent>
      </Card>
    );
  }

  const metaAtingida = progress && progress.visitPct >= 100;

  return (
    <Card className={metaAtingida ? 'ring-2 ring-success/30' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4" /> {activeCampaign.name}
          {metaAtingida && <Badge className="bg-success text-success-foreground ml-auto">🎉 Meta atingida!</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{activeCampaign.startDate} — {activeCampaign.endDate}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Visitas</span>
                <span className="font-semibold tabular-nums">{progress.visits}/{progress.visitGoal}</span>
              </div>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ transformOrigin: 'left' }}>
                <Progress value={progress.visitPct} className="h-2" />
              </motion.div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Prospecções</span>
                <span className="font-semibold tabular-nums">{progress.prospections}/{progress.prospectionGoal}</span>
              </div>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} style={{ transformOrigin: 'left' }}>
                <Progress value={progress.prospPct} className="h-2" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Mini ranking by score */}
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Medal className="h-3 w-3" /> Top 3
          </p>
          {ranking.map((r, i) => (
            <motion.div
              key={r.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-2 text-sm ${r.userId === user?.id ? 'font-semibold' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === 0 ? 'bg-primary text-primary-foreground' :
                i === 1 ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </span>
              <span className="truncate flex-1">{r.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{r.score} pts</span>
            </motion.div>
          ))}
          {userPosition && userPosition > 3 && (
            <p className="text-xs text-muted-foreground ml-7">Você está em {userPosition}º lugar</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
