import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppNotification } from '@/hooks/useNotifications';
import { getUserById } from '@/data/mock-data';
import { format, parseISO, isToday, isTomorrow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Check, X, Eye, CalendarIcon, Clock, User, Landmark, FileCheck, MailCheck } from 'lucide-react';

interface InviteCardProps {
  notification: AppNotification;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails?: (notification: AppNotification) => void;
  onValidateItem?: (notification: AppNotification) => void;
  onRejectItem?: (notification: AppNotification) => void;
  onMarkAsRead?: (id: string) => void;
  canActOnValidation?: boolean;
}

export default function InviteCard({ notification, onAccept, onReject, onViewDetails, onValidateItem, onRejectItem, onMarkAsRead, canActOnValidation }: InviteCardProps) {
  const fromUser = getUserById(notification.fromUserId);
  const visitDate = notification.date ? parseISO(notification.date) : null;
  const validDate = visitDate && isValid(visitDate);
  const isDateToday = validDate ? isToday(visitDate) : false;
  const isDateTomorrow = validDate ? isTomorrow(visitDate) : false;

  const isPending = notification.status === 'pending';
  const isAccepted = notification.status === 'accepted';
  const isRejected = notification.status === 'rejected';

  const isRegistrationApproval = notification.type === 'registration_approval';
  const isRegistrationResult = notification.type === 'registration_approved' || notification.type === 'registration_rejected';
  const isDocValidation = notification.type === 'doc_validation_submitted' || notification.type === 'doc_validation_rejected';
  const isRegValidation = notification.type === 'reg_validation_submitted' || notification.type === 'reg_validation_rejected';
  const isValidationNotif = isDocValidation || isRegValidation;
  // Highlight if created within last 5 seconds
  const isNew = useMemo(() => {
    const created = new Date(notification.createdAt).getTime();
    return Date.now() - created < 5000;
  }, [notification.createdAt]);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-200',
        isPending && !isRegistrationApproval && !isValidationNotif && 'bg-card hover:shadow-md hover:-translate-y-0.5 border-primary/20',
        isPending && isRegistrationApproval && 'bg-card hover:shadow-md hover:-translate-y-0.5 border-warning/30 bg-warning/5',
        isAccepted && 'bg-muted/30 border-border',
        isRejected && 'bg-muted/20 border-border opacity-60',
        !notification.read && isPending && !isRegistrationApproval && !isValidationNotif && 'ring-1 ring-primary/30',
        !notification.read && isPending && isRegistrationApproval && 'ring-1 ring-warning/40',
        isRegistrationResult && !notification.read && 'bg-card border-primary/20',
        isValidationNotif && !notification.read && 'bg-card border-info/20 ring-1 ring-info/20',
        isValidationNotif && notification.read && 'bg-muted/30 border-border',
        isNew && 'notification-new',
      )}
    >
      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-2">
        {isRegistrationApproval && isPending && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-warning text-foreground">Aprovação Pendente</Badge>
        )}
        {isRegistrationApproval && isAccepted && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-success/20">Aprovado</Badge>
        )}
        {isRegistrationApproval && isRejected && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">Recusado</Badge>
        )}
        {notification.type === 'registration_approved' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-success/20">Cadastro Aprovado</Badge>
        )}
        {notification.type === 'registration_rejected' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">Cadastro Recusado</Badge>
        )}
        {notification.bankName && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Landmark className="h-2.5 w-2.5" /> {notification.bankName}
          </Badge>
        )}
        {notification.type === 'doc_validation_submitted' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/20">📄 Doc em validação</Badge>
        )}
        {notification.type === 'doc_validation_rejected' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">📄 Doc devolvido</Badge>
        )}
        {notification.type === 'reg_validation_submitted' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/20">🏦 Cadastro em validação</Badge>
        )}
        {notification.type === 'reg_validation_rejected' && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">🏦 Cadastro devolvido</Badge>
        )}
        {notification.docName && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {notification.docName}
          </Badge>
        )}
        {!isRegistrationApproval && !isRegistrationResult && !isValidationNotif && (
          <>
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
          </>
        )}
        {isRejected && notification.rejectionReason && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/20 text-muted-foreground">
            {notification.rejectionReason}
          </Badge>
        )}
      </div>

      {/* Message */}
      <p className="text-sm leading-snug mb-2">{notification.message}</p>

      {/* Partner name highlighted */}
      <p className="text-xs font-semibold text-primary mb-1.5">{notification.partnerName}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
        {validDate && (
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {format(visitDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        )}
        {notification.time && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {notification.time}
          </span>
        )}
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {fromUser?.name}
        </span>
      </div>

      {/* Actions */}
      {isPending && isRegistrationApproval && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => onAccept(notification.id)}
          >
            <FileCheck className="h-3 w-3" />
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs gap-1"
            onClick={() => onReject(notification.id)}
          >
            <X className="h-3 w-3" />
            Recusar
          </Button>
        </div>
      )}

      {isPending && !isRegistrationApproval && notification.type === 'invite' && (
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

      {/* Validation actions for Cadastro on submitted items */}
      {canActOnValidation && (notification.type === 'doc_validation_submitted' || notification.type === 'reg_validation_submitted') && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => onValidateItem?.(notification)}
          >
            <Check className="h-3 w-3" />
            Validar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs gap-1"
            onClick={() => onRejectItem?.(notification)}
          >
            <X className="h-3 w-3" />
            Recusar
          </Button>
        </div>
      )}
    </div>
  );
}
