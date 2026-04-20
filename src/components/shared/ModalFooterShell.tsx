import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ModalFooterShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ModalFooterShell — footer oficial de modais do Canal Parceiro.
 * Aplica fundo tonal sutil + borda superior + espaçamento padrão.
 */
export function ModalFooterShell({ children, className }: ModalFooterShellProps) {
  return (
    <DialogFooter
      className={cn(
        'px-6 py-4 bg-muted/20 border-t border-border/60 gap-2 sm:gap-2',
        className,
      )}
    >
      {children}
    </DialogFooter>
  );
}
