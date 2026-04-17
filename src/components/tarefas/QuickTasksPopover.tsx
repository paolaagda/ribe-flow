import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Plus, ExternalLink, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks, isTaskPriority, type TaskItem } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import {
  isTaskCancelled,
  isTaskOverdue,
  getTaskDeadlineLabel,
} from '@/lib/task-helpers';
import TaskCreateModal from '@/components/tarefas/TaskCreateModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Caixa rápida pessoal de tarefas — sempre mostra apenas tarefas em que o
 * usuário logado é o responsável principal (task.userId).
 *
 * Limitação atual do modelo: tarefas hoje têm apenas um responsável (userId),
 * não existe ainda um campo de "atribuídos múltiplos". Quando esse campo for
 * adicionado ao VisitComment (ex.: taskAssignedUserIds: string[]), basta
 * incluir aqui no filtro: `|| t.task.taskAssignedUserIds?.includes(user.id)`.
 *
 * NÃO usar "responsável de carteira" nem visões globais de perfil — esta caixa
 * é estritamente pessoal, independente do cargo do usuário.
 *
 * Mostra apenas status ativos: Pendente, Em andamento, Aguardando terceiro.
 * Não exibe Concluídas nem Canceladas. Sem limite artificial — usa scroll.
 */
export default function QuickTasksPopover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allTasks, toggleTask } = useTasks();
  const { getPartnerById } = usePartners();
  const [open, setOpen] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  // Recorte estritamente pessoal: somente tarefas em que o usuário é o
  // responsável principal. Ignora cargo/visão global e responsável de carteira.
  const personalTasks = React.useMemo<TaskItem[]>(() => {
    if (!user) return [];
    return allTasks.filter(t => t.task.userId === user.id);
  }, [allTasks, user]);

  // Apenas status ativos (não concluída, não cancelada)
  const activeTasks = React.useMemo<TaskItem[]>(
    () => personalTasks.filter(t => !t.task.taskCompleted && !isTaskCancelled(t)),
    [personalTasks],
  );

  // Ordenação espelhando a página principal
  const sortedTasks = React.useMemo<TaskItem[]>(() => {
    return [...activeTasks].sort((a, b) => {
      const priorityScore = (t: TaskItem) => {
        if (t.task.taskCategory === 'document') return 0;
        if (t.task.taskCategory === 'data') return 1;
        if (t.task.taskPriority) return 2;
        return 3;
      };
      const pa = priorityScore(a), pb = priorityScore(b);
      if (pa !== pb) return pa - pb;
      const oa = isTaskOverdue(a.task.createdAt) ? -1 : 0;
      const ob = isTaskOverdue(b.task.createdAt) ? -1 : 0;
      if (oa !== ob) return oa - ob;
      return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
    });
  }, [activeTasks]);

  const count = sortedTasks.length;

  const handleConclude = React.useCallback((e: React.MouseEvent, item: TaskItem) => {
    e.stopPropagation();
    toggleTask(item.visit.id, item.task.id);
    toast.success('Tarefa concluída');
  }, [toggleTask]);

  const handleSeeAll = () => {
    setOpen(false);
    navigate('/tarefas');
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            title="Minhas tarefas"
          >
            <ListTodo className="h-4 w-4" />
            {count > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                aria-label={`${count} tarefas ativas`}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[360px] p-0 overflow-hidden"
          sideOffset={8}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Tarefas</span>
              {count > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {count}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setOpen(false); setShowCreate(true); }}
              title="Nova tarefa"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Corpo */}
          {sortedTasks.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Você não tem tarefas pendentes no momento
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[420px]">
              <div className="divide-y divide-border">
                {sortedTasks.map(item => (
                  <QuickTaskRow
                    key={item.task.id}
                    item={item}
                    partnerName={getPartnerById(item.visit.partnerId)?.name}
                    onConclude={handleConclude}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Rodapé */}
          <div className="px-3 py-2 border-t border-border bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeeAll}
              className="w-full h-8 text-xs justify-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              Ver todas
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <TaskCreateModal open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
}

/* ── Item resumido ── */
interface QuickTaskRowProps {
  item: TaskItem;
  partnerName?: string;
  onConclude: (e: React.MouseEvent, item: TaskItem) => void;
}

function QuickTaskRow({ item, partnerName, onConclude }: QuickTaskRowProps) {
  const deadline = getTaskDeadlineLabel(item.task.createdAt, !!item.task.taskCompleted);
  const overdue = deadline.variant === 'overdue';
  const warning = deadline.variant === 'warning';
  const priority = isTaskPriority(item.task);

  return (
    <div className="px-3 py-2.5 hover:bg-muted/40 transition-colors group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Título + prioridade */}
          <div className="flex items-start gap-1.5">
            {priority && (
              <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
              {item.task.text}
            </p>
          </div>

          {/* Parceiro + prazo */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            {partnerName && (
              <span className="truncate max-w-[180px]">{partnerName}</span>
            )}
            {partnerName && <span className="opacity-50">•</span>}
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium',
                overdue && 'text-destructive',
                warning && 'text-amber-600 dark:text-amber-400',
              )}
            >
              {(overdue || warning) && <AlertTriangle className="h-2.5 w-2.5" />}
              {deadline.label}
            </span>
          </div>
        </div>

        {/* Ação concluir */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100 hover:text-primary"
          onClick={(e) => onConclude(e, item)}
          title="Concluir tarefa"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
