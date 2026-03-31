import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip } from 'recharts';

interface Props {
  campaigns: Campaign[];
  currentCampaignId: string;
}

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

  const [compareCampaignId, setCompareCampaignId] = useState<string>(pastCampaigns[0]?.id || '');

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId);
  const compareCampaign = campaigns.find(c => c.id === compareCampaignId);

  const currentKpis = useMemo(() => currentCampaign ? getCampaignKpis(currentCampaign) : null, [currentCampaign]);
  const compareKpis = useMemo(() => compareCampaign ? getCampaignKpis(compareCampaign) : null, [compareCampaign]);

  const currentRanking = useMemo(() => currentCampaign ? getRanking(currentCampaign) : [], [currentCampaign]);
  const compareRanking = useMemo(() => compareCampaign ? getRanking(compareCampaign) : [], [compareCampaign]);

  // Bar chart data
  const barData = useMemo(() => {
    if (!currentKpis || !compareKpis || !currentCampaign || !compareCampaign) return [];
    return [
      { metric: 'Visitas', atual: currentKpis.totalVisits, anterior: compareKpis.totalVisits },
      { metric: 'Prospecções', atual: currentKpis.totalProsp, anterior: compareKpis.totalProsp },
      { metric: 'Pontuação', atual: currentKpis.totalScore, anterior: compareKpis.totalScore },
      { metric: 'Cancelamentos', atual: currentKpis.totalCancel, anterior: compareKpis.totalCancel },
    ];
  }, [currentKpis, compareKpis, currentCampaign, compareCampaign]);

  // Line chart: score evolution across all past campaigns
  const evolutionData = useMemo(() => {
    const sorted = [...pastCampaigns]
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (currentCampaign) sorted.push(currentCampaign);
    return sorted.map(c => {
      const kpis = getCampaignKpis(c);
      return {
        name: c.name.replace('Campanha ', '').replace('de ', ''),
        pontuação: kpis.totalScore,
        taxa: kpis.rate,
        visitas: kpis.totalVisits,
      };
    });
  }, [pastCampaigns, currentCampaign]);

  // Podium comparison highlights
  const podiumInsights = useMemo(() => {
    if (currentRanking.length === 0 || compareRanking.length === 0) return [];
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
  }, [currentRanking, compareRanking]);

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

  const chartConfig = {
    atual: { label: currentCampaign?.name || 'Atual', color: 'hsl(var(--primary))' },
    anterior: { label: compareCampaign?.name || 'Anterior', color: 'hsl(var(--muted-foreground))' },
    pontuação: { label: 'Pontuação', color: 'hsl(var(--primary))' },
    taxa: { label: 'Taxa %', color: 'hsl(var(--success))' },
    visitas: { label: 'Visitas', color: 'hsl(var(--info))' },
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-ds-md hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Comparativo de Campanhas</span>
              {!isOpen && currentKpis && compareKpis && (
                <DiffIndicator current={currentKpis.totalScore} previous={compareKpis.totalScore} suffix=" pts" />
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
                {/* Campaign selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Comparar com:</span>
                  <Select value={compareCampaignId} onValueChange={setCompareCampaignId}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pastCampaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comparison KPI cards */}
                {currentKpis && compareKpis && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-ds-sm">
                    {[
                      { label: 'Visitas', icon: Eye, current: currentKpis.totalVisits, prev: compareKpis.totalVisits, color: 'info' },
                      { label: 'Prospecções', icon: Target, current: currentKpis.totalProsp, prev: compareKpis.totalProsp, color: 'warning' },
                      { label: 'Pontuação', icon: Star, current: currentKpis.totalScore, prev: compareKpis.totalScore, color: 'primary' },
                      { label: 'Cancelamentos', icon: Ban, current: currentKpis.totalCancel, prev: compareKpis.totalCancel, color: 'destructive', invert: true },
                    ].map(item => (
                      <Card key={item.label} className="card-flat">
                        <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <item.icon className={cn("h-3.5 w-3.5", `text-${item.color}`)} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold tabular-nums">{item.current}</span>
                            <span className="text-xs text-muted-foreground">vs {item.prev}</span>
                          </div>
                          <DiffIndicator current={item.current} previous={item.prev} invert={item.invert} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Progress comparison */}
                {currentKpis && compareKpis && (
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
                        <div>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-muted-foreground">{compareCampaign?.name}</span>
                            <span className="font-semibold">{compareKpis.rate}%</span>
                          </div>
                          <Progress value={compareKpis.rate} className="h-2 [&>div]:bg-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm">
                  {/* Bar chart */}
                  {barData.length > 0 && (
                    <Card className="card-flat">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold mb-2">Comparativo por Métrica</p>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                          <BarChart data={barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={28} />
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
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                          <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="pontuação" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="visitas" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Podium comparison */}
                {currentRanking.length >= 3 && compareRanking.length >= 3 && (
                  <Card className="card-flat">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-yellow-500" /> Pódio Comparativo
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm">
                        {/* Current */}
                        <div>
                          <p className="text-[10px] font-medium text-primary mb-2">{currentCampaign?.name}</p>
                          <div className="space-y-1.5">
                            {currentRanking.slice(0, 3).map((entry, idx) => {
                              const prevIdx = compareRanking.findIndex(r => r.user.id === entry.user.id);
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
                        {/* Previous */}
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-2">{compareCampaign?.name}</p>
                          <div className="space-y-1.5">
                            {compareRanking.slice(0, 3).map((entry, idx) => (
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
                {currentKpis && compareKpis && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className={cn(
                      "border-l-4",
                      currentKpis.totalScore > compareKpis.totalScore ? "border-l-success" : currentKpis.totalScore < compareKpis.totalScore ? "border-l-destructive" : "border-l-muted-foreground"
                    )}>
                      <CardContent className="p-3 flex items-center gap-3">
                        {currentKpis.totalScore > compareKpis.totalScore ? (
                          <TrendingUp className="h-5 w-5 text-success shrink-0" />
                        ) : currentKpis.totalScore < compareKpis.totalScore ? (
                          <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold">
                            {currentKpis.totalScore > compareKpis.totalScore
                              ? `+${Math.round(((currentKpis.totalScore - compareKpis.totalScore) / (compareKpis.totalScore || 1)) * 100)}% em relação à ${compareCampaign?.name}`
                              : currentKpis.totalScore < compareKpis.totalScore
                              ? `${Math.round(((currentKpis.totalScore - compareKpis.totalScore) / (compareKpis.totalScore || 1)) * 100)}% em relação à ${compareCampaign?.name}`
                              : `Desempenho igual à ${compareCampaign?.name}`
                            }
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            {currentKpis.totalScore} pts (atual) vs {compareKpis.totalScore} pts (anterior)
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
