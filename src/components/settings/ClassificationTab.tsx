import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useClassification, buildRangesFromThresholds, validateRanges } from '@/hooks/useClassification';
import { usePartners } from '@/hooks/usePartners';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById } from '@/data/mock-data';
import { formatCurrencyInput, parseCurrencyToNumber, formatCentavos } from '@/lib/currency';
import { Gauge, Save, Clock, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const classColors: Record<string, string> = {
  A: 'bg-success/10 text-success border-success/20',
  B: 'bg-info/10 text-info border-info/20',
  C: 'bg-warning/10 text-warning border-warning/20',
  D: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

export default function ClassificationTab() {
  const { rules, activeRule, saveNewRule } = useClassification();
  const { partners, setPartners } = usePartners();
  const { canWrite } = usePermission();
  const { user } = useAuth();
  const canEdit = canWrite('settings.systemData');

  const [aMinInput, setAMinInput] = useState(formatCentavos(activeRule.ranges.A.min));
  const [bMinInput, setBMinInput] = useState(formatCentavos(activeRule.ranges.B.min));
  const [cMinInput, setCMinInput] = useState(formatCentavos(activeRule.ranges.C.min));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const previewRanges = useMemo(() => {
    const aMin = parseCurrencyToNumber(aMinInput);
    const bMin = parseCurrencyToNumber(bMinInput);
    const cMin = parseCurrencyToNumber(cMinInput);
    if (aMin <= 0 || bMin <= 0 || cMin <= 0) return null;
    return buildRangesFromThresholds(aMin, bMin, cMin);
  }, [aMinInput, bMinInput, cMinInput]);

  const classDistribution = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    partners.forEach(p => { counts[p.partnerClass]++; });
    return counts;
  }, [partners]);

  const handleSave = () => {
    if (!previewRanges || !user) return;
    const errors = validateRanges(previewRanges);
    if (errors.length > 0) {
      setValidationErrors(errors.map(e => e.message));
      return;
    }
    setValidationErrors([]);
    const result = saveNewRule(previewRanges, user.id, partners, setPartners);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success(`Régua salva com sucesso. ${result.changesCount} parceiro(s) reclassificado(s).`);
    }
  };

  const handleCurrencyChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(formatCurrencyInput(e.target.value));
  };

  return (
    <div className="space-y-6">
      {/* Current Distribution */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Distribuição atual:</span>
        {(['A', 'B', 'C', 'D'] as const).map(cls => (
          <Badge key={cls} variant="outline" className={cn('text-xs gap-1', classColors[cls])}>
            {cls}: {classDistribution[cls]}
          </Badge>
        ))}
      </div>

      {/* Editable Rule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Régua Vigente
          </CardTitle>
          <CardDescription className="text-xs">
            Vigente desde {new Date(activeRule.effectiveFrom).toLocaleDateString('pt-BR')} às {new Date(activeRule.effectiveFrom).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Badge variant="outline" className={cn('text-[10px] w-5 h-5 p-0 flex items-center justify-center', classColors.A)}>A</Badge>
                A partir de (R$)
              </Label>
              <Input
                value={aMinInput}
                onChange={handleCurrencyChange(setAMinInput)}
                disabled={!canEdit}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Badge variant="outline" className={cn('text-[10px] w-5 h-5 p-0 flex items-center justify-center', classColors.B)}>B</Badge>
                A partir de (R$)
              </Label>
              <Input
                value={bMinInput}
                onChange={handleCurrencyChange(setBMinInput)}
                disabled={!canEdit}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Badge variant="outline" className={cn('text-[10px] w-5 h-5 p-0 flex items-center justify-center', classColors.C)}>C</Badge>
                A partir de (R$)
              </Label>
              <Input
                value={cMinInput}
                onChange={handleCurrencyChange(setCMinInput)}
                disabled={!canEdit}
                className="text-sm"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Classe D: abaixo de {cMinInput || '—'}. Parceiros sem dados de produção recebem classe D (regra transitória).
          </p>

          {validationErrors.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-success/20 bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-xs text-success">Régua salva e parceiros reclassificados com sucesso.</p>
            </div>
          )}

          {canEdit && (
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" /> Salvar nova versão
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Rule History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Histórico de Réguas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length <= 1 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada além da régua inicial.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {rules.map((rule, i) => {
                const creator = getUserById(rule.createdBy);
                return (
                  <div key={rule.id} className={cn('p-3 rounded-lg border text-sm', i === 0 && 'border-primary/30 bg-primary/5')}>
                    <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(rule.effectiveFrom).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(rule.effectiveFrom).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {i === 0 && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Vigente</Badge>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span><strong>A:</strong> ≥ {formatCentavos(rule.ranges.A.min)}</span>
                      <span className="text-border">•</span>
                      <span><strong>B:</strong> {formatCentavos(rule.ranges.B.min)} – {formatCentavos(rule.ranges.B.max)}</span>
                      <span className="text-border">•</span>
                      <span><strong>C:</strong> {formatCentavos(rule.ranges.C.min)} – {formatCentavos(rule.ranges.C.max)}</span>
                      <span className="text-border">•</span>
                      <span><strong>D:</strong> ≤ {formatCentavos(rule.ranges.D.max)}</span>
                    </div>
                    {creator && <p className="text-[11px] text-muted-foreground mt-1">Por: {creator.name}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
