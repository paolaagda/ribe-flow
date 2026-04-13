import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Partner, getUserById } from '@/data/mock-data';
import { PartnerOperationalData, Criticality } from '@/hooks/usePartnerOperationalData';
import { usePermission } from '@/hooks/usePermission';
import { Building2, MapPin, User, CheckSquare, FileText, Landmark, ChevronRight, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  partner: Partner;
  operationalData: PartnerOperationalData;
  onClick: () => void;
  canOpenDetail: boolean;
}

const criticalityConfig: Record<Criticality, { label: string; className: string; border: string }> = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20', border: 'border-l-destructive' },
  média: { label: 'Média', className: 'bg-warning/10 text-warning border-warning/20', border: 'border-l-warning' },
  baixa: { label: 'Baixa', className: 'bg-success/10 text-success border-success/20', border: 'border-l-success' },
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
        'group overflow-hidden relative border-l-[3px] transition-all duration-300',
        cc.border,
        canOpenDetail ? 'card-interactive cursor-pointer hover:-translate-y-0.5' : 'card-flat',
      )}
      onClick={() => canOpenDetail && onClick()}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gradient-primary" />
      <CardContent className="p-ds-sm relative space-y-0 divide-y divide-border/40">
        {/* Row 1: Identity + Criticality */}
        <div className="flex items-start justify-between gap-2 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="icon-container-sm icon-container-primary transition-transform duration-300 group-hover:scale-105 shrink-0 cursor-default">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Criticidade: {cc.label}
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <p className="text-ds-sm font-semibold truncate">{partner.name}</p>
              <p className="text-ds-xs text-muted-foreground truncate">{city}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={cn(
              'text-[10px] w-5 h-5 p-0 flex items-center justify-center font-bold',
              partner.partnerClass === 'A' ? 'bg-success/10 text-success border-success/20' :
              partner.partnerClass === 'B' ? 'bg-info/10 text-info border-info/20' :
              partner.partnerClass === 'C' ? 'bg-warning/10 text-warning border-warning/20' :
              'bg-muted text-muted-foreground border-muted-foreground/20'
            )}>{partner.partnerClass}</Badge>
            <Badge variant="outline" className={cn('text-[10px]', cc.className)}>{cc.label}</Badge>
            <Badge variant="outline" className={cn('text-[10px] capitalize', potentialBadgeClass[partner.potential])}>{partner.potential}</Badge>
          </div>
        </div>

        {/* Row 2: Operational indicators */}
        <div className="py-2.5 space-y-2">
          <div className="flex items-center gap-2 text-ds-xs text-muted-foreground">
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

          <div className="flex items-center gap-1.5 flex-wrap">
            {operationalData.pendingTasksCount > 0 && (
              <Badge variant="outline" className={cn(
                'text-[10px] gap-1',
                operationalData.overdueTasksCount > 0
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-warning/10 text-warning border-warning/20'
              )}>
                <CheckSquare className="h-2.5 w-2.5" />
                {operationalData.pendingTasksCount} tarefa{operationalData.pendingTasksCount > 1 ? 's' : ''}
              </Badge>
            )}
            {operationalData.pendingDocsCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-info/10 text-info border-info/20">
                <FileText className="h-2.5 w-2.5" />
                {operationalData.pendingDocsCount} doc{operationalData.pendingDocsCount > 1 ? 's' : ''}
              </Badge>
            )}
            {canSeeRegistration && operationalData.activeRegistrationsCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                <Landmark className="h-2.5 w-2.5" />
                Cadastro ativo
              </Badge>
            )}
            {operationalData.pendingTasksCount === 0 && operationalData.pendingDocsCount === 0 && (!canSeeRegistration || operationalData.activeRegistrationsCount === 0) && (
              <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/20">
                Em dia
              </Badge>
            )}
          </div>
        </div>

        {/* Row 3: Next action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{operationalData.nextAction}</span>
          </p>
          {canOpenDetail && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
