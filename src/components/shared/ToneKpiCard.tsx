import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToneBar } from './ToneBar';
import { IconTile } from './IconTile';
import { getTone, type Tone } from './tone';

export interface ToneKpiCardProps {
  tone?: Tone;
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * ToneKpiCard — card oficial de KPI com barra lateral tonal.
 *
 * Padrão consolidado em Agenda KPIs, Cadastro Smart Summary, Parceiros operational center.
 * Suporta estado clicável (filtro ativo) e variações tonais.
 */
export function ToneKpiCard({
  tone = 'primary',
  icon,
  label,
  value,
  hint,
  trend,
  active = false,
  onClick,
  className,
}: ToneKpiCardProps) {
  const t = getTone(tone);
  const isInteractive = !!onClick;
  const Comp: any = isInteractive ? 'button' : 'div';
  return (
    <Comp
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-lg border bg-card p-4 shadow-sm overflow-hidden transition-all',
        'border-border/60',
        isInteractive && 'hover:shadow-md hover:border-border cursor-pointer',
        active && cn('ring-1', t.softBorder.replace('border-', 'ring-'), t.softBg),
        className,
      )}
    >
      <ToneBar tone={tone} />
      <div className="pl-3 flex items-start gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold leading-none text-foreground">{value}</span>
            {trend && <span className={cn('text-xs font-medium', t.badgeText)}>{trend}</span>}
          </div>
          {hint && <p className="mt-1 text-xs text-muted-foreground leading-snug">{hint}</p>}
        </div>
      </div>
    </Comp>
  );
}
