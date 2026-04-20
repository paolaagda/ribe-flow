import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Visit, VisitStatus, statusBgClasses } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { getAgendaTypeBrand } from '@/lib/agenda-type-branding';

interface DetailHeaderProps {
  visit: Visit;
  partnerName: string | undefined;
  partnerAddress: string | undefined;
  partner: { partnerClass?: string; potential?: string; structures?: string[] } | null;
  visitUserName: string | undefined;
  lastVisitInfo: string | null;
  isStatusLocked: boolean;
  canEditVisit: boolean;
  allStatuses: VisitStatus[];
  onStatusChange: (status: string) => void;
  onPartnerClick: () => void;
}

// Lateral gradient mapped by official type token (Visita=info, Prospecção=warning)
const typeBarMap: Record<'info' | 'warning', string> = {
  info: 'from-info/80 via-info/45 to-info/10',
  warning: 'from-warning/80 via-warning/45 to-warning/10',
};

export default function DetailHeader({
  visit, partnerName, partnerAddress, partner, visitUserName,
  lastVisitInfo, isStatusLocked, canEditVisit, allStatuses,
  onStatusChange, onPartnerClick,
}: DetailHeaderProps) {
  const brand = getAgendaTypeBrand(visit.type);
  const TypeIcon = brand.icon;
  const bar = typeBarMap[brand.colorToken];

  return (
    <div className="relative overflow-hidden px-5 pt-5 pb-4 pr-12">
      {/* Lateral gradient bar by official type color */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b', bar)} />

      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-border/40',
            brand.bgSoft,
          )}
        >
          <TypeIcon className={cn('h-5 w-5', brand.text)} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Type label — small, official, above title */}
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] uppercase tracking-wider font-semibold', brand.text)}>
              {brand.label}
            </span>
          </div>

          {partner ? (
            <button
              onClick={onPartnerClick}
              className="text-left text-lg font-bold leading-tight tracking-tight hover:text-primary hover:underline underline-offset-2 transition-colors truncate block max-w-full"
            >
              {partnerName}
            </button>
          ) : (
            <p className="text-lg font-bold leading-tight tracking-tight truncate">{partnerName}</p>
          )}

          {/* Status control */}
          <div className="pt-0.5">
            {isStatusLocked ? (
              <Badge variant="outline" className={cn('text-xs capitalize font-medium', statusBgClasses[visit.status])}>
                {visit.status}
              </Badge>
            ) : canEditVisit ? (
              <Select value={visit.status} onValueChange={onStatusChange}>
                <SelectTrigger
                  className={cn(
                    'h-7 w-auto min-w-0 gap-1 border px-2 text-xs font-medium capitalize',
                    statusBgClasses[visit.status],
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={cn('text-xs capitalize font-medium', statusBgClasses[visit.status])}>
                {visit.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {partnerAddress && (
        <p className="text-xs text-muted-foreground mt-2.5 pl-[55px] leading-snug">{partnerAddress}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pl-[55px]">
        {partner && visit.type === 'visita' && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
              partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
              partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
              partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
              'bg-muted text-muted-foreground border-muted-foreground/20',
            )}
          >
            {partner.partnerClass}
          </Badge>
        )}
        {partner && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 capitalize font-medium',
              partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
              partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
              'bg-muted/50 text-muted-foreground border-border/30',
            )}
          >
            Potencial {partner.potential}
          </Badge>
        )}
        {lastVisitInfo && (
          <span className="text-[10px] text-muted-foreground/80 ml-0.5">• {lastVisitInfo}</span>
        )}
        {visit.structures.length > 0 && visit.structures.map(s => (
          <Badge key={s} variant="outline" className="text-[10px] bg-muted/40 font-medium">{s}</Badge>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-2 pl-[55px] text-xs text-muted-foreground">
        <div className="w-5 h-5 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
          <User className="h-3 w-3" />
        </div>
        <span>Responsável: <span className="text-foreground font-medium">{visitUserName || '—'}</span></span>
      </div>
    </div>
  );
}
