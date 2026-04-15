import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useNotificationRules, NotificationRules, DEFAULT_NOTIFICATION_RULES } from '@/hooks/useNotificationRules';
import { Bell, Save, RefreshCw, HelpCircle } from 'lucide-react';
import ConfigurabilityBadge from '@/components/settings/ConfigurabilityBadge';
import BlockImpactNote from '@/components/settings/BlockImpactNote';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams } from '@/lib/rules-persistence';
import { useAuth } from '@/contexts/AuthContext';

interface EventToggle {
  key: keyof NotificationRules;
  label: string;
  description: string;
}

const EVENTS: EventToggle[] = [
  {
    key: 'taskCompletedNotifyResponsible',
    label: 'Tarefa concluída → Responsável',
    description: 'Notifica o responsável principal quando a tarefa é concluída por outro usuário.',
  },
  {
    key: 'taskCadastroCompletedNotifyCadastro',
    label: 'Tarefa de cadastro concluída → Cadastro',
    description: 'Notifica os usuários do setor de Cadastro quando uma tarefa documental/dados é concluída.',
  },
  {
    key: 'docSubmittedNotifyCadastro',
    label: 'Documento enviado para validação → Cadastro',
    description: 'Notifica o setor de Cadastro quando um documento é submetido para validação.',
  },
  {
    key: 'docRejectedNotifySender',
    label: 'Documento rejeitado → Remetente',
    description: 'Notifica o usuário que enviou o documento quando ele é rejeitado pelo Cadastro.',
  },
  {
    key: 'regSubmittedNotifyCadastro',
    label: 'Registro bancário enviado → Cadastro',
    description: 'Notifica o setor de Cadastro quando um registro bancário é submetido para validação.',
  },
  {
    key: 'regRejectedNotifySender',
    label: 'Registro bancário rejeitado → Remetente',
    description: 'Notifica o remetente quando um registro bancário é rejeitado pelo Cadastro.',
  },
];

export default function NotificationsBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { rules, setAll, resetToDefaults } = useNotificationRules();
  const [local, setLocal] = useState<NotificationRules>(() => ({ ...rules }));
  const [savedSnapshot, setSavedSnapshot] = useState<NotificationRules>(() => ({ ...rules }));
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (key: keyof NotificationRules) => {
    setLocal(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setAll(local);
    const audit = buildAuditParams(user);
    const changedKeys = Object.keys(local).filter(
      k => local[k as keyof NotificationRules] !== savedSnapshot[k as keyof NotificationRules],
    );
    logRulesAuditEvent({
      ...audit,
      module: 'notifications',
      action: 'update',
      summary: changedKeys.length > 0
        ? `Notificações por evento atualizadas (${changedKeys.length} ${changedKeys.length === 1 ? 'evento' : 'eventos'})`
        : 'Notificações salvas sem alterações',
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...local },
    });
    setSavedSnapshot({ ...local });
    setHasChanges(false);
    toast({ title: 'Regras de notificação salvas com sucesso!' });
  };

  const handleReset = () => {
    const before = { ...local };
    const defaults = { ...DEFAULT_NOTIFICATION_RULES };
    setLocal(defaults);
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'notifications',
      action: 'restore_defaults',
      summary: 'Notificações restauradas ao padrão',
      snapshotBefore: before,
      snapshotAfter: defaults,
    });
    setSavedSnapshot(defaults);
    setHasChanges(false);
    toast({ title: 'Notificações restauradas ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-primary" />
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">Notificações por Evento</CardTitle>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">Ativa ou desativa disparos automáticos de notificação para eventos operacionais. Não altera canais, templates ou lógica de agrupamento — esses permanecem protegidos.</TooltipContent></Tooltip></TooltipProvider>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Disparos automáticos de notificação para cada evento do sistema.
              </CardDescription>
              <BlockImpactNote items={['Central de notificações', 'Alertas operacionais', 'Não altera templates']} />
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
      <CardContent className="pt-0">
        <div className="rounded-md border divide-y">
          {EVENTS.map(evt => (
            <div key={evt.key} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium">{evt.label}</p>
                <p className="text-xs text-muted-foreground">{evt.description}</p>
              </div>
              <Switch
                checked={local[evt.key]}
                onCheckedChange={() => handleToggle(evt.key)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
