import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useVisibility } from '@/hooks/useVisibility';
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
import { Trophy, Flame, Medal, Star, TrendingUp, ShieldOff, Award, Ban, CheckCircle2, Target, Calendar, XCircle, Eye, Crown } from 'lucide-react';
import SmartInsights from '@/components/shared/SmartInsights';
import CampaignComparison from '@/components/campaigns/CampaignComparison';
import AnimatedFilterContent from '@/components/shared/AnimatedFilterContent';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import PageHeader from '@/components/shared/PageHeader';

const podiumColors = [
  '',
  'from-yellow-400/30 to-yellow-600/10 border-yellow-500/40',
  'from-slate-300/30 to-slate-400/10 border-slate-400/40',
  'from-amber-600/20 to-amber-800/10 border-amber-700/30',
];
const medalColors = ['', 'text-yellow-500', 'text-slate-400', 'text-amber-700'];

export default function CampanhasPage() {
  const { user } = useAuth();
  const { hasGlobalView } = useVisibility();
  const { canRead } = usePermission();
  const { toast } = useToast();
  const [campaigns] = useLocalStorage<Campaign[]>('ribercred_campaigns', initialCampaigns);
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage<Record<string, string[]>>('ribercred_badges', {});
  
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  const selectableCampaigns = useMemo(() => campaigns.filter(c => getCampaignStatus(c) !== 'Futura'), [campaigns]);
  const activeCampaign = useMemo(() => campaigns.find(c => getCampaignStatus(c) === 'Ativa'), [campaigns]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(activeCampaign?.id || selectableCampaigns[0]?.id || '');

  const selectedCampaign = useMemo(() => campaigns.find(c => c.id === selectedCampaignId) || null, [campaigns, selectedCampaignId]);
  const config = useMemo(() => selectedCampaign ? getGamificationConfig(selectedCampaign) : null, [selectedCampaign]);

  const isComercial = user?.role === 'comercial';
  const canFilterUsers = !isComercial && hasGlobalView;
  const [filterUserId, setFilterUserId] = useState<string>('all');

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

  const myStats = useMemo(() => {
    if (!user) return null;
    return ranking.find(r => r.user.id === user.id) || null;
  }, [user, ranking]);

  const myPosition = ranking.findIndex(r => r.user.id === user?.id) + 1;

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

  const achievements = useMemo(() => {
    if (!selectedCampaign || !config || !user) return [];
    const userId = isComercial ? user.id : (filterUserId !== 'all' ? filterUserId : user.id);
    const participant = selectedCampaign.participants.find(p => p.userId === userId);
    if (!participant) return [];

    const visits = getCompletedVisitsForUser(userId, selectedCampaign.startDate, selectedCampaign.endDate);
    const prospections = getCompletedProspectionsForUser(userId, selectedCampaign.startDate, selectedCampaign.endDate);

    return [
      { id: 'first_visit', name: 'Primeira Visita', description: '1ª visita concluída', icon: <Star className="h-4 w-4" />, done: visits >= 1, reward: config.achievements.firstVisitReward },
      { id: 'first_prosp', name: 'Primeira Prospecção', description: '1ª prospecção concluída', icon: <Star className="h-4 w-4" />, done: prospections >= 1, reward: config.achievements.firstProspectionReward },
      { id: 'visit_milestone', name: `${config.achievements.visitMilestone} Visitas`, description: `Meta de ${config.achievements.visitMilestone} visitas`, icon: <Trophy className="h-4 w-4" />, done: visits >= config.achievements.visitMilestone, reward: config.achievements.visitReward },
      { id: 'prosp_milestone', name: `${config.achievements.prospectionMilestone} Prospecções`, description: `Meta de ${config.achievements.prospectionMilestone}`, icon: <Medal className="h-4 w-4" />, done: prospections >= config.achievements.prospectionMilestone, reward: config.achievements.prospectionReward },
      { id: 'full_visit_goal', name: '100% Visitas', description: `${participant.visitGoal} visitas`, icon: <Target className="h-4 w-4" />, done: visits >= participant.visitGoal, reward: config.achievements.fullVisitGoalReward },
      { id: 'full_prosp_goal', name: '100% Prospecções', description: `${participant.prospectionGoal} prospecções`, icon: <Target className="h-4 w-4" />, done: prospections >= participant.prospectionGoal, reward: config.achievements.fullProspectionGoalReward },
      { id: 'full_goal', name: '100% Meta Geral', description: 'Todas as metas', icon: <Award className="h-4 w-4" />, done: visits >= participant.visitGoal && prospections >= participant.prospectionGoal, reward: config.achievements.fullGoalReward },
    ];
  }, [selectedCampaign, config, user, filterUserId, isComercial]);

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

  const isCurrentUserFirst = useMemo(() => {
    return ranking.length > 0 && ranking[0]?.user?.id === user?.id;
  }, [ranking, user?.id]);


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
    <div className="space-y-ds-lg">
      {/* 1. Header + Filters */}
      <PageHeader
        title={selectedCampaign?.name || 'Campanhas'}
        description={selectedCampaign ? `${selectedCampaign.startDate} — ${selectedCampaign.endDate}` : undefined}
      >
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
      </PageHeader>

      {/* 2. Smart Insights */}
      <SmartInsights page="campanhas" activeFilter={activeInsight} onFilterClick={setActiveInsight} />

      <AnimatedFilterContent filterKey={activeInsight} className="space-y-ds-lg">

      {/* 4. KPI Cards — refined with lateral tonal bar + tile */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-ds-sm">
          {[
            { label: 'Visitas', icon: Eye, value: kpis.totalVisits, goal: kpis.totalVisitGoal, color: 'info' as const, progress: kpis.totalVisitGoal > 0 ? Math.min(100, (kpis.totalVisits / kpis.totalVisitGoal) * 100) : 0 },
            { label: 'Prospecções', icon: Target, value: kpis.totalProsp, goal: kpis.totalProspGoal, color: 'warning' as const, progress: kpis.totalProspGoal > 0 ? Math.min(100, (kpis.totalProsp / kpis.totalProspGoal) * 100) : 0 },
            { label: 'Pontuação', icon: Star, value: kpis.totalScore, color: 'primary' as const, sub: 'pts acumulados', highlight: true },
            { label: 'Taxa', icon: CheckCircle2, value: kpis.rate, suffix: '%', color: 'success' as const, progress: kpis.rate },
            { label: 'Cancelamentos', icon: Ban, value: kpis.totalCancel, color: 'destructive' as const, sub: kpis.totalCancel > 0 && config ? `${Math.abs(kpis.totalCancel * config.pointsPerCancellation)} pts perdidos` : undefined },
          ].map((k) => (
            <Card key={k.label} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", `from-${k.color}/70 to-${k.color}/30`)} />
              <CardContent className="p-3 sm:p-3.5 pl-4 flex flex-col gap-2 min-h-[88px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">{k.label}</span>
                  <div className={cn("h-7 w-7 rounded-md flex items-center justify-center border", `bg-${k.color}/10 border-${k.color}/20 text-${k.color}`)}>
                    <k.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className={cn("text-xl sm:text-2xl font-bold tabular-nums leading-none", k.highlight && "text-primary")}>{k.value}{k.suffix || ''}</p>
                  {k.goal !== undefined && (
                    <span className="text-[11px] font-medium text-muted-foreground/80">/ {k.goal}</span>
                  )}
                </div>
                {k.progress !== undefined && (
                  <Progress value={k.progress} className="h-1.5 w-full" />
                )}
                {k.sub && (
                  <p className={cn("text-[10px] text-muted-foreground", k.color === 'destructive' && k.value > 0 && 'text-destructive font-medium')}>{k.sub}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 5. Streak — celebrative */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-success/70 to-success/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="p-ds-md pl-5 flex items-center gap-ds-md relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 text-success flex items-center justify-center shadow-sm">
              <Flame className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums leading-none">{streak}</p>
                <p className="text-sm font-medium text-muted-foreground">{streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Streak de atividades — continue assim!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5b. Podium — Animated & Fun */}
      {canRead('gamification.ranking') && podium.length >= 3 && (
        <Card className="overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-yellow-500/[0.06] via-primary/[0.03] to-transparent pointer-events-none" />
          <CardContent className="p-ds-md pb-ds-sm relative">
            <div className="flex items-center justify-between mb-ds-md">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-yellow-400/25 to-yellow-600/10 border border-yellow-500/30 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Pódio da Campanha</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Top 3 colocações por pontuação</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">{ranking.length} participantes</Badge>
            </div>
            <div className="flex items-end justify-center gap-ds-sm md:gap-ds-md relative">

              {podiumOrder.map((item, idx) => {
                const pos = podium.indexOf(item) + 1;
                const isFirst = pos === 1;
                const isSecond = pos === 2;
                const avatarSize = isFirst ? 'h-16 w-16' : 'h-12 w-12';
                const barHeight = isFirst ? 'h-24' : isSecond ? 'h-16' : 'h-10';
                const barDelay = isFirst ? 0.4 : isSecond ? 0.2 : 0.6;
                const ringColor = isFirst ? 'ring-2 ring-yellow-400' : isSecond ? 'ring-2 ring-slate-300' : 'ring-2 ring-amber-600/60';
                const barGradient = isFirst
                  ? 'bg-gradient-to-t from-yellow-500/40 to-yellow-300/10 border-yellow-400/50 podium-shimmer'
                  : isSecond
                  ? 'bg-gradient-to-t from-slate-400/30 to-slate-200/10 border-slate-300/40'
                  : 'bg-gradient-to-t from-amber-700/30 to-amber-500/10 border-amber-600/40';
                const fallbackColor = isFirst ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' : isSecond ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';

                return (
                  <motion.div
                    key={item.user.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: barDelay, type: 'spring', bounce: 0.4 }}
                    className="flex flex-col items-center gap-2 relative"
                  >
                    {/* Crown for 1st place */}
                    {isFirst && (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="-mb-1"
                      >
                        <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
                      </motion.div>
                    )}

                    {/* Avatar with glow for 1st */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: barDelay + 0.2, type: 'spring', stiffness: 300, damping: 15 }}
                      whileHover={{ scale: 1.12, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative cursor-pointer"
                    >
                      {isFirst && (
                        <motion.div
                          className="absolute -inset-1.5 rounded-full"
                          animate={{
                            boxShadow: [
                              '0 0 12px 2px rgba(234,179,8,0.25)',
                              '0 0 24px 6px rgba(234,179,8,0.45)',
                              '0 0 12px 2px rgba(234,179,8,0.25)',
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      <Avatar className={cn(avatarSize, ringColor, 'transition-all relative z-10')}>
                        <AvatarFallback className={cn('font-bold', isFirst ? 'text-base' : 'text-sm', fallbackColor)}>
                          {item.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: barDelay + 0.35 }}
                      className={cn("font-medium", isFirst ? "text-sm" : "text-xs")}
                    >
                      {item.user.name.split(' ')[0]}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: barDelay + 0.4 }}
                      className="text-[10px] text-muted-foreground capitalize"
                    >
                      {item.user.role}
                    </motion.p>

                    {/* Badge with bounce-in */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: barDelay + 0.5, type: 'spring', stiffness: 400, damping: 12 }}
                    >
                      <Badge variant={isFirst ? 'default' : 'secondary'} className="text-[11px]">{item.score} pts</Badge>
                    </motion.div>

                    {/* Bar growing from bottom */}
                    <motion.div
                      className={cn('w-16 md:w-20 rounded-t-lg border-x border-t overflow-hidden relative', barGradient)}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.7, delay: barDelay, ease: [0.34, 1.56, 0.64, 1] }}
                      whileHover={{ filter: 'brightness(1.15)' }}
                    >
                      <div className={cn('flex items-center justify-center', barHeight)}>
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: barDelay + 0.6, type: 'spring', stiffness: 300 }}
                          className={cn("font-bold", isFirst ? "text-lg text-yellow-600 dark:text-yellow-400" : "text-muted-foreground")}
                        >
                          {pos}º
                        </motion.span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. You vs Average */}
      {myStats && ranking.length > 0 && (() => {
        const avg = Math.round(ranking.reduce((s, r) => s + r.score, 0) / ranking.length);
        const top = ranking[0]?.score || 0;
        const diff = myStats.score - avg;
        return (
          <Card className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/70 to-primary/30" />
            <CardContent className="p-ds-md pl-5">
              <div className="flex items-center justify-between mb-ds-sm">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> Você vs Média
                </p>
                <Badge variant={diff >= 0 ? 'default' : 'secondary'} className="text-[10px]">
                  {diff >= 0 ? '+' : ''}{diff} pts vs média
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-md">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Você <span className="text-muted-foreground">({myPosition}º)</span></span>
                    <span className="font-bold tabular-nums text-primary">{myStats.score} pts</span>
                  </div>
                  <Progress value={top > 0 ? (myStats.score / top) * 100 : 0} className="h-2.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Média do time</span>
                    <span className="font-semibold tabular-nums">{avg} pts</span>
                  </div>
                  <Progress value={top > 0 ? (avg / top) * 100 : 0} className="h-2.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* 7. Achievements — refined celebrative tiles */}
      {achievements.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-ds-md">
            <div className="flex items-center justify-between mb-ds-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Conquistas</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{achievements.filter(a => a.done).length} de {achievements.length} desbloqueadas</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-ds-xs">
              {achievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <div className={cn(
                    "relative rounded-lg border text-center p-3 flex flex-col items-center gap-1.5 transition-all",
                    a.done
                      ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "border-dashed border-border/60 bg-muted/20 opacity-70"
                  )}>
                    <div className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center border",
                      a.done
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "bg-muted border-border/60 text-muted-foreground"
                    )}>
                      {a.icon}
                    </div>
                    <p className="text-[11px] font-semibold leading-tight">{a.name}</p>
                    {a.done && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 h-3 w-3 text-primary" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. Score History (detailed with date/time) */}
      {scoreHistory.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-ds-md">
            <div className="flex items-center gap-2 mb-ds-sm">
              <div className="h-8 w-8 rounded-md bg-muted/50 border border-border flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Histórico de Pontuação</p>
            </div>
            <Accordion type="multiple" className="space-y-2">
              {scoreHistory.map(entry => (
                <AccordionItem key={entry.user?.id} value={entry.user?.id || ''} className="border rounded-lg px-4 bg-muted/20">
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
                  {entry.breakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground pb-2">Sem dados suficientes</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] h-8">Data</TableHead>
                          <TableHead className="text-[10px] h-8">Hora</TableHead>
                          <TableHead className="text-[10px] h-8">Tipo</TableHead>
                          <TableHead className="text-[10px] h-8">Descrição</TableHead>
                          <TableHead className="text-[10px] h-8 text-right">Pontos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.breakdown.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-[11px] py-1.5">{item.date || '-'}</TableCell>
                            <TableCell className="text-[11px] py-1.5">{item.time || '-'}</TableCell>
                            <TableCell className="py-1.5">
                              <div className="flex items-center gap-1">
                                {item.type === 'earn' && <TrendingUp className="h-3 w-3 text-success" />}
                                {item.type === 'penalty' && <XCircle className="h-3 w-3 text-destructive" />}
                                {item.type === 'achievement' && <Award className="h-3 w-3 text-primary" />}
                                <span className="text-[10px] text-muted-foreground capitalize">{item.type === 'earn' ? 'Ganho' : item.type === 'penalty' ? 'Penalidade' : 'Conquista'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[11px] py-1.5">{item.label}</TableCell>
                            <TableCell className={cn("text-[11px] py-1.5 text-right font-semibold", item.points > 0 ? "text-success" : item.points < 0 ? "text-destructive" : "")}>
                              {item.points > 0 ? '+' : ''}{item.points}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 9. Campaign Comparison */}
      <CampaignComparison campaigns={campaigns} currentCampaignId={selectedCampaignId} />

      </AnimatedFilterContent>
    </div>
  );
}
