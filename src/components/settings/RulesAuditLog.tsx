import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getRulesAuditLog, RulesAuditEvent, MODULE_LABELS, ACTION_LABELS } from '@/lib/rules-audit';
import { History, ChevronDown, ChevronRight, User, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULE_COLORS: Record<string, string> = {
  permissions: 'bg-primary/15 text-primary border-primary/30',
  visibility: 'bg-success/15 text-success border-success/30',
  task_rules: 'bg-warning/15 text-warning border-warning/30',
  notifications: 'bg-accent/15 text-accent-foreground border-accent/30',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function RulesAuditLog() {
  const [events, setEvents] = useState<RulesAuditEvent[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Refresh on mount and whenever the component regains focus
  useEffect(() => {
    setEvents(getRulesAuditLog());

    const handler = () => setEvents(getRulesAuditLog());
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, []);

  // Expose a way for parent to trigger refresh
  const refresh = () => setEvents(getRulesAuditLog());

  const visible = showAll ? events : events.slice(0, 10);

  if (events.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/25">
        <CardContent className="py-6 text-center">
          <History className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            As alterações feitas nos blocos acima serão registradas aqui automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary" />
            <div>
              <CardTitle className="text-base">Histórico de Alterações</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Registro das alterações realizadas nos blocos de Regras e Permissões.
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {visible.map(evt => (
            <AuditEventItem key={evt.id} event={evt} />
          ))}
        </div>
        {events.length > 10 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${events.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AuditEventItem({ event }: { event: RulesAuditEvent }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group">
          <div className="mt-0.5">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn('text-[10px] font-medium', MODULE_COLORS[event.module] || '')}
              >
                {MODULE_LABELS[event.module]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {ACTION_LABELS[event.action]}
              </Badge>
            </div>
            <p className="text-xs font-medium text-foreground">{event.summary}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(event.timestamp)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {event.userName}
              </span>
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-7 mr-3 mb-2 rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
            <span>Antes</span>
            <ArrowRight className="h-3 w-3" />
            <span>Depois</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <pre className="text-[10px] bg-background rounded p-2 overflow-auto max-h-40 border">
              {JSON.stringify(event.snapshotBefore, null, 2)}
            </pre>
            <pre className="text-[10px] bg-background rounded p-2 overflow-auto max-h-40 border">
              {JSON.stringify(event.snapshotAfter, null, 2)}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
