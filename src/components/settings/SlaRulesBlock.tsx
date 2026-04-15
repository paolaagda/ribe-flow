import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, RefreshCw, Gauge, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSlaRules, DEFAULT_SLA_RULES, SlaRulesConfig } from '@/hooks/useSlaRules';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams } from '@/lib/rules-persistence';
import ConfigurabilityBadge from './ConfigurabilityBadge';

function SlaNumberInput({
  label,
  description,
  value,
  onChange,
  suffix = 'dias',
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="space-y-0.5 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={1}
          max={365}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(Math.max(1, Math.min(365, n)));
          }}
          className="h-8 w-[72px] text-center text-sm"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function SlaSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="space-y-0.5 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SlaRulesBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateConfig, resetToDefaults } = useSlaRules();
  const [savedSnapshot, setSavedSnapshot] = useState<SlaRulesConfig>(() => ({ ...config }));

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedSnapshot);

  const handleSave = () => {
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'sla_rules',
      action: 'update',
      summary: 'Regras de SLA, Alertas e Criticidade atualizadas',
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...config },
    });
    setSavedSnapshot({ ...config });
    toast({ title: 'Regras de SLA salvas com sucesso!' });
  };

  const handleReset = () => {
    const before = { ...config };
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'sla_rules',
      action: 'restore_defaults',
      summary: 'Regras de SLA restauradas ao padrão',
      snapshotBefore: before,
      snapshotAfter: { ...DEFAULT_SLA_RULES },
    });
    setSavedSnapshot({ ...DEFAULT_SLA_RULES });
    toast({ title: 'Regras de SLA restauradas ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4.5 w-4.5 text-primary" />
            <div>
              <CardTitle className="text-base">SLA, Alertas e Criticidade</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configure thresholds de atenção, prazos por contexto e critérios de criticidade operacional.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfigurabilityBadge level="configurable" />
            <Button variant="outline" size="sm" className="text-xs" onClick={handleReset}>
              <RefreshCw className="h-3 w-3 mr-1" /> Restaurar padrão
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} size="sm">
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        {/* Grupo 1 — Atenção Imediata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h4 className="text-sm font-semibold">Atenção Imediata</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Define quando um cadastro entra na fila de atenção imediata no painel operacional.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <SlaNumberInput
              label="Dias sem movimentação"
              description="Cadastros sem atualização por esse número de dias entram em atenção imediata."
              value={config.immediateAttentionDays}
              onChange={(v) => updateConfig({ immediateAttentionDays: v })}
            />
            <Separator />
            <SlaSwitchRow
              label="Documentos pendentes"
              description="Cadastros com documentos pendentes entram automaticamente em atenção imediata."
              checked={config.immediateAttentionPendingDocs}
              onCheckedChange={(v) => updateConfig({ immediateAttentionPendingDocs: v })}
            />
            <Separator />
            <SlaSwitchRow
              label="Marcação manual como crítico"
              description="Cadastros sinalizados como críticos manualmente contam para atenção imediata."
              checked={config.immediateAttentionManualCritical}
              onCheckedChange={(v) => updateConfig({ immediateAttentionManualCritical: v })}
            />
          </div>
        </div>

        {/* Grupo 2 — SLA por contexto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <h4 className="text-sm font-semibold">SLA por Contexto</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Thresholds em dias para alertas de tempo parado por responsável. Itens parados acima do limite aparecem nos cards operacionais.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <SlaNumberInput
              label="Comercial"
              description="Limite de dias parado com responsabilidade do Comercial."
              value={config.slaComercial}
              onChange={(v) => updateConfig({ slaComercial: v })}
            />
            <Separator />
            <SlaNumberInput
              label="Parceiro"
              description="Limite de dias parado aguardando ação do Parceiro."
              value={config.slaParceiro}
              onChange={(v) => updateConfig({ slaParceiro: v })}
            />
            <Separator />
            <SlaNumberInput
              label="Banco"
              description="Limite de dias parado aguardando tratativa com o Banco."
              value={config.slaBanco}
              onChange={(v) => updateConfig({ slaBanco: v })}
            />
            <Separator />
            <SlaNumberInput
              label="Cadastro"
              description="Limite de dias parado com pendência no time de Cadastro."
              value={config.slaCadastro}
              onChange={(v) => updateConfig({ slaCadastro: v })}
            />
          </div>
        </div>

        {/* Grupo 3 — Criticidade automática */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-info" />
            <h4 className="text-sm font-semibold">Criticidade Automática</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Critérios para elevar automaticamente a criticidade de parceiros e cadastros nos indicadores operacionais.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <SlaSwitchRow
              label="Elevar por documento pendente"
              description="Parceiros com alta proporção de documentos pendentes têm criticidade elevada."
              checked={config.criticalityByPendingDoc}
              onCheckedChange={(v) => updateConfig({ criticalityByPendingDoc: v })}
            />
            <Separator />
            <SlaSwitchRow
              label="Elevar por tempo parado"
              description="Cadastros parados acima do limite de SLA têm criticidade elevada automaticamente."
              checked={config.criticalityByStalledTime}
              onCheckedChange={(v) => updateConfig({ criticalityByStalledTime: v })}
            />
            <Separator />
            <SlaSwitchRow
              label="Considerar criticidade manual"
              description="Marcações manuais de criticidade são respeitadas nos cálculos operacionais."
              checked={config.criticalityManual}
              onCheckedChange={(v) => updateConfig({ criticalityManual: v })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
