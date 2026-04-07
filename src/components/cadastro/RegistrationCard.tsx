import { Registration, statusColors } from '@/data/registrations';
import { mockUsers } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
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
import { PenLine, RefreshCw, Lock, Trash2, FileCheck, ArrowRight, Clock, Users } from 'lucide-react';

interface Props {
  registration: Registration;
  operationalData: RegistrationOperationalData;
  onClick: () => void;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onTogglePause?: () => void;
  onDelete?: () => void;
}

const criticalityBorder: Record<RegistrationCriticality, string> = {
  alta: 'border-l-destructive',
  média: 'border-l-warning',
  baixa: 'border-l-success',
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
        'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-l-[3px]',
        criticalityBorder[operationalData.criticality],
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-0 divide-y divide-border/40">
        {/* Row 1: Partner + Criticality */}
        <div className="flex items-start justify-between gap-2 pb-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{operationalData.partnerName}</h3>
            {commercial && (
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar className="h-4 w-4">
                  {(getAvatar(commercial.id) || commercial.avatar) && <AvatarImage src={getAvatar(commercial.id) || commercial.avatar} />}
                  <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                    {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">{commercial.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className={cn('text-[10px]', cc.className)}>{cc.label}</Badge>
          </div>
        </div>

        {/* Row 2: Badges + operational indicators */}
        <div className="py-2.5 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{registration.bank}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{registration.solicitation}</Badge>
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0', statusColors[registration.status] || 'bg-muted text-muted-foreground')}>
              {registration.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              <span>{registration.handlingWith}</span>
            </div>
            {!isTerminal && operationalData.daysSinceLastUpdate > 7 && (
              <Badge variant="outline" className={cn(
                'text-[10px] gap-1',
                operationalData.daysSinceLastUpdate > 15
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-warning/10 text-warning border-warning/20'
              )}>
                <Clock className="h-2.5 w-2.5" />
                {operationalData.daysSinceLastUpdate}d parado
              </Badge>
            )}
          </div>
        </div>

        {/* Row 3: Next action */}
        <div className="pt-2 pb-2">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{operationalData.nextAction}</span>
          </p>
        </div>

        {/* Row 4: Last update */}
        {lastUpdate && lastUpdateUser && (
          <div className="flex items-center gap-2 pt-2">
            <Avatar className="h-5 w-5 shrink-0">
              {(getAvatar(lastUpdate.userId) || lastUpdateUser?.avatar) && <AvatarImage src={getAvatar(lastUpdate.userId) || lastUpdateUser?.avatar} />}
              <AvatarFallback className="text-[7px] bg-muted">
                {lastUpdateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate">
              {lastUpdateUser.name.split(' ')[0]} · {format(new Date(lastUpdate.date), "dd/MM/yy", { locale: ptBR })}{lastUpdate.time ? ` · ${lastUpdate.time}` : ''}
            </span>
          </div>
        )}

        {/* Contract indicator */}
        {registration.contractConfirmed && (
          <div className="flex items-center gap-1.5 text-success pt-2">
            <FileCheck className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Contrato confirmado</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-1 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleAction(e, onEdit)}>
                <PenLine className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleAction(e, onChangeStatus)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atualizar status</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-7 w-7", isPaused && "text-warning")} onClick={e => handleAction(e, onTogglePause)}>
                <Lock className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPaused ? 'Reativar' : 'Pausar'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => handleAction(e, onDelete)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
