import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskDocStatus } from '@/data/mock-data';

interface Props {
  status?: TaskDocStatus;
  returnReason?: string;
  className?: string;
}

const config: Record<TaskDocStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', className: '', icon: Clock },
  submitted_for_validation: { label: 'Em validação', className: 'bg-warning/10 text-warning border-warning/30', icon: Clock },
  returned_for_correction: { label: 'Devolvida', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: RotateCcw },
  validated: { label: 'Validada', className: 'bg-success/10 text-success border-success/30', icon: CheckCircle2 },
};

export default function TaskDocBadge({ status, returnReason, className }: Props) {
  if (!status || status === 'pending') return null;

  const cfg = config[status];
  const Icon = cfg.icon;

  const badge = (
    <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 gap-0.5', cfg.className, className)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </Badge>
  );

  if (status === 'returned_for_correction' && returnReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
            <span className="text-xs">{returnReason}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
