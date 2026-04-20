import { Registration, statusColors } from '@/data/registrations';
import { mockUsers } from '@/data/mock-data';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { RegistrationOperationalData, RegistrationCriticality } from '@/hooks/useRegistrationOperationalData';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PenLine, RefreshCw, Lock, Trash2, FileCheck, ArrowRight, Clock, Users, FileText } from 'lucide-react';

interface Props {
  registration: Registration;
  operationalData: RegistrationOperationalData;
  onClick: () => void;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onTogglePause?: () => void;
  onDelete?: () => void;
}

const criticalityBar: Record<RegistrationCriticality, string> = {
  alta: 'bg-gradient-to-b from-destructive to-destructive/60',
  média: 'bg-gradient-to-b from-warning to-warning/60',
  baixa: 'bg-gradient-to-b from-success to-success/60',
};

const criticalityTile: Record<RegistrationCriticality, string> = {
  alta: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
  média: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  baixa: 'bg-success/10 text-success ring-1 ring-success/20',
};

const criticalityBadge: Record<RegistrationCriticality, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  média: { label: 'Média', className: 'bg-warning/10 text-warning border-warning/20' },
  baixa: { label: 'Baixa', className: 'bg-success/10 text-success border-success/20' },
};

export default function RegistrationCard({ registration, operationalData, onClick, onEdit, onChangeStatus, onTogglePause, onDelete }: Props) {
  const { getAvatar } = useUserAvatars();
  const commercial = mockUsers.find(u => u.id === registration.commercialUserId);
  const lastUpdate = registration.updates.length > 0 ? registration.updates[registration.updates.length - 1] : null;
  const lastUpdateUser = lastUpdate ? mockUsers.find(u => u.id === lastUpdate.userId) : null;
  const isPaused = registration.status === 'Em pausa';

  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  const cc = criticalityBadge[operationalData.criticality];
  const isTerminal = ['Concluído', 'Cancelado'].includes(registration.status);

  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden border-border/60',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border',
      )}
      onClick={onClick}
    >
      {/* Lateral gradient bar by criticality */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', criticalityBar[operationalData.criticality])} />

      <CardContent className="p-4 pl-[18px] space-y-3">
        {/* Header: tile + partner + criticality */}
        <div className="flex items-start gap-2.5">
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', criticalityTile[operationalData.criticality])}>
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[15px] leading-tight truncate text-foreground">{operationalData.partnerName}</h3>
            {commercial && (
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar className="h-4 w-4">
                  {(getAvatar(commercial.id) || commercial.avatar) && <AvatarImage src={getAvatar(commercial.id) || commercial.avatar} />}
                  <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                    {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground truncate">{commercial.name}</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className={cn('text-[10px] shrink-0', cc.className)}>{cc.label}</Badge>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border/60">{registration.bank}</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{registration.solicitation}</Badge>
          <Badge className={cn('text-[10px] px-1.5 py-0 h-5 border-0 font-medium', statusColors[registration.status] || 'bg-muted text-muted-foreground')}>
            {registration.status}
          </Badge>
        </div>

        {/* Operational indicators */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{registration.handlingWith}</span>
          </div>
          {!isTerminal && operationalData.daysSinceLastUpdate > 7 && (
            <Badge variant="outline" className={cn(
              'text-[10px] gap-1 h-5 px-1.5',
              operationalData.daysSinceLastUpdate > 15
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-warning/10 text-warning border-warning/20'
            )}>
              <Clock className="h-2.5 w-2.5" />
              {operationalData.daysSinceLastUpdate}d parado
            </Badge>
          )}
        </div>

        {/* Next action — highlighted */}
        <div className="rounded-md bg-muted/40 border border-border/40 px-2.5 py-1.5">
          <p className="text-[11px] text-foreground/80 flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{operationalData.nextAction}</span>
          </p>
        </div>

        {/* Footer row: last update + contract + actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {lastUpdate && lastUpdateUser ? (
              <>
                <Avatar className="h-5 w-5 shrink-0">
                  {(getAvatar(lastUpdate.userId) || lastUpdateUser?.avatar) && <AvatarImage src={getAvatar(lastUpdate.userId) || lastUpdateUser?.avatar} />}
                  <AvatarFallback className="text-[7px] bg-muted">
                    {lastUpdateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">
                  {lastUpdateUser.name.split(' ')[0]} · {format(new Date(lastUpdate.date), "dd/MM/yy", { locale: ptBR })}{lastUpdate.time ? ` · ${lastUpdate.time}` : ''}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground/60">Sem atualizações</span>
            )}
            {registration.contractConfirmed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileCheck className="h-3.5 w-3.5 text-success shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Contrato confirmado</TooltipContent>
              </Tooltip>
            )}
          </div>

          {(onEdit || onChangeStatus || onTogglePause || onDelete) && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleAction(e, onEdit)}>
                      <PenLine className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
              )}
              {onChangeStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleAction(e, onChangeStatus)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar status</TooltipContent>
                </Tooltip>
              )}
              {onTogglePause && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-7 w-7", isPaused && "text-warning")} onClick={e => handleAction(e, onTogglePause)}>
                      <Lock className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isPaused ? 'Reativar' : 'Pausar'}</TooltipContent>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => handleAction(e, onDelete)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
