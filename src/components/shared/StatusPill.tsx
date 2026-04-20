import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTone, type Tone } from './tone';

export interface StatusPillProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  variant?: 'soft' | 'outline' | 'solid';
  className?: string;
}

/**
 * StatusPill — badge/status discreto e elegante oficial do Canal Parceiro.
 *
 * Use em listas, headers e cards. Para gamificação use componentes próprios mais expressivos.
 */
export function StatusPill({
  tone = 'muted',
  icon: Icon,
  children,
  size = 'sm',
  variant = 'soft',
  className,
}: StatusPillProps) {
  const t = getTone(tone);
  const sizeClasses = size === 'sm'
    ? 'h-5 px-2 text-[10.5px] gap-1 [&>svg]:h-3 [&>svg]:w-3'
    : 'h-6 px-2.5 text-xs gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5';

  const variantClasses =
    variant === 'solid'
      ? cn(t.button, 'border border-transparent')
      : variant === 'outline'
        ? cn('bg-transparent border', t.badgeText, t.badgeBorder)
        : cn(t.badgeBg, t.badgeText, 'border', t.badgeBorder);

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md whitespace-nowrap',
        sizeClasses,
        variantClasses,
        className,
      )}
    >
      {Icon && <Icon />}
      {children}
    </span>
  );
}
