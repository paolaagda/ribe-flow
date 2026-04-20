import { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Visit, VisitComment, VisitStatus, VisitPeriod, VisitMedio, getUserById, mockUsers, statusBgClasses } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useInfoData } from '@/hooks/useInfoData';
import { useSystemData } from '@/hooks/useSystemData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Pencil, Check, Trash2, AlertTriangle, FileText, CalendarPlus, Landmark, Package, LogOut } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { formatCentavos } from '@/lib/currency';
import AgendaComments from '@/components/agenda/AgendaComments';
import { useRegistrationBadge } from '@/hooks/useRegistrationBadge';
import { useNavigate } from 'react-router-dom';
import BankRegistrationFlow from '@/components/agenda/BankRegistrationFlow';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Team, initialTeams } from '@/data/teams';
import { useToast } from '@/hooks/use-toast';
import JustificationModal from '@/components/agenda/JustificationModal';
import { getStatusRules } from '@/hooks/useStatusRules';
import { getFieldRules } from '@/hooks/useFieldRules';
import { ToneBlock } from '@/components/shared';

import DetailHeader from '@/components/agenda/detail/DetailHeader';
import DetailScheduleFields from '@/components/agenda/detail/DetailScheduleFields';
import DetailListEditor from '@/components/agenda/detail/DetailListEditor';
import DetailParticipants from '@/components/agenda/detail/DetailParticipants';

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
  const [showBankRegistration, setShowBankRegistration] = useState(false);

  // Status justification/confirmation states
  const [showJustification, setShowJustification] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'Reagendada' | 'Cancelada' | 'Inconclusa' | null>(null);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [pendingFinalStatus, setPendingFinalStatus] = useState<VisitStatus | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const visit = initialVisit ? (visits.find((v) => v.id === initialVisit.id) ?? initialVisit) : null;
  const partner = visit ? getPartnerById(visit.partnerId) : null;

  const lastVisitInfo = useMemo(() => {
    if (!partner || !visit || visit.type !== 'visita') return null;
    const lastConcluded = visits
      .filter(v => v.partnerId === visit.partnerId && v.status === 'Concluída' && v.id !== visit.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastConcluded) return 'Primeira visita';
    const days = Math.floor((Date.now() - new Date(lastConcluded.date).getTime()) / 86400000);
    return `Última visita: ${days}d atrás`;
  }, [partner, visit, visits]);

  if (!visit) return null;

  const visitUser = getUserById(visit.userId);
  const myInvite = user ? visit.invitedUsers?.find(iu => iu.userId === user.id) : null;
  const isResponsibleCommercial = user?.id === visit.userId;
  const FINAL_STATUSES = ['Concluída', 'Cancelada', 'Inconclusa'];
  const isStatusFinal = FINAL_STATUSES.includes(visit.status);
  const isStatusLocked = user?.role === 'comercial' && isStatusFinal;
  const isOwnerOrManager = isResponsibleCommercial || user?.id === visit.createdBy || !['comercial', 'cadastro'].includes(user?.role || '');
  const canEditFields = canWrite('agenda.edit') && isOwnerOrManager && !isStatusFinal;
  const canEditVisit = canWrite('agenda.edit') && isOwnerOrManager && !isStatusLocked;

  const partnerName = partner?.name || visit.prospectPartner;
  const partnerAddress = partner?.address || visit.prospectAddress;

  // ── Update helper ──
  const updateVisit = (updates: Partial<Visit> | ((v: Visit) => Partial<Visit> | null)) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== visit.id) return v;
      const resolved = typeof updates === 'function' ? updates(v) : updates;
      return resolved ? { ...v, ...resolved } : v;
    }));
  };

  // ── Summary ──
  const handleStartEditSummary = () => { setSummaryDraft(visit.summary || ''); setEditingSummary(true); };
  const handleSaveSummary = () => { updateVisit({ summary: summaryDraft.trim() }); setEditingSummary(false); };

  // ── Date change (reschedule) ──
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const newDateStr = format(date, 'yyyy-MM-dd');
    if (newDateStr !== visit.date) {
      setPendingDate(newDateStr);
      setPendingStatus('Reagendada');
      setShowJustification(true);
    }
  };

  // ── Status change with business rules ──
  const handleStatusChange = (newStatus: string) => {
    const status = newStatus as VisitStatus;
    if (['Reagendada', 'Cancelada', 'Inconclusa'].includes(status)) {
      setPendingStatus(status as 'Reagendada' | 'Cancelada' | 'Inconclusa');
      setShowJustification(true);
      return;
    }
    if (status === 'Concluída') {
      const fieldRules = getFieldRules();
      const missing: string[] = [];
      if (visit.type === 'visita') {
        if (fieldRules.visitRequirePotential && !visit.potentialValue) missing.push('Potencial de produção');
        if (fieldRules.visitRequireSummary && !visit.summary?.trim()) missing.push('Resumo / observação');
      } else {
        if (fieldRules.prospectRequireSummary && !visit.summary?.trim()) missing.push('Resumo / observação');
        if (fieldRules.prospectRequireContact && !visit.prospectContact?.trim()) missing.push('Contato do prospect');
      }
      if (missing.length > 0) {
        toast({ title: 'Campos obrigatórios', description: `Preencha antes de concluir: ${missing.join(', ')}`, variant: 'destructive' });
        return;
      }
    }
    const statusRules = getStatusRules();
    if (statusRules.requireAgendaFinalConfirmation && user?.role === 'comercial' && FINAL_STATUSES.includes(status)) {
      setPendingFinalStatus(status);
      setShowFinalConfirm(true);
      return;
    }
    updateVisit({ status, statusChangedAt: new Date().toISOString() });
  };

  const handleJustificationConfirm = (reason: string) => {
    if (!pendingStatus) return;
    const reasonField = pendingStatus === 'Reagendada' ? 'rescheduleReason' : pendingStatus === 'Inconclusa' ? 'inconclusiveReason' : 'cancelReason';
    const cachedStatusRules = getStatusRules();
    const needsFinalConfirm = cachedStatusRules.requireAgendaFinalConfirmation && user?.role === 'comercial';

    if (pendingDate) {
      if (needsFinalConfirm) {
        updateVisit({ [reasonField]: reason });
        setPendingFinalStatus('Reagendada');
        setShowJustification(false); setPendingStatus(null); setPendingDate(null);
        setShowFinalConfirm(true);
        return;
      }
      updateVisit({ date: pendingDate, status: 'Reagendada' as VisitStatus, [reasonField]: reason, statusChangedAt: new Date().toISOString() });
      setShowJustification(false); setPendingStatus(null); setPendingDate(null);
      toast({ title: 'Reagendamento registrado' });
      return;
    }

    if (needsFinalConfirm && FINAL_STATUSES.includes(pendingStatus)) {
      setPendingFinalStatus(pendingStatus);
      updateVisit({ [reasonField]: reason });
      setShowJustification(false); setPendingStatus(null);
      setShowFinalConfirm(true);
      return;
    }
    updateVisit({ status: pendingStatus, [reasonField]: reason, statusChangedAt: new Date().toISOString() });
    setShowJustification(false); setPendingStatus(null);
    toast({
      title: pendingStatus === 'Reagendada' ? 'Reagendamento registrado' : pendingStatus === 'Inconclusa' ? 'Compromisso marcado como inconcluso' : 'Cancelamento registrado',
    });
  };

  const handleFinalConfirm = () => {
    if (!pendingFinalStatus) return;
    const updates: Partial<Visit> = { status: pendingFinalStatus, statusChangedAt: new Date().toISOString() };
    if (pendingDate) updates.date = pendingDate;
    updateVisit(updates);
    setShowFinalConfirm(false); setPendingFinalStatus(null); setPendingDate(null);
    toast({ title: `Compromisso ${pendingFinalStatus.toLowerCase()}` });
  };

  // ── Banks/Products helpers ──
  const handleAddBank = (bankName: string) => {
    updateVisit(v => v.banks.includes(bankName) ? null : { banks: [...v.banks, bankName] });
  };
  const handleRemoveBank = (bankName: string) => {
    updateVisit(v => ({ banks: v.banks.filter(b => b !== bankName) }));
  };
  const handleAddProduct = (productName: string) => {
    updateVisit(v => v.products.includes(productName) ? null : { products: [...v.products, productName] });
  };
  const handleRemoveProduct = (productName: string) => {
    updateVisit(v => ({ products: v.products.filter(p => p !== productName) }));
  };

  // ── Invitees ──
  const handleAddInvitee = (userId: string) => {
    updateVisit(v => {
      const existing = v.invitedUsers || [];
      return existing.some(iu => iu.userId === userId) ? null : { invitedUsers: [...existing, { userId, status: 'pending' }] };
    });
  };
  const handleRemoveInvitee = (userId: string) => {
    updateVisit(v => ({ invitedUsers: (v.invitedUsers || []).filter(iu => iu.userId !== userId) }));
  };

  // ── Bank registration ──
  const handleBankRegistrationComplete = (data: { bankId: string; bankName: string; pendingDocs: string[]; pendingDocIds: string[]; unfilledFieldIds: string[]; unfilledFieldNames: string[]; fieldValues: Record<string, string> }) => {
    const pName = partner?.name || visit.prospectPartner || '';
    const details = Object.entries(data.fieldValues).map(([, v]) => v).filter(Boolean).join(' | ');
    const now = new Date().toISOString();
    const autoTasks: VisitComment[] = [];
    data.pendingDocIds.forEach((docId, i) => {
      autoTasks.push({ id: `auto-doc-${Date.now()}-${i}`, userId: user?.id || '', text: `📄 Enviar: ${data.pendingDocs[i]} (${data.bankName})`, type: 'task', taskCompleted: false, taskCategory: 'document', taskSourceId: docId, taskBankName: data.bankName, createdAt: now });
    });
    data.unfilledFieldIds.forEach((fieldId, i) => {
      autoTasks.push({ id: `auto-field-${Date.now()}-${i}`, userId: user?.id || '', text: `🧾 Preencher: ${data.unfilledFieldNames[i]} (${data.bankName})`, type: 'task', taskCompleted: false, taskCategory: 'data', taskSourceId: fieldId, taskBankName: data.bankName, createdAt: now });
    });
    if (autoTasks.length > 0) {
      updateVisit(v => ({ comments: [...(v.comments || []), ...autoTasks] }));
    }
    const newReg = addRegistration({
      partnerId: visit.partnerId || '', bank: data.bankName, cnpj: partner?.cnpj || visit.prospectCnpj || '',
      commercialUserId: user?.id || '',
      observation: `Solicitação via compromisso. ${details ? `Dados: ${details}` : ''}${data.pendingDocs.length > 0 ? ` | Docs pendentes: ${data.pendingDocs.join(', ')}` : ''}`,
      status: 'Não iniciado', solicitation: 'Substabelecido', handlingWith: 'Comercial', code: '', contractConfirmed: false, isCritical: false,
    });
    const userTeam = teams.find(t =>
      t.commercialIds.includes(user?.id || '') || t.ascomIds.includes(user?.id || '') ||
      t.managerId === user?.id || t.directorId === user?.id || (t.cadastroIds || []).includes(user?.id || '')
    );
    const managerId = userTeam?.managerId;
    if (managerId && managerId !== user?.id) {
      addNotification({
        type: 'registration_approval', visitId: visit.id, fromUserId: user?.id || '', toUserId: managerId,
        partnerId: visit.partnerId || '', partnerName: pName, date: format(new Date(), 'yyyy-MM-dd'), time: '', status: 'pending',
        message: `📋 ${user?.name || 'Comercial'} solicita aprovação de cadastro no banco ${data.bankName} para ${pName}.${data.pendingDocs.length > 0 ? ` (${data.pendingDocs.length} docs pendentes)` : ''}`,
        registrationId: newReg.id, bankName: data.bankName,
      });
    }
    setShowBankRegistration(false);
    toast({ title: 'Cadastro solicitado', description: `Aprovação enviada ao gerente.${autoTasks.length > 0 ? ` ${autoTasks.length} tarefa(s) gerada(s) automaticamente.` : ''}` });
  };

  // ── Computed data for sub-components ──
  const availableBanks = getActiveBanks().filter(b => !visit.banks.includes(b.name));
  const availableProducts = getActiveItems('products').filter(p => !visit.products.includes(p));
  const activePeriods = getActiveItems('periods');
  const invitableUsers = mockUsers.filter(u => u.active && u.id !== user?.id && u.id !== visit.userId && !visit.invitedUsers?.some(iu => iu.userId === u.id));
  const allStatuses: VisitStatus[] = ['Planejada', 'Concluída', 'Reagendada', 'Cancelada', 'Inconclusa'];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 border-border/60 shadow-lg">
          {/* ── Header ── */}
          <DetailHeader
            visit={visit}
            partnerName={partnerName}
            partnerAddress={partnerAddress}
            partner={partner}
            visitUserName={visitUser?.name}
            lastVisitInfo={lastVisitInfo}
            isStatusLocked={isStatusLocked}
            canEditVisit={canEditVisit}
            allStatuses={allStatuses}
            onStatusChange={handleStatusChange}
            onPartnerClick={() => { if (partner) { onOpenChange(false); navigate(`/parceiros?id=${partner.id}`); } }}
          />

          <Separator className="opacity-50" />

          {/* ── Schedule fields (date/period/time/medio/potential) ── */}
          <DetailScheduleFields
            visit={visit}
            canEditFields={canEditFields}
            activePeriods={activePeriods}
            onDateChange={handleDateChange}
            onPeriodChange={(p) => updateVisit({ period: p as VisitPeriod })}
            onMedioChange={(m) => updateVisit({ medio: m as VisitMedio })}
            onTimeChange={(t) => updateVisit({ time: t })}
            onPotentialChange={(v) => updateVisit({ potentialValue: v })}
          />

          <Separator className="opacity-50" />

          {/* ── Summary ── */}
          <div className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Resumo</p>
              {!editingSummary && (
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60" onClick={handleStartEditSummary}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingSummary ? (
              <div className="space-y-2">
                <Textarea value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} placeholder="Escreva o resumo..." className="min-h-[64px] text-sm" autoFocus />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingSummary(false)}>Cancelar</Button>
                  <Button size="sm" className="h-7 text-xs gap-1 shadow-sm" onClick={handleSaveSummary}><Check className="h-3 w-3" /> Salvar</Button>
                </div>
              </div>
            ) : visit.summary?.trim() ? (
              <p
                className="text-sm bg-muted/30 border border-border/40 rounded-lg p-3 cursor-pointer hover:bg-muted/50 hover:border-border/60 transition-colors leading-relaxed"
                onClick={handleStartEditSummary}
              >
                {visit.summary}
              </p>
            ) : visit.status === 'Concluída' ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">Resumo ainda não preenchido</p>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleStartEditSummary}>Preencher</Button>
              </div>
            ) : (
              <p
                className="text-xs text-muted-foreground italic cursor-pointer hover:text-foreground transition-colors px-1"
                onClick={handleStartEditSummary}
              >
                Clique para adicionar um resumo
              </p>
            )}
          </div>

          {/* Status reasons — refined with shared ToneBlock */}
          {visit.status === 'Reagendada' && visit.rescheduleReason && (
            <div className="mx-5 mb-3">
              <ToneBlock
                tone="warning"
                icon={AlertTriangle}
                eyebrow="Motivo do reagendamento"
                description={visit.rescheduleReason}
              />
            </div>
          )}
          {visit.status === 'Cancelada' && visit.cancelReason && (
            <div className="mx-5 mb-3">
              <ToneBlock
                tone="destructive"
                icon={AlertTriangle}
                eyebrow="Motivo do cancelamento"
                description={visit.cancelReason}
              />
            </div>
          )}
          {visit.status === 'Inconclusa' && visit.inconclusiveReason && (
            <div className="mx-5 mb-3">
              <ToneBlock
                tone="primary"
                icon={AlertTriangle}
                eyebrow="Motivo do compromisso inconcluso"
                description={visit.inconclusiveReason}
              />
            </div>
          )}

          {/* ── Banks ── */}
          <DetailListEditor
            icon={Landmark}
            label="Bancos"
            items={visit.banks}
            availableItems={availableBanks.map(b => ({ key: b.name, label: b.name }))}
            emptyText="Nenhum banco selecionado"
            allAddedText="Todos os bancos já adicionados"
            onAdd={handleAddBank}
            onRemove={handleRemoveBank}
          />

          {/* ── Products ── */}
          <DetailListEditor
            icon={Package}
            label="Produtos"
            items={visit.products}
            availableItems={availableProducts.map(p => ({ key: p, label: p }))}
            emptyText="Nenhum produto selecionado"
            allAddedText="Todos os produtos já adicionados"
            popoverWidth="w-56"
            onAdd={handleAddProduct}
            onRemove={handleRemoveProduct}
          />

          {/* ── Bank Registration ── */}
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
                  className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60 text-xs h-9 font-medium"
                  onClick={() => setShowBankRegistration(true)}
                >
                  <Landmark className="h-3.5 w-3.5" /> Cadastrar Banco
                </Button>
              )
            )}
            {hasActive && (
              <ToneBlock
                tone="info"
                icon={FileText}
                eyebrow={`Cadastro em andamento (${activeCount})`}
              >
                <div className="space-y-1 mt-1">
                  {regs.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">{r.bank}</Badge>
                      <span>{r.status}</span>
                      <span className="text-muted-foreground/60">• {r.handlingWith}</span>
                    </div>
                  ))}
                </div>
              </ToneBlock>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* ── Participants ── */}
          <DetailParticipants
            invitedUsers={visit.invitedUsers || []}
            canEditFields={canEditFields}
            invitableUsers={invitableUsers}
            myInviteStatus={myInvite?.status || null}
            isResponsibleCommercial={isResponsibleCommercial}
            getAvatar={getAvatar}
            onAddInvitee={handleAddInvitee}
            onRemoveInvitee={handleRemoveInvitee}
            onAcceptInvite={onAcceptInvite}
            onRejectInvite={onRejectInvite}
            visitId={visit.id}
          />

          <Separator className="opacity-50" />

          {/* ── Comments ── */}
          <div className="px-5 py-4 bg-muted/15">
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-muted/20">
            {myInvite?.status === 'accepted' && !isResponsibleCommercial && onLeaveVisit && (
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => { onLeaveVisit(visit.id); onOpenChange(false); }}>
                <LogOut className="h-3.5 w-3.5" /> Sair
              </Button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {canEditVisit && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-8 text-xs">
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
                <Button size="sm" className="gap-1.5 text-xs h-8 shadow-sm" onClick={() => onScheduleFollowUp(visit.partnerId)}>
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
        onOpenChange={(o) => { if (!o) { setShowJustification(false); setPendingStatus(null); setPendingDate(null); } }}
        targetStatus={pendingStatus || 'Reagendada'}
        medio={visit.medio}
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
