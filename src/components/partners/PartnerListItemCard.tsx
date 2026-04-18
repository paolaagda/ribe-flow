import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Partner, getUserById } from '@/data/mock-data';
import { PartnerOperationalData, Criticality } from '@/hooks/usePartnerOperationalData';
import { usePermission } from '@/hooks/usePermission';
import { Building2, User, CheckSquare, FileText, Landmark, ChevronRight, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  partner: Partner;
  operationalData: PartnerOperationalData;
  onClick: () => void;
  canOpenDetail: boolean;
}

const criticalityConfig: Record<Criticality, { label: string; dot: string; barGradient: string; ringTint: string }> = {
  alta: {
    label: 'Alta',
    dot: 'bg-destructive',
    barGradient: 'bg-gradient-to-b from-destructive/80 via-destructive to-destructive/80',
    ringTint: 'ring-destructive/20',
  },
  média: {
    label: 'Média',
    dot: 'bg-warning',
    barGradient: 'bg-gradient-to-b from-warning/80 via-warning to-warning/80',
    ringTint: 'ring-warning/20',
  },
  baixa: {
    label: 'Baixa',
    dot: 'bg-success',
    barGradient: 'bg-gradient-to-b from-success/80 via-success to-success/80',
    ringTint: 'ring-success/20',
  },
};

const classBadgeConfig: Record<string, string> = {
  A: 'bg-success/10 text-success border-success/30',
  B: 'bg-info/10 text-info border-info/30',
  C: 'bg-warning/10 text-warning border-warning/30',
  D: 'bg-muted text-muted-foreground border-border',
};

const potentialBadgeClass: Record<string, string> = {
  alto: 'badge-potential-alto',
  médio: 'badge-potential-medio',
  baixo: 'badge-potential-baixo',
};

export default function PartnerListItemCard({ partner, operationalData, onClick, canOpenDetail }: Props) {
  const responsible = getUserById(partner.responsibleUserId);
  const { canRead } = usePermission();
  const canSeeRegistration = canRead('registration.view');
  const cc = criticalityConfig[operationalData.criticality];

  const city = partner.address.split('—')[1]?.trim() || partner.address;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border bg-card transition-all duration-300',
        canOpenDetail
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-border'
          : 'shadow-none',
      )}
      onClick={() => canOpenDetail && onClick()}
    >
      {/* Lateral colored bar (criticality) */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', cc.barGradient)} aria-hidden />

      <CardContent className="p-ds-sm pl-[calc(theme(spacing.ds-sm)+0.25rem)] space-y-2.5">
        {/* Row 1 — Identity + Class + Criticality dot */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ring-1 transition-transform duration-300 group-hover:scale-105',
              'bg-primary/8 ring-primary/15',
            )}>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight truncate text-foreground">{partner.name}</p>
              <p className="text-ds-xs text-muted-foreground truncate mt-0.5">{city}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] h-5 w-5 p-0 flex items-center justify-center font-bold rounded-md',
                classBadgeConfig[partner.partnerClass],
              )}
            >
              {partner.partnerClass}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('w-2 h-2 rounded-full ring-2 ring-background', cc.dot)} />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Criticidade: {cc.label}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Row 2 — Responsible + last visit (subtle metadata strip) */}
        <div className="flex items-center gap-2 text-ds-xs text-muted-foreground border-t border-border/50 pt-2">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{responsible?.name || '—'}</span>
          {operationalData.lastVisitDate && (
            <>
              <span className="text-border">•</span>
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {formatDistanceToNowStrict(parseISO(operationalData.lastVisitDate), { locale: ptBR, addSuffix: true })}
              </span>
            </>
          )}
        </div>

        {/* Row 3 — Operational badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {operationalData.pendingTasksCount > 0 && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] gap-1 h-5 px-1.5 font-medium',
                operationalData.overdueTasksCount > 0
                  ? 'bg-destructive/10 text-destructive border-destructive/25'
                  : 'bg-warning/10 text-warning border-warning/25',
              )}
            >
              <CheckSquare className="h-2.5 w-2.5" />
              {operationalData.pendingTasksCount} tarefa{operationalData.pendingTasksCount > 1 ? 's' : ''}
            </Badge>
          )}
          {operationalData.pendingDocsCount > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 h-5 px-1.5 font-medium bg-info/10 text-info border-info/25">
              <FileText className="h-2.5 w-2.5" />
              {operationalData.pendingDocsCount} doc{operationalData.pendingDocsCount > 1 ? 's' : ''}
            </Badge>
          )}
          {canSeeRegistration && operationalData.activeRegistrationsCount > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 h-5 px-1.5 font-medium bg-primary/10 text-primary border-primary/25">
              <Landmark className="h-2.5 w-2.5" />
              Cadastro ativo
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] capitalize h-5 px-1.5 ml-auto font-medium',
              potentialBadgeClass[partner.potential],
            )}
          >
            {partner.potential}
          </Badge>
          {operationalData.pendingTasksCount === 0 &&
            operationalData.pendingDocsCount === 0 &&
            (!canSeeRegistration || operationalData.activeRegistrationsCount === 0) && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium bg-success/8 text-success border-success/25">
                Em dia
              </Badge>
            )}
        </div>

        {/* Row 4 — Next action footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 min-w-0">
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{operationalData.nextAction}</span>
          </p>
          {canOpenDetail && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
