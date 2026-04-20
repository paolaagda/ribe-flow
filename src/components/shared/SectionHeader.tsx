import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTone, type Tone } from './tone';

export interface SectionHeaderProps {
  icon?: LucideIcon;
  label: string;
  tone?: Tone;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * SectionHeader — cabeçalho oficial de seção dentro de modais, formulários
 * e blocos de detalhe.
 *
 * Padrão: ícone tonal pequeno + label uppercase tracking + linha divisória sutil.
 * Usado em AgendaFormDialog, TaskCreateModal, TaskDetailModal, CadastroDetalhePage etc.
 */
export function SectionHeader({
  icon: Icon,
  label,
  tone = 'muted',
  hint,
  action,
  className,
}: SectionHeaderProps) {
  const t = getTone(tone);
  return (
    <div className={cn('flex items-center gap-3 pt-1', className)}>
      <div className="flex items-center gap-2 shrink-0">
        {Icon && (
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md border',
              t.tile,
            )}
          >
            <Icon className={cn('h-3 w-3', t.iconColor)} />
          </div>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground/70">· {hint}</span>}
      </div>
      <div className="flex-1 h-px bg-border/60" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
