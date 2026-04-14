import { useMemo } from 'react';
import {
  Calendar, User as UserIcon, Briefcase, FileText, Link2,
  CheckCircle2, Edit3, UserPlus, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskItem } from '@/hooks/useTasks';
import { getUserById, Partner } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const OVERDUE_DAYS = 10;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(createdAt: string) {
  return daysSince(createdAt) >= OVERDUE_DAYS;
}

/* ── Status ── */
function getStatusInfo(item: TaskItem) {
  if (item.task.taskCompleted) {
    if (item.task.taskDocStatus === 'validated') return { label: 'Validada', className: 'bg-primary/10 text-primary border-primary/20' };
    return { label: 'Concluída', className: 'bg-primary/10 text-primary border-primary/20' };
  }
  if (item.task.taskDocStatus === 'submitted_for_validation') return { label: 'Aguardando terceiro', className: 'bg-accent text-accent-foreground border-accent' };
  if (item.task.taskDocStatus === 'returned_for_correction') return { label: 'Devolvida', className: 'bg-destructive/10 text-destructive border-destructive/20' };
  return { label: 'Pendente', className: 'bg-muted text-muted-foreground border-border' };
}

/* ── Deadline ── */
function getDeadlineLabel(createdAt: string, completed: boolean) {
  if (completed) return { label: 'Concluída', variant: 'default' as const };
  const days = daysSince(createdAt);
  if (days >= OVERDUE_DAYS) {
    const over = days - OVERDUE_DAYS;
    if (over === 0) return { label: 'Vence hoje', variant: 'warning' as const };
    return { label: `Atrasada há ${over}d`, variant: 'overdue' as const };
  }
  const remaining = OVERDUE_DAYS - days;
  if (remaining === 0) return { label: 'Vence hoje', variant: 'warning' as const };
  if (remaining === 1) return { label: 'Vence amanhã', variant: 'warning' as const };
  if (remaining <= 3) return { label: `Vence em ${remaining} dias`, variant: 'warning' as const };
  return { label: `${remaining}d restantes`, variant: 'default' as const };
}

/* ── History events (mock) ── */
interface HistoryEvent {
  id: string;
  label: string;
  date: string;
}

function buildHistory(item: TaskItem): HistoryEvent[] {
  const events: HistoryEvent[] = [];
  const created = new Date(item.task.createdAt);

  events.push({
    id: 'created',
    label: 'Tarefa criada',
    date: created.toISOString(),
  });

  if (item.task.taskDocStatus === 'submitted_for_validation') {
    events.push({
      id: 'submitted',
      label: 'Enviada para validação',
      date: new Date(created.getTime() + 2 * 86400000).toISOString(),
    });
  }

  if (item.task.taskDocStatus === 'returned_for_correction') {
    events.push({
      id: 'returned',
      label: 'Devolvida para correção',
      date: new Date(created.getTime() + 3 * 86400000).toISOString(),
    });
  }

  if (item.task.taskDocStatus === 'validated') {
    events.push({
      id: 'validated',
      label: 'Documento validado',
      date: new Date(created.getTime() + 4 * 86400000).toISOString(),
    });
  }

  if (item.task.taskCompleted) {
    events.push({
      id: 'completed',
      label: 'Tarefa concluída',
      date: new Date(created.getTime() + 5 * 86400000).toISOString(),
    });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ══════════════════════════════════════════════════════════ */
interface TaskDetailModalProps {
  item: TaskItem | null;
  partner: Partner | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConclude: (visitId: string, commentId: string) => void;
}

export default function TaskDetailModal({
  item, partner, open, onOpenChange, onConclude,
}: TaskDetailModalProps) {
  if (!item) return null;

  const responsible = getUserById(item.task.userId);
  const completed = !!item.task.taskCompleted;
  const overdue = !completed && isOverdue(item.task.createdAt);
  const statusInfo = getStatusInfo(item);
  const deadline = getDeadlineLabel(item.task.createdAt, completed);
  const history = useMemo(() => buildHistory(item), [item]);

  const categoryLabel = item.task.taskCategory === 'document'
    ? 'Documento' : item.task.taskCategory === 'data'
    ? 'Dado operacional' : 'Geral';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-2">
          <div className="flex items-start gap-2 pr-6">
            <div className="flex-1 min-w-0 space-y-1.5">
              <DialogTitle className="text-base font-semibold leading-snug">
                {item.task.text}
              </DialogTitle>
              <DialogDescription className="sr-only">Detalhe da tarefa</DialogDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-[11px] font-medium', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {overdue && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Prioritária
                  </Badge>
                )}
                <span className={cn(
                  'text-[11px] font-medium',
                  deadline.variant === 'overdue' && 'text-destructive',
                  deadline.variant === 'warning' && 'text-amber-600 dark:text-amber-400',
                  deadline.variant === 'default' && 'text-muted-foreground',
                )}>
                  {deadline.label}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-4 sm:p-5 pt-3 space-y-4">
            {/* ── A. Context block ── */}
            <section className="space-y-2.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contexto
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Partner */}
                <ContextRow
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Parceiro"
                  value={partner?.name || '—'}
                />
                {/* Category / type */}
                <ContextRow
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Tipo"
                  value={categoryLabel}
                />
                {/* Visit link */}
                <ContextRow
                  icon={<Link2 className="h-3.5 w-3.5" />}
                  label="Compromisso"
                  value={item.visit.date
                    ? `${new Date(item.visit.date).toLocaleDateString('pt-BR')} — ${item.visit.type}`
                    : '—'}
                />
                {/* Deadline */}
                <ContextRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Prazo"
                  value={deadline.label}
                  valueClassName={cn(
                    deadline.variant === 'overdue' && 'text-destructive font-semibold',
                    deadline.variant === 'warning' && 'text-amber-600 dark:text-amber-400 font-semibold',
                  )}
                />
                {/* Responsible */}
                <ContextRow
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  label="Responsável"
                  value={responsible?.name || 'Sem responsável'}
                />
                {/* Bank if applicable */}
                {item.task.taskBankName && (
                  <ContextRow
                    icon={<Briefcase className="h-3.5 w-3.5" />}
                    label="Banco"
                    value={item.task.taskBankName}
                  />
                )}
              </div>
            </section>

            <Separator />

            {/* ── B. Return / feedback block ── */}
            {item.task.taskReturnReason && !completed && (
              <>
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Devolutiva
                  </h4>
                  <div className="bg-muted/50 border border-border rounded-md p-3">
                    <p className="text-xs text-foreground leading-relaxed">
                      {item.task.taskReturnReason}
                    </p>
                  </div>
                </section>
                <Separator />
              </>
            )}

            {item.task.taskDocStatus === 'submitted_for_validation' && !completed && (
              <>
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Devolutiva
                  </h4>
                  <div className="bg-muted/50 border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      Aguardando validação do cadastro
                    </p>
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* ── C. History block ── */}
            <section className="space-y-2.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Histórico
              </h4>
              <div className="space-y-0">
                {history.map((evt, idx) => (
                  <div key={evt.id} className="flex items-start gap-3 py-1.5">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={cn(
                        'h-2 w-2 rounded-full mt-1',
                        idx === 0 ? 'bg-primary' : 'bg-muted-foreground/30',
                      )} />
                      {idx < history.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />
                      )}
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

        {/* ── D. Actions footer ── */}
        <div className="border-t bg-muted/30 p-3 sm:p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {!completed && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => onConclude(item.visit.id, item.task.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Concluir
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
              <UserPlus className="h-3.5 w-3.5" />
              Atribuir
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" disabled>
              <XCircle className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Small context row ── */
function ContextRow({
  icon, label, value, valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={cn('font-medium text-foreground truncate', valueClassName)}>
        {value}
      </span>
    </div>
  );
}
