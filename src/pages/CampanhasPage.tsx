import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { mockVisits, mockUsers, getUserById } from '@/data/mock-data';
import {
  Campaign, initialCampaigns, getCampaignStatus,
  getCompletedVisitsForUser, getCompletedProspectionsForUser,
  getCancelledVisitsForUser, calculateUserScore, getGamificationConfig,
  getUserScoreBreakdown,
} from '@/data/campaigns';
import { Trophy, Flame, Medal, Star, TrendingUp, ShieldOff, Award, Ban, Gamepad2, CheckCircle2, Target, Calendar, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const podiumColors = [
  '',
  'from-yellow-400/30 to-yellow-600/10 border-yellow-500/40',
  'from-slate-300/30 to-slate-400/10 border-slate-400/40',
  'from-amber-600/20 to-amber-800/10 border-amber-700/30',
];
const medalColors = ['', 'text-yellow-500', 'text-slate-400', 'text-amber-700'];

export default function CampanhasPage() {
  const { user } = useAuth();
  const { canRead } = usePermission();
  const { toast } = useToast();
  const [campaigns] = useLocalStorage<Campaign[]>('ribercred_campaigns', initialCampaigns);
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage<Record<string, string[]>>('ribercred_badges', {});
  const confettiFired = useRef(false);

  const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Filter out future campaigns from selectable list
  const selectableCampaigns = useMemo(() => campaigns.filter(c => getCampaignStatus(c) !== 'Futura'), [campaigns]);
  const activeCampaign = useMemo(() => campaigns.find(c => getCampaignStatus(c) === 'Ativa'), [campaigns]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(activeCampaign?.id || selectableCampaigns[0]?.id || '');

  const selectedCampaign = useMemo(() => campaigns.find(c => c.id === selectedCampaignId) || null, [campaigns, selectedCampaignId]);
  const config = useMemo(() => selectedCampaign ? getGamificationConfig(selectedCampaign) : null, [selectedCampaign]);

  // Commercial filter (only for non-comercial roles)
  const isComercial = user?.role === 'comercial';
  const canFilterUsers = !isComercial && ['diretor', 'gerente', 'ascom', 'cadastro'].includes(user?.role || '');
  const [filterUserId, setFilterUserId] = useState<string>('all');

  // Ranking
  const allCommercials = useMemo(() => mockUsers.filter(u => u.role === 'comercial' && u.active), []);

  const ranking = useMemo(() => {
    if (!selectedCampaign) return [];
    return selectedCampaign.participants
      .map(p => {
        const u = getUserById(p.userId);
        if (!u) return null;
        const visits = getCompletedVisitsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
        const prospections = getCompletedProspectionsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
        const cancellations = getCancelledVisitsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
        const score = calculateUserScore(selectedCampaign, p.userId);
        return { user: u, visits, prospections, cancellations, score, visitGoal: p.visitGoal, prospectionGoal: p.prospectionGoal };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as { user: typeof allCommercials[0]; visits: number; prospections: number; cancellations: number; score: number; visitGoal: number; prospectionGoal: number }[];
  }, [selectedCampaign, allCommercials]);

  // My stats
  const myStats = useMemo(() => {
    if (!user) return null;
    return ranking.find(r => r.user.id === user.id) || null;
  }, [user, ranking]);

  const myPosition = ranking.findIndex(r => r.user.id === user?.id) + 1;

  // Streak
  const streak = useMemo(() => {
    if (!user) return 0;
    const userVisits = mockVisits.filter(v => v.userId === user.id && v.status === 'Concluída').map(v => v.date).sort().reverse();
    if (userVisits.length === 0) return 0;
    const uniqueDates = [...new Set(userVisits)];
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) { count++; } else if (i > 0) { break; }
    }
    return count;
  }, [user]);

  // KPIs
  const kpis = useMemo(() => {
    if (!selectedCampaign) return null;
    const participants = filterUserId === 'all'
      ? selectedCampaign.participants
      : selectedCampaign.participants.filter(p => p.userId === filterUserId);

    let totalVisits = 0, totalVisitGoal = 0, totalProsp = 0, totalProspGoal = 0, totalCancel = 0, totalScore = 0;
    participants.forEach(p => {
      totalVisits += getCompletedVisitsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
      totalProsp += getCompletedProspectionsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
      totalCancel += getCancelledVisitsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate);
      totalScore += calculateUserScore(selectedCampaign, p.userId);
      totalVisitGoal += p.visitGoal;
      totalProspGoal += p.prospectionGoal;
    });
    const totalGoal = totalVisitGoal + totalProspGoal;
    const totalDone = totalVisits + totalProsp;
    const rate = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;
    return { totalVisits, totalVisitGoal, totalProsp, totalProspGoal, totalCancel, totalScore, rate };
  }, [selectedCampaign, filterUserId]);

  // Achievements
  const achievements = useMemo(() => {
    if (!selectedCampaign || !config || !user) return [];
    const userId = isComercial ? user.id : (filterUserId !== 'all' ? filterUserId : user.id);
    const participant = selectedCampaign.participants.find(p => p.userId === userId);
    if (!participant) return [];

    const visits = getCompletedVisitsForUser(userId, selectedCampaign.startDate, selectedCampaign.endDate);
    const prospections = getCompletedProspectionsForUser(userId, selectedCampaign.startDate, selectedCampaign.endDate);

    return [
      { id: 'first_visit', name: 'Primeira Visita', description: 'Complete sua primeira visita', icon: <Star className="h-4 w-4" />, progress: Math.min(1, visits), goal: 1, done: visits >= 1, reward: config.achievements.firstVisitReward },
      { id: 'first_prosp', name: 'Primeira Prospecção', description: 'Complete sua primeira prospecção', icon: <Star className="h-4 w-4" />, progress: Math.min(1, prospections), goal: 1, done: prospections >= 1, reward: config.achievements.firstProspectionReward },
      { id: 'visit_milestone', name: `${config.achievements.visitMilestone} Visitas`, description: `Complete ${config.achievements.visitMilestone} visitas`, icon: <Trophy className="h-4 w-4" />, progress: Math.min(visits, config.achievements.visitMilestone), goal: config.achievements.visitMilestone, done: visits >= config.achievements.visitMilestone, reward: config.achievements.visitReward },
      { id: 'prosp_milestone', name: `${config.achievements.prospectionMilestone} Prospecções`, description: `Complete ${config.achievements.prospectionMilestone} prospecções`, icon: <Medal className="h-4 w-4" />, progress: Math.min(prospections, config.achievements.prospectionMilestone), goal: config.achievements.prospectionMilestone, done: prospections >= config.achievements.prospectionMilestone, reward: config.achievements.prospectionReward },
      { id: 'full_visit_goal', name: '100% Visitas', description: `Atinja sua meta de ${participant.visitGoal} visitas`, icon: <Target className="h-4 w-4" />, progress: Math.min(visits, participant.visitGoal), goal: participant.visitGoal, done: visits >= participant.visitGoal, reward: 0 },
      { id: 'full_prosp_goal', name: '100% Prospecções', description: `Atinja sua meta de ${participant.prospectionGoal} prospecções`, icon: <Target className="h-4 w-4" />, progress: Math.min(prospections, participant.prospectionGoal), goal: participant.prospectionGoal, done: prospections >= participant.prospectionGoal, reward: 0 },
      { id: 'full_goal', name: '100% Meta Geral', description: 'Atinja todas as metas da campanha', icon: <Award className="h-4 w-4" />, progress: (visits >= participant.visitGoal && prospections >= participant.prospectionGoal) ? 1 : 0, goal: 1, done: visits >= participant.visitGoal && prospections >= participant.prospectionGoal, reward: config.achievements.fullGoalReward },
    ];
  }, [selectedCampaign, config, user, filterUserId, isComercial]);

  // Unlock badges effect
  useEffect(() => {
    if (!user || achievements.length === 0) return;
    const current = unlockedBadges[user.id] || [];
    const newBadges: string[] = [];
    achievements.forEach(a => {
      if (!current.includes(a.id) && a.done) newBadges.push(a.id);
    });
    if (newBadges.length > 0) {
      setUnlockedBadges(prev => ({ ...prev, [user.id]: [...current, ...newBadges] }));
      newBadges.forEach(bid => {
        const badge = achievements.find(a => a.id === bid);
        if (badge) toast({ title: `🏆 Conquista: ${badge.name}!`, description: badge.description });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievements, user?.id]);

  // Confetti
  useEffect(() => {
    if (confettiFired.current || ranking.length < 3) return;
    confettiFired.current = true;
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5'] });
    }, 800);
  }, [ranking]);

  // Campaign comparison data
  const comparisonData = useMemo(() => {
    const pastCampaigns = campaigns.filter(c => getCampaignStatus(c) !== 'Futura');
    return pastCampaigns.map(camp => {
      let totalVisits = 0, totalProsp = 0, totalScore = 0, totalCancel = 0, totalGoal = 0, totalDone = 0;
      camp.participants.forEach(p => {
        const v = getCompletedVisitsForUser(p.userId, camp.startDate, camp.endDate);
        const pr = getCompletedProspectionsForUser(p.userId, camp.startDate, camp.endDate);
        totalVisits += v;
        totalProsp += pr;
        totalCancel += getCancelledVisitsForUser(p.userId, camp.startDate, camp.endDate);
        totalScore += calculateUserScore(camp, p.userId);
        totalGoal += p.visitGoal + p.prospectionGoal;
        totalDone += v + pr;
      });
      const rate = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;
      return { name: camp.name.replace('Campanha ', '').slice(0, 12), visits: totalVisits, prospections: totalProsp, score: totalScore, cancellations: totalCancel, rate };
    });
  }, [campaigns]);

  // Charts data for selected campaign
  const visitChartData = useMemo(() => {
    if (!selectedCampaign) return [];
    return selectedCampaign.participants.map(p => {
      const u = getUserById(p.userId);
      return { name: u?.name?.split(' ')[0] || '', value: getCompletedVisitsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate) };
    });
  }, [selectedCampaign]);

  const prospChartData = useMemo(() => {
    if (!selectedCampaign) return [];
    return selectedCampaign.participants.map(p => {
      const u = getUserById(p.userId);
      return { name: u?.name?.split(' ')[0] || '', value: getCompletedProspectionsForUser(p.userId, selectedCampaign.startDate, selectedCampaign.endDate) };
    });
  }, [selectedCampaign]);

  // Score history
  const scoreHistory = useMemo(() => {
    if (!selectedCampaign) return [];
    const userIds = isComercial
      ? [user?.id].filter(Boolean) as string[]
      : (filterUserId !== 'all' ? [filterUserId] : selectedCampaign.participants.map(p => p.userId));

    return userIds.map(uid => {
      const u = getUserById(uid);
      const breakdown = getUserScoreBreakdown(selectedCampaign, uid);
      const total = calculateUserScore(selectedCampaign, uid);
      return { user: u, breakdown, total };
    });
  }, [selectedCampaign, user, filterUserId, isComercial]);

  // Podium
  const podium = ranking.slice(0, 3);
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;

  if (!canRead('campaigns.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  // Empty state
  if (selectableCampaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <Trophy className="h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">Nenhuma campanha ativa no momento</p>
        <p className="text-sm">Crie uma campanha em Configurações para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A) Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{selectedCampaign?.name || 'Campanhas'}</h1>
          {selectedCampaign && (
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{selectedCampaign.startDate} — {selectedCampaign.endDate}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Selecionar campanha" />
            </SelectTrigger>
            <SelectContent>
              {selectableCampaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {getCampaignStatus(c) === 'Ativa' && '●'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canFilterUsers && selectedCampaign && (
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Comercial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {selectedCampaign.participants.map(p => {
                  const u = getUserById(p.userId);
                  return <SelectItem key={p.userId} value={p.userId}>{u?.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* B) Reinforcement badge */}
      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs gap-1">
        <Gamepad2 className="h-3 w-3" /> Pontuação válida apenas durante esta campanha
      </Badge>

      {/* C) KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Visitas</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{kpis.totalVisits}</span>
                <span className="text-sm text-muted-foreground mb-0.5">/ {kpis.totalVisitGoal}</span>
              </div>
              <Progress value={kpis.totalVisitGoal > 0 ? Math.min(100, (kpis.totalVisits / kpis.totalVisitGoal) * 100) : 0} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Prospecções</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{kpis.totalProsp}</span>
                <span className="text-sm text-muted-foreground mb-0.5">/ {kpis.totalProspGoal}</span>
              </div>
              <Progress value={kpis.totalProspGoal > 0 ? Math.min(100, (kpis.totalProsp / kpis.totalProspGoal) * 100) : 0} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pontuação</p>
              <span className="text-2xl font-bold text-primary">{kpis.totalScore}</span>
              <p className="text-[10px] text-muted-foreground mt-1">pts acumulados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Taxa de conclusão</p>
              <span className="text-2xl font-bold">{kpis.rate}%</span>
              <Progress value={kpis.rate} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Cancelamentos</p>
              <span className={cn("text-2xl font-bold", kpis.totalCancel > 0 && "text-destructive")}>{kpis.totalCancel}</span>
              {kpis.totalCancel > 0 && config && (
                <p className="text-[10px] text-destructive mt-1">{Math.abs(kpis.totalCancel * config.pointsPerCancellation)} pts perdidos</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* D) Achievements (inline) */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4" /> Conquistas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className={cn("transition-all", a.done ? "border-primary/30 bg-primary/5" : "opacity-70")}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", a.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        {a.done ? <CheckCircle2 className="h-4 w-4" /> : a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold truncate">{a.name}</p>
                          {a.reward > 0 && <Badge variant="secondary" className="text-[10px] shrink-0">+{a.reward}pts</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={a.goal > 0 ? (a.progress / a.goal) * 100 : 0} className="h-1 flex-1" />
                          <span className="text-[10px] text-muted-foreground">{a.progress}/{a.goal}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* E) Streak + Podium + You vs Average */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', streak > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                <Flame className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">{streak === 1 ? 'dia' : 'dias'} consecutivos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Podium */}
        {canRead('gamification.ranking') && podium.length >= 3 && (
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Pódio</p>
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map((item, idx) => {
                  const pos = podium.indexOf(item) + 1;
                  const isFirst = pos === 1;
                  return (
                    <motion.div
                      key={item.user.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + idx * 0.15, type: 'spring', bounce: 0.3 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Medal className={cn('h-5 w-5', medalColors[pos])} />
                      <Avatar className={cn(isFirst ? 'h-12 w-12' : 'h-10 w-10', 'border-2 border-border')}>
                        <AvatarFallback className={cn('text-xs font-bold', isFirst ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' : 'bg-primary/10 text-primary')}>
                          {item.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-[10px] font-medium">{item.user.name.split(' ')[0]}</p>
                      <Badge variant={isFirst ? 'default' : 'secondary'} className="text-[10px]">{item.score}pts</Badge>
                      <div className={cn('w-14 rounded-t-lg bg-gradient-to-t border-x border-t', podiumColors[pos], isFirst ? 'h-16' : pos === 2 ? 'h-10' : 'h-7')}>
                        <div className="flex items-center justify-center h-full">
                          <span className="font-bold text-muted-foreground text-sm">{pos}º</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* You vs Average */}
        {myStats && ranking.length > 0 && (
          <Card className="h-full">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-3">Você vs Média</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Você ({myPosition}º)</span>
                    <span className="font-semibold">{myStats.score} pts</span>
                  </div>
                  <Progress value={ranking[0]?.score > 0 ? (myStats.score / ranking[0].score) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Média</span>
                    <span>{Math.round(ranking.reduce((s, r) => s + r.score, 0) / ranking.length)} pts</span>
                  </div>
                  <Progress value={ranking[0]?.score > 0 ? ((ranking.reduce((s, r) => s + r.score, 0) / ranking.length) / ranking[0].score) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* F) Contribution Charts */}
      {selectedCampaign && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contribuição — Visitas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={visitChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Visitas" radius={[4, 4, 0, 0]}>
                    {visitChartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contribuição — Prospecções</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={prospChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Prospecções" radius={[4, 4, 0, 0]}>
                    {prospChartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* G) Campaign Comparison */}
      {comparisonData.length > 1 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Comparativo entre campanhas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="visits" name="Visitas" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="prospections" name="Prospecções" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="score" name="Pontuação" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cancellations" name="Cancelamentos" fill="hsl(var(--chart-5))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* H) Score History */}
      {scoreHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Histórico de Pontuação</h2>
          <Accordion type="multiple" className="space-y-2">
            {scoreHistory.map(entry => (
              <AccordionItem key={entry.user?.id} value={entry.user?.id || ''} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {entry.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.user?.name}</span>
                    <Badge variant="secondary" className="text-xs">{entry.total} pts</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1.5 pb-2">
                    {entry.breakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem dados suficientes</p>
                    ) : (
                      entry.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            {item.type === 'earn' && <TrendingUp className="h-3 w-3 text-success" />}
                            {item.type === 'penalty' && <XCircle className="h-3 w-3 text-destructive" />}
                            {item.type === 'achievement' && <Award className="h-3 w-3 text-primary" />}
                            <span>{item.label}</span>
                          </div>
                          <span className={cn("font-semibold", item.points > 0 ? "text-success" : item.points < 0 ? "text-destructive" : "")}>
                            {item.points > 0 ? '+' : ''}{item.points}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Gamification rules reference */}
      {config && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">Regras de pontuação desta campanha</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-success/10 text-center">
                <p className="font-bold text-base text-success">+{config.pointsPerVisit}</p>
                <p className="text-muted-foreground">por visita</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10 text-center">
                <p className="font-bold text-base text-info">+{config.pointsPerProspection}</p>
                <p className="text-muted-foreground">por prospecção</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10 text-center">
                <p className="font-bold text-base text-destructive">{config.pointsPerCancellation}</p>
                <p className="text-muted-foreground">cancelamento</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-base text-primary">+{config.achievements.firstVisitReward}</p>
                <p className="text-muted-foreground">1ª visita</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-base text-primary">+{config.achievements.firstProspectionReward}</p>
                <p className="text-muted-foreground">1ª prospecção</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-base text-primary">+{config.achievements.visitReward}</p>
                <p className="text-muted-foreground">{config.achievements.visitMilestone} vis.</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-base text-primary">+{config.achievements.fullGoalReward}</p>
                <p className="text-muted-foreground">100% meta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
