import { AuditLogEntry, actionLabels, actionColors } from '@/data/audit-log';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FileText, Pencil, Trash2, RefreshCw, Shield } from 'lucide-react';

const actionIcons: Record<string, typeof FileText> = {
  create: FileText,
  edit: Pencil,
  delete: Trash2,
  status_change: RefreshCw,
  permission_change: Shield,
  approve: Shield,
  reject: Trash2,
};

interface Props {
  logs: AuditLogEntry[];
  maxItems?: number;
  emptyMessage?: string;
}

export default function AuditTimeline({ logs, maxItems, emptyMessage = 'Nenhuma alteração registrada ainda' }: Props) {
  const { getAvatar } = useUserAvatars();
  const displayed = maxItems ? logs.slice(0, maxItems) : logs;

  if (displayed.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayed.map((log) => {
        const Icon = actionIcons[log.action] || FileText;
        return (
          <div key={log.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <Avatar className="h-7 w-7 shrink-0">
                {getAvatar(log.userId) && <AvatarImage src={getAvatar(log.userId)} />}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="w-px flex-1 bg-border mt-1" />
            </div>
            <div className="flex-1 pb-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{log.userName.split(' ')[0]}</span>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 gap-0.5', actionColors[log.action])}>
                  <Icon className="h-2.5 w-2.5" />
                  {actionLabels[log.action]}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(log.timestamp), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
              {log.field && log.oldValue !== undefined && log.newValue !== undefined && (
                <div className="mt-1 text-[11px] bg-muted/50 rounded-md px-2 py-1 inline-flex gap-1 items-center">
                  <span className="text-muted-foreground">{log.field}:</span>
                  {log.oldValue && <span className="line-through text-muted-foreground/70">{log.oldValue}</span>}
                  {log.oldValue && <span className="text-muted-foreground">→</span>}
                  <span className="font-medium text-foreground">{log.newValue}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
