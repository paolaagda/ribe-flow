import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Visit, VisitStatus, statusBgClasses } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Handshake, UserPlus, User } from 'lucide-react';

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

export default function DetailHeader({
  visit, partnerName, partnerAddress, partner, visitUserName,
  lastVisitInfo, isStatusLocked, canEditVisit, allStatuses,
  onStatusChange, onPartnerClick,
}: DetailHeaderProps) {
  const TypeIcon = visit.type === 'visita' ? Handshake : UserPlus;

  return (
    <div className="px-5 pt-5 pb-3 pr-12">
      <div className="flex items-start gap-2.5">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          visit.type === 'visita' ? 'bg-info/10' : 'bg-warning/10'
        )}>
          <TypeIcon className={cn('h-4 w-4', visit.type === 'visita' ? 'text-info' : 'text-warning')} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {partner ? (
            <button
              onClick={onPartnerClick}
              className="text-left text-lg font-bold leading-snug hover:text-primary hover:underline underline-offset-2 transition-colors truncate block max-w-full"
            >
              {partnerName}
            </button>
          ) : (
            <p className="text-lg font-bold leading-snug truncate">{partnerName}</p>
          )}
          {isStatusLocked ? (
            <Badge variant="outline" className={cn('text-xs capitalize', statusBgClasses[visit.status])}>
              {visit.status}
            </Badge>
          ) : canEditVisit ? (
            <Select value={visit.status} onValueChange={onStatusChange}>
              <SelectTrigger className={cn('h-7 w-auto min-w-0 gap-1 border px-2 text-xs font-medium capitalize', statusBgClasses[visit.status])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className={cn('text-xs capitalize', statusBgClasses[visit.status])}>
              {visit.status}
            </Badge>
          )}
        </div>
      </div>

      {partnerAddress && (
        <p className="text-xs text-muted-foreground mt-1 pl-[42px] leading-snug">{partnerAddress}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mt-2 pl-[42px]">
        {partner && visit.type === 'visita' && (
          <Badge variant="outline" className={cn(
            'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
            partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
            partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
            partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
            'bg-muted text-muted-foreground border-muted-foreground/20'
          )}>{partner.partnerClass}</Badge>
        )}
        {partner && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize",
            partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
            partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
            'bg-muted/50 text-muted-foreground border-border/30'
          )}>Potencial {partner.potential}</Badge>
        )}
        {lastVisitInfo && (
          <span className="text-[10px] text-muted-foreground/70">{lastVisitInfo}</span>
        )}
        {visit.structures.length > 0 && visit.structures.map(s => (
          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 pl-[42px] text-xs text-muted-foreground">
        <User className="h-3 w-3 shrink-0" />
        <span>{visitUserName || '—'}</span>
      </div>
    </div>
  );
}
