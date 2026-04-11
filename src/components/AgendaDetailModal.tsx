import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Visit, getUserById, statusBgClasses, cargoLabels } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, MapPin, User, Pencil, Building2, Landmark, Package, Users, LogOut, Check, X, Trash2, DollarSign, AlertTriangle, Handshake, UserPlus, FileText, CalendarPlus, ListTodo } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCentavos } from '@/lib/currency';
import AgendaComments from '@/components/agenda/AgendaComments';
import { useRegistrationBadge } from '@/hooks/useRegistrationBadge';

interface AgendaDetailModalProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (visit: Visit) => void;
  onDelete?: (visitId: string) => void;
  onAcceptInvite?: (visitId: string) => void;
  onRejectInvite?: (visitId: string) => void;
  onLeaveVisit?: (visitId: string) => void;
  onAddComment?: (visitId: string, text: string, type: 'observation' | 'task', parentId?: string) => void;
  onToggleTask?: (visitId: string, commentId: string) => void;
  onScheduleFollowUp?: (partnerId: string) => void;
}

export default function AgendaDetailModal({ visit, open, onOpenChange, onEdit, onDelete, onAcceptInvite, onRejectInvite, onLeaveVisit, onAddComment, onToggleTask, onScheduleFollowUp }: AgendaDetailModalProps) {
  const { canWrite } = usePermission();
  const { user } = useAuth();
  const { getAvatar } = useUserAvatars();
  const { getPartnerById } = usePartners();
  const { visits } = useVisits();
  const { hasActive, activeCount, regs } = useRegistrationBadge(visit?.partnerId);
  const commentsRef = useRef<HTMLDivElement>(null);
  if (!visit) return null;

  const partner = getPartnerById(visit.partnerId);
  const visitUser = getUserById(visit.userId);
  const typeLabel = visit.type === 'visita' ? 'Visita' : 'Prospecção';

  const myInvite = user ? visit.invitedUsers?.find(iu => iu.userId === user.id) : null;
  const isResponsibleCommercial = user?.id === visit.userId;
  const FINAL_STATUSES = ['Concluída', 'Cancelada', 'Inconclusa'];
  const isStatusLocked = user?.role === 'comercial' && FINAL_STATUSES.includes(visit.status);
  const canEditVisit = canWrite('agenda.edit') && (isResponsibleCommercial || user?.id === visit.createdBy || user?.role !== 'comercial') && !isStatusLocked;

  // Calculate last visit to this partner
  const lastVisitInfo = partner && visit.type === 'visita' ? (() => {
    const lastConcluded = visits
      .filter(v => v.partnerId === visit.partnerId && v.status === 'Concluída' && v.id !== visit.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastConcluded) return 'Primeira visita';
    const days = Math.floor((Date.now() - new Date(lastConcluded.date).getTime()) / 86400000);
    return `Última visita: ${days}d atrás`;
  })() : null;

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
    accepted: { label: 'Confirmado', className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Recusado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Detalhes da Agenda</span>
            <Badge variant="outline" className={cn('text-[10px] capitalize', statusBgClasses[visit.status])}>
              {visit.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Partner & Type */}
          <div>
            <p className="text-base font-semibold">{partner?.name || visit.prospectPartner}</p>
            <p className="text-xs text-muted-foreground">{partner?.address || visit.prospectAddress}</p>
            {/* Visual aids: potential + last visit */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {partner && visit.type === 'visita' && (
                <Badge variant="outline" className={cn(
                  'text-[9px] w-4 h-4 p-0 flex items-center justify-center font-bold',
                  partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
                  partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
                  partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-muted text-muted-foreground border-muted-foreground/20'
                )}>{partner.partnerClass}</Badge>
              )}
              {partner && (
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 capitalize",
                  partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                  partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                  'bg-muted/50 text-muted-foreground border-border/30'
                )}>Potencial {partner.potential}</Badge>
              )}
              {lastVisitInfo && (
                <span className="text-[10px] text-muted-foreground/70">{lastVisitInfo}</span>
              )}
            </div>
          </div>

          {/* Missing summary banner */}
          {visit.status === 'Concluída' && !visit.summary?.trim() && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">Resumo da visita ainda não preenchido</p>
              {canEditVisit && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onEdit(visit)}>
                  Editar
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{format(parseISO(visit.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="outline" className="text-[10px] capitalize">{visit.period}</Badge>
              {visit.time ? (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.time}</span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/60"><Clock className="h-3 w-3" />Sem horário</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{visitUser?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-xs capitalize gap-1', visit.type === 'visita' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning')}>
                {visit.type === 'visita' ? <Handshake className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {typeLabel}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">{visit.medio}</Badge>
            </div>
          </div>

          {/* Potential Value */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            {visit.potentialValue ? (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold',
                  visit.potentialValue >= 1000000
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'text-foreground',
                )}
              >
                {formatCentavos(visit.potentialValue)}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">Potencial não informado</span>
            )}
          </div>

          {/* Registration indicator */}
          {hasActive && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-info/10 border border-info/20 text-sm">
              <FileText className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-info">Cadastro em andamento ({activeCount})</p>
                {regs.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[9px]">{r.bank}</Badge>
                    <span>{r.status}</span>
                    <span>• {r.handlingWith}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reschedule/Cancel Reason */}
          {visit.status === 'Reagendada' && visit.rescheduleReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-warning">Motivo do reagendamento</p>
                <p className="text-sm">{visit.rescheduleReason}</p>
              </div>
            </div>
          )}

          {visit.status === 'Cancelada' && visit.cancelReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">Motivo do cancelamento</p>
                <p className="text-sm">{visit.cancelReason}</p>
              </div>
            </div>
          )}

          {/* Structures */}
          {visit.structures.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Estrutura da loja
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visit.structures.map(s => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Banks */}
          {visit.banks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Bancos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visit.banks.map(b => (
                  <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {visit.products.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Produtos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visit.products.map(p => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {visit.summary && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Resumo da visita</p>
              <p className="text-sm bg-muted/50 rounded-md p-2">{visit.summary}</p>
            </div>
          )}


          {/* Inconclusive reason */}
          {visit.status === 'Inconclusa' && visit.inconclusiveReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Motivo da agenda inconclusa</p>
                <p className="text-sm">{visit.inconclusiveReason}</p>
              </div>
            </div>
          )}
          {visit.invitedUsers && visit.invitedUsers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Participantes
                </div>
                <div className="space-y-1.5">
                  {visit.invitedUsers.map(iu => {
                    const invitedUser = getUserById(iu.userId);
                    if (!invitedUser) return null;
                    const initials = invitedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    const badge = statusBadgeMap[iu.status];
                    return (
                      <div key={iu.userId} className="flex items-center gap-2">
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
                        <span className="text-sm flex-1">{invitedUser.name}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">{cargoLabels[invitedUser.role]}</Badge>
                        <Badge variant="outline" className={cn('text-[10px]', badge.className)}>
                          {badge.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Invite actions for current user */}
          {myInvite?.status === 'pending' && onAcceptInvite && onRejectInvite && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onAcceptInvite(visit.id)}>
                <Check className="h-3.5 w-3.5" /> Aceitar convite
              </Button>
              <Button size="sm" variant="secondary" className="gap-1" onClick={() => onRejectInvite(visit.id)}>
                <X className="h-3.5 w-3.5" /> Rejeitar
              </Button>
            </div>
          )}

          {/* Comments */}
          <Separator />
          <div ref={commentsRef}>
            {onAddComment && onToggleTask && (
              <AgendaComments
                comments={visit.comments || []}
                onAddComment={(text, type, parentId) => onAddComment(visit.id, text, type, parentId)}
                onToggleTask={(commentId) => onToggleTask(visit.id, commentId)}
              />
            )}
          </div>

          {/* Quick actions for completed visits */}
          {visit.status === 'Concluída' && canWrite('agenda.create') && (onScheduleFollowUp || onToggleTask) && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                {onScheduleFollowUp && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onScheduleFollowUp(visit.partnerId)}>
                    <CalendarPlus className="h-3.5 w-3.5" /> Agendar follow-up
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                  commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
                  // Focus the task input after scrolling
                  setTimeout(() => {
                    const taskInput = commentsRef.current?.querySelector('input, textarea') as HTMLElement;
                    taskInput?.focus();
                  }, 400);
                }}>
                  <ListTodo className="h-3.5 w-3.5" /> Nova tarefa
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {myInvite?.status === 'accepted' && !isResponsibleCommercial && onLeaveVisit && (
            <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { onLeaveVisit(visit.id); onOpenChange(false); }}>
              <LogOut className="h-3.5 w-3.5" /> Sair da agenda
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {canEditVisit && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir visita</AlertDialogTitle>
                    <AlertDialogDescription>Tem certeza que deseja excluir esta visita? Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete(visit.id); onOpenChange(false); }}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canEditVisit && (
              <Button onClick={() => onEdit(visit)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Editar agenda
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
