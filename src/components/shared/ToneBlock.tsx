import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToneBar } from './ToneBar';
import { IconTile } from './IconTile';
import { getTone, type Tone } from './tone';

export interface ToneBlockProps {
  tone?: Tone;
  icon?: LucideIcon;
  eyebrow?: string;
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  showBar?: boolean;
  className?: string;
}

/**
 * ToneBlock — bloco semântico tonal com barra lateral opcional + tile + texto.
 *
 * Usos: banners de "Próxima ação", justificativas (Reagendada / Cancelada / Inconclusa),
 * blocos de devolutiva, banners de prospecção, alertas contextuais.
 *
 * Substitui as variações ad-hoc espalhadas em AgendaFormDialog, AgendaDetailModal,
 * TaskCreateModal, TaskDetailModal, CadastroDetalhePage.
 */
export function ToneBlock({
  tone = 'primary',
  icon,
  eyebrow,
  title,
  description,
  actions,
  children,
  showBar = true,
  className,
}: ToneBlockProps) {
  const t = getTone(tone);
  return (
    <div
      className={cn(
        'relative rounded-lg border overflow-hidden',
        t.softBg,
        t.softBorder,
        className,
      )}
    >
      {showBar && <ToneBar tone={tone} />}
      <div className={cn('flex items-start gap-3 p-3', showBar && 'pl-4')}>
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="flex-1 min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {title && (
            <p className={cn('text-sm font-medium leading-snug', t.badgeText)}>{title}</p>
          )}
          {description && (
            <div className="text-xs text-foreground/80 leading-relaxed">{description}</div>
          )}
          {children}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
