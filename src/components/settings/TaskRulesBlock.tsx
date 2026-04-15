import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useTaskRules, DEFAULT_TASK_RULES, TaskCategory, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/hooks/useTaskRules';
import { CompanyCargo, cargoLabels, cargoColors, allCargos } from '@/data/mock-data';
import { ListChecks, Save, RefreshCw, Clock, Zap, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigurabilityBadge from '@/components/settings/ConfigurabilityBadge';
import BlockImpactNote from '@/components/settings/BlockImpactNote';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams } from '@/lib/rules-persistence';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  document: 'Documentos',
  data: 'Dados cadastrais',
};

export default function TaskRulesBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateConfig, resetToDefaults } = useTaskRules();
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({ ...config }));
  const [hasChanges, setHasChanges] = useState(false);

  const handleDeadlineChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= MIN_DEADLINE_DAYS && num <= MAX_DEADLINE_DAYS) {
      updateConfig({ cadastroDeadlineDays: num });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (config.cadastroDeadlineDays < MIN_DEADLINE_DAYS || config.cadastroDeadlineDays > MAX_DEADLINE_DAYS) {
      toast({ title: 'Prazo inválido', description: `O prazo deve estar entre ${MIN_DEADLINE_DAYS} e ${MAX_DEADLINE_DAYS} dias úteis.`, variant: 'destructive' });
      return;
    }
    const invalidRoles = config.globalCancelRoles.filter(r => !allCargos.includes(r));
    if (invalidRoles.length > 0) {
      toast({ title: 'Perfis inválidos', description: 'A lista de perfis com cancelamento global contém valores inválidos.', variant: 'destructive' });
      return;
    }
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'task_rules',
      action: 'update',
      summary: 'Regras de tarefas atualizadas',
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...config },
    });
    setSavedSnapshot({ ...config });
    setHasChanges(false);
    toast({ title: 'Regras de tarefas salvas com sucesso!' });
  };

  const toggleCategory = (cat: TaskCategory) => {
    const current = config.autoPriorityCategories;
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    updateConfig({ autoPriorityCategories: next });
    setHasChanges(true);
  };

  const toggleCancelRole = (cargo: CompanyCargo) => {
    const current = config.globalCancelRoles;
    const next = current.includes(cargo) ? current.filter(r => r !== cargo) : [...current, cargo];
    updateConfig({ globalCancelRoles: next });
    setHasChanges(true);
  };

  const handleReset = () => {
    const before = { ...config };
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'task_rules',
      action: 'restore_defaults',
      summary: 'Regras de tarefas restauradas ao padrão',
      snapshotBefore: before,
      snapshotAfter: { ...DEFAULT_TASK_RULES },
    });
    setSavedSnapshot({ ...DEFAULT_TASK_RULES });
    setHasChanges(false);
    toast({ title: 'Regras de tarefas restauradas ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4.5 w-4.5 text-primary" />
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">Regras de Tarefas</CardTitle>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">Controla prazo padrão, prioridade automática por categoria e quais perfis podem cancelar tarefas globalmente. Não altera regras de criação contextual ou fluxo documental.</TooltipContent></Tooltip></TooltipProvider>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Prazo padrão, prioridade automática e cancelamento global de tarefas.
              </CardDescription>
              <BlockImpactNote items={['Gestão de Tarefas', 'Tarefas de parceiros', 'Não altera fluxo documental']} />
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
        {/* Group 1: Prazo padrão */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Prazo padrão de tarefas de cadastro</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tarefas vinculadas a cadastro recebem automaticamente este prazo em dias úteis ({MIN_DEADLINE_DAYS}–{MAX_DEADLINE_DAYS}).
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={MIN_DEADLINE_DAYS}
              max={MAX_DEADLINE_DAYS}
              value={config.cadastroDeadlineDays}
              onChange={e => handleDeadlineChange(e.target.value)}
              className="w-20 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">dias úteis</span>
          </div>
        </div>

        {/* Group 2: Prioridade automática */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Categorias com prioridade automática</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tarefas dessas categorias entram automaticamente como prioridade no sistema.
          </p>
          <div className="space-y-2">
            {(['document', 'data'] as TaskCategory[]).map(cat => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer">
                <Switch
                  checked={config.autoPriorityCategories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                />
                <span className="text-sm">{CATEGORY_LABELS[cat]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Group 3: Cancelamento global */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Perfis com cancelamento global</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Perfis selecionados podem cancelar qualquer tarefa do sistema, independente do contexto.
          </p>
          <div className="flex flex-wrap gap-2">
            {allCargos.map(cargo => {
              const checked = config.globalCancelRoles.includes(cargo);
              return (
                <label
                  key={cargo}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-1.5 cursor-pointer transition-colors',
                    checked ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleCancelRole(cargo)}
                  />
                  <Badge className={cn('text-xs capitalize', cargoColors[cargo])} variant="secondary">
                    {cargoLabels[cargo]}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
