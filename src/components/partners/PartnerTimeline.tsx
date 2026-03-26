import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visit, getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

interface Props {
  visits: Visit[];
}

type EventType = 'first' | 'last' | 'cancelled' | 'rescheduled' | 'normal';

const eventStyles: Record<EventType, { dot: string; badge: string; label?: string }> = {
  first: { dot: 'bg-success border-success', badge: 'bg-success/10 text-success border-success/20', label: 'Primeira visita' },
  last: { dot: 'bg-info border-info', badge: 'bg-info/10 text-info border-info/20', label: 'Última visita' },
  cancelled: { dot: 'bg-destructive border-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20' },
  rescheduled: { dot: 'bg-warning border-warning', badge: 'bg-warning/10 text-warning border-warning/20' },
  normal: { dot: 'bg-primary border-primary', badge: '' },
};

export default function PartnerTimeline({ visits }: Props) {
  const events = useMemo(() => {
    if (visits.length === 0) return [];
    const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((v, i) => {
      let eventType: EventType = 'normal';
      if (i === 0) eventType = 'first';
      else if (i === sorted.length - 1) eventType = 'last';
      else if (v.status === 'Cancelada') eventType = 'cancelled';
      else if (v.status === 'Reagendada') eventType = 'rescheduled';
      return { ...v, eventType };
    });
  }, [visits]);

  if (visits.length === 0) return null;

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
            const user = getUserById(ev.userId);
            return (
              <div key={ev.id} className="relative group">
                <div className={cn('absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-card transition-transform group-hover:scale-125', style.dot)} />
                <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    {style.label && <Badge variant="outline" className={cn('text-[10px]', style.badge)}>{style.label}</Badge>}
                    <Badge variant="outline" className="text-[10px]">{ev.status}</Badge>
                    <span className="text-xs text-muted-foreground">{ev.date} • {ev.time}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{ev.type}</Badge>
                  </div>
                  <p className="text-sm mt-1">{user?.name}</p>
                  {ev.status === 'Reagendada' && ev.rescheduleReason && (
                    <p className="text-xs text-warning mt-0.5">Visita reagendada — motivo: {ev.rescheduleReason}</p>
                  )}
                  {ev.status === 'Cancelada' && ev.cancelReason && (
                    <p className="text-xs text-destructive mt-0.5">Visita cancelada — motivo: {ev.cancelReason}</p>
                  )}
                  {ev.summary && !(ev.status === 'Reagendada' && ev.rescheduleReason) && !(ev.status === 'Cancelada' && ev.cancelReason) && <p className="text-xs text-muted-foreground mt-0.5">{ev.summary}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
