import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Campaign, getCampaignStatus,
  getCompletedVisitsForUser, getCompletedProspectionsForUser,
  getCancelledVisitsForUser, calculateUserScore,
} from '@/data/campaigns';
import { getUserById } from '@/data/mock-data';
import {
  GitCompareArrows, ChevronDown, TrendingUp, TrendingDown, Minus,
  Trophy, Eye, Target, Star, Ban, Crown, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartContainer, ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, Legend } from 'recharts';

interface Props {
  campaigns: Campaign[];
  currentCampaignId: string;
}

const COMPARE_COLORS = [
  'hsl(var(--muted-foreground))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
];

function getCampaignKpis(campaign: Campaign) {
  let totalVisits = 0, totalVisitGoal = 0, totalProsp = 0, totalProspGoal = 0, totalCancel = 0, totalScore = 0;
  campaign.participants.forEach(p => {
    totalVisits += getCompletedVisitsForUser(p.userId, campaign.startDate, campaign.endDate);
    totalProsp += getCompletedProspectionsForUser(p.userId, campaign.startDate, campaign.endDate);
    totalCancel += getCancelledVisitsForUser(p.userId, campaign.startDate, campaign.endDate);
    totalScore += calculateUserScore(campaign, p.userId);
    totalVisitGoal += p.visitGoal;
    totalProspGoal += p.prospectionGoal;
  });
  const totalGoal = totalVisitGoal + totalProspGoal;
  const totalDone = totalVisits + totalProsp;
  const rate = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0;
  return { totalVisits, totalVisitGoal, totalProsp, totalProspGoal, totalCancel, totalScore, rate, totalDone, totalGoal };
}

function getRanking(campaign: Campaign) {
  return campaign.participants
    .map(p => {
      const u = getUserById(p.userId);
      if (!u) return null;
      const score = calculateUserScore(campaign, p.userId);
      return { user: u, score };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score) as { user: { id: string; name: string; role: string }; score: number }[];
}

function DiffIndicator({ current, previous, suffix = '', invert = false }: { current: number; previous: number; suffix?: string; invert?: boolean }) {
  if (previous === 0 && current === 0) return <span className="text-[10px] text-muted-foreground">—</span>;
  const diff = current - previous;
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const isPositive = invert ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-semibold",
      isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
    )}>
      {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)}%{suffix}
    </span>
  );
}

export default function CampaignComparison({ campaigns, currentCampaignId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const pastCampaigns = useMemo(() =>
    campaigns.filter(c => getCampaignStatus(c) !== 'Futura' && c.id !== currentCampaignId),
    [campaigns, currentCampaignId]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    pastCampaigns.length > 0 ? [pastCampaigns[0].id] : []
  );

  const toggleCampaign = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId);
  const selectedCampaigns = useMemo(() =>
    selectedIds.map(id => campaigns.find(c => c.id === id)).filter(Boolean) as Campaign[],
    [selectedIds, campaigns]
  );

  const currentKpis = useMemo(() => currentCampaign ? getCampaignKpis(currentCampaign) : null, [currentCampaign]);
  const selectedKpis = useMemo(() =>
    selectedCampaigns.map(c => ({ campaign: c, kpis: getCampaignKpis(c) })),
    [selectedCampaigns]
  );

  const currentRanking = useMemo(() => currentCampaign ? getRanking(currentCampaign) : [], [currentCampaign]);
  const selectedRankings = useMemo(() =>
    selectedCampaigns.map(c => ({ campaign: c, ranking: getRanking(c) })),
    [selectedCampaigns]
  );

  // Bar chart data — one group per metric, one bar per campaign
  const barData = useMemo(() => {
    if (!currentKpis || selectedKpis.length === 0) return [];
    const metrics = [
      { key: 'Visitas', getCurrent: () => currentKpis.totalVisits, getPrev: (k: ReturnType<typeof getCampaignKpis>) => k.totalVisits },
      { key: 'Prospecções', getCurrent: () => currentKpis.totalProsp, getPrev: (k: ReturnType<typeof getCampaignKpis>) => k.totalProsp },
      { key: 'Pontuação', getCurrent: () => currentKpis.totalScore, getPrev: (k: ReturnType<typeof getCampaignKpis>) => k.totalScore },
      { key: 'Cancelamentos', getCurrent: () => currentKpis.totalCancel, getPrev: (k: ReturnType<typeof getCampaignKpis>) => k.totalCancel },
    ];
    return metrics.map(m => {
      const row: Record<string, string | number> = { metric: m.key, atual: m.getCurrent() };
      selectedKpis.forEach(({ campaign, kpis }) => {
        row[campaign.id] = m.getPrev(kpis);
      });
      return row;
    });
  }, [currentKpis, selectedKpis]);

  // Evolution line chart — all campaigns sorted by date
  const evolutionData = useMemo(() => {
    const allCampaigns = [...pastCampaigns].sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (currentCampaign) allCampaigns.push(currentCampaign);
    return allCampaigns.map(c => {
      const kpis = getCampaignKpis(c);
      return {
        name: c.name.replace('Campanha ', '').replace('de ', ''),
        pontuação: kpis.totalScore,
        taxa: kpis.rate,
        visitas: kpis.totalVisits,
      };
    });
  }, [pastCampaigns, currentCampaign]);

  // Podium insights comparing current vs first selected
  const podiumInsights = useMemo(() => {
    if (currentRanking.length === 0 || selectedRankings.length === 0) return [];
    const compareRanking = selectedRankings[0].ranking;
    if (compareRanking.length === 0) return [];
    const insights: { label: string; type: 'up' | 'down' | 'new' }[] = [];

    const currentFirst = currentRanking[0];
    const compareFirst = compareRanking[0];
    if (currentFirst && compareFirst && currentFirst.user.id !== compareFirst.user.id) {
      insights.push({ label: `Novo líder: ${currentFirst.user.name.split(' ')[0]}`, type: 'new' });
    }

    currentRanking.slice(0, 3).forEach((entry, idx) => {
      const prevIdx = compareRanking.findIndex(r => r.user.id === entry.user.id);
      if (prevIdx >= 0 && prevIdx > idx) {
        insights.push({ label: `${entry.user.name.split(' ')[0]} subiu ${prevIdx - idx} posição(ões)`, type: 'up' });
      } else if (prevIdx >= 0 && prevIdx < idx) {
        insights.push({ label: `${entry.user.name.split(' ')[0]} caiu ${idx - prevIdx} posição(ões)`, type: 'down' });
      }
    });

    return insights;
  }, [currentRanking, selectedRankings]);

  // Average of selected for the KPI comparison (when multiple)
  const avgKpis = useMemo(() => {
    if (selectedKpis.length === 0) return null;
    const sum = selectedKpis.reduce((acc, { kpis }) => ({
      totalVisits: acc.totalVisits + kpis.totalVisits,
      totalProsp: acc.totalProsp + kpis.totalProsp,
      totalScore: acc.totalScore + kpis.totalScore,
      totalCancel: acc.totalCancel + kpis.totalCancel,
      rate: acc.rate + kpis.rate,
    }), { totalVisits: 0, totalProsp: 0, totalScore: 0, totalCancel: 0, rate: 0 });
    const n = selectedKpis.length;
    return {
      totalVisits: Math.round(sum.totalVisits / n),
      totalProsp: Math.round(sum.totalProsp / n),
      totalScore: Math.round(sum.totalScore / n * 10) / 10,
      totalCancel: Math.round(sum.totalCancel / n),
      rate: Math.round(sum.rate / n),
    };
  }, [selectedKpis]);

  if (pastCampaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-ds-md text-center text-muted-foreground">
          <GitCompareArrows className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma campanha anterior disponível para comparação</p>
        </CardContent>
      </Card>
    );
  }

  // Dynamic chart config
  const chartConfig: Record<string, { label: string; color: string }> = {
    atual: { label: currentCampaign?.name || 'Atual', color: 'hsl(var(--primary))' },
    pontuação: { label: 'Pontuação', color: 'hsl(var(--primary))' },
    taxa: { label: 'Taxa %', color: 'hsl(var(--success))' },
    visitas: { label: 'Visitas', color: 'hsl(var(--info))' },
  };
  selectedCampaigns.forEach((c, i) => {
    chartConfig[c.id] = { label: c.name, color: COMPARE_COLORS[i % COMPARE_COLORS.length] };
  });
    };
  }, [selectedKpis]);

  const comparisonLabel = selectedCampaigns.length === 1
    ? selectedCampaigns[0].name
    : `Média de ${selectedCampaigns.length} campanhas`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-ds-md hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Comparativo de Campanhas</span>
              {selectedCampaigns.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{selectedCampaigns.length} selecionada{selectedCampaigns.length > 1 ? 's' : ''}</Badge>
              )}
              {!isOpen && currentKpis && avgKpis && (
                <DiffIndicator current={currentKpis.totalScore} previous={avgKpis.totalScore} suffix=" pts" />
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-ds-md pb-ds-md space-y-ds-md"
              >
                {/* Multi-campaign selector */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">Comparar com:</span>
                  <div className="flex flex-wrap gap-3">
                    {pastCampaigns.map((c, i) => {
                      const checked = selectedIds.includes(c.id);
                      const colorIdx = selectedIds.indexOf(c.id);
                      return (
                        <label
                          key={c.id}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs",
                            checked ? "bg-primary/5 border-primary/30" : "border-border hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleCampaign(c.id)}
                            className="h-3.5 w-3.5"
                          />
                          {checked && (
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COMPARE_COLORS[colorIdx % COMPARE_COLORS.length] }}
                            />
                          )}
                          <span className={cn(checked && "font-medium")}>{c.name}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5">
                            {getCampaignStatus(c)}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedCampaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Selecione ao menos uma campanha para comparar
                  </div>
                )}

                {/* KPI Comparison cards */}
                {currentKpis && avgKpis && selectedCampaigns.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-ds-sm">
                    {[
                      { label: 'Visitas', icon: Eye, current: currentKpis.totalVisits, prev: avgKpis.totalVisits, color: 'info' },
                      { label: 'Prospecções', icon: Target, current: currentKpis.totalProsp, prev: avgKpis.totalProsp, color: 'warning' },
                      { label: 'Pontuação', icon: Star, current: currentKpis.totalScore, prev: avgKpis.totalScore, color: 'primary' },
                      { label: 'Cancelamentos', icon: Ban, current: currentKpis.totalCancel, prev: avgKpis.totalCancel, color: 'destructive', invert: true },
                    ].map(item => (
                      <Card key={item.label} className="card-flat">
                        <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <item.icon className={cn("h-3.5 w-3.5", `text-${item.color}`)} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold tabular-nums">{item.current}</span>
                            <span className="text-xs text-muted-foreground">
                              vs {item.prev}{selectedCampaigns.length > 1 && ' (média)'}
                            </span>
                          </div>
                          <DiffIndicator current={item.current} previous={item.prev} invert={item.invert} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Progress comparison — all selected */}
                {currentKpis && selectedKpis.length > 0 && (
                  <Card className="card-flat">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs font-semibold">Taxa de Conclusão</p>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-primary font-medium">{currentCampaign?.name}</span>
                            <span className="font-semibold">{currentKpis.rate}%</span>
                          </div>
                          <Progress value={currentKpis.rate} className="h-2" />
                        </div>
                        {selectedKpis.map(({ campaign, kpis }, i) => (
                          <div key={campaign.id}>
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                                />
                                <span className="text-muted-foreground">{campaign.name}</span>
                              </div>
                              <span className="font-semibold">{kpis.rate}%</span>
                            </div>
                            <Progress
                              value={kpis.rate}
                              className="h-2"
                              style={{ ['--progress-color' as string]: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts */}
                {selectedCampaigns.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm">
                    {/* Bar chart */}
                    {barData.length > 0 && (
                      <Card className="card-flat">
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold mb-2">Comparativo por Métrica</p>
                          <ChartContainer config={chartConfig} className="h-[220px] w-full">
                            <BarChart data={barData} barGap={2}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                              <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip content={<ChartTooltipContent />} />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Bar dataKey="atual" name={currentCampaign?.name} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                              {selectedCampaigns.map((c, i) => (
                                <Bar
                                  key={c.id}
                                  dataKey={c.id}
                                  name={c.name}
                                  fill={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                                  radius={[3, 3, 0, 0]}
                                  maxBarSize={24}
                                />
                              ))}
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Evolution line chart */}
                    {evolutionData.length > 1 && (
                      <Card className="card-flat">
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold mb-2">Evolução entre Campanhas</p>
                          <ChartContainer config={chartConfig} className="h-[220px] w-full">
                            <LineChart data={evolutionData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip content={<ChartTooltipContent />} />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Line type="monotone" dataKey="pontuação" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                              <Line type="monotone" dataKey="visitas" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Podium comparison — current + all selected */}
                {currentRanking.length >= 3 && selectedRankings.some(r => r.ranking.length >= 3) && (
                  <Card className="card-flat">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-yellow-500" /> Pódio Comparativo
                      </p>
                      <div className={cn(
                        "grid gap-ds-sm",
                        selectedCampaigns.length === 1 ? "grid-cols-1 md:grid-cols-2" :
                        selectedCampaigns.length === 2 ? "grid-cols-1 md:grid-cols-3" :
                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                      )}>
                        {/* Current */}
                        <div>
                          <p className="text-[10px] font-medium text-primary mb-2">{currentCampaign?.name}</p>
                          <div className="space-y-1.5">
                            {currentRanking.slice(0, 3).map((entry, idx) => {
                              const firstCompare = selectedRankings[0]?.ranking || [];
                              const prevIdx = firstCompare.findIndex(r => r.user.id === entry.user.id);
                              const posChange = prevIdx >= 0 ? prevIdx - idx : null;
                              return (
                                <div key={entry.user.id} className="flex items-center gap-2 text-xs">
                                  <span className={cn("font-bold w-5", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-700")}>
                                    {idx + 1}º
                                  </span>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                                      {entry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium flex-1 truncate">{entry.user.name.split(' ')[0]}</span>
                                  <Badge variant="secondary" className="text-[10px]">{entry.score} pts</Badge>
                                  {posChange !== null && posChange !== 0 && (
                                    <span className={cn("text-[10px]", posChange > 0 ? "text-success" : "text-destructive")}>
                                      {posChange > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                                      {Math.abs(posChange)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Each selected campaign */}
                        {selectedRankings.map(({ campaign, ranking }, ci) => (
                          ranking.length >= 3 && (
                            <div key={campaign.id}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: COMPARE_COLORS[ci % COMPARE_COLORS.length] }}
                                />
                                <p className="text-[10px] font-medium text-muted-foreground">{campaign.name}</p>
                              </div>
                              <div className="space-y-1.5">
                                {ranking.slice(0, 3).map((entry, idx) => (
                                  <div key={entry.user.id} className="flex items-center gap-2 text-xs opacity-70">
                                    <span className={cn("font-bold w-5", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-700")}>
                                      {idx + 1}º
                                    </span>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[9px] bg-muted text-muted-foreground font-bold">
                                        {entry.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium flex-1 truncate">{entry.user.name.split(' ')[0]}</span>
                                    <Badge variant="outline" className="text-[10px]">{entry.score} pts</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      {/* Insights */}
                      {podiumInsights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                          {podiumInsights.map((insight, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                insight.type === 'new' && "bg-primary/10 text-primary border-primary/20",
                                insight.type === 'up' && "bg-success/10 text-success border-success/20",
                                insight.type === 'down' && "bg-destructive/10 text-destructive border-destructive/20",
                              )}
                            >
                              {insight.type === 'new' && <Crown className="h-3 w-3 mr-1" />}
                              {insight.type === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                              {insight.type === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                              {insight.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Overall insight */}
                {currentKpis && avgKpis && selectedCampaigns.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className={cn(
                      "border-l-4",
                      currentKpis.totalScore > avgKpis.totalScore ? "border-l-success" : currentKpis.totalScore < avgKpis.totalScore ? "border-l-destructive" : "border-l-muted-foreground"
                    )}>
                      <CardContent className="p-3 flex items-center gap-3">
                        {currentKpis.totalScore > avgKpis.totalScore ? (
                          <TrendingUp className="h-5 w-5 text-success shrink-0" />
                        ) : currentKpis.totalScore < avgKpis.totalScore ? (
                          <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold">
                            {currentKpis.totalScore > avgKpis.totalScore
                              ? `+${Math.round(((currentKpis.totalScore - avgKpis.totalScore) / (avgKpis.totalScore || 1)) * 100)}% em relação ${selectedCampaigns.length > 1 ? 'à média' : `à ${comparisonLabel}`}`
                              : currentKpis.totalScore < avgKpis.totalScore
                              ? `${Math.round(((currentKpis.totalScore - avgKpis.totalScore) / (avgKpis.totalScore || 1)) * 100)}% em relação ${selectedCampaigns.length > 1 ? 'à média' : `à ${comparisonLabel}`}`
                              : `Desempenho igual ${selectedCampaigns.length > 1 ? 'à média' : `à ${comparisonLabel}`}`
                            }
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            {currentKpis.totalScore} pts (atual) vs {avgKpis.totalScore} pts ({selectedCampaigns.length > 1 ? 'média' : 'anterior'})
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
