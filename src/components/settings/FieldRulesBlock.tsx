import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, ClipboardCheck, Handshake, UserPlus, FileText, RotateCcw, Shield, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import BlockImpactNote from '@/components/settings/BlockImpactNote';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldRules, DEFAULT_FIELD_RULES, FieldRulesConfig } from '@/hooks/useFieldRules';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams } from '@/lib/rules-persistence';
import ConfigurabilityBadge from './ConfigurabilityBadge';

function FieldSwitchRow({
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

export default function FieldRulesBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateConfig, resetToDefaults } = useFieldRules();
  const [savedSnapshot, setSavedSnapshot] = useState<FieldRulesConfig>(() => ({ ...config }));

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedSnapshot);

  const handleSave = () => {
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'field_rules',
      action: 'update',
      summary: 'Campos obrigatórios e validações atualizados',
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...config },
    });
    setSavedSnapshot({ ...config });
    toast({ title: 'Regras de campos salvas com sucesso!' });
  };

  const handleReset = () => {
    const before = { ...config };
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'field_rules',
      action: 'restore_defaults',
      summary: 'Regras de campos restauradas ao padrão',
      snapshotBefore: before,
      snapshotAfter: { ...DEFAULT_FIELD_RULES },
    });
    setSavedSnapshot({ ...DEFAULT_FIELD_RULES });
    toast({ title: 'Regras de campos restauradas ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4.5 w-4.5 text-primary" />
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">Campos Obrigatórios e Validações</CardTitle>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">Define quais campos são obrigatórios na conclusão de visitas, prospecções e ações administrativas. Justificativas de cancelamento/reagendamento permanecem protegidas.</TooltipContent></Tooltip></TooltipProvider>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Campos obrigatórios por contexto operacional do sistema.
              </CardDescription>
              <BlockImpactNote items={['Agenda (conclusão)', 'Cadastro', 'Ações administrativas']} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfigurabilityBadge level="partial" />
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
        {/* Grupo 1 — Conclusão de visita */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="h-3.5 w-3.5 text-info" />
            <h4 className="text-sm font-semibold">Conclusão de Visita</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Campos exigidos ao marcar uma visita como concluída. Não afeta justificativas obrigatórias já protegidas.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <FieldSwitchRow
              label="Potencial de produção obrigatório"
              description="O campo de potencial (R$) precisa estar preenchido para concluir a visita."
              checked={config.visitRequirePotential}
              onCheckedChange={(v) => updateConfig({ visitRequirePotential: v })}
            />
            <Separator />
            <FieldSwitchRow
              label="Resumo obrigatório"
              description="Um resumo ou observação precisa ser informado na conclusão da visita."
              checked={config.visitRequireSummary}
              onCheckedChange={(v) => updateConfig({ visitRequireSummary: v })}
            />
          </div>
        </div>

        {/* Grupo 2 — Conclusão de prospecção */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-3.5 w-3.5 text-warning" />
            <h4 className="text-sm font-semibold">Conclusão de Prospecção</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Campos exigidos ao concluir uma prospecção. Justificativas obrigatórias permanecem protegidas.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <FieldSwitchRow
              label="Resumo obrigatório"
              description="Um resumo precisa ser informado ao concluir a prospecção."
              checked={config.prospectRequireSummary}
              onCheckedChange={(v) => updateConfig({ prospectRequireSummary: v })}
            />
            <Separator />
            <FieldSwitchRow
              label="Contato do prospect obrigatório"
              description="O nome de contato do prospect deve estar preenchido para conclusão."
              checked={config.prospectRequireContact}
              onCheckedChange={(v) => updateConfig({ prospectRequireContact: v })}
            />
          </div>
        </div>

        {/* Grupo 3 — Cadastro */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-sm font-semibold">Cadastro e Registros</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Obrigatoriedade de campos ao criar solicitações de cadastro bancário.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <FieldSwitchRow
              label="Observação obrigatória na solicitação"
              description="Uma observação precisa ser preenchida ao criar uma solicitação de cadastro."
              checked={config.registrationRequireObservation}
              onCheckedChange={(v) => updateConfig({ registrationRequireObservation: v })}
            />
          </div>
        </div>

        {/* Grupo 4 — Ações administrativas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="h-3.5 w-3.5 text-success" />
            <h4 className="text-sm font-semibold">Ações Administrativas</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Exigência de observação/nota em ações administrativas controladas.
          </p>
          <div className="rounded-md border p-3 space-y-1">
            <FieldSwitchRow
              label="Nota obrigatória ao reabrir tarefa"
              description="Uma justificativa textual é exigida ao reabrir uma tarefa concluída."
              checked={config.taskReopenRequireNote}
              onCheckedChange={(v) => updateConfig({ taskReopenRequireNote: v })}
            />
          </div>
        </div>

        {/* Regras protegidas */}
        <div className="rounded-md border border-dashed p-3 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Regras protegidas nesta fase</span>
          </div>
          <div className="space-y-1.5">
            {[
              'Justificativas obrigatórias de cancelamento, reagendamento e inconclusão permanecem estruturais',
              'Validações do fluxo documental (documentos por banco) permanecem no módulo próprio',
              'Campos estruturais de parceiro (CNPJ, nome, endereço) permanecem obrigatórios por design',
              'Campos de cadastro por banco seguem as regras do BankRegistrationFlow',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20 shrink-0 mt-0.5">
                  Protegido
                </Badge>
                <span className="text-[11px] text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
