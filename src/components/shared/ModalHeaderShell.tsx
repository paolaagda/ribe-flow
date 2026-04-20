import { LucideIcon } from 'lucide-react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ToneBar } from './ToneBar';
import { IconTile } from './IconTile';
import type { Tone } from './tone';

export interface ModalHeaderShellProps {
  icon: LucideIcon;
  tone?: Tone;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * ModalHeaderShell — cabeçalho oficial de modais do Canal Parceiro.
 *
 * Estrutura: barra lateral tonal + tile de ícone + eyebrow uppercase + título + subtítulo opcional.
 * Padrão consolidado em JustificationModal, AgendaDetailModal, AgendaFormDialog,
 * TaskCreateModal, TaskDetailModal.
 *
 * Deve ser renderizado dentro de um <DialogContent className="p-0 gap-0 overflow-hidden">.
 */
export function ModalHeaderShell({
  icon,
  tone = 'primary',
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  className,
}: ModalHeaderShellProps) {
  return (
    <div className={cn('relative', className)}>
      <ToneBar tone={tone} />
      <DialogHeader className="px-6 pt-6 pb-4 pl-7 space-y-0">
        <div className="flex items-start gap-3">
          <IconTile icon={icon} tone={tone} size="md" />
          <div className="flex-1 min-w-0 pt-0.5">
            {eyebrow && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <DialogTitle className="text-base font-semibold leading-tight mt-0.5">
              {title}
            </DialogTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
            )}
            {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </DialogHeader>
    </div>
  );
}
