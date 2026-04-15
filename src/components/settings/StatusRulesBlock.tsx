import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, RefreshCw, ShieldAlert, Lock, Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import BlockImpactNote from '@/components/settings/BlockImpactNote';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStatusRules, DEFAULT_STATUS_RULES, StatusRulesConfig } from '@/hooks/useStatusRules';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams, isDeepEqual } from '@/lib/rules-persistence';
import { cargoLabels, CompanyCargo } from '@/data/mock-data';
import ConfigurabilityBadge from './ConfigurabilityBadge';

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
  {
    label: 'Reversão de ações finais da Agenda',
    description: 'Ações finais da Agenda (Concluída, Cancelada, Inconclusa) não podem ser revertidas.',
  },
  {
    label: 'Edição de tarefas validadas',
    description: 'Tarefas com documento validado não permitem edição administrativa. O fluxo documental permanece protegido.',
  },
];

/** Roles eligible for reopen / terminal edit selection */
const ADMIN_ELIGIBLE_ROLES: CompanyCargo[] = ['diretor', 'gerente', 'ascom'];

export default function StatusRulesBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateConfig, resetToDefaults } = useStatusRules();
  const [savedSnapshot, setSavedSnapshot] = useState<StatusRulesConfig>(() => ({ ...config }));

  const hasChanges = !isDeepEqual(config, savedSnapshot);

  const handleSave = () => {
    const normalized = { ...config };
    // Normalize reopen
    if (!normalized.allowTaskReopen) {
      normalized.taskReopenAllowedRoles = [];
    }
    if (normalized.allowTaskReopen && normalized.taskReopenAllowedRoles.length === 0) {
      toast({ title: 'Selecione ao menos um perfil autorizado para reabertura', variant: 'destructive' });
      return;
    }
    // Normalize terminal edit
    if (!normalized.allowTerminalLimitedEdit) {
      normalized.terminalLimitedEditAllowedRoles = [];
    }
    if (normalized.allowTerminalLimitedEdit && normalized.terminalLimitedEditAllowedRoles.length === 0) {
      toast({ title: 'Selecione ao menos um perfil autorizado para edição administrativa', variant: 'destructive' });
      return;
    }
    updateConfig(normalized);

    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'status_rules',
      action: 'update',
      summary: buildSummary(savedSnapshot, normalized),
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...normalized },
    });
    setSavedSnapshot({ ...normalized });
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

  const toggleRole = (field: 'taskReopenAllowedRoles' | 'terminalLimitedEditAllowedRoles', role: CompanyCargo) => {
    const current = config[field];
    const next = current.includes(role) ? current.filter(r => r !== role) : [...current, role];
    updateConfig({ [field]: next });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-primary" />
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">Regras de Status e Bloqueios</CardTitle>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">Controla bloqueios em tarefas terminais, reabertura e exceções administrativas. Transições de Agenda e validação documental permanecem protegidas.</TooltipContent></Tooltip></TooltipProvider>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Bloqueios por status, confirmações obrigatórias e exceções administrativas.
              </CardDescription>
              <BlockImpactNote items={['Gestão de Tarefas', 'Exceções administrativas', 'Agenda e docs protegidos']} />
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

          {/* Task reopen */}
          <RoleGatedRule
            label="Permitir reabertura de tarefas concluídas"
            description="Tarefas concluídas (não validadas) podem ser reabertas pelos perfis selecionados. A ação exige confirmação e é registrada no histórico."
            badge="Operacional"
            enabled={config.allowTaskReopen}
            onToggle={(v) => updateConfig({ allowTaskReopen: v })}
            roles={config.taskReopenAllowedRoles}
            eligibleRoles={ADMIN_ELIGIBLE_ROLES}
            onToggleRole={(role) => toggleRole('taskReopenAllowedRoles', role)}
            roleNote="Comercial e Cadastro não são elegíveis para reabertura nesta fase."
          />

          {/* Terminal limited edit */}
          <RoleGatedRule
            label="Edição administrativa limitada em tarefas terminais"
            description="Permite adicionar ou editar uma nota administrativa em tarefas concluídas ou canceladas (não validadas). Não altera status, contexto, vínculo ou categoria da tarefa."
            badge="Exceção controlada"
            enabled={config.allowTerminalLimitedEdit}
            onToggle={(v) => updateConfig({ allowTerminalLimitedEdit: v })}
            roles={config.terminalLimitedEditAllowedRoles}
            eligibleRoles={ADMIN_ELIGIBLE_ROLES}
            onToggleRole={(role) => toggleRole('terminalLimitedEditAllowedRoles', role)}
            roleNote="Comercial e Cadastro não são elegíveis para edição administrativa nesta fase. Tarefas validadas permanecem protegidas."
          />
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

/* ── Reusable role-gated rule component ── */
function RoleGatedRule({ label, description, badge, enabled, onToggle, roles, eligibleRoles, onToggleRole, roleNote }: {
  label: string;
  description: string;
  badge: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  roles: CompanyCargo[];
  eligibleRoles: CompanyCargo[];
  onToggleRole: (role: CompanyCargo) => void;
  roleNote: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              {badge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <div className="pl-1 space-y-2">
          <Label className="text-xs text-muted-foreground">Perfis autorizados:</Label>
          <div className="flex flex-wrap gap-3">
            {eligibleRoles.map(role => (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={roles.includes(role)}
                  onCheckedChange={() => onToggleRole(role)}
                />
                <span className="text-xs font-medium">{cargoLabels[role]}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">{roleNote}</p>
        </div>
      )}
    </div>
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
    changes.push(`Reabertura ${after.allowTaskReopen ? 'ativada' : 'desativada'}`);
  }
  if (before.allowTerminalLimitedEdit !== after.allowTerminalLimitedEdit) {
    changes.push(`Edição administrativa ${after.allowTerminalLimitedEdit ? 'ativada' : 'desativada'}`);
  }
  const rB = (before.taskReopenAllowedRoles || []).sort().join(',');
  const rA = (after.taskReopenAllowedRoles || []).sort().join(',');
  if (rB !== rA && after.allowTaskReopen) {
    changes.push(`Perfis de reabertura: ${after.taskReopenAllowedRoles.map(r => cargoLabels[r]).join(', ')}`);
  }
  const eB = (before.terminalLimitedEditAllowedRoles || []).sort().join(',');
  const eA = (after.terminalLimitedEditAllowedRoles || []).sort().join(',');
  if (eB !== eA && after.allowTerminalLimitedEdit) {
    changes.push(`Perfis de edição admin.: ${after.terminalLimitedEditAllowedRoles.map(r => cargoLabels[r]).join(', ')}`);
  }
  return changes.length > 0 ? changes.join('; ') : 'Regras de status atualizadas';
}
