import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTaskRules, DEFAULT_TASK_RULES, TaskCategory } from '@/hooks/useTaskRules';
import { CompanyCargo, cargoLabels, cargoColors, allCargos } from '@/data/mock-data';
import { ListChecks, Save, RefreshCw, Clock, Zap, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  document: 'Documentos',
  data: 'Dados cadastrais',
};

export default function TaskRulesBlock() {
  const { toast } = useToast();
  const { config, updateConfig, resetToDefaults } = useTaskRules();
  const [hasChanges, setHasChanges] = useState(false);

  const handleDeadlineChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      updateConfig({ cadastroDeadlineDays: num });
      setHasChanges(true);
    }
  };

  const toggleCategory = (cat: TaskCategory) => {
    const current = config.autoPriorityCategories;
    const next = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    updateConfig({ autoPriorityCategories: next });
    setHasChanges(true);
  };

  const toggleCancelRole = (cargo: CompanyCargo) => {
    const current = config.globalCancelRoles;
    const next = current.includes(cargo)
      ? current.filter(r => r !== cargo)
      : [...current, cargo];
    updateConfig({ globalCancelRoles: next });
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    toast({ title: 'Regras de tarefas salvas com sucesso!' });
  };

  const handleReset = () => {
    resetToDefaults();
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
              <CardTitle className="text-base">Regras de Tarefas</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configure prazo padrão, prioridade automática e permissões de cancelamento global.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            Tarefas vinculadas a cadastro recebem automaticamente este prazo em dias úteis.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={30}
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
