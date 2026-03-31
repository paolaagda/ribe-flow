import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSystemData } from '@/hooks/useSystemData';
import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InviteRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export default function InviteRejectionModal({ open, onOpenChange, onConfirm }: InviteRejectionModalProps) {
  const [reason, setReason] = useState('');
  const { getActiveItems } = useSystemData();
  const reasons = getActiveItems('inviteRejectionReasons');

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
            <XCircle className="h-5 w-5 text-destructive" />
            Rejeitar participação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Motivo da rejeição *</Label>
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

          {!reason && (
            <p className="text-xs text-muted-foreground">Selecione um motivo para continuar</p>
          )}

          <AnimatePresence>
            {reason && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs p-2 rounded-md border bg-destructive/10 border-destructive/20 text-destructive"
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
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              !reason && 'opacity-50 cursor-not-allowed'
            )}
          >
            Confirmar rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
