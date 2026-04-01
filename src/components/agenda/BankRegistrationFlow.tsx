import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInfoData, InfoBank } from '@/hooks/useInfoData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Landmark, FileText, AlertCircle, CheckCircle2, Settings2, ChevronLeft, Send, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BankRegistrationData {
  bankId: string;
  bankName: string;
  pendingDocs: string[];
  fieldValues: Record<string, string>;
}

interface Props {
  partnerId: string;
  partnerName: string;
  onComplete: (data: BankRegistrationData) => void;
  onCancel: () => void;
}

export default function BankRegistrationFlow({ partnerId, partnerName, onComplete, onCancel }: Props) {
  const { getActiveBanks, getDocumentsForBank, getOperationalFieldsForBank } = useInfoData();
  const [checkedDocs] = useLocalStorage<Record<string, string[]>>('ribercred_partner_docs_v1', {});

  const [step, setStep] = useState(0);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const banks = getActiveBanks();
  const selectedBank = banks.find(b => b.id === selectedBankId);

  // Step 1: Pending documents (bank docs - partner checked docs)
  const { pendingDocs, completedDocs } = useMemo(() => {
    if (!selectedBankId) return { pendingDocs: [], completedDocs: [] };
    const bankDocs = getDocumentsForBank(selectedBankId);
    const partnerChecked = checkedDocs[partnerId] || [];
    const pending = bankDocs.filter(d => !partnerChecked.includes(d.id));
    const completed = bankDocs.filter(d => partnerChecked.includes(d.id));
    return { pendingDocs: pending, completedDocs: completed };
  }, [selectedBankId, checkedDocs, partnerId, getDocumentsForBank]);

  // Step 2: Operational fields for the selected bank
  const operationalFields = useMemo(() => {
    if (!selectedBankId) return [];
    return getOperationalFieldsForBank(selectedBankId);
  }, [selectedBankId, getOperationalFieldsForBank]);

  const handleComplete = () => {
    if (!selectedBank) return;
    onComplete({
      bankId: selectedBankId,
      bankName: selectedBank.name,
      pendingDocs: pendingDocs.map(d => d.name),
      fieldValues,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onCancel}>
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm font-medium text-muted-foreground">
          Cadastro de Banco — Etapa {step + 1}/3
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0: Select Bank */}
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                Selecione o Banco
              </Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um banco para credenciamento" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <span className="flex items-center gap-2">
                        {bank.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bank info tooltip card */}
            {selectedBank && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border bg-accent/30 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedBank.name}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {getDocumentsForBank(selectedBankId).length} docs
                  </Badge>
                  {operationalFields.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {operationalFields.length} campos
                    </Badge>
                  )}
                </div>

                {/* Show operational fields as quick reference */}
                {operationalFields.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {operationalFields.map(f => (
                      <TooltipProvider key={f.id}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Info className="h-2.5 w-2.5" /> {f.name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Campo operacional configurado para este banco</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!selectedBankId}>
                Próximo
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 1: Pending Documents */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Documentação — {selectedBank?.name}
              </Label>
              <p className="text-xs text-muted-foreground">
                Parceiro: <span className="font-medium text-foreground">{partnerName}</span>
              </p>
            </div>

            {pendingDocs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-warning flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Documentos pendentes ({pendingDocs.length})
                </p>
                {pendingDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 rounded-md bg-warning/10 border border-warning/20 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))}
              </div>
            )}

            {completedDocs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Documentos recebidos ({completedDocs.length})
                </p>
                {completedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 rounded-md bg-success/10 border border-success/20 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))}
              </div>
            )}

            {pendingDocs.length === 0 && completedDocs.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nenhum documento vinculado a este banco.</p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
              <Button onClick={() => setStep(2)}>Próximo</Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Operational Fields Form */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Dados do Banco — {selectedBank?.name}
              </Label>
              <p className="text-xs text-muted-foreground">
                Preencha os campos operacionais para este credenciamento.
              </p>
            </div>

            {operationalFields.length > 0 ? (
              <div className="space-y-3">
                {operationalFields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm">{field.name}</Label>
                    {field.name.toLowerCase().includes('observa') ? (
                      <Textarea
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={`Informe ${field.name.toLowerCase()}...`}
                        className="min-h-[60px]"
                      />
                    ) : (
                      <Input
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={`Informe ${field.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhum campo operacional configurado para este banco.
              </p>
            )}

            {/* Summary card */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Resumo do cadastro</p>
              <div className="text-sm space-y-0.5">
                <p><span className="text-muted-foreground">Banco:</span> {selectedBank?.name}</p>
                <p><span className="text-muted-foreground">Parceiro:</span> {partnerName}</p>
                {pendingDocs.length > 0 && (
                  <p className="text-warning text-xs">{pendingDocs.length} documento(s) pendente(s)</p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleComplete} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Solicitar Cadastro
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
