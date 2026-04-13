import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemData } from '@/hooks/useSystemData';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docName: string;
  onConfirm: (reason: string) => void;
}

export default function DocumentRejectModal({ open, onOpenChange, docName, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const { getActiveItems } = useSystemData();
  const reasons = getActiveItems('documentRejectionReasons');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Devolver documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O documento <strong className="text-foreground">{docName}</strong> será devolvido para correção.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivo da devolução *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={!reason} onClick={handleConfirm}>
            Devolver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
