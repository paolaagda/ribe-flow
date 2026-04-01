import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { CheckSquare, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  partnerId: string;
}

export default function PartnerTasksSection({ partnerId }: Props) {
  const { getTasksByPartnerId, toggleTask, getDaysPending } = useTasks();
  const tasks = getTasksByPartnerId(partnerId);
  const pending = tasks.filter(t => !t.task.taskCompleted);
  const completed = tasks.filter(t => t.task.taskCompleted);

  if (tasks.length === 0) return null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Tarefas
          </span>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">
                {pending.length} pendente{pending.length > 1 ? 's' : ''}
              </Badge>
            )}
            {completed.length > 0 && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
                {completed.length} concluída{completed.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pending.map(item => {
          const days = getDaysPending(item.task.createdAt);
          const isOverdue = days >= 10;
          return (
            <motion.div
              key={item.task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-start gap-2 p-2.5 rounded-lg border',
                isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border'
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }} className="mt-0.5">
                <Checkbox
                  className="h-4 w-4"
                  onCheckedChange={() => toggleTask(item.visit.id, item.task.id)}
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.task.text}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-muted-foreground">
                  {item.task.taskCategory && (
                    <Badge variant="outline" className={cn(
                      'text-[9px] px-1 py-0',
                      item.task.taskCategory === 'document' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent text-accent-foreground border-accent'
                    )}>
                      {item.task.taskCategory === 'document' ? 'Documento' : 'Dado'}
                    </Badge>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(parseISO(item.visit.date), "dd/MM/yy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    há {days}d
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> Atrasada
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {completed.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="completed" className="border-none">
              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                Concluídas ({completed.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-1.5 pt-1">
                {completed.map(item => (
                  <div key={item.task.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border/50">
                    <Checkbox checked disabled className="h-4 w-4 mt-0.5 opacity-50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground line-through">{item.task.text}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(item.visit.date), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
