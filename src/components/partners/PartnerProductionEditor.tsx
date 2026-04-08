import { useState } from 'react';
import { Partner } from '@/data/mock-data';
import { usePermission } from '@/hooks/usePermission';
import { useClassification } from '@/hooks/useClassification';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { formatCentavos, formatCurrencyInput, parseCurrencyToNumber } from '@/lib/currency';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  partner: Partner;
}

export default function PartnerProductionEditor({ partner }: Props) {
  const { canWrite } = usePermission();
  const { updatePartnerProduction } = useClassification();
  const { partners, setPartners } = usePartners();
  const canEdit = canWrite('partners.edit');

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const startEdit = () => {
    setInputValue(partner.averageProduction > 0 ? formatCentavos(partner.averageProduction) : '');
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    const newValue = parseCurrencyToNumber(inputValue);
    updatePartnerProduction(partner, newValue, partners, setPartners);
    setEditing(false);

    const newClass = newValue !== partner.averageProduction
      ? ` • Classe atualizada`
      : '';
    toast.success(`Produção atualizada para ${formatCentavos(newValue)}${newClass}`);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(formatCurrencyInput(e.target.value))}
          placeholder="R$ 0,00"
          className="h-7 text-xs w-36"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={save}>
          <Check className="h-3.5 w-3.5 text-success" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancel}>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
      Produção média: {partner.averageProduction > 0
        ? formatCentavos(partner.averageProduction)
        : <span className="italic">Sem dados de produção</span>
      }
      {canEdit && (
        <button onClick={startEdit} className="text-primary hover:text-primary/80 transition-colors ml-1">
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </p>
  );
}
