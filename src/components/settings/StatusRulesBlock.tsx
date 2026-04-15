import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, ShieldAlert, Lock, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStatusRules, DEFAULT_STATUS_RULES, StatusRulesConfig } from '@/hooks/useStatusRules';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams, isDeepEqual } from '@/lib/rules-persistence';
import ConfigurabilityBadge from './ConfigurabilityBadge';

/** Items documented as protected — not editable in this phase */
const PROTECTED_RULES = [
  {
    label: 'Transições de status da Agenda',
    description: 'A máquina de estados (Planejada → Concluída / Cancelada / Inconclusa / Reagendada) permanece estrutural.',
  },
  {
    label: 'Justificativas obrigatórias',
    description: 'Cancelamento, reagendamento e marcação como inconclusa continuam exigindo justificativa.',
  },
  {
    label: 'Status terminal de documentos',
    description: 'O fluxo de validação documental (aprovado/rejeitado/revogado) permanece protegido.',
  },
  {
    label: 'Convenção CANCELLED: em tarefas',
    description: 'A marcação textual de cancelamento de tarefas permanece estrutural nesta fase.',
  },
];

export default function StatusRulesBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateConfig, resetToDefaults } = useStatusRules();
  const [savedSnapshot, setSavedSnapshot] = useState<StatusRulesConfig>(() => ({ ...config }));

  const hasChanges = !isDeepEqual(config, savedSnapshot);

  const handleSave = () => {
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'status_rules',
      action: 'update',
      summary: buildSummary(savedSnapshot, config),
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...config },
    });
    setSavedSnapshot({ ...config });
    toast({ title: 'Regras de status salvas com sucesso!' });
  };

  const handleRestore = () => {
    const before = { ...config };
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'status_rules',
      action: 'restore_defaults',
      summary: 'Regras de status restauradas ao padrão',
      snapshotBefore: before,
      snapshotAfter: { ...DEFAULT_STATUS_RULES },
    });
    setSavedSnapshot({ ...DEFAULT_STATUS_RULES });
    toast({ title: 'Regras de status restauradas ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-primary" />
            <div>
              <CardTitle className="text-base">Regras de Status e Bloqueios</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Gerencie comportamentos de bloqueio por status e confirmações obrigatórias.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfigurabilityBadge level="partial" />
            <Button variant="outline" size="sm" className="text-xs" onClick={handleRestore}>
              <RefreshCw className="h-3 w-3 mr-1" /> Restaurar padrão
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} size="sm">
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-5">
        {/* ── Configurable rules ── */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Regras configuráveis
          </h4>

          {/* Task terminal edit blocking */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Bloquear edição em status terminal de tarefas</Label>
              <p className="text-xs text-muted-foreground">
                Quando ativado, tarefas concluídas ou validadas não podem ser editadas. Desativar permite edição limitada mesmo após conclusão.
              </p>
            </div>
            <Switch
              checked={config.blockEditOnTerminalTask}
              onCheckedChange={(v) => updateConfig({ blockEditOnTerminalTask: v })}
            />
          </div>

          {/* Agenda final confirmation */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Confirmação obrigatória para ações finais da Agenda</Label>
              <p className="text-xs text-muted-foreground">
                Quando ativado, ações finais (Concluída, Cancelada, Inconclusa) pelo perfil Comercial exigem confirmação antes de aplicar.
              </p>
            </div>
            <Switch
              checked={config.requireAgendaFinalConfirmation}
              onCheckedChange={(v) => updateConfig({ requireAgendaFinalConfirmation: v })}
            />
          </div>

          {/* Task reopen — prepared but documented as limited */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Permitir reabertura de tarefas concluídas</Label>
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                  Experimental
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Quando ativado, tarefas concluídas podem ter seu status reaberto pelo responsável. A ação operacional completa será validada em fase futura.
              </p>
            </div>
            <Switch
              checked={config.allowTaskReopen}
              onCheckedChange={(v) => updateConfig({ allowTaskReopen: v })}
            />
          </div>
        </div>

        <Separator />

        {/* ── Protected/structural rules ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Regras protegidas nesta fase
            </h4>
          </div>

          <div className="space-y-2">
            {PROTECTED_RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-md border border-dashed border-muted-foreground/20 bg-muted/10">
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">{rule.label}</p>
                  <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildSummary(before: StatusRulesConfig, after: StatusRulesConfig): string {
  const changes: string[] = [];
  if (before.blockEditOnTerminalTask !== after.blockEditOnTerminalTask) {
    changes.push(`Bloqueio terminal ${after.blockEditOnTerminalTask ? 'ativado' : 'desativado'}`);
  }
  if (before.requireAgendaFinalConfirmation !== after.requireAgendaFinalConfirmation) {
    changes.push(`Confirmação agenda ${after.requireAgendaFinalConfirmation ? 'ativada' : 'desativada'}`);
  }
  if (before.allowTaskReopen !== after.allowTaskReopen) {
    changes.push(`Reabertura de tarefas ${after.allowTaskReopen ? 'ativada' : 'desativada'}`);
  }
  return changes.length > 0 ? changes.join('; ') : 'Regras de status atualizadas';
}
