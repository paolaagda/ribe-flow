import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSystemData, getJustificationCategory } from '@/hooks/useSystemData';
import { AlertTriangle, XCircle, CalendarClock, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface JustificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: 'Reagendada' | 'Cancelada' | 'Inconclusa';
  medio?: 'presencial' | 'remoto';
  onConfirm: (reason: string) => void;
}

type Tone = 'warning' | 'destructive' | 'primary';

const toneConfig: Record<Tone, {
  bar: string;
  tile: string;
  iconColor: string;
  ring: string;
  badgeBg: string;
  badgeText: string;
  optionSelected: string;
  optionDot: string;
  button: string;
  helper: string;
  helperIcon: string;
}> = {
  warning: {
    bar: 'bg-gradient-to-b from-warning/80 via-warning/60 to-warning/30',
    tile: 'bg-warning/10 border-warning/30',
    iconColor: 'text-warning',
    ring: 'ring-warning/30',
    badgeBg: 'bg-warning/10 border-warning/20',
    badgeText: 'text-warning',
    optionSelected: 'border-warning/50 bg-warning/5 ring-1 ring-warning/30',
    optionDot: 'bg-warning text-warning-foreground',
    button: 'bg-warning text-warning-foreground hover:bg-warning/90',
    helper: 'bg-warning/5 border-warning/20',
    helperIcon: 'text-warning',
  },
  destructive: {
    bar: 'bg-gradient-to-b from-destructive/80 via-destructive/60 to-destructive/30',
    tile: 'bg-destructive/10 border-destructive/30',
    iconColor: 'text-destructive',
    ring: 'ring-destructive/30',
    badgeBg: 'bg-destructive/10 border-destructive/20',
    badgeText: 'text-destructive',
    optionSelected: 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/30',
    optionDot: 'bg-destructive text-destructive-foreground',
    button: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    helper: 'bg-destructive/5 border-destructive/20',
    helperIcon: 'text-destructive',
  },
  primary: {
    bar: 'bg-gradient-to-b from-primary/80 via-primary/60 to-primary/30',
    tile: 'bg-primary/10 border-primary/30',
    iconColor: 'text-primary',
    ring: 'ring-primary/30',
    badgeBg: 'bg-primary/10 border-primary/20',
    badgeText: 'text-primary',
    optionSelected: 'border-primary/50 bg-primary/5 ring-1 ring-primary/30',
    optionDot: 'bg-primary text-primary-foreground',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
    helper: 'bg-primary/5 border-primary/20',
    helperIcon: 'text-primary',
  },
};

export default function JustificationModal({ open, onOpenChange, targetStatus, medio = 'presencial', onConfirm }: JustificationModalProps) {
  const [reason, setReason] = useState('');

  const { getActiveItems } = useSystemData();
  const category = getJustificationCategory(targetStatus, medio);
  const reasons = getActiveItems(category);

  const config = useMemo(() => {
    if (targetStatus === 'Reagendada') {
      return {
        tone: 'warning' as Tone,
        Icon: CalendarClock,
        eyebrow: 'Ação no compromisso',
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
        eyebrow: 'Ação no compromisso',
        title: 'Compromisso inconcluso',
        subtitle: 'Selecione o motivo do compromisso inconcluso',
        helper: 'O compromisso será marcado como inconcluso e o motivo ficará registrado no histórico.',
        confirmLabel: 'Confirmar inconclusão',
      };
    }
    return {
      tone: 'destructive' as Tone,
      Icon: XCircle,
      eyebrow: 'Ação no compromisso',
      title: 'Cancelamento',
      subtitle: 'Selecione o motivo do cancelamento',
      helper: 'Esta ação cancela o compromisso. O motivo ficará registrado no histórico e não poderá ser desfeito.',
      confirmLabel: 'Confirmar cancelamento',
    };
  }, [targetStatus]);

  const tone = toneConfig[config.tone];
  const { Icon } = config;

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
        {/* Header com barra lateral tonal + tile */}
        <div className="relative">
          <div className={cn('absolute left-0 top-0 bottom-0 w-1', tone.bar)} />
          <DialogHeader className="px-6 pt-6 pb-4 pl-7 space-y-0">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border', tone.tile)}>
                <Icon className={cn('h-5 w-5', tone.iconColor)} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {config.eyebrow}
                </p>
                <DialogTitle className="text-base font-semibold leading-tight mt-0.5">
                  {config.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {config.subtitle}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 border-t border-border/60">
          {/* Helper contextual */}
          <div className={cn('flex items-start gap-2.5 rounded-md border p-3', tone.helper)}>
            <Info className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', tone.helperIcon)} />
            <p className="text-xs leading-relaxed text-foreground/80">
              {config.helper}
            </p>
          </div>

          {/* Lista de opções */}
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
                      selected && tone.optionSelected
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                        selected ? tone.optionDot + ' border-transparent' : 'border-border bg-background'
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span className={cn('flex-1 leading-snug', selected ? 'font-medium text-foreground' : 'text-foreground/80')}>
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

          {/* Confirmação visual da seleção */}
          <AnimatePresence>
            {reason && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  'flex items-center gap-2 text-xs rounded-md border px-3 py-2',
                  tone.badgeBg,
                  tone.badgeText
                )}
              >
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                <span className="text-foreground/80">
                  Motivo selecionado: <span className={cn('font-medium', tone.badgeText)}>{reason}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border/60 gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!reason}
            className={cn(!reason && 'opacity-50 cursor-not-allowed', tone.button)}
          >
            {config.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
