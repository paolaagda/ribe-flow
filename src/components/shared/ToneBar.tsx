import { cn } from '@/lib/utils';
import { getTone, type Tone } from './tone';

export interface ToneBarProps {
  tone?: Tone;
  className?: string;
}

/**
 * ToneBar — barra lateral vertical tonal usada em cabeçalhos de modal,
 * banners de "Próxima ação", cards de KPI e blocos semânticos.
 *
 * Importante: o container pai DEVE ter `position: relative`.
 */
export function ToneBar({ tone = 'primary', className }: ToneBarProps) {
  const t = getTone(tone);
  return <div className={cn('absolute left-0 top-0 bottom-0 w-1', t.bar, className)} />;
}
