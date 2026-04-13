import { useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Visit, VisitComment, VisitStatus, VisitPeriod, VisitMedio, getUserById, mockUsers, statusBgClasses, cargoLabels } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useInfoData } from '@/hooks/useInfoData';
import { useSystemData } from '@/hooks/useSystemData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, MapPin, User, Pencil, Building2, Landmark, Package, Users, LogOut, Check, X, Trash2, DollarSign, AlertTriangle, Handshake, UserPlus, FileText, CalendarPlus, Plus } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCentavos, formatCurrencyInput, parseCurrencyToNumber } from '@/lib/currency';
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
import JustificationModal from '@/components/agenda/JustificationModal';

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

export default function AgendaDetailModal({ visit: initialVisit, open, onOpenChange, onEdit, onDelete, onAcceptInvite, onRejectInvite, onLeaveVisit, onAddComment, onToggleTask, onScheduleFollowUp }: AgendaDetailModalProps) {
  const { canRead, canWrite } = usePermission();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAvatar } = useUserAvatars();
  const { getPartnerById } = usePartners();
  const { visits, setVisits } = useVisits();
  const { getActiveBanks } = useInfoData();
  const { getActiveItems } = useSystemData();
  const { addRegistration } = useRegistrations();
  const { addNotification } = useNotifications();
  const [teams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);
  const { hasActive, activeCount, regs } = useRegistrationBadge(initialVisit?.partnerId);
  const commentsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [banksPopoverOpen, setBanksPopoverOpen] = useState(false);
  const [productsPopoverOpen, setProductsPopoverOpen] = useState(false);
  const [showBankRegistration, setShowBankRegistration] = useState(false);

  // Inline editing states
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState('');
  const [editingPotential, setEditingPotential] = useState(false);
  const [potentialDraft, setPotentialDraft] = useState('');
  const [invitedPopoverOpen, setInvitedPopoverOpen] = useState(false);
  const [showJustification, setShowJustification] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'Reagendada' | 'Cancelada' | 'Inconclusa' | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [pendingFinalStatus, setPendingFinalStatus] = useState<VisitStatus | null>(null);

  if (!initialVisit) return null;

  const visit = visits.find((currentVisit) => currentVisit.id === initialVisit.id) ?? initialVisit;

  const partner = getPartnerById(visit.partnerId);
  const visitUser = getUserById(visit.userId);
  const typeLabel = visit.type === 'visita' ? 'Visita' : 'Prospecção';
  const TypeIcon = visit.type === 'visita' ? Handshake : UserPlus;

  const myInvite = user ? visit.invitedUsers?.find(iu => iu.userId === user.id) : null;
  const isResponsibleCommercial = user?.id === visit.userId;
  const FINAL_STATUSES = ['Concluída', 'Cancelada', 'Inconclusa'];
  const isStatusLocked = user?.role === 'comercial' && FINAL_STATUSES.includes(visit.status);
  const isOwnerOrManager = isResponsibleCommercial || user?.id === visit.createdBy || !['comercial', 'cadastro'].includes(user?.role || '');
  const canEditFields = canWrite('agenda.edit') && isOwnerOrManager;
  const canEditVisit = canEditFields && !isStatusLocked;

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
  const updateVisit = useCallback((updates: Partial<Visit> | ((currentVisit: Visit) => Partial<Visit> | null)) => {
    setVisits(prev => prev.map(currentVisit => {
      if (currentVisit.id !== visit.id) return currentVisit;
      const resolvedUpdates = typeof updates === 'function' ? updates(currentVisit) : updates;
      return resolvedUpdates ? { ...currentVisit, ...resolvedUpdates } : currentVisit;
    }));
  }, [setVisits, visit.id]);

  const handleSaveSummary = () => {
    updateVisit({ summary: summaryDraft.trim() });
    setEditingSummary(false);
  };

  const handleStartEditSummary = () => {
    setSummaryDraft(visit.summary || '');
    setEditingSummary(true);
  };

  const handleAddBank = (bankName: string) => {
    updateVisit(currentVisit => currentVisit.banks.includes(bankName)
      ? null
      : { banks: [...currentVisit.banks, bankName] });
    setBanksPopoverOpen(false);
  };

  const handleRemoveBank = (bankName: string) => {
    updateVisit(currentVisit => ({ banks: currentVisit.banks.filter(b => b !== bankName) }));
  };

  const handleAddProduct = (productName: string) => {
    updateVisit(currentVisit => currentVisit.products.includes(productName)
      ? null
      : { products: [...currentVisit.products, productName] });
    setProductsPopoverOpen(false);
  };

  const handleRemoveProduct = (productName: string) => {
    updateVisit(currentVisit => ({ products: currentVisit.products.filter(p => p !== productName) }));
  };

  // ── Date/Period/Time/Medio/Potential/Convidados inline editing ──
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      updateVisit({ date: format(date, 'yyyy-MM-dd') });
      setDatePopoverOpen(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    updateVisit({ period: period as VisitPeriod });
  };

  const handleMedioChange = (medio: string) => {
    updateVisit({ medio: medio as VisitMedio });
  };

  const handleStartEditTime = () => {
    setTimeDraft(visit.time || '');
    setEditingTime(true);
  };

  const handleSaveTime = () => {
    updateVisit({ time: timeDraft.trim() });
    setEditingTime(false);
  };

  const handleStartEditPotential = () => {
    setPotentialDraft(visit.potentialValue ? formatCentavos(visit.potentialValue) : '');
    setEditingPotential(true);
  };

  const handleSavePotential = () => {
    const centavos = parseCurrencyToNumber(potentialDraft);
    updateVisit({ potentialValue: centavos || undefined });
    setEditingPotential(false);
  };

  const handleAddInvitee = (userId: string) => {
    updateVisit(currentVisit => {
      const existing = currentVisit.invitedUsers || [];
      return existing.some(iu => iu.userId === userId)
        ? null
        : { invitedUsers: [...existing, { userId, status: 'pending' }] };
    });
    setInvitedPopoverOpen(false);
  };

  const handleRemoveInvitee = (userId: string) => {
    updateVisit(currentVisit => ({ invitedUsers: (currentVisit.invitedUsers || []).filter(iu => iu.userId !== userId) }));
  };

  // ── Status change with business rules ──
  const handleStatusChange = (newStatus: string) => {
    const status = newStatus as VisitStatus;
    // Needs justification?
    if (['Reagendada', 'Cancelada', 'Inconclusa'].includes(status)) {
      setPendingStatus(status as 'Reagendada' | 'Cancelada' | 'Inconclusa');
      setShowJustification(true);
      return;
    }
    // Final status confirmation for Comercial
    if (user?.role === 'comercial' && FINAL_STATUSES.includes(status)) {
      setPendingFinalStatus(status);
      setShowFinalConfirm(true);
      return;
    }
    updateVisit({ status, statusChangedAt: new Date().toISOString() });
  };

  const handleJustificationConfirm = (reason: string) => {
    if (!pendingStatus) return;
    const reasonField = pendingStatus === 'Reagendada' ? 'rescheduleReason' : pendingStatus === 'Inconclusa' ? 'inconclusiveReason' : 'cancelReason';
    // For Comercial + final status: confirm first
    if (user?.role === 'comercial' && FINAL_STATUSES.includes(pendingStatus)) {
      setPendingFinalStatus(pendingStatus);
      // Store reason temporarily
      updateVisit({ [reasonField]: reason });
      setShowJustification(false);
      setPendingStatus(null);
      setShowFinalConfirm(true);
      return;
    }
    updateVisit({
      status: pendingStatus,
      [reasonField]: reason,
      statusChangedAt: new Date().toISOString(),
    });
    setShowJustification(false);
    setPendingStatus(null);
    toast({
      title: pendingStatus === 'Reagendada' ? 'Reagendamento registrado' : pendingStatus === 'Inconclusa' ? 'Compromisso marcado como inconcluso' : 'Cancelamento registrado',
    });
  };

  const handleFinalConfirm = () => {
    if (!pendingFinalStatus) return;
    updateVisit({
      status: pendingFinalStatus,
      statusChangedAt: new Date().toISOString(),
    });
    setShowFinalConfirm(false);
    setPendingFinalStatus(null);
    toast({ title: `Compromisso ${pendingFinalStatus.toLowerCase()}` });
  };

  const handleBankRegistrationComplete = (data: { bankId: string; bankName: string; pendingDocs: string[]; pendingDocIds: string[]; unfilledFieldIds: string[]; unfilledFieldNames: string[]; fieldValues: Record<string, string> }) => {
    const pName = partner?.name || visit.prospectPartner || '';
    const details = Object.entries(data.fieldValues).map(([, v]) => v).filter(Boolean).join(' | ');

    const now = new Date().toISOString();
    const autoTasks: VisitComment[] = [];
    data.pendingDocIds.forEach((docId, i) => {
      autoTasks.push({
        id: `auto-doc-${Date.now()}-${i}`,
        userId: user?.id || '',
        text: `📄 Enviar: ${data.pendingDocs[i]} (${data.bankName})`,
        type: 'task',
        taskCompleted: false,
        taskCategory: 'document',
        taskSourceId: docId,
        taskBankName: data.bankName,
        createdAt: now,
      });
    });
    data.unfilledFieldIds.forEach((fieldId, i) => {
      autoTasks.push({
        id: `auto-field-${Date.now()}-${i}`,
        userId: user?.id || '',
        text: `🧾 Preencher: ${data.unfilledFieldNames[i]} (${data.bankName})`,
        type: 'task',
        taskCompleted: false,
        taskCategory: 'data',
        taskSourceId: fieldId,
        taskBankName: data.bankName,
        createdAt: now,
      });
    });

    if (autoTasks.length > 0) {
      updateVisit(currentVisit => ({ comments: [...(currentVisit.comments || []), ...autoTasks] }));
    }

    const newReg = addRegistration({
      partnerId: visit.partnerId || '',
      bank: data.bankName,
      cnpj: partner?.cnpj || visit.prospectCnpj || '',
      commercialUserId: user?.id || '',
      observation: `Solicitação via compromisso. ${details ? `Dados: ${details}` : ''}${data.pendingDocs.length > 0 ? ` | Docs pendentes: ${data.pendingDocs.join(', ')}` : ''}`,
      status: 'Não iniciado',
      solicitation: 'Substabelecido',
      handlingWith: 'Comercial',
      code: '',
      contractConfirmed: false,
      isCritical: false,
    });

    const userTeam = teams.find(t =>
      t.commercialIds.includes(user?.id || '') ||
      t.ascomIds.includes(user?.id || '') ||
      t.managerId === user?.id ||
      t.directorId === user?.id ||
      (t.cadastroIds || []).includes(user?.id || '')
    );
    const managerId = userTeam?.managerId;
    if (managerId && managerId !== user?.id) {
      addNotification({
        type: 'registration_approval',
        visitId: visit.id,
        fromUserId: user?.id || '',
        toUserId: managerId,
        partnerId: visit.partnerId || '',
        partnerName: pName,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        status: 'pending',
        message: `📋 ${user?.name || 'Comercial'} solicita aprovação de cadastro no banco ${data.bankName} para ${pName}.${data.pendingDocs.length > 0 ? ` (${data.pendingDocs.length} docs pendentes)` : ''}`,
        registrationId: newReg.id,
        bankName: data.bankName,
      });
    }

    setShowBankRegistration(false);
    const totalTasks = autoTasks.length;
    toast({
      title: 'Cadastro solicitado',
      description: `Aprovação enviada ao gerente.${totalTasks > 0 ? ` ${totalTasks} tarefa(s) gerada(s) automaticamente.` : ''}`,
    });
  };

  // Available options
  const availableBanks = getActiveBanks().filter(b => !visit.banks.includes(b.name));
  const availableProducts = getActiveItems('products').filter(p => !visit.products.includes(p));
  const activePeriods = getActiveItems('periods');
  const invitableUsers = mockUsers.filter(u => u.active && u.id !== user?.id && u.id !== visit.userId && !visit.invitedUsers?.some(iu => iu.userId === u.id));

  const allStatuses: VisitStatus[] = ['Planejada', 'Concluída', 'Reagendada', 'Cancelada', 'Inconclusa'];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          {/* ── Header ── */}
          <div className="px-5 pt-5 pb-3 pr-12">
            <div className="flex items-start gap-2.5">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                visit.type === 'visita' ? 'bg-info/10' : 'bg-warning/10'
              )}>
                <TypeIcon className={cn('h-4 w-4', visit.type === 'visita' ? 'text-info' : 'text-warning')} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {partner ? (
                  <button
                    onClick={handlePartnerClick}
                    className="text-left text-lg font-bold leading-snug hover:text-primary hover:underline underline-offset-2 transition-colors truncate block max-w-full"
                  >
                    {partnerName}
                  </button>
                ) : (
                  <p className="text-lg font-bold leading-snug truncate">{partnerName}</p>
                )}
                {/* Status — editable select, below partner name */}
                {isStatusLocked ? (
                  <Badge variant="outline" className={cn('text-xs capitalize', statusBgClasses[visit.status])}>
                    {visit.status}
                  </Badge>
                ) : canEditFields ? (
                  <Select value={visit.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={cn('h-7 w-auto min-w-0 gap-1 border px-2 text-xs font-medium capitalize', statusBgClasses[visit.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn('text-xs capitalize', statusBgClasses[visit.status])}>
                    {visit.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Address */}
            {partnerAddress && (
              <p className="text-xs text-muted-foreground mt-1 pl-[42px] leading-snug">{partnerAddress}</p>
            )}

            {/* Partner meta badges */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2 pl-[42px]">
              {partner && visit.type === 'visita' && (
                <Badge variant="outline" className={cn(
                  'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
                  partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
                  partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
                  partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-muted text-muted-foreground border-muted-foreground/20'
                )}>{partner.partnerClass}</Badge>
              )}
              {partner && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize",
                  partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                  partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                  'bg-muted/50 text-muted-foreground border-border/30'
                )}>Potencial {partner.potential}</Badge>
              )}
              {lastVisitInfo && (
                <span className="text-[10px] text-muted-foreground/70">{lastVisitInfo}</span>
              )}
              {visit.structures.length > 0 && visit.structures.map(s => (
                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
              ))}
            </div>

            {/* Commercial user */}
            <div className="flex items-center gap-1.5 mt-1.5 pl-[42px] text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span>{visitUser?.name || '—'}</span>
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* ── Date / Period / Time / Medio — editable with permissions ── */}
          <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap">
            {/* Date */}
            {canEditFields ? (
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{format(parseISO(visit.date), "dd/MM/yyyy")}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={parseISO(visit.date)} onSelect={handleDateChange} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground px-1.5 py-0.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(parseISO(visit.date), "dd/MM/yyyy")}
              </span>
            )}

            <span className="text-muted-foreground/30">·</span>

            {/* Period */}
            {canEditFields ? (
              <Select value={visit.period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-6 w-auto min-w-0 gap-1 border-0 bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground capitalize shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activePeriods.map(p => (
                    <SelectItem key={p} value={p.toLowerCase()} className="text-xs capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground capitalize px-1.5">{visit.period}</span>
            )}

            <span className="text-muted-foreground/30">·</span>

            {/* Time */}
            {canEditFields && editingTime ? (
              <div className="flex items-center gap-1">
                <Input type="time" value={timeDraft} onChange={e => setTimeDraft(e.target.value)} className="h-6 w-24 text-xs px-1.5" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveTime(); if (e.key === 'Escape') setEditingTime(false); }} />
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSaveTime}><Check className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingTime(false)}><X className="h-3 w-3" /></Button>
              </div>
            ) : canEditFields ? (
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50" onClick={handleStartEditTime}>
                <Clock className="h-3 w-3" />
                {visit.time || 'Sem horário'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1.5 py-0.5">
                <Clock className="h-3 w-3" />
                {visit.time || 'Sem horário'}
              </span>
            )}

            <span className="text-muted-foreground/30">·</span>

            {/* Medio */}
            {canEditFields ? (
              <Select value={visit.medio} onValueChange={handleMedioChange}>
                <SelectTrigger className="h-6 w-auto min-w-0 gap-1 border-0 bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground capitalize shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial" className="text-xs">Presencial</SelectItem>
                  <SelectItem value="remoto" className="text-xs">Remoto</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground capitalize px-1.5">{visit.medio}</span>
            )}
          </div>

          {/* ── Potential value — editable with permissions ── */}
          <div className="px-5 pb-2.5 flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {canEditFields && editingPotential ? (
              <div className="flex items-center gap-1">
                <Input value={potentialDraft} onChange={e => setPotentialDraft(formatCurrencyInput(e.target.value))} className="h-7 w-36 text-xs" placeholder="R$ 0,00" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSavePotential(); if (e.key === 'Escape') setEditingPotential(false); }} />
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSavePotential}><Check className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingPotential(false)}><X className="h-3 w-3" /></Button>
              </div>
            ) : canEditFields ? (
              <button className="inline-flex items-center gap-1 hover:bg-muted/50 rounded-md px-1.5 py-0.5 transition-colors" onClick={handleStartEditPotential}>
                {visit.potentialValue ? (
                  <Badge variant="outline" className={cn('text-xs font-semibold', visit.potentialValue >= 1000000 ? 'bg-warning/10 text-warning border-warning/20' : 'text-foreground')}>
                    {formatCentavos(visit.potentialValue)}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Potencial não informado</span>
                )}
              </button>
            ) : (
              visit.potentialValue ? (
                <Badge variant="outline" className={cn('text-xs font-semibold', visit.potentialValue >= 1000000 ? 'bg-warning/10 text-warning border-warning/20' : 'text-foreground')}>
                  {formatCentavos(visit.potentialValue)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">Potencial não informado</span>
              )
            )}
          </div>

          <Separator className="opacity-40" />

          {/* ── Summary (editable) ── */}
          <div className="px-5 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Resumo da {visit.type === 'visita' ? 'visita' : 'prospecção'}</p>
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
                  placeholder="Escreva o resumo..."
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
                <p className="text-sm bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors leading-relaxed" onClick={handleStartEditSummary}>{visit.summary}</p>
              ) : (
                visit.status === 'Concluída' ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground flex-1">Resumo ainda não preenchido</p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleStartEditSummary}>
                      Preencher
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic cursor-pointer hover:text-foreground transition-colors" onClick={handleStartEditSummary}>Clique para adicionar um resumo</p>
                )
              )
            )}
          </div>

          {/* Reschedule/Cancel/Inconclusive reasons */}
          {visit.status === 'Reagendada' && visit.rescheduleReason && (
            <div className="mx-5 mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-warning">Motivo do reagendamento</p>
                <p className="text-sm">{visit.rescheduleReason}</p>
              </div>
            </div>
          )}

          {visit.status === 'Cancelada' && visit.cancelReason && (
            <div className="mx-5 mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">Motivo do cancelamento</p>
                <p className="text-sm">{visit.cancelReason}</p>
              </div>
            </div>
          )}

          {visit.status === 'Inconclusa' && visit.inconclusiveReason && (
            <div className="mx-5 mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Motivo do compromisso inconcluso</p>
                <p className="text-sm">{visit.inconclusiveReason}</p>
              </div>
            </div>
          )}

          {/* ── Banks (editable) ── */}
          <div className="px-5 pb-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Bancos
              </div>
              <Popover open={banksPopoverOpen} onOpenChange={setBanksPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-5 w-5 rounded-full border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3 w-3" />
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
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group px-2 py-0.5"
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
          <div className="px-5 pb-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Produtos
              </div>
              <Popover open={productsPopoverOpen} onOpenChange={setProductsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-5 w-5 rounded-full border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3 w-3" />
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
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group px-2 py-0.5"
                    onClick={() => handleRemoveProduct(p)}
                  >
                    {p}
                    <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* ── Solicitar Cadastro ── */}
          <div className="px-5 pb-3 space-y-2">
            {showBankRegistration ? (
              <BankRegistrationFlow
                partnerId={visit.partnerId || `prospect-${visit.prospectCnpj}`}
                partnerName={partner?.name || visit.prospectPartner || ''}
                onComplete={handleBankRegistrationComplete}
                onCancel={() => setShowBankRegistration(false)}
              />
            ) : (
              (visit.partnerId || visit.prospectPartner) && canWrite('agenda.create') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs"
                  onClick={() => setShowBankRegistration(true)}
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Cadastrar Banco
                </Button>
              )
            )}

            {hasActive && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-info/5 border border-info/15">
                <FileText className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-info">Cadastro em andamento ({activeCount})</p>
                  {regs.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{r.bank}</Badge>
                      <span>{r.status}</span>
                      <span>• {r.handlingWith}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* ── Participants — editable with permissions ── */}
          <div className="px-5 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Participantes
              </div>
              {canEditFields && (
                <Popover open={invitedPopoverOpen} onOpenChange={setInvitedPopoverOpen}>
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
                          onClick={() => handleAddInvitee(u.id)}
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

            {visit.invitedUsers && visit.invitedUsers.length > 0 && (
              <div className="space-y-1.5">
                {visit.invitedUsers.map(iu => {
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
                          onClick={() => handleRemoveInvitee(iu.userId)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Invite actions */}
            {myInvite?.status === 'pending' && onAcceptInvite && onRejectInvite && (
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs" onClick={() => onAcceptInvite(visit.id)}>
                  <Check className="h-3.5 w-3.5" /> Aceitar convite
                </Button>
                <Button size="sm" variant="secondary" className="gap-1 h-7 text-xs" onClick={() => onRejectInvite(visit.id)}>
                  <X className="h-3.5 w-3.5" /> Rejeitar
                </Button>
              </div>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* ── Comments ── */}
          <div className="px-5 py-3">
            <div ref={commentsRef}>
              {onAddComment && onToggleTask && (
                <AgendaComments
                  comments={visit.comments || []}
                  onAddComment={(text, type, parentId) => onAddComment(visit.id, text, type, parentId)}
                  onToggleTask={(commentId) => onToggleTask(visit.id, commentId)}
                />
              )}
            </div>
          </div>

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-between px-5 pb-4 pt-1">
            {myInvite?.status === 'accepted' && !isResponsibleCommercial && onLeaveVisit && (
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive h-7 text-xs" onClick={() => { onLeaveVisit(visit.id); onOpenChange(false); }}>
                <LogOut className="h-3.5 w-3.5" /> Sair
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {canEditVisit && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-7 text-xs">
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
              {visit.status === 'Concluída' && canWrite('agenda.create') && onScheduleFollowUp && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => onScheduleFollowUp(visit.partnerId)}>
                  <CalendarPlus className="h-3.5 w-3.5" /> Agendar follow-up
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Justification modal for status changes */}
      <JustificationModal
        open={showJustification}
        onOpenChange={(o) => { if (!o) { setShowJustification(false); setPendingStatus(null); } }}
        targetStatus={pendingStatus || 'Reagendada'}
        onConfirm={handleJustificationConfirm}
      />

      {/* Final status confirmation for Comercial */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingFinalStatus === 'Cancelada' && 'Tem certeza que quer cancelar?'}
              {pendingFinalStatus === 'Concluída' && 'Tem certeza que quer concluir?'}
              {pendingFinalStatus === 'Inconclusa' && 'Tem certeza que quer marcar como inconcluso?'}
            </AlertDialogTitle>
            <AlertDialogDescription>Essa ação não poderá ser revertida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowFinalConfirm(false); setPendingFinalStatus(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
