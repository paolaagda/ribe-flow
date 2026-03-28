import { useState, useMemo } from 'react';
import { useTasks, TaskItem } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, mockUsers } from '@/data/mock-data';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle2, ListTodo } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenVisit?: (visitId: string) => void;
}

export default function TasksDrawer({ open, onOpenChange, onOpenVisit }: Props) {
  const { allTasks, pendingTasks, completedTasks, overdueTasks, toggleTask, getDaysPending } = useTasks();
  const { profile } = useAuth();
  const [filterUser, setFilterUser] = useState('all');
  const [tab, setTab] = useState('pending');

  const filteredPending = useMemo(() => {
    if (filterUser === 'all') return pendingTasks;
    return pendingTasks.filter(t => t.visit.userId === filterUser);
  }, [pendingTasks, filterUser]);

  const filteredCompleted = useMemo(() => {
    if (filterUser === 'all') return completedTasks;
    return completedTasks.filter(t => t.visit.userId === filterUser);
  }, [completedTasks, filterUser]);

  const activeUsers = useMemo(() => {
    const ids = new Set(allTasks.map(t => t.visit.userId));
    return mockUsers.filter(u => ids.has(u.id));
  }, [allTasks]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-warning" />
              Tarefas
              <Badge variant="secondary" className="text-xs">{allTasks.length}</Badge>
            </DrawerTitle>
            {profile === 'gestor' && activeUsers.length > 1 && (
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DrawerHeader>

        <Tabs value={tab} onValueChange={setTab} className="px-4 pb-4">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1 text-xs gap-1">
              Pendentes
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{filteredPending.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs gap-1">
              Concluídas
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{filteredCompleted.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-3">
            <ScrollArea className="max-h-[55vh]">
              {filteredPending.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente</div>
              ) : (
                <div className="space-y-2 pr-3">
                  {overdueTasks.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">{overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''} (10+ dias)</span>
                    </div>
                  )}
                  {filteredPending.map(item => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      onToggle={() => toggleTask(item.visit.id, item.task.id)}
                      onOpen={() => { onOpenVisit?.(item.visit.id); onOpenChange(false); }}
                      daysPending={getDaysPending(item.task.createdAt)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completed" className="mt-3">
            <ScrollArea className="max-h-[55vh]">
              {filteredCompleted.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa concluída</div>
              ) : (
                <div className="space-y-2 pr-3">
                  {filteredCompleted.map(item => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      completed
                      onToggle={() => toggleTask(item.visit.id, item.task.id)}
                      onOpen={() => { onOpenVisit?.(item.visit.id); onOpenChange(false); }}
                      daysPending={getDaysPending(item.task.createdAt)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

function TaskRow({ item, onToggle, onOpen, daysPending, completed }: {
  item: TaskItem;
  onToggle: () => void;
  onOpen: () => void;
  daysPending: number;
  completed?: boolean;
}) {
  const isOverdue = !completed && daysPending >= 10;
  const owner = getUserById(item.visit.userId);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
        completed ? 'bg-muted/20 border-border' :
        isOverdue ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10' :
        'bg-muted/30 border-border hover:bg-muted/60'
      )}
      onClick={onOpen}
    >
      <div className="mt-0.5" onClick={e => { e.stopPropagation(); onToggle(); }}>
        <Checkbox checked={!!completed} className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs leading-snug line-clamp-2', completed && 'line-through text-muted-foreground')}>{item.task.text}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {item.partner?.name || 'Parceiro'}
          </span>
          {owner && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              • {owner.name.split(' ')[0]}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {format(parseISO(item.task.createdAt), "dd/MM", { locale: ptBR })}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0">{daysPending}d</Badge>
          )}
          {completed && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Feita
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
