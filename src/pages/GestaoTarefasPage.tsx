import { useState, useMemo, useCallback } from 'react';
import {
  Search, X, Filter, Plus, ListChecks, AlertTriangle, Clock,
  ChevronDown, ChevronUp, CheckCircle2, User as UserIcon,
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import PageHeader from '@/components/shared/PageHeader';
import SectionContainer from '@/components/shared/SectionContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTasks, TaskItem } from '@/hooks/useTasks';
import TaskDetailModal from '@/components/tarefas/TaskDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';

/* ── Filter types ── */
type ScopeFilter = 'todas' | 'minhas' | 'carteira' | 'cadastro' | 'concluidas';
type StatusFilter = 'tudo' | 'pendente' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
type PriorityFilter = 'todas' | 'prioritarias';

const scopeOptions: { value: ScopeFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'minhas', label: 'Minhas' },
  { value: 'carteira', label: 'Carteira' },
  { value: 'cadastro', label: 'Cadastro' },
  { value: 'concluidas', label: 'Concluídas' },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'tudo', label: 'Tudo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'aguardando', label: 'Aguardando terceiro' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'prioritarias', label: 'Prioritárias' },
];

const OVERDUE_DAYS = 10;

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(createdAt: string) {
  return daysSince(createdAt) >= OVERDUE_DAYS;
}

/* ── Deadline display helper ── */
function getDeadlineLabel(createdAt: string, completed: boolean): { label: string; variant: 'default' | 'warning' | 'overdue' } {
  if (completed) return { label: 'Concluída', variant: 'default' };
  const days = daysSince(createdAt);
  if (days >= OVERDUE_DAYS) {
    const overdueDays = days - OVERDUE_DAYS;
    if (overdueDays === 0) return { label: 'Vence hoje', variant: 'warning' };
    return { label: `Atrasada há ${overdueDays}d`, variant: 'overdue' };
  }
  const remaining = OVERDUE_DAYS - days;
  if (remaining === 0) return { label: 'Vence hoje', variant: 'warning' };
  if (remaining === 1) return { label: 'Vence amanhã', variant: 'warning' };
  if (remaining <= 3) return { label: `Vence em ${remaining} dias`, variant: 'warning' };
  return { label: `${remaining}d restantes`, variant: 'default' };
}

/* ── Status display helper ── */
function getStatusDisplay(item: TaskItem): { label: string; className: string } {
  if (item.task.taskCompleted) {
    if (item.task.taskDocStatus === 'validated') return { label: 'Validada', className: 'bg-primary/10 text-primary border-primary/20' };
    return { label: 'Concluída', className: 'bg-primary/10 text-primary border-primary/20' };
  }
  if (item.task.taskDocStatus === 'submitted_for_validation') return { label: 'Aguardando terceiro', className: 'bg-accent text-accent-foreground border-accent' };
  if (item.task.taskDocStatus === 'returned_for_correction') return { label: 'Devolvida', className: 'bg-destructive/10 text-destructive border-destructive/20' };
  return { label: 'Pendente', className: 'bg-muted text-muted-foreground border-border' };
}

/* ── Return reason helper ── */
function getReturnText(item: TaskItem): string | null {
  if (item.task.taskReturnReason) return item.task.taskReturnReason;
  if (item.task.taskDocStatus === 'submitted_for_validation') return 'Aguardando validação do cadastro';
  if (item.task.taskDocStatus === 'returned_for_correction') return 'Devolvida para ajuste';
  return null;
}

/* ── Sort logic ── */
function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    // 1. Priority: document > data > general, pending first
    const priorityScore = (t: TaskItem) => {
      if (t.task.taskCompleted) return 100;
      let score = 0;
      if (t.task.taskCategory === 'document') score = 0;
      else if (t.task.taskCategory === 'data') score = 1;
      else score = 2;
      return score;
    };

    // 2. Overdue first among pending
    const overdueScore = (t: TaskItem) => {
      if (t.task.taskCompleted) return 0;
      return isOverdue(t.task.createdAt) ? -1 : 0;
    };

    // Priority tasks first
    const pa = priorityScore(a);
    const pb = priorityScore(b);
    if (pa !== pb) return pa - pb;

    // Overdue first
    const oa = overdueScore(a);
    const ob = overdueScore(b);
    if (oa !== ob) return oa - ob;

    // Older tasks first (closer deadline)
    const da = new Date(a.task.createdAt).getTime();
    const db = new Date(b.task.createdAt).getTime();
    return da - db;
  });
}

/* ══════════════════════════════════════════════════════════ */
export default function GestaoTarefasPage() {
  const { allTasks, toggleTask } = useTasks();
  const { user } = useAuth();
  const { getPartnerById } = usePartners();

  // Filters
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('todas');
  const [status, setStatus] = useState<StatusFilter>('tudo');
  const [priority, setPriority] = useState<PriorityFilter>('todas');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advCommercial, setAdvCommercial] = useState('all');
  const [advPartner, setAdvPartner] = useState('all');

  // Detail modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const hasActiveFilters = !!(search || scope !== 'todas' || status !== 'tudo' || priority !== 'todas' || advCommercial !== 'all' || advPartner !== 'all');

  const clearFilters = useCallback(() => {
    setSearch('');
    setScope('todas');
    setStatus('tudo');
    setPriority('todas');
    setAdvCommercial('all');
    setAdvPartner('all');
  }, []);

  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Scope
    if (scope === 'minhas') {
      tasks = tasks.filter(t => t.task.userId === user?.id);
    } else if (scope === 'concluidas') {
      tasks = tasks.filter(t => t.task.taskCompleted);
    } else if (scope === 'cadastro') {
      tasks = tasks.filter(t => t.task.taskCategory === 'document' || t.task.taskCategory === 'data');
    } else if (scope === 'carteira') {
      // Tasks from partners in user's portfolio
      tasks = tasks.filter(t => {
        const partner = getPartnerById(t.visit.partnerId);
        return partner?.responsibleUserId === user?.id;
      });
    }

    // Status
    if (status === 'pendente') {
      tasks = tasks.filter(t => !t.task.taskCompleted && !t.task.taskDocStatus);
    } else if (status === 'em_andamento') {
      tasks = tasks.filter(t => !t.task.taskCompleted);
    } else if (status === 'aguardando') {
      tasks = tasks.filter(t => t.task.taskDocStatus === 'submitted_for_validation');
    } else if (status === 'concluida') {
      tasks = tasks.filter(t => t.task.taskCompleted);
    } else if (status === 'cancelada') {
      // No cancel status yet in data
      tasks = [];
    }

    // Priority
    if (priority === 'prioritarias') {
      tasks = tasks.filter(t => !t.task.taskCompleted && isOverdue(t.task.createdAt));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t => {
        const partner = getPartnerById(t.visit.partnerId);
        return (
          t.task.text.toLowerCase().includes(q) ||
          partner?.name.toLowerCase().includes(q) ||
          getUserById(t.task.userId)?.name.toLowerCase().includes(q)
        );
      });
    }

    // Advanced
    if (advPartner !== 'all') tasks = tasks.filter(t => t.visit.partnerId === advPartner);
    if (advCommercial !== 'all') tasks = tasks.filter(t => t.task.userId === advCommercial);

    return sortTasks(tasks);
  }, [allTasks, scope, status, priority, search, user, getPartnerById, advCommercial, advPartner]);

  // Summary
  const totalFiltered = filteredTasks.length;
  const priorityCount = filteredTasks.filter(t => !t.task.taskCompleted && isOverdue(t.task.createdAt)).length;
  const overdueCount = filteredTasks.filter(t => !t.task.taskCompleted && isOverdue(t.task.createdAt)).length;

  // Unique partners and users for advanced filters
  const uniquePartners = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach(t => {
      const p = getPartnerById(t.visit.partnerId);
      if (p) map.set(p.id, p.name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allTasks, getPartnerById]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach(t => {
      const u = getUserById(t.task.userId);
      if (u) map.set(u.id, u.name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allTasks]);

  const handleConclude = useCallback((visitId: string, commentId: string) => {
    toggleTask(visitId, commentId);
  }, [toggleTask]);

  const handleOpenDetail = useCallback((item: TaskItem) => {
    setSelectedTask(item);
    setShowDetail(true);
  }, []);

  const handleConcludeFromModal = useCallback((visitId: string, commentId: string) => {
    toggleTask(visitId, commentId);
    setShowDetail(false);
    setSelectedTask(null);
  }, [toggleTask]);

  return (
    <PageTransition>
      <SectionContainer>
        {/* Header */}
        <PageHeader
          title="Gestão de Tarefas"
          description="Acompanhe e gerencie tarefas operacionais e comerciais da equipe."
        >
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        </PageHeader>

        {/* Quick filters bar */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tarefa, parceiro, cadastro ou compromisso..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              {/* Filter row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={scope} onValueChange={(v) => setScope(v as ScopeFilter)}>
                  <SelectTrigger className="w-[120px] sm:w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Escopo" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priority} onValueChange={(v) => setPriority(v as PriorityFilter)}>
                  <SelectTrigger className="w-[120px] sm:w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground h-9">
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced filters (collapsible) */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros adicionais
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Select value={advCommercial} onValueChange={setAdvCommercial}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos comerciais</SelectItem>
                      {uniqueUsers.map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={advPartner} onValueChange={setAdvPartner}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Parceiro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos parceiros</SelectItem>
                      {uniquePartners.map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select disabled>
                    <SelectTrigger className="h-9 text-xs opacity-50">
                      <SelectValue placeholder="Cadastro" />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="x">—</SelectItem></SelectContent>
                  </Select>

                  <Select disabled>
                    <SelectTrigger className="h-9 text-xs opacity-50">
                      <SelectValue placeholder="Compromisso" />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="x">—</SelectItem></SelectContent>
                  </Select>

                  <Select disabled>
                    <SelectTrigger className="h-9 text-xs opacity-50">
                      <SelectValue placeholder="Tipo tarefa" />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="x">—</SelectItem></SelectContent>
                  </Select>

                  <Select disabled>
                    <SelectTrigger className="h-9 text-xs opacity-50">
                      <SelectValue placeholder="Prazo" />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="x">—</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Summary bar */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs px-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            <span className="font-semibold text-foreground">{totalFiltered}</span>
            <span>tarefa{totalFiltered !== 1 ? 's' : ''}</span>
          </div>
          {priorityCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-semibold">{priorityCount}</span>
              <span>prioritária{priorityCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 text-destructive">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-semibold">{overdueCount}</span>
              <span>atrasada{overdueCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Task list or empty state */}
        {filteredTasks.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(item => (
              <TaskCard
                key={item.task.id}
                item={item}
                getPartnerById={getPartnerById}
                onConclude={handleConclude}
                onClick={() => handleOpenDetail(item)}
              />
            ))}
          </div>
        )}

        {/* Detail modal */}
        <TaskDetailModal
          item={selectedTask}
          partner={selectedTask ? getPartnerById(selectedTask.visit.partnerId) : undefined}
          open={showDetail}
          onOpenChange={(open) => {
            setShowDetail(open);
            if (!open) setSelectedTask(null);
          }}
          onConclude={handleConcludeFromModal}
        />
      </SectionContainer>
    </PageTransition>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── Task Card ── */
/* ══════════════════════════════════════════════════════════ */
function TaskCard({
  item,
  getPartnerById,
  onConclude,
  onClick,
}: {
  item: TaskItem;
  getPartnerById: (id: string) => ReturnType<ReturnType<typeof usePartners>['getPartnerById']>;
  onConclude: (visitId: string, commentId: string) => void;
  onClick: () => void;
}) {
  const partner = getPartnerById(item.visit.partnerId);
  const responsible = getUserById(item.task.userId);
  const completed = !!item.task.taskCompleted;
  const overdue = !completed && isOverdue(item.task.createdAt);
  const statusDisplay = getStatusDisplay(item);
  const deadline = getDeadlineLabel(item.task.createdAt, completed);
  const returnText = getReturnText(item);

  // Context line: partner + category
  const contextParts: string[] = [];
  if (partner) contextParts.push(partner.name);
  if (item.task.taskCategory === 'document') contextParts.push('Documento');
  else if (item.task.taskCategory === 'data') contextParts.push('Cadastro');

  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-all duration-200 cursor-pointer group',
        'hover:shadow-md hover:border-primary/20',
        overdue && 'border-destructive/30',
        completed && 'opacity-75',
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Left: status dot */}
          <div className="pt-0.5 shrink-0">
            <div className={cn(
              'h-2.5 w-2.5 rounded-full',
              completed ? 'bg-primary' : overdue ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/30'
            )} />
          </div>

          {/* Center: content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title */}
            <p className={cn(
              'text-sm font-semibold leading-snug line-clamp-2',
              completed && 'line-through text-muted-foreground'
            )}>
              {item.task.text}
            </p>

            {/* Context: partner + category */}
            {contextParts.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {contextParts.join(' • ')}
              </p>
            )}

            {/* Status + Deadline row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] font-medium', statusDisplay.className)}>
                {statusDisplay.label}
              </Badge>

              <span className={cn(
                'text-[10px] font-medium',
                deadline.variant === 'overdue' && 'text-destructive font-semibold',
                deadline.variant === 'warning' && 'text-amber-600 dark:text-amber-400 font-semibold',
                deadline.variant === 'default' && 'text-muted-foreground',
              )}>
                {deadline.label}
              </span>

              {item.task.taskCategory && (
                <Badge variant="outline" className="text-[10px] font-normal capitalize border-dashed">
                  {item.task.taskCategory === 'document' ? 'Doc' : item.task.taskCategory === 'data' ? 'Dado' : 'Geral'}
                </Badge>
              )}
            </div>

            {/* Return / feedback text */}
            {returnText && !completed && (
              <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1 line-clamp-1 italic">
                {returnText}
              </p>
            )}

            {/* Bottom row: responsible + date */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span>{responsible?.name || 'Sem responsável'}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.task.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Right: conclude action */}
          {!completed && (
            <div className="shrink-0 pt-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                title="Concluir tarefa"
                onClick={(e) => {
                  e.stopPropagation();
                  onConclude(item.visit.id, item.task.id);
                }}
              >
                <CheckCircle2 className="h-4.5 w-4.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── Empty State ── */
/* ══════════════════════════════════════════════════════════ */
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <ListChecks className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {hasFilters
            ? 'Nenhuma tarefa encontrada para os filtros selecionados.'
            : 'Quando houver tarefas, elas aparecerão aqui.'}
        </p>
      </div>
      <div className="flex gap-2">
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear} className="gap-1 text-xs">
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        )}
        <Button size="sm" className="gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Nova tarefa
        </Button>
      </div>
    </div>
  );
}
