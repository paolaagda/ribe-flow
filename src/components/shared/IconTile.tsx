import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTone, type Tone } from './tone';

export interface IconTileProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14', icon: 'h-6 w-6' },
};

/**
 * IconTile — bloco quadrado tonal com ícone.
 * Padrão oficial usado em headers de modais, banners contextuais e cards de KPI.
 */
export function IconTile({ icon: Icon, tone = 'primary', size = 'md', className }: IconTileProps) {
  const t = getTone(tone);
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border',
        t.tile,
        s.box,
        className,
      )}
    >
      <Icon className={cn(s.icon, t.iconColor)} />
    </div>
  );
}
