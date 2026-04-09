import AnimatedKpiCard from '@/components/shared/AnimatedKpiCard';
import { AlertTriangle, UserCog, Users, Building2, ClipboardList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface SummaryCardData {
  key: string;
  label: string;
  subtitle: string;
  tooltip: string;
  value: number;
  icon: any;
  color: string;
  pulse?: boolean;
}

interface Props {
  cards: SummaryCardData[];
  activeCard: string | null;
  onCardClick: (key: string) => void;
}

export default function RegistrationOperationalSummary({ cards, activeCard, onCardClick }: Props) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo Inteligente de Cadastro</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-ds-xs">
        {cards.map((card, i) => (
          <Tooltip key={card.key}>
            <TooltipTrigger asChild>
              <div>
                <AnimatedKpiCard
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  color={card.color}
                  delay={i * 0.05}
                  pulse={card.pulse}
                  onClick={() => onCardClick(card.key)}
                  active={activeCard === card.key}
                  suffix={card.subtitle ? undefined : undefined}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[220px] text-center">
              {card.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
