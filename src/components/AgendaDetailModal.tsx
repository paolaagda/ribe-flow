import { useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Visit, VisitComment, getUserById, statusBgClasses, cargoLabels } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useInfoData } from '@/hooks/useInfoData';
import { useSystemData } from '@/hooks/useSystemData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, MapPin, User, Pencil, Building2, Landmark, Package, Users, LogOut, Check, X, Trash2, DollarSign, AlertTriangle, Handshake, UserPlus, FileText, CalendarPlus, ListTodo, Plus } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCentavos } from '@/lib/currency';
import AgendaComments from '@/components/agenda/AgendaComments';
import { useRegistrationBadge } from '@/hooks/useRegistrationBadge';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import BankRegistrationFlow from '@/components/agenda/BankRegistrationFlow';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Team, initialTeams } from '@/data/teams';
import { useToast } from '@/hooks/use-toast';

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
  const { visits, setVisits } = useVisits();
  const { getActiveBanks } = useInfoData();
  const { getActiveItems } = useSystemData();
  const { hasActive, activeCount, regs } = useRegistrationBadge(visit?.partnerId);
  const commentsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [banksPopoverOpen, setBanksPopoverOpen] = useState(false);
  const [productsPopoverOpen, setProductsPopoverOpen] = useState(false);

  if (!visit) return null;

  const partner = getPartnerById(visit.partnerId);
  const visitUser = getUserById(visit.userId);
  const typeLabel = visit.type === 'visita' ? 'Visita' : 'Prospecção';
  const TypeIcon = visit.type === 'visita' ? Handshake : UserPlus;

  const myInvite = user ? visit.invitedUsers?.find(iu => iu.userId === user.id) : null;
  const isResponsibleCommercial = user?.id === visit.userId;
  const FINAL_STATUSES = ['Concluída', 'Cancelada', 'Inconclusa'];
  const isStatusLocked = user?.role === 'comercial' && FINAL_STATUSES.includes(visit.status);
  const canEditVisit = canWrite('agenda.edit') && (isResponsibleCommercial || user?.id === visit.createdBy || user?.role !== 'comercial') && !isStatusLocked;

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

  const partnerName = partner?.name || visit.prospectPartner;
  const partnerAddress = partner?.address || visit.prospectAddress;

  const handlePartnerClick = () => {
    if (partner) {
      onOpenChange(false);
      navigate(`/parceiros?id=${partner.id}`);
    }
  };

  // ── Inline update helpers ──
  const updateVisit = (updates: Partial<Visit>) => {
    setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, ...updates } : v));
  };

  const handleSaveSummary = () => {
    updateVisit({ summary: summaryDraft.trim() });
    setEditingSummary(false);
  };

  const handleStartEditSummary = () => {
    setSummaryDraft(visit.summary || '');
    setEditingSummary(true);
  };

  const handleAddBank = (bankName: string) => {
    if (!visit.banks.includes(bankName)) {
      updateVisit({ banks: [...visit.banks, bankName] });
    }
    setBanksPopoverOpen(false);
  };

  const handleRemoveBank = (bankName: string) => {
    updateVisit({ banks: visit.banks.filter(b => b !== bankName) });
  };

  const handleAddProduct = (productName: string) => {
    if (!visit.products.includes(productName)) {
      updateVisit({ products: [...visit.products, productName] });
    }
    setProductsPopoverOpen(false);
  };

  const handleRemoveProduct = (productName: string) => {
    updateVisit({ products: visit.products.filter(p => p !== productName) });
  };

  // Available options (active only, not already selected)
  const availableBanks = getActiveBanks().filter(b => !visit.banks.includes(b.name));
  const availableProducts = getActiveItems('products').filter(p => !visit.products.includes(p));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
        {/* ── Header: Type icon + Status + Partner name ── */}
        <div className="px-5 pt-5 pb-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-xs capitalize gap-1.5 px-2 py-0.5', visit.type === 'visita' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning')}>
              <TypeIcon className="h-3.5 w-3.5" />
              {typeLabel}
            </Badge>
            <Badge variant="outline" className={cn('text-[10px] capitalize', statusBgClasses[visit.status])}>
              {visit.status}
            </Badge>
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
          </div>

          {/* Partner name – clickable */}
          <div>
            {partner ? (
              <button
                onClick={handlePartnerClick}
                className="text-left text-base font-bold leading-snug hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                {partnerName}
              </button>
            ) : (
              <p className="text-base font-bold leading-snug">{partnerName}</p>
            )}
            {lastVisitInfo && (
              <span className="text-[10px] text-muted-foreground/70 block mt-0.5">{lastVisitInfo}</span>
            )}
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* ── Partner summary block ── */}
        <div className="px-5 py-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {partnerAddress && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{partnerAddress}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Comercial: <span className="font-medium text-foreground">{visitUser?.name || '—'}</span></span>
            </div>
            {partner?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">{partner.phone}</span>
              </div>
            )}
          </div>

          {/* Structures – now part of the top summary */}
          {visit.structures.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {visit.structures.map(s => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>

        <Separator className="opacity-50" />

        {/* ── Visit details ── */}
        <div className="px-5 py-3 space-y-4">
          {/* Date, period, time, medio */}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">{visit.medio}</Badge>
            </div>
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
          </div>

          {/* Missing summary banner */}
          {visit.status === 'Concluída' && !visit.summary?.trim() && !editingSummary && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">Resumo da visita ainda não preenchido</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleStartEditSummary}>
                Preencher
              </Button>
            </div>
          )}

          {/* Reschedule/Cancel/Inconclusive reasons */}
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

          {visit.status === 'Inconclusa' && visit.inconclusiveReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Motivo do compromisso inconcluso</p>
                <p className="text-sm">{visit.inconclusiveReason}</p>
              </div>
            </div>
          )}

          {/* ── Banks (editable) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Bancos
              </div>
              <Popover open={banksPopoverOpen} onOpenChange={setBanksPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1.5 max-h-52 overflow-y-auto" align="end">
                  {availableBanks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Todos os bancos já adicionados</p>
                  ) : (
                    availableBanks.map(b => (
                      <button
                        key={b.id}
                        className="flex items-center w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                        onClick={() => handleAddBank(b.name)}
                      >
                        {b.name}
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visit.banks.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">Nenhum banco selecionado</span>
              ) : (
                visit.banks.map(b => (
                  <Badge
                    key={b}
                    variant="outline"
                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group"
                    onClick={() => handleRemoveBank(b)}
                  >
                    {b}
                    <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* ── Products (editable) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Produtos
              </div>
              <Popover open={productsPopoverOpen} onOpenChange={setProductsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1.5 max-h-52 overflow-y-auto" align="end">
                  {availableProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Todos os produtos já adicionados</p>
                  ) : (
                    availableProducts.map(p => (
                      <button
                        key={p}
                        className="flex items-center w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                        onClick={() => handleAddProduct(p)}
                      >
                        {p}
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visit.products.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">Nenhum produto selecionado</span>
              ) : (
                visit.products.map(p => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors group"
                    onClick={() => handleRemoveProduct(p)}
                  >
                    {p}
                    <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))
              )}
            </div>
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

          {/* ── Summary (editable) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Resumo da visita</p>
              {!editingSummary && (
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground" onClick={handleStartEditSummary}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingSummary ? (
              <div className="space-y-2">
                <Textarea
                  value={summaryDraft}
                  onChange={e => setSummaryDraft(e.target.value)}
                  placeholder="Escreva o resumo da visita..."
                  className="min-h-[60px] text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveSummary}>
                    <Check className="h-3 w-3" /> Salvar
                  </Button>
                </div>
              </div>
            ) : (
              visit.summary?.trim() ? (
                <p className="text-sm bg-muted/50 rounded-md p-2 cursor-pointer hover:bg-muted/70 transition-colors" onClick={handleStartEditSummary}>{visit.summary}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic cursor-pointer hover:text-foreground transition-colors" onClick={handleStartEditSummary}>Clique para adicionar um resumo</p>
              )
            )}
          </div>

          {/* Participants */}
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

          {/* Invite actions */}
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

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2">
          {myInvite?.status === 'accepted' && !isResponsibleCommercial && onLeaveVisit && (
            <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { onLeaveVisit(visit.id); onOpenChange(false); }}>
              <LogOut className="h-3.5 w-3.5" /> Sair do compromisso
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
                <Pencil className="h-3.5 w-3.5" /> Editar compromisso
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}