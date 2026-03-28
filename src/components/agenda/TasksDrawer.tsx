import { useState, useMemo } from 'react';
import { useTasks, TaskItem } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, mockUsers } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle2, ListTodo, CalendarIcon, Filter, X } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange } from 'react-day-picker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenVisit?: (visitId: string) => void;
}

export default function TasksDrawer({ open, onOpenChange, onOpenVisit }: Props) {
  const { allTasks, pendingTasks, completedTasks, overdueTasks, toggleTask, getDaysPending } = useTasks();
  const { profile } = useAuth();
  const { partners } = usePartners();
  const [filterUser, setFilterUser] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');
  const [filterOverdue, setFilterOverdue] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState('pending');

  const activeUsers = useMemo(() => {
    const ids = new Set(allTasks.map(t => t.visit.userId));
    return mockUsers.filter(u => ids.has(u.id));
  }, [allTasks]);

  const activePartners = useMemo(() => {
    const ids = new Set(allTasks.map(t => t.visit.partnerId));
    return partners.filter(p => ids.has(p.id));
  }, [allTasks, partners]);

  const applyFilters = (tasks: TaskItem[]) => {
    let result = tasks;
    if (filterUser !== 'all') {
      result = result.filter(t => t.visit.userId === filterUser);
    }
    if (filterPartner !== 'all') {
      result = result.filter(t => t.visit.partnerId === filterPartner);
    }
    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      result = result.filter(t => !isBefore(parseISO(t.task.createdAt), from));
    }
    if (dateRange?.to) {
      const to = endOfDay(dateRange.to);
      result = result.filter(t => !isAfter(parseISO(t.task.createdAt), to));
    }
    if (filterOverdue === 'overdue') {
      result = result.filter(t => getDaysPending(t.task.createdAt) >= 10);
    } else if (filterOverdue === 'on_time') {
      result = result.filter(t => getDaysPending(t.task.createdAt) < 10);
    }
    return result;
  };

  const filteredPending = useMemo(() => applyFilters(pendingTasks), [pendingTasks, filterUser, filterPartner, dateRange, filterOverdue]);
  const filteredCompleted = useMemo(() => applyFilters(completedTasks), [completedTasks, filterUser, filterPartner, dateRange, filterOverdue]);

  const hasActiveFilters = filterUser !== 'all' || filterPartner !== 'all' || filterOverdue !== 'all' || !!dateRange;

  const clearFilters = () => {
    setFilterUser('all');
    setFilterPartner('all');
    setFilterOverdue('all');
    setDateRange(undefined);
  };

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
            <div className="flex items-center gap-1.5">
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs gap-1 relative"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center">!</span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
          </div>
        </DrawerHeader>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3">
                {profile === 'gestor' && activeUsers.length > 1 && (
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos usuários</SelectItem>
                      {activeUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filterPartner} onValueChange={setFilterPartner}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos parceiros</SelectItem>
                    {activePartners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterOverdue} onValueChange={setFilterOverdue}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="overdue">Atrasadas (10+d)</SelectItem>
                    <SelectItem value="on_time">No prazo</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-7 text-xs justify-start gap-1 font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="h-3 w-3" />
                      {dateRange?.from ? (
                        dateRange.to
                          ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                          : format(dateRange.from, 'dd/MM/yy')
                      ) : 'Período'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <ScrollArea className="max-h-[50vh]">
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
            <ScrollArea className="max-h-[50vh]">
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
