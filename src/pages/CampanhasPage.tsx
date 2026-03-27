import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { mockVisits, mockUsers, getUserById } from '@/data/mock-data';
import {
  Campaign, initialCampaigns, getCampaignStatus, campaignStatusColors,
  getCompletedVisitsForUser, getCompletedProspectionsForUser,
  getCancelledVisitsForUser, calculateUserScore, getGamificationConfig,
} from '@/data/campaigns';
import { Trophy, Flame, Medal, Star, AlertTriangle, TrendingUp, ShieldOff, Award, ChevronLeft, Eye, Ban, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filterUser, setFilterUser] = useState<string>('all');

  const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Active campaign
  const activeCampaign = useMemo(() => campaigns.find(c => getCampaignStatus(c) === 'Ativa'), [campaigns]);
  const activeConfig = useMemo(() => activeCampaign ? getGamificationConfig(activeCampaign) : null, [activeCampaign]);

  // Global ranking using campaign score
  const allCommercials = useMemo(() => mockUsers.filter(u => u.role === 'comercial' && u.active), []);

  const ranking = useMemo(() => {
    return allCommercials.map(u => {
      const visits = activeCampaign
        ? getCompletedVisitsForUser(u.id, activeCampaign.startDate, activeCampaign.endDate)
        : mockVisits.filter(v => v.userId === u.id && v.status === 'Concluída' && v.type === 'visita').length;
      const prospections = activeCampaign
        ? getCompletedProspectionsForUser(u.id, activeCampaign.startDate, activeCampaign.endDate)
        : mockVisits.filter(v => v.userId === u.id && v.status === 'Concluída' && v.type === 'prospecção').length;
      const cancellations = activeCampaign
        ? getCancelledVisitsForUser(u.id, activeCampaign.startDate, activeCampaign.endDate)
        : 0;
      const score = activeCampaign ? calculateUserScore(activeCampaign, u.id) : visits + prospections;
      return { user: u, visits, prospections, cancellations, score };
    }).sort((a, b) => b.score - a.score);
  }, [allCommercials, activeCampaign]);

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

  const myStats = useMemo(() => {
    if (!user) return null;
    return ranking.find(r => r.user.id === user.id) || null;
  }, [user, ranking]);

  // Campaign-based badge checking
  const campaignBadges = useMemo(() => {
    if (!activeCampaign || !activeConfig) return [];
    const badges = [
      { id: 'first_visit', name: 'Primeira Visita', description: 'Completou a primeira visita', icon: <Star className="h-5 w-5" />, check: (v: number) => v >= 1 },
      { id: 'visit_milestone', name: `${activeConfig.achievements.visitMilestone} Visitas`, description: `Completou ${activeConfig.achievements.visitMilestone} visitas (+${activeConfig.achievements.visitReward}pts)`, icon: <Trophy className="h-5 w-5" />, check: (v: number) => v >= activeConfig.achievements.visitMilestone },
      { id: 'first_prosp', name: 'Primeira Prospecção', description: 'Completou a primeira prospecção', icon: <Star className="h-5 w-5" />, check: (_v: number, p: number) => p >= 1 },
      { id: 'prosp_milestone', name: `${activeConfig.achievements.prospectionMilestone} Prospecções`, description: `Completou ${activeConfig.achievements.prospectionMilestone} prospecções (+${activeConfig.achievements.prospectionReward}pts)`, icon: <Medal className="h-5 w-5" />, check: (_v: number, p: number) => p >= activeConfig.achievements.prospectionMilestone },
      { id: 'meta_hit', name: 'Meta Atingida', description: 'Atingiu 100% de uma meta', icon: <TrendingUp className="h-5 w-5" />, check: (v: number) => v >= activeConfig.achievements.visitMilestone },
      { id: 'full_100', name: '100% Concluído', description: 'Concluiu todas as metas da campanha', icon: <Award className="h-5 w-5" />, check: (v: number, p: number) => v >= activeConfig.achievements.visitMilestone && p >= activeConfig.achievements.prospectionMilestone },
    ];
    return badges;
  }, [activeCampaign, activeConfig]);

  useEffect(() => {
    if (!user || !myStats || campaignBadges.length === 0) return;
    const current = unlockedBadges[user.id] || [];
    const newBadges: string[] = [];
    campaignBadges.forEach(b => {
      if (!current.includes(b.id) && b.check(myStats.visits, myStats.prospections)) {
        newBadges.push(b.id);
      }
    });
    if (newBadges.length > 0) {
      setUnlockedBadges(prev => ({ ...prev, [user.id]: [...current, ...newBadges] }));
      newBadges.forEach(bid => {
        const badge = campaignBadges.find(b => b.id === bid);
        if (badge) {
          toast({ title: `🏆 Nova conquista: ${badge.name}!`, description: badge.description });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStats, user?.id, toast, campaignBadges]);

  // Confetti
  useEffect(() => {
    if (confettiFired.current) return;
    if (ranking.length >= 3 && canRead('gamification.ranking')) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 }, colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5'] });
      }, 800);
    }
  }, [ranking, canRead]);

  // Alerts
  const alerts = useMemo(() => {
    const items: { text: string; icon: React.ReactNode }[] = [];
    if (!user || !myStats) return items;
    const activeCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'Ativa');
    activeCampaigns.forEach(camp => {
      const participant = camp.participants.find(p => p.userId === user.id);
      if (participant) {
        const visits = getCompletedVisitsForUser(user.id, camp.startDate, camp.endDate);
        const remaining = participant.visitGoal - visits;
        if (remaining > 0) items.push({ text: `Faltam ${remaining} visitas para sua meta em "${camp.name}"`, icon: <AlertTriangle className="h-4 w-4 text-warning" /> });
        const endDate = new Date(camp.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft > 0) items.push({ text: `Campanha "${camp.name}" termina em ${daysLeft} dias`, icon: <AlertTriangle className="h-4 w-4 text-destructive" /> });
      }
      // Cancellation alert
      const cancellations = getCancelledVisitsForUser(user.id, camp.startDate, camp.endDate);
      if (cancellations > 0) {
        const config = getGamificationConfig(camp);
        const penalty = Math.abs(cancellations * config.pointsPerCancellation);
        items.push({ text: `${cancellations} cancelamento(s) = -${penalty} pts em "${camp.name}"`, icon: <Ban className="h-4 w-4 text-destructive" /> });
      }
    });
    if (ranking.length > 0) {
      const avg = ranking.reduce((s, r) => s + r.score, 0) / ranking.length;
      if (myStats.score > avg) items.push({ text: 'Você está acima da média da equipe!', icon: <TrendingUp className="h-4 w-4 text-success" /> });
    }
    return items;
  }, [user, myStats, campaigns, ranking]);

  const leader = ranking[0];
  const myPosition = ranking.findIndex(r => r.user.id === user?.id) + 1;
  const myBadges = user ? (unlockedBadges[user.id] || []) : [];
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

  // Campaign detail view
  if (selectedCampaign) {
    const camp = selectedCampaign;
    const status = getCampaignStatus(camp);
    const config = getGamificationConfig(camp);
    const participantData = camp.participants
      .filter(p => filterUser === 'all' || p.userId === filterUser)
      .map(p => {
        const u = getUserById(p.userId);
        const visits = getCompletedVisitsForUser(p.userId, camp.startDate, camp.endDate);
        const prospections = getCompletedProspectionsForUser(p.userId, camp.startDate, camp.endDate);
        const cancellations = getCancelledVisitsForUser(p.userId, camp.startDate, camp.endDate);
        const score = calculateUserScore(camp, p.userId);
        return { ...p, user: u, visits, prospections, cancellations, score };
      });

    const totalVisitGoal = participantData.reduce((s, p) => s + p.visitGoal, 0);
    const totalVisits = participantData.reduce((s, p) => s + p.visits, 0);
    const totalProspGoal = participantData.reduce((s, p) => s + p.prospectionGoal, 0);
    const totalProsp = participantData.reduce((s, p) => s + p.prospections, 0);

    const visitChartData = participantData.map(p => ({ name: p.user?.name?.split(' ')[0] || '', value: p.visits }));
    const prospChartData = participantData.map(p => ({ name: p.user?.name?.split(' ')[0] || '', value: p.prospections }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{camp.name}</h1>
            <p className="text-sm text-muted-foreground">{camp.startDate} — {camp.endDate}</p>
          </div>
          <Badge className={cn('ml-2', campaignStatusColors[status])} variant="outline">{status}</Badge>
        </div>

        {/* Gamification rules */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Regras de pontuação</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2 rounded-lg bg-success/10 text-center">
                <p className="font-bold text-lg text-success">+{config.pointsPerVisit}</p>
                <p className="text-muted-foreground">por visita</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10 text-center">
                <p className="font-bold text-lg text-info">+{config.pointsPerProspection}</p>
                <p className="text-muted-foreground">por prospecção</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10 text-center">
                <p className="font-bold text-lg text-destructive">{config.pointsPerCancellation}</p>
                <p className="text-muted-foreground">por cancelamento</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-lg text-primary">+{config.achievements.visitReward}</p>
                <p className="text-muted-foreground">{config.achievements.visitMilestone} visitas</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-center">
                <p className="font-bold text-lg text-primary">+{config.achievements.prospectionReward}</p>
                <p className="text-muted-foreground">{config.achievements.prospectionMilestone} prosp.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar comercial" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {camp.participants.map(p => {
              const u = getUserById(p.userId);
              return <SelectItem key={p.userId} value={p.userId}>{u?.name}</SelectItem>;
            })}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Visitas concluídas</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{totalVisits}</span>
                <span className="text-muted-foreground text-sm mb-1">/ {totalVisitGoal}</span>
              </div>
              <Progress value={totalVisitGoal > 0 ? Math.min(100, (totalVisits / totalVisitGoal) * 100) : 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Prospecções concluídas</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{totalProsp}</span>
                <span className="text-muted-foreground text-sm mb-1">/ {totalProspGoal}</span>
              </div>
              <Progress value={totalProspGoal > 0 ? Math.min(100, (totalProsp / totalProspGoal) * 100) : 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Progresso individual</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comercial</TableHead>
                  <TableHead className="text-center">Visitas</TableHead>
                  <TableHead className="text-center">Prospecções</TableHead>
                  <TableHead className="text-center">Cancelamentos</TableHead>
                  <TableHead className="text-center">Pontuação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantData.sort((a, b) => b.score - a.score).map(p => (
                  <TableRow key={p.userId}>
                    <TableCell className="font-medium">{p.user?.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{p.visits}</span>
                      <span className="text-muted-foreground text-xs">/{p.visitGoal}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{p.prospections}</span>
                      <span className="text-muted-foreground text-xs">/{p.prospectionGoal}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {p.cancellations > 0 ? (
                        <span className="text-destructive font-semibold flex items-center justify-center gap-1">
                          <Ban className="h-3 w-3" /> {p.cancellations}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="tabular-nums">{p.score} pts</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contribuição — Visitas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={visitChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={prospChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Prospecções" radius={[4, 4, 0, 0]}>
                    {prospChartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <p className="text-muted-foreground text-sm">Acompanhe campanhas, ranking e conquistas</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((a, i) => (
            <Card key={i} className="border-l-4 border-l-warning">
              <CardContent className="p-3 flex items-center gap-3">
                {a.icon}
                <p className="text-xs">{a.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active campaign highlight */}
      {activeCampaign && activeConfig && (
        <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCampaign(activeCampaign)}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{activeCampaign.name}</h3>
                  <Badge className={cn('text-[10px]', campaignStatusColors['Ativa'])} variant="outline">Ativa</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activeCampaign.startDate} — {activeCampaign.endDate}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Eye className="h-3 w-3" /> Detalhes
              </Button>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {activeCampaign.participants.slice(0, 5).map(p => {
                const u = getUserById(p.userId);
                return (
                  <Avatar key={p.userId} className="h-7 w-7 border-2 border-card -ml-1 first:ml-0">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                      {u?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            {/* Rules summary */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
              <Gamepad2 className="h-3 w-3" />
              <span>Visita: +{activeConfig.pointsPerVisit}pt</span>
              <span>Prospecção: +{activeConfig.pointsPerProspection}pt</span>
              <span>Cancelamento: {activeConfig.pointsPerCancellation}pt</span>
            </div>
            {(() => {
              const totalGoal = activeCampaign.participants.reduce((s, p) => s + p.visitGoal + p.prospectionGoal, 0);
              const totalDone = activeCampaign.participants.reduce((s, p) => s + getCompletedVisitsForUser(p.userId, activeCampaign.startDate, activeCampaign.endDate) + getCompletedProspectionsForUser(p.userId, activeCampaign.startDate, activeCampaign.endDate), 0);
              const progress = totalGoal > 0 ? Math.min(100, Math.round((totalDone / totalGoal) * 100)) : 0;
              return (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progresso geral</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Other campaigns */}
      {campaigns.filter(c => c.id !== activeCampaign?.id).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.filter(c => c.id !== activeCampaign?.id).map(camp => {
            const status = getCampaignStatus(camp);
            const totalGoal = camp.participants.reduce((s, p) => s + p.visitGoal + p.prospectionGoal, 0);
            const totalDone = camp.participants.reduce((s, p) => s + getCompletedVisitsForUser(p.userId, camp.startDate, camp.endDate) + getCompletedProspectionsForUser(p.userId, camp.startDate, camp.endDate), 0);
            const progress = totalGoal > 0 ? Math.min(100, Math.round((totalDone / totalGoal) * 100)) : 0;
            return (
              <Card key={camp.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCampaign(camp)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{camp.name}</h3>
                      <p className="text-xs text-muted-foreground">{camp.startDate} — {camp.endDate}</p>
                    </div>
                    <Badge className={cn('text-[10px]', campaignStatusColors[status])} variant="outline">{status}</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Gamification section */}
      <Tabs defaultValue="ranking" className="mt-8">
        <TabsList>
          <TabsTrigger value="ranking">Ranking & Pódio</TabsTrigger>
          <TabsTrigger value="badges">Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-6">
          {/* Streak */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', streak > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
                  <p className="text-xs text-muted-foreground">Streak de atividades consecutivas</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Podium */}
          {canRead('gamification.ranking') && podium.length >= 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Pódio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-6 py-8">
                    {podiumOrder.map((item, idx) => {
                      const pos = podium.indexOf(item) + 1;
                      const isFirst = pos === 1;
                      return (
                        <motion.div
                          key={item.user.id}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 + idx * 0.2, type: 'spring', bounce: 0.3 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.6, delay: 0.8 + idx * 0.15, type: 'spring', bounce: 0.5 }}>
                            <Medal className={cn('h-7 w-7', medalColors[pos])} />
                          </motion.div>
                          <div className={cn('relative rounded-full', isFirst && 'ring-2 ring-yellow-500/60 ring-offset-2 ring-offset-background animate-pulse')}>
                            <Avatar className={cn(isFirst ? 'h-18 w-18' : 'h-14 w-14', 'border-2 border-border')}>
                              <AvatarFallback className={cn('font-bold text-sm', isFirst ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 text-base' : 'bg-primary/10 text-primary')}>
                                {item.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className={cn('text-xs font-semibold text-center', isFirst && 'text-sm')}>{item.user.name.split(' ')[0]}</p>
                          <Badge variant={isFirst ? 'default' : 'secondary'} className="text-xs tabular-nums">{item.score} pts</Badge>
                          <div className={cn('w-20 rounded-t-xl bg-gradient-to-t border-x border-t transition-all', podiumColors[pos], isFirst ? 'h-24' : pos === 2 ? 'h-16' : 'h-12')}>
                            <div className="flex items-center justify-center h-full">
                              <span className={cn('font-bold text-muted-foreground', isFirst ? 'text-2xl' : 'text-lg')}>{pos}º</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Full ranking */}
          {canRead('gamification.ranking') && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Ranking completo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ranking.map((item, i) => {
                  const isMe = item.user.id === user?.id;
                  return (
                    <motion.div
                      key={item.user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className={cn('flex items-center gap-3 p-2 rounded-lg transition-colors cursor-default', isMe && 'bg-primary/5 ring-1 ring-primary/20')}
                    >
                      <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                        i === 1 ? 'bg-slate-300/30 text-slate-600 dark:text-slate-300' :
                        i === 2 ? 'bg-amber-600/20 text-amber-800 dark:text-amber-400' :
                        'bg-muted text-muted-foreground'
                      )}>{i + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {item.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.user.name} {isMe && <span className="text-xs text-muted-foreground">(você)</span>}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.visits} vis</span>
                        <span>{item.prospections} prosp</span>
                        {item.cancellations > 0 && (
                          <span className="text-destructive flex items-center gap-0.5">
                            <Ban className="h-3 w-3" /> {item.cancellations}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="tabular-nums">{item.score} pts</Badge>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Comparisons */}
          {myStats && leader && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Você vs Média</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Você</span><span>{myStats.score} pts</span></div>
                      <Progress value={leader.score > 0 ? (myStats.score / leader.score) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Média</span>
                        <span>{Math.round(ranking.reduce((s, r) => s + r.score, 0) / ranking.length)} pts</span>
                      </div>
                      <Progress value={leader.score > 0 ? ((ranking.reduce((s, r) => s + r.score, 0) / ranking.length) / leader.score) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Você vs Líder</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Você ({myPosition}º)</span><span>{myStats.score} pts</span></div>
                      <Progress value={leader.score > 0 ? (myStats.score / leader.score) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>{leader.user.name.split(' ')[0]} (1º)</span><span>{leader.score} pts</span></div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Conquistas</CardTitle></CardHeader>
            <CardContent>
              {campaignBadges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma campanha ativa no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {campaignBadges.map((badge, i) => {
                    const unlocked = myBadges.includes(badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 * i }}
                        whileHover={unlocked ? { scale: 1.08 } : undefined}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center cursor-default',
                          unlocked ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border opacity-50'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                          {badge.icon}
                        </div>
                        <p className="text-xs font-semibold">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
