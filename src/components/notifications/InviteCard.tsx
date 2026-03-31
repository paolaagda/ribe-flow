import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppNotification } from '@/hooks/useNotifications';
import { getUserById } from '@/data/mock-data';
import { format, parseISO, isToday, isTomorrow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, X, Eye, CalendarIcon, Clock, User } from 'lucide-react';

interface InviteCardProps {
  notification: AppNotification;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails?: (notification: AppNotification) => void;
}

export default function InviteCard({ notification, onAccept, onReject, onViewDetails }: InviteCardProps) {
  const fromUser = getUserById(notification.fromUserId);
  const visitDate = notification.date ? parseISO(notification.date) : null;
  const validDate = visitDate && isValid(visitDate);
  const isDateToday = validDate ? isToday(visitDate) : false;
  const isDateTomorrow = validDate ? isTomorrow(visitDate) : false;

  const isPending = notification.status === 'pending';
  const isAccepted = notification.status === 'accepted';
  const isRejected = notification.status === 'rejected';

  // Highlight if created within last 5 seconds
  const isNew = useMemo(() => {
    const created = new Date(notification.createdAt).getTime();
    return Date.now() - created < 5000;
  }, [notification.createdAt]);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-200',
        isPending && 'bg-card hover:shadow-md hover:-translate-y-0.5 border-primary/20',
        isAccepted && 'bg-muted/30 border-border',
        isRejected && 'bg-muted/20 border-border opacity-60',
        !notification.read && isPending && 'ring-1 ring-primary/30',
        isNew && 'notification-new',
      )}
    >
      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-2">
        {isDateToday && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-destructive text-destructive-foreground">Hoje</Badge>
        )}
        {isDateTomorrow && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-warning text-foreground">Amanhã</Badge>
        )}
        {isAccepted && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-success/20">Confirmado</Badge>
        )}
        {isRejected && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">Recusado</Badge>
        )}
      </div>

      {/* Message */}
      <p className="text-sm leading-snug mb-2">{notification.message}</p>

      {/* Partner name highlighted */}
      <p className="text-xs font-semibold text-primary mb-1.5">{notification.partnerName}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          {validDate ? format(visitDate, "dd/MM/yyyy", { locale: ptBR }) : 'Data indefinida'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {notification.time}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {fromUser?.name}
        </span>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onAccept(notification.id)}
          >
            <Check className="h-3 w-3" />
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs gap-1"
            onClick={() => onReject(notification.id)}
          >
            <X className="h-3 w-3" />
            Rejeitar
          </Button>
          {onViewDetails && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 ml-auto"
              onClick={() => onViewDetails(notification)}
            >
              <Eye className="h-3 w-3" />
              Detalhes
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
