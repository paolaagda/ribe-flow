import { useState, useMemo } from 'react';
import { Search, X, Filter, Plus, ListChecks, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';

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

function isOverdue(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) >= OVERDUE_DAYS;
}

export default function GestaoTarefasPage() {
  const { allTasks, pendingTasks, overdueTasks, getDaysPending } = useTasks();
  const { user } = useAuth();
  const { getPartnerById } = usePartners();

  // Filters
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('todas');
  const [status, setStatus] = useState<StatusFilter>('tudo');
  const [priority, setPriority] = useState<PriorityFilter>('todas');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters (placeholders)
  const [advCommercial, setAdvCommercial] = useState('all');
  const [advPartner, setAdvPartner] = useState('all');

  const hasActiveFilters = !!(search || scope !== 'todas' || status !== 'tudo' || priority !== 'todas' || advCommercial !== 'all' || advPartner !== 'all');

  const clearFilters = () => {
    setSearch('');
    setScope('todas');
    setStatus('tudo');
    setPriority('todas');
    setAdvCommercial('all');
    setAdvPartner('all');
  };

  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Scope
    if (scope === 'minhas') {
      tasks = tasks.filter(t => t.task.userId === user?.id);
    } else if (scope === 'concluidas') {
      tasks = tasks.filter(t => t.task.taskCompleted);
    } else if (scope !== 'todas') {
      // carteira / cadastro - placeholder, show all for now
    }

    // Status
    if (status === 'pendente') {
      tasks = tasks.filter(t => !t.task.taskCompleted);
    } else if (status === 'concluida') {
      tasks = tasks.filter(t => t.task.taskCompleted);
    }
    // em_andamento, aguardando, cancelada — future statuses

    // Priority (overdue = prioritária for now)
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
    if (advPartner !== 'all') {
      tasks = tasks.filter(t => t.visit.partnerId === advPartner);
    }
    if (advCommercial !== 'all') {
      tasks = tasks.filter(t => t.task.userId === advCommercial);
    }

    return tasks;
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
    return Array.from(map.entries());
  }, [allTasks, getPartnerById]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach(t => {
      const u = getUserById(t.task.userId);
      if (u) map.set(u.id, u.name);
    });
    return Array.from(map.entries());
  }, [allTasks]);

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
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefa, parceiro ou responsável..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={scope} onValueChange={(v) => setScope(v as ScopeFilter)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Escopo" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                  <SelectTrigger className="w-[150px] h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priority} onValueChange={(v) => setPriority(v as PriorityFilter)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
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
              <CardContent className="p-4">
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

                  {/* Placeholder slots for future filters */}
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
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            <span className="font-medium">{totalFiltered}</span>
            <span>tarefa{totalFiltered !== 1 ? 's' : ''} encontrada{totalFiltered !== 1 ? 's' : ''}</span>
          </div>
          {priorityCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{priorityCount}</span>
              <span>prioritária{priorityCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 text-destructive">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{overdueCount}</span>
              <span>atrasada{overdueCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Task list or empty state */}
        {filteredTasks.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(item => (
              <TaskCard key={item.task.id} item={item} getDaysPending={getDaysPending} getPartnerById={getPartnerById} />
            ))}
          </div>
        )}
      </SectionContainer>
    </PageTransition>
  );
}

/* ── Task Card ── */
function TaskCard({
  item,
  getDaysPending,
  getPartnerById,
}: {
  item: TaskItem;
  getDaysPending: (d: string) => number;
  getPartnerById: (id: string) => ReturnType<ReturnType<typeof usePartners>['getPartnerById']>;
}) {
  const partner = getPartnerById(item.visit.partnerId);
  const responsible = getUserById(item.task.userId);
  const days = getDaysPending(item.task.createdAt);
  const overdue = !item.task.taskCompleted && days >= OVERDUE_DAYS;

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/20',
        overdue && !item.task.taskCompleted && 'border-destructive/30'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          <div className={cn(
            'mt-1 h-3 w-3 rounded-full shrink-0',
            item.task.taskCompleted ? 'bg-primary' : overdue ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/30'
          )} />

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Task text */}
            <p className={cn(
              'text-sm font-medium leading-snug',
              item.task.taskCompleted && 'line-through text-muted-foreground'
            )}>
              {item.task.text}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              {partner && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {partner.name}
                </Badge>
              )}
              {item.task.taskCategory && (
                <Badge variant="outline" className="text-[10px] font-normal capitalize">
                  {item.task.taskCategory === 'document' ? 'Documento' : item.task.taskCategory === 'data' ? 'Dado' : 'Geral'}
                </Badge>
              )}
              {item.task.taskCompleted ? (
                <Badge className="text-[10px] bg-primary/10 text-primary border-0">Concluída</Badge>
              ) : overdue ? (
                <Badge variant="destructive" className="text-[10px]">Atrasada ({days}d)</Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">Pendente · {days}d</span>
              )}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
              <span>{responsible?.name || 'Sem responsável'}</span>
              <span>{new Date(item.task.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Empty State ── */
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
            ? 'Tente ajustar os filtros para encontrar o que procura.'
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
