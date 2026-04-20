import { useState, useMemo } from 'react';
import {
  Calendar, User as UserIcon, Briefcase, FileText, Link2,
  CheckCircle2, Edit3, UserPlus, XCircle, AlertTriangle, Star, RotateCcw, MessageSquarePlus, Users, X,
  ListChecks, ClipboardList, History, MessageSquare, Handshake,
} from 'lucide-react';
import { isTaskPriority } from '@/hooks/useTasks';
import {
  isTaskCancelled, daysSinceDate, isTaskOverdue, getTaskStatusDisplay,
  getTaskDeadlineLabel, TASK_CANCELLED_PREFIX,
} from '@/lib/task-helpers';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TaskItem } from '@/hooks/useTasks';
import { TaskPermissions } from '@/hooks/useTaskPermissions';
import { getUserById, Partner, User } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Helpers imported from @/lib/task-helpers:
// isTaskCancelled, daysSinceDate, isTaskOverdue, getTaskStatusDisplay, getTaskDeadlineLabel, TASK_CANCELLED_PREFIX
const isOverdue = isTaskOverdue;
const getStatusInfo = getTaskStatusDisplay;
const getDeadlineLabel = getTaskDeadlineLabel;

/* ── History events ── */
interface HistoryEvent { id: string; label: string; date: string; }

function buildHistory(item: TaskItem): HistoryEvent[] {
  if (item.task.taskHistory && item.task.taskHistory.length > 0) {
    return item.task.taskHistory
      .map(evt => ({ id: evt.id, label: evt.label, date: evt.date }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const events: HistoryEvent[] = [];
  const created = new Date(item.task.createdAt);
  events.push({ id: 'created', label: 'Tarefa criada', date: created.toISOString() });

  if (isTaskPriority(item.task)) {
    events.push({ id: 'priority', label: 'Prioridade automática aplicada', date: new Date(created.getTime() + 1000).toISOString() });
  }

  if (item.task.taskDocStatus === 'submitted_for_validation')
    events.push({ id: 'submitted', label: 'Enviada para validação', date: new Date(created.getTime() + 2 * 86400000).toISOString() });
  if (item.task.taskDocStatus === 'returned_for_correction') {
    const reason = item.task.taskReturnReason;
    events.push({ id: 'returned', label: reason ? `Documento recusado: ${reason}` : 'Devolvida para correção', date: new Date(created.getTime() + 3 * 86400000).toISOString() });
  }
  if (item.task.taskDocStatus === 'validated')
    events.push({ id: 'validated', label: 'Documento validado', date: new Date(created.getTime() + 4 * 86400000).toISOString() });
  if (item.task.taskCompleted) {
    const completedBy = item.task.taskCompletedBy ? getUserById(item.task.taskCompletedBy)?.name : undefined;
    events.push({ id: 'completed', label: completedBy ? `Concluída por ${completedBy}` : 'Tarefa concluída', date: new Date(created.getTime() + 5 * 86400000).toISOString() });
  }
  if (item.task.taskReturnReason?.startsWith(TASK_CANCELLED_PREFIX))
    events.push({ id: 'cancelled', label: 'Tarefa cancelada', date: new Date(created.getTime() + 5 * 86400000).toISOString() });

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ══════════════════════════════════════════════════════════ */
interface TaskDetailModalProps {
  item: TaskItem | null;
  partner: Partner | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConclude: (visitId: string, commentId: string) => void;
  onCancel: (visitId: string, commentId: string) => void;
  onReopen?: (visitId: string, commentId: string) => void;
  onAdminNote?: (visitId: string, commentId: string, note: string) => void;
  onUpdateAssignees?: (visitId: string, commentId: string, ids: string[]) => void;
  permissions: TaskPermissions;
  validAssignees: User[];
}

export default function TaskDetailModal({
  item, partner, open, onOpenChange, onConclude, onCancel, onReopen, onAdminNote, onUpdateAssignees,
  permissions, validAssignees,
}: TaskDetailModalProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingAssignees, setEditingAssignees] = useState(false);
  const history = useMemo(() => item ? buildHistory(item) : [], [item]);

  if (!item) return null;

  const responsible = getUserById(item.task.userId);
  const completed = !!item.task.taskCompleted;
  const cancelled = isTaskCancelled(item);
  const overdue = !completed && !cancelled && isOverdue(item.task.createdAt);
  const priority = !completed && !cancelled && isTaskPriority(item.task);
  const statusInfo = getStatusInfo(item);
  const deadline = getDeadlineLabel(item.task.createdAt, completed);

  const categoryLabel = item.task.taskCategory === 'document'
    ? 'Documento' : item.task.taskCategory === 'data'
    ? 'Dado operacional' : 'Geral';

  const handleConclude = () => {
    onConclude(item.visit.id, item.task.id);
    toast.success('Tarefa concluída');
    onOpenChange(false);
  };

  const handleConfirmCancel = () => {
    onCancel(item.visit.id, item.task.id);
    setConfirmCancel(false);
  };

  const handleConfirmReopen = () => {
    onReopen?.(item.visit.id, item.task.id);
    setConfirmReopen(false);
    toast.success('Tarefa reaberta');
    onOpenChange(false);
  };

  const handleStartNoteEdit = () => {
    setNoteText(item.task.taskAdminNote || '');
    setEditingNote(true);
  };

  const handleSaveNote = () => {
    onAdminNote?.(item.visit.id, item.task.id, noteText);
    setEditingNote(false);
    toast.success('Nota administrativa salva');
  };

  const hasAnyAction = permissions.canConclude || permissions.canEdit || permissions.canAssign
    || permissions.canCancel || permissions.canReopen || permissions.canTerminalEdit;

  // Determine accent tone (status drives lateral bar/tile)
  const tone = cancelled
    ? { bar: 'hsl(var(--destructive))', barSoft: 'hsl(var(--destructive) / 0.6)', tile: 'bg-destructive/10 text-destructive ring-destructive/20', label: 'text-destructive' }
    : completed
    ? { bar: 'hsl(var(--success))', barSoft: 'hsl(var(--success) / 0.6)', tile: 'bg-success/10 text-success ring-success/20', label: 'text-success' }
    : overdue
    ? { bar: 'hsl(var(--destructive))', barSoft: 'hsl(var(--destructive) / 0.6)', tile: 'bg-destructive/10 text-destructive ring-destructive/20', label: 'text-destructive' }
    : priority
    ? { bar: 'hsl(var(--warning))', barSoft: 'hsl(var(--warning) / 0.6)', tile: 'bg-warning/10 text-warning ring-warning/20', label: 'text-warning' }
    : { bar: 'hsl(var(--primary))', barSoft: 'hsl(var(--primary) / 0.6)', tile: 'bg-primary/10 text-primary ring-primary/20', label: 'text-primary' };

  const visitIsVisita = item.visit.type === 'visita';
  const VisitIcon = visitIsVisita ? Handshake : UserPlus;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg sm:max-w-xl max-h-[92vh] p-0 gap-0 overflow-hidden">
          {/* ── Branded header with lateral bar ── */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ background: `linear-gradient(180deg, ${tone.bar} 0%, ${tone.barSoft} 100%)` }}
            />
            <DialogHeader className="px-5 py-4 pl-6 space-y-2.5">
              <div className="flex items-start gap-3 pr-6">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1', tone.tile)}>
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wider', tone.label)}>
                    Tarefa · {categoryLabel}
                  </p>
                  <DialogTitle className="text-base font-semibold leading-snug">
                    {item.task.text}
                  </DialogTitle>
                  <DialogDescription className="sr-only">Detalhe da tarefa</DialogDescription>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Badge variant="outline" className={cn('text-[10px] font-medium', statusInfo.className)}>
                      {statusInfo.label}
                    </Badge>
                    {overdue && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Atrasada
                      </Badge>
                    )}
                    {priority && (
                      <Badge variant="outline" className="text-[10px] gap-0.5 border-warning/40 text-warning bg-warning/10">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Prioritária
                      </Badge>
                    )}
                    <span className={cn(
                      'text-[10px] font-medium',
                      deadline.variant === 'overdue' && 'text-destructive',
                      deadline.variant === 'warning' && 'text-warning',
                      deadline.variant === 'default' && 'text-muted-foreground',
                    )}>
                      · {deadline.label}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[calc(92vh-200px)]">
            <div className="p-5 pt-4 space-y-5">
              {/* ── A. Contexto ── */}
              <section className="space-y-2.5">
                <SectionHeader icon={ClipboardList} label="Contexto" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
                  <ContextRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Parceiro" value={partner?.name || '—'} />
                  <ContextRow icon={<FileText className="h-3.5 w-3.5" />} label="Tipo" value={categoryLabel} />
                  <ContextRow
                    icon={<VisitIcon className={cn('h-3.5 w-3.5', visitIsVisita ? 'text-info' : 'text-warning')} />}
                    label="Compromisso"
                    value={item.visit.date ? `${new Date(item.visit.date).toLocaleDateString('pt-BR')} — ${visitIsVisita ? 'Visita' : 'Prospecção'}` : '—'}
                  />
                  <ContextRow icon={<Calendar className="h-3.5 w-3.5" />} label="Prazo" value={deadline.label}
                    valueClassName={cn(
                      deadline.variant === 'overdue' && 'text-destructive font-semibold',
                      deadline.variant === 'warning' && 'text-warning font-semibold',
                    )} />
                  <ContextRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Responsável" value={responsible?.name || 'Sem responsável'} />
                  {item.task.taskBankName && (
                    <ContextRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Banco" value={item.task.taskBankName} />
                  )}
                </div>
              </section>


              {/* ── B. Devolutiva ── */}
              {item.task.taskReturnReason && !completed && !cancelled && (
                <section className="space-y-2.5">
                  <SectionHeader icon={MessageSquare} label="Devolutiva" />
                  <div className="relative overflow-hidden rounded-md border border-warning/30 bg-warning/10 pl-3 pr-3 py-2.5">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                    <p className="text-xs text-foreground leading-relaxed">{item.task.taskReturnReason}</p>
                  </div>
                </section>
              )}

              {item.task.taskDocStatus === 'submitted_for_validation' && !completed && (
                <section className="space-y-2.5">
                  <SectionHeader icon={MessageSquare} label="Devolutiva" />
                  <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      Aguardando validação do Cadastro
                    </p>
                  </div>
                </section>
              )}

              {/* ── Nota administrativa ── */}
              {(item.task.taskAdminNote || permissions.canTerminalEdit) && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={MessageSquarePlus} label="Nota administrativa" />
                    {permissions.canTerminalEdit && !editingNote && (
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 -mt-1" onClick={handleStartNoteEdit}>
                        <Edit3 className="h-3 w-3" />
                        {item.task.taskAdminNote ? 'Editar' : 'Adicionar'}
                      </Button>
                    )}
                  </div>
                  {editingNote ? (
                    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2.5">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Adicione uma nota administrativa..."
                        className="text-xs min-h-[64px] resize-none bg-background"
                        maxLength={500}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-xs h-7" onClick={handleSaveNote}>
                          Salvar nota
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingNote(false)}>
                          Cancelar
                        </Button>
                        <span className="text-[10px] text-muted-foreground ml-auto">{noteText.length}/500</span>
                      </div>
                    </div>
                  ) : item.task.taskAdminNote ? (
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{item.task.taskAdminNote}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">Nenhuma nota administrativa registrada.</p>
                  )}
                </section>
              )}

              {/* ── Atribuídos ── */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Users} label="Atribuídos" />
                  {permissions.canAssign && onUpdateAssignees && !editingAssignees && (
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 -mt-1"
                      onClick={() => setEditingAssignees(true)}
                    >
                      <Edit3 className="h-3 w-3" />
                      {(item.task.taskAssignedUserIds?.length ?? 0) > 0 ? 'Editar' : 'Adicionar'}
                    </Button>
                  )}
                </div>

                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
                  {/* Principal */}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-[10px]">Principal</Badge>
                    <span className="font-medium text-foreground">{responsible?.name || 'Sem responsável'}</span>
                  </div>

                  {/* Assigned list (read mode) */}
                  {!editingAssignees && (
                    (item.task.taskAssignedUserIds?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.task.taskAssignedUserIds!.map(uid => {
                          const u = getUserById(uid);
                          return (
                            <Badge key={uid} variant="outline" className="text-[10px] bg-background">
                              {u?.name || uid}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Nenhum usuário atribuído além do responsável principal.
                      </p>
                    )
                  )}

                  {/* Edit mode */}
                  {editingAssignees && onUpdateAssignees && (
                    <AssigneesEditor
                      validAssignees={validAssignees}
                      principalId={item.task.userId}
                      currentIds={item.task.taskAssignedUserIds || []}
                      onSave={(ids) => {
                        onUpdateAssignees(item.visit.id, item.task.id, ids);
                        setEditingAssignees(false);
                        toast.success('Atribuídos atualizados');
                      }}
                      onCancel={() => setEditingAssignees(false)}
                    />
                  )}
                </div>
              </section>

              {/* ── C. Histórico ── */}
              <section className="space-y-2.5">
                <SectionHeader icon={History} label="Histórico" />
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-0">
                  {history.map((evt, idx) => (
                    <div key={evt.id} className="flex items-start gap-3 py-1.5">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={cn('h-2 w-2 rounded-full mt-1.5', idx === 0 ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-foreground/30')} />
                        {idx < history.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />}
                      </div>
                      <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                        <span className="text-xs text-foreground">{evt.label}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(evt.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* ── D. Footer com ações ── */}
          <div className="border-t border-border/60 bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {permissions.canConclude && (
                <Button size="sm" className="gap-1.5 text-xs" onClick={handleConclude}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Concluir
                </Button>
              )}
              {permissions.canEdit && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
              {permissions.canAssign && onUpdateAssignees && !editingAssignees && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                  onClick={() => setEditingAssignees(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Atribuir
                </Button>
              )}
              {permissions.canCancel && (
                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmCancel(true)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelar
                </Button>
              )}
              {permissions.canReopen && (
                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setConfirmReopen(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reabrir
                </Button>
              )}
              {permissions.canTerminalEdit && !editingNote && (
                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleStartNoteEdit}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Nota admin.
                </Button>
              )}
              {!hasAnyAction && (
                <p className="text-xs text-muted-foreground italic">Nenhuma ação disponível para esta tarefa.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa será cancelada e removida da lista ativa. Ela ficará acessível apenas pelo filtro de canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen confirmation dialog */}
      <AlertDialog open={confirmReopen} onOpenChange={setConfirmReopen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa voltará ao estado pendente e poderá ser trabalhada novamente. A ação ficará registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReopen}>
              Reabrir tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Small context row ── */
function ContextRow({ icon, label, value, valueClassName }: {
  icon: React.ReactNode; label: string; value: string; valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={cn('font-medium text-foreground truncate', valueClassName)}>{value}</span>
    </div>
  );
}

/* ── Section header (matches AgendaFormDialog/TaskCreateModal pattern) ── */
function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 flex-1">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/* ── Assignees inline editor ── */
function AssigneesEditor({
  validAssignees, principalId, currentIds, onSave, onCancel,
}: {
  validAssignees: User[];
  principalId: string;
  currentIds: string[];
  onSave: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(currentIds);
  const candidates = useMemo(
    () => validAssignees.filter(u => u.id !== principalId),
    [validAssignees, principalId],
  );
  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2.5">
      {candidates.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">
          Nenhum usuário válido para atribuição neste contexto.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map(u => {
            const sel = selected.includes(u.id);
            return (
              <Badge
                key={u.id}
                variant={sel ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-[10px] transition-colors',
                  sel ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
                onClick={() => toggle(u.id)}
              >
                {u.name}
                <span className="text-muted-foreground ml-1 capitalize">({u.role})</span>
              </Badge>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="text-xs h-7" onClick={() => onSave(selected)}>
          Salvar
        </Button>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
