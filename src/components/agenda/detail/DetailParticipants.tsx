import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserById, cargoLabels } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Users, Plus, Check, X } from 'lucide-react';

interface InvitedUser {
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface InvitableUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface DetailParticipantsProps {
  invitedUsers: InvitedUser[];
  canEditFields: boolean;
  invitableUsers: InvitableUser[];
  myInviteStatus: string | null;
  isResponsibleCommercial: boolean;
  getAvatar: (userId: string) => string | undefined;
  onAddInvitee: (userId: string) => void;
  onRemoveInvitee: (userId: string) => void;
  onAcceptInvite?: (visitId: string) => void;
  onRejectInvite?: (visitId: string) => void;
  visitId: string;
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
  accepted: { label: 'Confirmado', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Recusado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function DetailParticipants({
  invitedUsers, canEditFields, invitableUsers, myInviteStatus,
  isResponsibleCommercial, getAvatar,
  onAddInvitee, onRemoveInvitee, onAcceptInvite, onRejectInvite, visitId,
}: DetailParticipantsProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAdd = (userId: string) => {
    onAddInvitee(userId);
    setPopoverOpen(false);
  };

  return (
    <div className="px-5 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Participantes
        </div>
        {canEditFields && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-5 w-5 rounded-full border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground">
                <Plus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1.5 max-h-52 overflow-y-auto" align="end">
              {invitableUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum usuário disponível</p>
              ) : (
                invitableUsers.map(u => (
                  <button
                    key={u.id}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                    onClick={() => handleAdd(u.id)}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="text-[8px]">{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{u.name}</span>
                    <Badge variant="secondary" className="text-[9px] px-1">{cargoLabels[u.role]}</Badge>
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {invitedUsers.length > 0 && (
        <div className="space-y-1.5">
          {invitedUsers.map(iu => {
            const invitedUser = getUserById(iu.userId);
            if (!invitedUser) return null;
            const initials = invitedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const badge = statusBadgeMap[iu.status];
            return (
              <div key={iu.userId} className="flex items-center gap-2 group">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6">
                      {(getAvatar(iu.userId) || invitedUser?.avatar) && <AvatarImage src={getAvatar(iu.userId) || invitedUser?.avatar} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent><p>{badge.label}</p></TooltipContent>
                </Tooltip>
                <span className="text-sm flex-1 truncate">{invitedUser.name}</span>
                <Badge variant="secondary" className="text-[10px] capitalize">{cargoLabels[invitedUser.role]}</Badge>
                <Badge variant="outline" className={cn('text-[10px]', badge.className)}>
                  {badge.label}
                </Badge>
                {canEditFields && (
                  <button
                    className="h-4 w-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => onRemoveInvitee(iu.userId)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {myInviteStatus === 'pending' && onAcceptInvite && onRejectInvite && (
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs" onClick={() => onAcceptInvite(visitId)}>
            <Check className="h-3.5 w-3.5" /> Aceitar convite
          </Button>
          <Button size="sm" variant="secondary" className="gap-1 h-7 text-xs" onClick={() => onRejectInvite(visitId)}>
            <X className="h-3.5 w-3.5" /> Rejeitar
          </Button>
        </div>
      )}
    </div>
  );
}
