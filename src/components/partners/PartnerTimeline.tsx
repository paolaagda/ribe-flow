import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visit, getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { GitBranch, ArrowUpDown } from 'lucide-react';
import { useClassification, ClassChangeRecord } from '@/hooks/useClassification';

interface Props {
  visits: Visit[];
  partnerId?: string;
}

type EventType = 'first' | 'last' | 'cancelled' | 'rescheduled' | 'normal' | 'class_change';

const eventStyles: Record<EventType, { dot: string; badge: string; label?: string }> = {
  first: { dot: 'bg-success border-success', badge: 'bg-success/10 text-success border-success/20', label: 'Primeira visita' },
  last: { dot: 'bg-info border-info', badge: 'bg-info/10 text-info border-info/20', label: 'Última visita' },
  cancelled: { dot: 'bg-destructive border-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20' },
  rescheduled: { dot: 'bg-warning border-warning', badge: 'bg-warning/10 text-warning border-warning/20' },
  normal: { dot: 'bg-primary border-primary', badge: '' },
  class_change: { dot: 'bg-accent-foreground border-accent-foreground', badge: 'bg-accent/50 text-accent-foreground border-accent-foreground/20', label: 'Mudança de classe' },
};

const classChangeReasonLabels: Record<string, string> = {
  rule_change: 'Atualização da régua de classificação',
  production_update: 'Atualização da média de produção',
};

type TimelineEvent = { id: string; date: string; time: string; eventType: EventType } & (
  | { kind: 'visit'; visit: Visit }
  | { kind: 'class_change'; change: ClassChangeRecord }
);

export default function PartnerTimeline({ visits, partnerId }: Props) {
  const { getClassChangesForPartner } = useClassification();

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Visit events
    if (visits.length > 0) {
      const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date));
      sorted.forEach((v, i) => {
        let eventType: EventType = 'normal';
        if (i === 0) eventType = 'first';
        else if (i === sorted.length - 1) eventType = 'last';
        else if (v.status === 'Cancelada') eventType = 'cancelled';
        else if (v.status === 'Reagendada') eventType = 'rescheduled';
        items.push({ id: v.id, date: v.date, time: v.time, eventType, kind: 'visit', visit: v });
      });
    }

    // Class change events
    if (partnerId) {
      const changes = getClassChangesForPartner(partnerId);
      changes.forEach(c => {
        const d = new Date(c.changedAt);
        items.push({
          id: c.id,
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          eventType: 'class_change',
          kind: 'class_change',
          change: c,
        });
      });
    }

    items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return items;
  }, [visits, partnerId, getClassChangesForPartner]);

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Linha do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4 max-h-[400px] overflow-y-auto pr-1">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {events.map(ev => {
            const style = eventStyles[ev.eventType];
            if (ev.kind === 'class_change') {
              const c = ev.change;
              return (
                <div key={ev.id} className="relative group">
                  <div className={cn('absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-card transition-transform group-hover:scale-125', style.dot)} />
                  <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn('text-[10px] gap-1', style.badge)}>
                        <ArrowUpDown className="h-2.5 w-2.5" /> Mudança de classe
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ev.date} • {ev.time}</span>
                    </div>
                    <p className="text-sm mt-1 font-medium">Classe {c.previousClass} → {c.newClass}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{classChangeReasonLabels[c.reason] || c.reason}</p>
                  </div>
                </div>
              );
            }
            const v = ev.visit;
            const user = getUserById(v.userId);
            return (
              <div key={ev.id} className="relative group">
                <div className={cn('absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-card transition-transform group-hover:scale-125', style.dot)} />
                <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    {style.label && <Badge variant="outline" className={cn('text-[10px]', style.badge)}>{style.label}</Badge>}
                    <Badge variant="outline" className="text-[10px]">{v.status}</Badge>
                    <span className="text-xs text-muted-foreground">{v.date} • {v.time}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{v.type}</Badge>
                  </div>
                  <p className="text-sm mt-1">{user?.name}</p>
                  {v.status === 'Reagendada' && v.rescheduleReason && (
                    <p className="text-xs text-warning mt-0.5">Visita reagendada — motivo: {v.rescheduleReason}</p>
                  )}
                  {v.status === 'Cancelada' && v.cancelReason && (
                    <p className="text-xs text-destructive mt-0.5">Visita cancelada — motivo: {v.cancelReason}</p>
                  )}
                  {v.summary && !(v.status === 'Reagendada' && v.rescheduleReason) && !(v.status === 'Cancelada' && v.cancelReason) && <p className="text-xs text-muted-foreground mt-0.5">{v.summary}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
