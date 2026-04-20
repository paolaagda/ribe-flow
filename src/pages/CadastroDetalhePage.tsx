import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useRegistrationOperationalData, RegistrationCriticality } from '@/hooks/useRegistrationOperationalData';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { usePermission } from '@/hooks/usePermission';
import PartnerDocuments from '@/components/partners/PartnerDocuments';
import { mockUsers } from '@/data/mock-data';
import { statusColors } from '@/data/registrations';
import AuditTimeline from '@/components/shared/AuditTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Building2, Calendar, Clock, Hash, FileText, Users,
  TrendingUp, AlertTriangle, CheckCircle2, Info, ShieldAlert, ExternalLink,
  ArrowRight, Flag, Landmark,
} from 'lucide-react';

const STATUS_STEPS = [
  'Não iniciado',
  'Colhendo documentação',
  'Em análise',
  'Colhendo assinaturas',
  'Concluído',
];

type CritTone = {
  label: string;
  badge: string;
  border: string;
  bg: string;
  bar: string;
  tile: string;
};

const criticalityConfig: Record<RegistrationCriticality, CritTone> = {
  alta: {
    label: 'Crítico',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    border: 'border-destructive/30',
    bg: 'bg-destructive/5',
    bar: 'bg-gradient-to-b from-destructive to-destructive/60',
    tile: 'bg-destructive/10 text-destructive',
  },
  média: {
    label: 'Atenção',
    badge: 'bg-warning/10 text-warning border-warning/20',
    border: 'border-warning/30',
    bg: 'bg-warning/5',
    bar: 'bg-gradient-to-b from-warning to-warning/60',
    tile: 'bg-warning/10 text-warning',
  },
  baixa: {
    label: 'Regular',
    badge: 'bg-success/10 text-success border-success/20',
    border: 'border-success/30',
    bg: 'bg-success/5',
    bar: 'bg-gradient-to-b from-success to-success/60',
    tile: 'bg-success/10 text-success',
  },
};

export default function CadastroDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { registrations, getById, updateRegistration } = useRegistrations();
  const { getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { getLogsForEntity } = useAuditLog();
  const { getAvatar } = useUserAvatars();
  const { canRead } = usePermission();
  const { getRegData, STAGE_OWNERS } = useRegistrationOperationalData(registrations);

  const reg = id ? getById(id) : undefined;
  const partner = reg ? getPartnerById(reg.partnerId) : undefined;
  const commercial = reg ? mockUsers.find(u => u.id === reg.commercialUserId) : undefined;
  const auditLogs = reg ? getLogsForEntity(reg.id) : [];
  const opData = reg ? getRegData(reg) : null;

  const linkedVisits = useMemo(() => {
    if (!reg) return [];
    return visits.filter(v => v.partnerId === reg.partnerId).slice(0, 5);
  }, [visits, reg]);

  const currentStepIndex = reg ? STATUS_STEPS.indexOf(reg.status) : -1;
  const progressPercent = reg
    ? reg.status === 'Concluído' ? 100
    : reg.status === 'Em pausa' || reg.status === 'Cancelado' ? 0
    : currentStepIndex >= 0 ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
    : 0
    : 0;

  if (!canRead('registration.view')) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-md">Você não tem permissão para acessar esta página.</p>
        </div>
      </PageTransition>
    );
  }

  if (!reg) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">Cadastro não encontrado</h2>
          <Button variant="outline" onClick={() => navigate('/cadastro')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </PageTransition>
    );
  }

  const cc = opData ? criticalityConfig[opData.criticality] : null;
  const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);

  return (
    <PageTransition>
      <div className="space-y-ds-lg">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/cadastro')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Cadastro
        </Button>

        {/* Identity Header — lateral gradient bar by criticality */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <div className="relative">
            <div className={cn('absolute left-0 top-0 bottom-0 w-1', cc?.bar || 'bg-gradient-to-b from-primary to-primary/60')} />
            <CardContent className="p-5 pl-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', cc?.tile || 'bg-primary/10 text-primary')}>
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cadastro</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{reg.bank}</span>
                  </div>
                  <h1 className="text-ds-xl font-bold tracking-tight leading-tight">{partner?.name || 'Parceiro removido'}</h1>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <Badge variant="outline" className={cn('text-[11px] font-medium border', statusColors[reg.status] || 'bg-muted text-muted-foreground border-border')}>
                      {reg.status}
                    </Badge>
                    {cc && (
                      <Badge variant="outline" className={cn('text-[11px] font-medium', cc.badge)}>
                        {cc.label}
                      </Badge>
                    )}
                    {reg.isCritical && (
                      <Badge variant="outline" className="text-[11px] font-medium bg-destructive/10 text-destructive border-destructive/20 gap-1">
                        <Flag className="h-3 w-3" /> Crítico
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[11px] font-medium bg-muted/40 text-muted-foreground border-border/60">
                      {reg.solicitation}
                    </Badge>
                  </div>
                  {commercial && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        {getAvatar(commercial.id) && <AvatarImage src={getAvatar(commercial.id)} />}
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                          {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>Responsável comercial: <span className="text-foreground font-medium">{commercial.name}</span></span>
                    </div>
                  )}
                </div>
                {!isTerminal && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={reg.isCritical ? 'destructive' : 'outline'}
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={() => updateRegistration(reg.id, { isCritical: !reg.isCritical })}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {reg.isCritical ? 'Remover alerta' : 'Marcar crítico'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {reg.isCritical
                        ? 'Remover sinalização crítica manual. O item pode permanecer em Atenção Imediata por outras condições.'
                        : 'Marcar como crítico. O item entrará automaticamente em Atenção Imediata.'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Próxima Ação Banner — lateral bar pattern */}
        {opData && !isTerminal && (
          <div className={cn(
            'relative overflow-hidden rounded-lg border',
            cc?.border || 'border-border',
            cc?.bg || 'bg-primary/5'
          )}>
            <div className={cn('absolute left-0 top-0 bottom-0 w-1', cc?.bar || 'bg-gradient-to-b from-primary to-primary/60')} />
            <div className="flex items-center gap-3 px-4 py-3 pl-5">
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', cc?.tile || 'bg-primary/10 text-primary')}>
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Próxima ação</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{opData.nextAction}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {opData.currentResponsible}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {opData.daysInProcess}d no processo</span>
                  {opData.daysSinceLastUpdate > 0 && (
                    <Badge variant="outline" className={cn(
                      'text-[10px] font-medium',
                      opData.daysSinceLastUpdate > 15
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : opData.daysSinceLastUpdate > 7
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-muted/40 text-muted-foreground border-border/60'
                    )}>
                      {opData.daysSinceLastUpdate}d sem movimentação
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-ds-md">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-ds-md">
            {/* Status e Andamento */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </span>
                  Status e andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <Progress value={progressPercent} className="h-1.5" />
                <div className="flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i === currentStepIndex;
                    const isCompleted = currentStepIndex >= 0 && i < currentStepIndex;
                    const isDone = reg.status === 'Concluído';
                    const owner = STAGE_OWNERS[step] || '—';
                    return (
                      <Tooltip key={step}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div className={cn(
                              'h-3 w-3 rounded-full border-2 transition-colors',
                              isDone || isCompleted ? 'bg-primary border-primary' :
                              isActive ? 'bg-primary border-primary ring-2 ring-primary/30' :
                              'bg-muted border-border'
                            )} />
                            <span className={cn(
                              'text-[9px] text-center leading-tight',
                              isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                            )}>
                              {step.length > 12 ? step.slice(0, 12) + '…' : step}
                            </span>
                            <span className="text-[8px] text-muted-foreground/70 text-center leading-tight">{owner}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{step} — {owner}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {(reg.status === 'Em pausa' || reg.status === 'Cancelado') && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning font-medium">
                      Este cadastro está com status "{reg.status}" e não se enquadra no fluxo padrão.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Gerais */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  Informações gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoItem label="CNPJ" value={reg.cnpj} />
                  <InfoItem label="Solicitado em" value={format(new Date(reg.requestedAt), "dd/MM/yyyy", { locale: ptBR })} />
                  <InfoItem label="Código" value={reg.code || '—'} />
                  <InfoItem label="Tratando com" value={reg.handlingWith} />
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            {opData && opData.totalDocsCount > 0 && (
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60 py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    Documentos
                    {opData.pendingDocsCount > 0 && (
                      <Badge variant="outline" className="text-[10px] font-medium bg-warning/10 text-warning border-warning/20 ml-1">
                        {opData.pendingDocsCount} pendente{opData.pendingDocsCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <PartnerDocuments partnerId={reg.partnerId} />
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {reg.updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {[...reg.updates].reverse().map((upd, i) => {
                      const updUser = mockUsers.find(u => u.id === upd.userId);
                      return (
                        <div key={i} className={cn('flex gap-3 rounded-lg p-3 transition-colors', i === 0 ? 'bg-primary/5 border border-primary/15' : 'hover:bg-muted/30')}>
                          <Avatar className="h-7 w-7 shrink-0">
                            {getAvatar(upd.userId) && <AvatarImage src={getAvatar(upd.userId)} />}
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {updUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-foreground">{updUser?.name.split(' ')[0] || 'Usuário'}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(upd.date), "dd/MM/yy", { locale: ptBR })}{upd.time ? ` · ${upd.time}` : ''}
                              </span>
                              {i === 0 && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-medium">Mais recente</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{upd.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico / Auditoria */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  Histórico de alterações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <AuditTimeline logs={auditLogs} emptyMessage="Nenhuma alteração registrada ainda." />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-ds-md">
            {/* Análises e Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Situação
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {opData && (
                  <>
                    <InsightRow
                      icon={Clock}
                      text={`${opData.daysInProcess} dias no processo`}
                      type="info"
                    />
                    <InsightRow
                      icon={opData.daysSinceLastUpdate > 15 ? AlertTriangle : Clock}
                      text={`${opData.daysSinceLastUpdate} dias sem movimentação`}
                      type={opData.daysSinceLastUpdate > 15 ? 'warning' : opData.daysSinceLastUpdate > 7 ? 'warning' : 'info'}
                    />
                    <InsightRow
                      icon={Users}
                      text={`Responsável: ${opData.currentResponsible}`}
                      type="info"
                    />
                    {opData.pendingDocsCount > 0 && (
                      <InsightRow
                        icon={FileText}
                        text={`${opData.pendingDocsCount} de ${opData.totalDocsCount} documentos pendentes`}
                        type="warning"
                      />
                    )}
                    {reg.status === 'Concluído' && (
                      <InsightRow icon={CheckCircle2} text="Processo concluído com sucesso" type="success" />
                    )}
                    {reg.status === 'Cancelado' && (
                      <InsightRow icon={AlertTriangle} text="Processo cancelado" type="warning" />
                    )}
                    {reg.status === 'Em pausa' && (
                      <InsightRow icon={AlertTriangle} text="Cadastro pausado" type="warning" />
                    )}
                    <InsightRow icon={Info} text={`${reg.updates.length} atualizações registradas`} type="info" />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Agenda Vinculada */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Agenda Vinculada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {linkedVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum compromisso vinculado.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedVisits.map(v => {
                      const vPartner = getPartnerById(v.partnerId);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => navigate('/agenda')}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{vPartner?.name || 'Parceiro'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">{v.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(v.date), "dd/MM/yy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info do Parceiro */}
            {partner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Parceiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <InfoItem label="Razão Social" value={partner.razaoSocial} />
                  <InfoItem label="CNPJ" value={partner.cnpj} />
                  <InfoItem label="Endereço" value={partner.address} />
                  <InfoItem label="Contato" value={partner.contact} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => navigate('/parceiros')}
                  >
                    Ver parceiro completo <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

const insightColors = {
  info: 'text-info bg-info/10',
  warning: 'text-warning bg-warning/10',
  success: 'text-success bg-success/10',
};

function InsightRow({ icon: Icon, text, type }: { icon: any; text: string; type: 'info' | 'warning' | 'success' }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg p-2.5 text-xs', insightColors[type])}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
