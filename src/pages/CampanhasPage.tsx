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

      {/* 4. KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-ds-sm">
           <Card className="card-flat group overflow-hidden relative">
            <CardContent className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center min-h-[72px] sm:min-h-[80px] gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="icon-container-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--info) / 0.15) 0%, hsl(var(--info) / 0.05) 100%)' }}>
                  <Eye className="h-4 w-4 text-info" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-foreground tracking-wide uppercase leading-tight">Visitas</p>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-none text-muted-foreground">
                {kpis.totalVisits}<span className="text-xs font-normal text-muted-foreground/70 ml-0.5">/ {kpis.totalVisitGoal}</span>
              </p>
              <Progress value={kpis.totalVisitGoal > 0 ? Math.min(100, (kpis.totalVisits / kpis.totalVisitGoal) * 100) : 0} className="h-1.5 w-full" />
            </CardContent>
          </Card>
           <Card className="card-flat group overflow-hidden relative">
            <CardContent className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center min-h-[72px] sm:min-h-[80px] gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="icon-container-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--warning) / 0.15) 0%, hsl(var(--warning) / 0.05) 100%)' }}>
                  <Target className="h-4 w-4 text-warning" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-foreground tracking-wide uppercase leading-tight">Prospecções</p>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-none text-muted-foreground">
                {kpis.totalProsp}<span className="text-xs font-normal text-muted-foreground/70 ml-0.5">/ {kpis.totalProspGoal}</span>
              </p>
              <Progress value={kpis.totalProspGoal > 0 ? Math.min(100, (kpis.totalProsp / kpis.totalProspGoal) * 100) : 0} className="h-1.5 w-full" />
            </CardContent>
          </Card>
           <Card className="card-flat group overflow-hidden relative">
            <CardContent className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center min-h-[72px] sm:min-h-[80px] gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="icon-container-sm icon-container-primary">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-foreground tracking-wide uppercase leading-tight">Pontuação</p>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-none text-primary">{kpis.totalScore}</p>
              <p className="text-[10px] text-muted-foreground/70">pts acumulados</p>
            </CardContent>
          </Card>
           <Card className="card-flat group overflow-hidden relative">
            <CardContent className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center min-h-[72px] sm:min-h-[80px] gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="icon-container-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--success) / 0.15) 0%, hsl(var(--success) / 0.05) 100%)' }}>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-foreground tracking-wide uppercase leading-tight">Taxa de conclusão</p>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-none text-muted-foreground">{kpis.rate}%</p>
              <Progress value={kpis.rate} className="h-1.5 w-full" />
            </CardContent>
          </Card>
          <Card className="card-flat group overflow-hidden relative">
            <CardContent className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center min-h-[72px] sm:min-h-[80px] gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="icon-container-sm" style={{ background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.15) 0%, hsl(var(--destructive) / 0.05) 100%)' }}>
                  <Ban className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-foreground tracking-wide uppercase leading-tight">Cancelamentos</p>
              </div>
              <p className={cn("text-lg sm:text-xl font-bold tabular-nums leading-none text-muted-foreground", kpis.totalCancel > 0 && "text-destructive")}>{kpis.totalCancel}</p>
              {kpis.totalCancel > 0 && config && (
                <p className="text-[10px] text-destructive">{Math.abs(kpis.totalCancel * config.pointsPerCancellation)} pts perdidos</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Streak */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-ds-md flex items-center gap-ds-sm">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-ds-xl font-bold">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
              <p className="text-xs text-muted-foreground">Streak de atividades consecutivas</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5b. Podium — Animated & Fun */}
      {canRead('gamification.ranking') && podium.length >= 3 && (
        <Card className="overflow-hidden relative">
          <CardContent className="p-ds-md pb-0">
            <p className="text-ds-sm font-semibold mb-ds-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Pódio</p>
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
      {myStats && ranking.length > 0 && (
        <Card className="min-h-[100px] card-hover">
          <CardContent className="p-ds-md">
            <p className="card-section-title mb-ds-sm">Você vs Média</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm">
              <div>
                <div className="flex justify-between text-ds-xs mb-1">
                  <span>Você ({myPosition}º)</span>
                  <span className="font-semibold">{myStats.score} pts</span>
                </div>
                <Progress value={ranking[0]?.score > 0 ? (myStats.score / ranking[0].score) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-ds-xs mb-1">
                  <span>Média</span>
                  <span>{Math.round(ranking.reduce((s, r) => s + r.score, 0) / ranking.length)} pts</span>
                </div>
                <Progress value={ranking[0]?.score > 0 ? ((ranking.reduce((s, r) => s + r.score, 0) / ranking.length) / ranking[0].score) * 100 : 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Achievements (compact single row) */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-ds-sm font-semibold mb-ds-xs flex items-center gap-2"><Award className="h-4 w-4" /> Conquistas</h2>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-ds-xs">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Card className={cn("transition-all text-center card-hover", a.done ? "border-primary/30 bg-primary/5" : "opacity-60")}>
                  <CardContent className="p-3 flex flex-col items-center gap-1.5">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", a.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {a.icon}
                    </div>
                    <p className="text-ds-xs font-semibold leading-tight">{a.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Score History (detailed with date/time) */}
      {scoreHistory.length > 0 && (
        <div>
          <h2 className="text-ds-sm font-semibold mb-ds-xs">Histórico de Pontuação</h2>
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
        </div>
      )}

      {/* 9. Campaign Comparison */}
      <CampaignComparison campaigns={campaigns} currentCampaignId={selectedCampaignId} />

      </AnimatedFilterContent>
    </div>
  );
}
