import { useTasks, TaskItem } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onOpenVisit?: (visitId: string) => void;
}

export default function PendingTasksCard({ onOpenVisit }: Props) {
  const { pendingTasks, overdueTasks, toggleTask, getDaysPending } = useTasks();

  if (pendingTasks.length === 0) return null;

  const top5 = pendingTasks.slice(0, 5);

  return (
    <Card className="hover:shadow-md transition-shadow border-warning/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-warning" />
            Tarefas pendentes
          </span>
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {pendingTasks.length} total
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        <AnimatePresence>
          {top5.map((item) => (
            <TaskRow
              key={item.task.id}
              item={item}
              onToggle={() => toggleTask(item.visit.id, item.task.id)}
              onOpen={() => onOpenVisit?.(item.visit.id)}
              daysPending={getDaysPending(item.task.createdAt)}
            />
          ))}
        </AnimatePresence>
        {pendingTasks.length > 5 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{pendingTasks.length - 5} tarefa{pendingTasks.length - 5 > 1 ? 's' : ''} pendente{pendingTasks.length - 5 > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({ item, onToggle, onOpen, daysPending }: {
  item: TaskItem;
  onToggle: () => void;
  onOpen: () => void;
  daysPending: number;
}) {
  const isOverdue = daysPending >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
        isOverdue ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10' : 'bg-muted/30 border-border hover:bg-muted/60'
      )}
      onClick={onOpen}
    >
      <motion.div whileTap={{ scale: 0.9 }} className="mt-0.5" onClick={e => { e.stopPropagation(); onToggle(); }}>
        <Checkbox className="h-4 w-4" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug line-clamp-2">{item.task.text}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {item.partner?.name || 'Parceiro'}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {format(parseISO(item.task.createdAt), "dd/MM", { locale: ptBR })}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0">
              {daysPending}d
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
