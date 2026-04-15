import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Settings2, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfigurabilityLevel = 'configurable' | 'partial' | 'protected';

const levelConfig: Record<ConfigurabilityLevel, {
  label: string;
  icon: typeof Settings2;
  className: string;
  tooltip: string;
}> = {
  configurable: {
    label: 'Configurável',
    icon: Unlock,
    className: 'bg-success/15 text-success border-success/30',
    tooltip: 'Todas as opções deste bloco podem ser alteradas livremente pelo administrador.',
  },
  partial: {
    label: 'Parcialmente configurável',
    icon: Settings2,
    className: 'bg-warning/15 text-warning border-warning/30',
    tooltip: 'Algumas opções deste bloco possuem limites de segurança para evitar configurações perigosas.',
  },
  protected: {
    label: 'Protegido',
    icon: Lock,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    tooltip: 'Este bloco é controlado pelo sistema e não pode ser alterado manualmente.',
  },
};

interface Props {
  level: ConfigurabilityLevel;
}

export default function ConfigurabilityBadge({ level }: Props) {
  const { label, icon: Icon, className, tooltip } = levelConfig[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn('text-[10px] font-medium gap-1 cursor-help', className)}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
