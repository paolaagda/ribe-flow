import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSystemData, getJustificationCategory } from '@/hooks/useSystemData';
import { AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface JustificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: 'Reagendada' | 'Cancelada' | 'Inconclusa';
  medio?: 'presencial' | 'remoto';
  onConfirm: (reason: string) => void;
}

export default function JustificationModal({ open, onOpenChange, targetStatus, medio = 'presencial', onConfirm }: JustificationModalProps) {
  const [reason, setReason] = useState('');

  const { getActiveItems } = useSystemData();
  const category = getJustificationCategory(targetStatus, medio);
  const reasons = getActiveItems(category);

  const isReschedule = targetStatus === 'Reagendada';
  const isInconclusive = targetStatus === 'Inconclusa';
  const title = isReschedule ? 'Selecione o motivo do reagendamento' : isInconclusive ? 'Selecione o motivo do compromisso inconcluso' : 'Selecione o motivo do cancelamento';
  const Icon = isReschedule ? AlertTriangle : XCircle;
  const accentClass = isReschedule ? 'text-warning' : isInconclusive ? 'text-purple-600 dark:text-purple-400' : 'text-destructive';

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', accentClass)} />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Motivo *</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className={cn(!reason && 'text-muted-foreground')}>
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              {reasons.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AnimatePresence>
            {reason && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  'text-xs p-2 rounded-md border',
                  isReschedule ? 'bg-warning/10 border-warning/20 text-warning' : isInconclusive ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-destructive/10 border-destructive/20 text-destructive'
                )}
              >
                Motivo selecionado: <span className="font-medium">{reason}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason}
            className={cn(
              !reason && 'opacity-50 cursor-not-allowed',
              isReschedule ? 'bg-warning text-warning-foreground hover:bg-warning/90' : isInconclusive ? 'bg-purple-600 text-white hover:bg-purple-600/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
