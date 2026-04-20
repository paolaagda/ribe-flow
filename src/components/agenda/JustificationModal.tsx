import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSystemData, getJustificationCategory } from '@/hooks/useSystemData';
import { AlertTriangle, XCircle, CalendarClock, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ModalHeaderShell,
  ModalFooterShell,
  ToneBlock,
  getTone,
  type Tone,
} from '@/components/shared';

interface JustificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: 'Reagendada' | 'Cancelada' | 'Inconclusa';
  medio?: 'presencial' | 'remoto';
  onConfirm: (reason: string) => void;
}

export default function JustificationModal({
  open,
  onOpenChange,
  targetStatus,
  medio = 'presencial',
  onConfirm,
}: JustificationModalProps) {
  const [reason, setReason] = useState('');

  const { getActiveItems } = useSystemData();
  const category = getJustificationCategory(targetStatus, medio);
  const reasons = getActiveItems(category);

  const config = useMemo(() => {
    if (targetStatus === 'Reagendada') {
      return {
        tone: 'warning' as Tone,
        Icon: CalendarClock,
        title: 'Reagendamento',
        subtitle: 'Selecione o motivo do reagendamento',
        helper: 'Esta ação registra o motivo do reagendamento no histórico do compromisso.',
        confirmLabel: 'Confirmar reagendamento',
      };
    }
    if (targetStatus === 'Inconclusa') {
      return {
        tone: 'primary' as Tone,
        Icon: AlertTriangle,
        title: 'Compromisso inconcluso',
        subtitle: 'Selecione o motivo do compromisso inconcluso',
        helper:
          'O compromisso será marcado como inconcluso e o motivo ficará registrado no histórico.',
        confirmLabel: 'Confirmar inconclusão',
      };
    }
    return {
      tone: 'destructive' as Tone,
      Icon: XCircle,
      title: 'Cancelamento',
      subtitle: 'Selecione o motivo do cancelamento',
      helper:
        'Esta ação cancela o compromisso. O motivo ficará registrado no histórico e não poderá ser desfeito.',
      confirmLabel: 'Confirmar cancelamento',
    };
  }, [targetStatus]);

  const t = getTone(config.tone);

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason);
    setReason('');
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) setReason('');
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <ModalHeaderShell
          icon={config.Icon}
          tone={config.tone}
          eyebrow="Ação no compromisso"
          title={config.title}
          subtitle={config.subtitle}
        />

        <div className="px-6 py-4 space-y-4 border-t border-border/60">
          <ToneBlock tone={config.tone} icon={Info} description={config.helper} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Motivo
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {reasons.length} {reasons.length === 1 ? 'opção' : 'opções'}
              </span>
            </div>

            <div className="max-h-[280px] overflow-y-auto pr-1 space-y-1.5 -mr-1">
              {reasons.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all',
                      'border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border',
                      selected && t.optionSelected,
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                        selected
                          ? t.optionDot + ' border-transparent'
                          : 'border-border bg-background',
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span
                      className={cn(
                        'flex-1 leading-snug',
                        selected ? 'font-medium text-foreground' : 'text-foreground/80',
                      )}
                    >
                      {r}
                    </span>
                  </button>
                );
              })}
              {reasons.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-3 py-4 text-center">
                  Nenhum motivo cadastrado para este contexto.
                </p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {reason && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  'flex items-center gap-2 text-xs rounded-md border px-3 py-2',
                  t.badgeBg,
                  t.badgeBorder,
                  t.badgeText,
                )}
              >
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                <span className="text-foreground/80">
                  Motivo selecionado:{' '}
                  <span className={cn('font-medium', t.badgeText)}>{reason}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ModalFooterShell>
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!reason}
            className={cn(!reason && 'opacity-50 cursor-not-allowed', t.button)}
          >
            {config.confirmLabel}
          </Button>
        </ModalFooterShell>
      </DialogContent>
    </Dialog>
  );
}
