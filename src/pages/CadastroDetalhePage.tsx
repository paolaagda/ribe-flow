import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import { useRegistrations } from '@/hooks/useRegistrations';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { usePermission } from '@/hooks/usePermission';
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
} from 'lucide-react';

const STATUS_STEPS = [
  'Não iniciado',
  'Colhendo documentação',
  'Em análise',
  'Colhendo assinaturas',
  'Concluído',
];

export default function CadastroDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById } = useRegistrations();
  const { getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { getLogsForEntity } = useAuditLog();
  const { getAvatar } = useUserAvatars();
  const { canRead } = usePermission();

  const reg = id ? getById(id) : undefined;
  const partner = reg ? getPartnerById(reg.partnerId) : undefined;
  const commercial = reg ? mockUsers.find(u => u.id === reg.commercialUserId) : undefined;
  const auditLogs = reg ? getLogsForEntity(reg.id) : [];

  const linkedVisits = useMemo(() => {
    if (!reg) return [];
    return visits.filter(v => v.partnerId === reg.partnerId).slice(0, 5);
  }, [visits, reg]);

  const insights = useMemo(() => {
    if (!reg) return [];
    const items: { icon: any; text: string; type: 'info' | 'warning' | 'success' }[] = [];
    const daysSinceCreation = differenceInDays(new Date(), new Date(reg.requestedAt));
    const updateCount = reg.updates.length;

    if (reg.status === 'Concluído') {
      items.push({ icon: CheckCircle2, text: 'Processo concluído com sucesso', type: 'success' });
    } else if (reg.status === 'Cancelado') {
      items.push({ icon: AlertTriangle, text: 'Processo cancelado', type: 'warning' });
    } else if (reg.status === 'Em pausa') {
      items.push({ icon: AlertTriangle, text: `Cadastro pausado há ${daysSinceCreation} dias`, type: 'warning' });
    } else if (daysSinceCreation > 30) {
      items.push({ icon: AlertTriangle, text: `Cadastro parado há ${daysSinceCreation} dias`, type: 'warning' });
    } else {
      items.push({ icon: TrendingUp, text: 'Processo avançando normalmente', type: 'info' });
    }

    if (updateCount > 5) {
      items.push({ icon: Info, text: `Muitas atualizações (${updateCount})`, type: 'info' });
    }

    items.push({ icon: Clock, text: `${daysSinceCreation} dias no processo`, type: 'info' });
    items.push({ icon: FileText, text: `${updateCount} atualizações registradas`, type: 'info' });

    return items;
  }, [reg]);

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

  const insightColors = {
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  };

  return (
    <PageTransition>
      <div className="space-y-ds-lg">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/cadastro')} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Cadastro
        </Button>

        {/* Header */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-ds-xl font-bold tracking-tight">{partner?.name || 'Parceiro removido'}</h1>
                  <Badge variant="outline" className="text-xs">{reg.bank}</Badge>
                  <Badge className={cn('text-xs border-0 font-semibold', statusColors[reg.status] || 'bg-muted text-muted-foreground')}>
                    {reg.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span>{reg.solicitation}</span>
                  {commercial && (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        {getAvatar(commercial.id) && <AvatarImage src={getAvatar(commercial.id)} />}
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                          {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{commercial.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-ds-md">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-ds-md">
            {/* Informações Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoItem label="CNPJ" value={reg.cnpj} />
                  <InfoItem label="Solicitado em" value={format(new Date(reg.requestedAt), "dd/MM/yyyy", { locale: ptBR })} />
                  <InfoItem label="Código" value={reg.code || '—'} />
                  <InfoItem label="Tratando com" value={reg.handlingWith} />
                </div>
              </CardContent>
            </Card>

            {/* Status e Andamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Status e Andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i === currentStepIndex;
                    const isCompleted = currentStepIndex >= 0 && i < currentStepIndex;
                    const isDone = reg.status === 'Concluído';
                    return (
                      <Tooltip key={step}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 flex-1">
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
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{step}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {(reg.status === 'Em pausa' || reg.status === 'Cancelado') && (
                  <p className="text-xs text-warning font-medium">
                    ⚠ Este cadastro está com status "{reg.status}" e não se enquadra no fluxo padrão.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {reg.updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {[...reg.updates].reverse().map((upd, i) => {
                      const updUser = mockUsers.find(u => u.id === upd.userId);
                      return (
                        <div key={i} className={cn('flex gap-3', i === 0 && 'bg-accent/50 rounded-lg p-3 -mx-1')}>
                          <Avatar className="h-7 w-7 shrink-0">
                            {getAvatar(upd.userId) && <AvatarImage src={getAvatar(upd.userId)} />}
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {updUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{updUser?.name.split(' ')[0] || 'Usuário'}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(upd.date), "dd/MM/yy", { locale: ptBR })}{upd.time ? ` · ${upd.time}` : ''}
                              </span>
                              {i === 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0">Mais recente</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{upd.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico / Auditoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
                  <TrendingUp className="h-4 w-4 text-primary" /> Análises e Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {insights.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={cn('flex items-start gap-2 rounded-lg p-2.5 text-xs', insightColors[item.type])}>
                      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  );
                })}
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
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma agenda vinculada.</p>
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
