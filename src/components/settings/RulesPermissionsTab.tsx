import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useVisibilityConfig, DEFAULT_VISIBILITY, VisibilityLevel } from '@/hooks/useVisibilityConfig';
import { CompanyCargo, cargoLabels, cargoColors, allCargos } from '@/data/mock-data';
import { PermissionLevel, defaultPermissions, groupedPermissions } from '@/data/permissions';
import { Eye, EyeOff, Pencil, Save, RefreshCw, Shield, Globe, Lock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import TaskRulesBlock from '@/components/settings/TaskRulesBlock';
import NotificationsBlock from '@/components/settings/NotificationsBlock';
import StatusRulesBlock from '@/components/settings/StatusRulesBlock';
import SlaRulesBlock from '@/components/settings/SlaRulesBlock';
import FieldRulesBlock from '@/components/settings/FieldRulesBlock';
import ConfigurabilityBadge from '@/components/settings/ConfigurabilityBadge';
import ProtectedRulesInfo from '@/components/settings/ProtectedRulesInfo';
import RulesAuditLog from '@/components/settings/RulesAuditLog';
import RulesExecutiveSummary from '@/components/settings/RulesExecutiveSummary';
import BlockSectionHeader from '@/components/settings/BlockSectionHeader';
import BlockImpactNote from '@/components/settings/BlockImpactNote';
import { logRulesAuditEvent } from '@/lib/rules-audit';
import { buildAuditParams } from '@/lib/rules-persistence';
import { useAuth } from '@/contexts/AuthContext';

/** Keys that Diretor MUST keep at least 'read' to avoid admin lockout */
const PROTECTED_DIRETOR_KEYS = ['settings.view'];

function validatePermissionsSafety(
  perms: Record<CompanyCargo, Record<string, PermissionLevel>>,
): string | null {
  for (const key of PROTECTED_DIRETOR_KEYS) {
    if (perms.diretor[key] === 'none') {
      return `O perfil Diretor não pode perder acesso a "${key.replace('.', ' > ')}". Isso bloquearia o acesso administrativo ao sistema.`;
    }
  }
  const hasAdmin = allCargos.some(c => perms[c]?.['settings.view'] !== 'none');
  if (!hasAdmin) {
    return 'Pelo menos um perfil precisa manter acesso a Configurações para administrar o sistema.';
  }
  return null;
}

function BlockHelp({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function RulesPermissionsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [permissions, setPermissions] = useLocalStorage<Record<CompanyCargo, Record<string, PermissionLevel>>>(
    'ribercred_permissions_v7',
    defaultPermissions
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.parse(JSON.stringify(permissions)));
  const [hasChanges, setHasChanges] = useState(false);
  const grouped = groupedPermissions();

  const handlePermissionChange = (cargo: CompanyCargo, key: string, level: PermissionLevel) => {
    setPermissions(prev => ({
      ...prev,
      [cargo]: { ...prev[cargo], [key]: level },
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    const error = validatePermissionsSafety(permissions);
    if (error) {
      toast({ title: 'Configuração bloqueada', description: error, variant: 'destructive' });
      return;
    }
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'permissions',
      action: 'update',
      summary: 'Permissões por perfil atualizadas',
      snapshotBefore: savedSnapshot,
      snapshotAfter: permissions,
    });
    setSavedSnapshot(JSON.parse(JSON.stringify(permissions)));
    setHasChanges(false);
    toast({ title: 'Permissões salvas com sucesso!' });
  };

  const handleResetPermissions = (cargo: CompanyCargo) => {
    const before = JSON.parse(JSON.stringify(permissions));
    const next = { ...permissions, [cargo]: { ...defaultPermissions[cargo] } };
    setPermissions(next);
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'permissions',
      action: 'restore_defaults',
      summary: `Permissões de ${cargoLabels[cargo]} restauradas ao padrão`,
      snapshotBefore: before,
      snapshotAfter: next,
    });
    setSavedSnapshot(JSON.parse(JSON.stringify(next)));
    setHasChanges(true);
    toast({ title: `Permissões de ${cargoLabels[cargo]} restauradas ao padrão` });
  };

  return (
    <div className="space-y-6">
      {/* Resumo executivo */}
      <RulesExecutiveSummary />

      <BlockSectionHeader title="Acesso e Visibilidade" description="Controle quem pode ver e editar cada área do sistema" />

      {/* Bloco 1 — Permissões por Perfil */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              <div>
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-base">Permissões por Perfil</CardTitle>
                  <BlockHelp text="Define o nível de acesso (sem acesso, leitura ou edição) de cada cargo em cada funcionalidade. Impacta navegação, botões e ações em todo o sistema. Não altera fluxos documentais ou regras de status." />
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Nível de acesso de cada cargo em cada funcionalidade do sistema.
                </CardDescription>
                <BlockImpactNote items={['Impacta todo o sistema', 'Navegação e ações', 'Não altera fluxos documentais']} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConfigurabilityBadge level="partial" />
              <Button onClick={handleSavePermissions} disabled={!hasChanges} size="sm">
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible defaultValue="diretor" className="space-y-2">
            {allCargos.map(r => (
              <AccordionItem key={r} value={r} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Badge className={cn('text-xs capitalize', cargoColors[r])} variant="secondary">
                      {cargoLabels[r]}
                    </Badge>
                    <span className="text-sm font-medium">{cargoLabels[r]}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleResetPermissions(r)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Restaurar padrão
                      </Button>
                    </div>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[160px] text-xs">Módulo</TableHead>
                            <TableHead className="text-xs">Permissão</TableHead>
                            <TableHead className="w-[200px] text-xs text-right">Nível de acesso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(grouped).map(([module, items]) =>
                            items.map((item, idx) => (
                              <TableRow key={item.key}>
                                {idx === 0 && (
                                  <TableCell rowSpan={items.length} className="text-xs font-semibold align-top border-r bg-muted/30">
                                    {module}
                                  </TableCell>
                                )}
                                <TableCell className="text-xs py-2">{item.action}</TableCell>
                                <TableCell className="py-2">
                                  <Select
                                    value={permissions[r]?.[item.key] || 'none'}
                                    onValueChange={(v) => handlePermissionChange(r, item.key, v as PermissionLevel)}
                                  >
                                    <SelectTrigger className="h-8 w-[48px] ml-auto flex items-center justify-center">
                                      {(() => {
                                        const level = permissions[r]?.[item.key] || 'none';
                                        const icons: Record<PermissionLevel, React.ReactNode> = {
                                          none: <EyeOff className="h-3.5 w-3.5 text-destructive" />,
                                          read: <Eye className="h-3.5 w-3.5 text-warning" />,
                                          write: <Pencil className="h-3.5 w-3.5 text-success" />,
                                        };
                                        return <span>{icons[level]}</span>;
                                      })()}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        <div className="flex items-center gap-2">
                                          <EyeOff className="h-3.5 w-3.5 text-destructive" />
                                          <span>Sem acesso</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="read">
                                        <div className="flex items-center gap-2">
                                          <Eye className="h-3.5 w-3.5 text-warning" />
                                          <span>Somente leitura</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="write">
                                        <div className="flex items-center gap-2">
                                          <Pencil className="h-3.5 w-3.5 text-success" />
                                          <span>Leitura e edição</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Bloco 2 — Visibilidade Editável */}
      <VisibilityBlock />

      <BlockSectionHeader title="Regras Operacionais" description="Comportamento de tarefas, notificações, status e campos" />

      {/* Bloco 3 — Regras de Tarefas */}
      <TaskRulesBlock />

      {/* Bloco 4 — Notificações */}
      <NotificationsBlock />

      {/* Bloco 5 — Regras de Status e Bloqueios */}
      <StatusRulesBlock />

      <BlockSectionHeader title="Parâmetros e Validações" description="Thresholds, SLA e exigências de preenchimento" />

      {/* Bloco 6 — SLA, Alertas e Criticidade */}
      <SlaRulesBlock />

      {/* Bloco 7 — Campos Obrigatórios e Validações */}
      <FieldRulesBlock />

      <BlockSectionHeader title="Governança e Auditoria" />

      {/* Bloco 8 — Regras protegidas */}
      <ProtectedRulesInfo />

      {/* Bloco 9 — Histórico de alterações */}
      <RulesAuditLog />
    </div>
  );
}

const VISIBILITY_DESCRIPTIONS: Record<VisibilityLevel, Record<CompanyCargo, string>> = {
  global: {
    diretor: 'Acesso a todos os dados do sistema',
    gerente: 'Acesso a todos os dados do sistema',
    ascom: 'Acesso a todos os dados do sistema',
    comercial: 'Acesso a todos os dados do sistema',
    cadastro: 'Acesso a todos os dados do sistema',
  },
  restrita: {
    diretor: 'Apenas dados do seu contexto direto',
    gerente: 'Apenas dados do seu contexto direto',
    ascom: 'Apenas dados do seu contexto direto',
    comercial: 'Apenas dados da sua carteira e contexto direto',
    cadastro: 'Apenas dados do seu contexto operacional',
  },
};

function VisibilityBlock() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, updateCargo, resetToDefaults } = useVisibilityConfig();
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({ ...config }));
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (cargo: CompanyCargo, level: VisibilityLevel) => {
    updateCargo(cargo, level);
    setHasChanges(true);
  };

  const handleSave = () => {
    const changedCount = allCargos.filter(c => config[c] !== savedSnapshot[c]).length;
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'visibility',
      action: 'update',
      summary: changedCount > 0
        ? `Visibilidade alterada para ${changedCount} ${changedCount === 1 ? 'perfil' : 'perfis'}`
        : 'Visibilidade salva sem alterações',
      snapshotBefore: savedSnapshot,
      snapshotAfter: { ...config },
    });
    setSavedSnapshot({ ...config });
    setHasChanges(false);
    toast({ title: 'Regras de visibilidade salvas com sucesso!' });
  };

  const handleReset = () => {
    const before = { ...config };
    resetToDefaults();
    const audit = buildAuditParams(user);
    logRulesAuditEvent({
      ...audit,
      module: 'visibility',
      action: 'restore_defaults',
      summary: 'Visibilidade restaurada ao padrão',
      snapshotBefore: before,
      snapshotAfter: DEFAULT_VISIBILITY,
    });
    setSavedSnapshot({ ...DEFAULT_VISIBILITY });
    setHasChanges(false);
    toast({ title: 'Visibilidade restaurada ao padrão' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-primary" />
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">Visibilidade de Dados</CardTitle>
                <BlockHelp text="Controla o escopo de dados que cada perfil enxerga. Visibilidade Global dá acesso a tudo; Restrita limita ao contexto do usuário. Afeta Agenda, Parceiros, Cadastro e indicadores." />
              </div>
              <CardDescription className="text-xs mt-0.5">
                Escopo de dados acessíveis por perfil em todos os módulos.
              </CardDescription>
              <BlockImpactNote items={['Agenda, Parceiros, Cadastro', 'Indicadores e listagens', 'Efeito em tempo real']} />
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
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs w-[140px]">Perfil</TableHead>
                <TableHead className="text-xs w-[160px]">Visibilidade</TableHead>
                <TableHead className="text-xs">Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCargos.map(cargo => {
                const level = config[cargo];
                return (
                  <TableRow key={cargo}>
                    <TableCell>
                      <Badge className={cn('text-xs capitalize', cargoColors[cargo])} variant="secondary">
                        {cargoLabels[cargo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={level}
                        onValueChange={(v) => handleChange(cargo, v as VisibilityLevel)}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <div className="flex items-center gap-1.5">
                            {level === 'global' ? (
                              <>
                                <Globe className="h-3.5 w-3.5 text-success" />
                                <span className="text-xs font-medium">Global</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5 text-warning" />
                                <span className="text-xs font-medium">Restrita</span>
                              </>
                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-success" />
                              <span>Global</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="restrita">
                            <div className="flex items-center gap-2">
                              <Lock className="h-3.5 w-3.5 text-warning" />
                              <span>Restrita</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {VISIBILITY_DESCRIPTIONS[level][cargo]}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Alterações afetam Agenda, Parceiros, Tarefas e indicadores em tempo real.
        </p>
      </CardContent>
    </Card>
  );
}
