import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CompanyCargo, cargoLabels, cargoColors, allCargos } from '@/data/mock-data';
import { PermissionLevel, defaultPermissions, groupedPermissions } from '@/data/permissions';
import { Eye, EyeOff, Pencil, Save, RefreshCw, Shield, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const VISIBILITY_RULES: { cargo: CompanyCargo; level: 'global' | 'restrita'; description: string }[] = [
  { cargo: 'diretor', level: 'global', description: 'Acesso a todos os dados do sistema' },
  { cargo: 'gerente', level: 'global', description: 'Acesso a todos os dados do sistema' },
  { cargo: 'ascom', level: 'global', description: 'Acesso a todos os dados do sistema' },
  { cargo: 'comercial', level: 'restrita', description: 'Apenas dados da sua carteira e contexto direto' },
  { cargo: 'cadastro', level: 'restrita', description: 'Apenas dados do seu contexto operacional' },
];

export default function RulesPermissionsTab() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useLocalStorage<Record<CompanyCargo, Record<string, PermissionLevel>>>(
    'ribercred_permissions_v7',
    defaultPermissions
  );
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
    setHasChanges(false);
    toast({ title: 'Permissões salvas com sucesso!' });
  };

  const handleResetPermissions = (cargo: CompanyCargo) => {
    setPermissions(prev => ({
      ...prev,
      [cargo]: { ...defaultPermissions[cargo] },
    }));
    setHasChanges(true);
    toast({ title: `Permissões de ${cargoLabels[cargo]} restauradas ao padrão` });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Gerencie as permissões de acesso e as regras de visibilidade de dados por perfil do sistema.
        </p>
      </div>

      {/* Bloco 1 — Permissões por Perfil */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              <div>
                <CardTitle className="text-base">Permissões por Perfil</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Defina o nível de acesso de cada cargo em cada funcionalidade do sistema.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleSavePermissions} disabled={!hasChanges} size="sm">
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
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

      {/* Bloco 2 — Visibilidade */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-primary" />
            <div>
              <CardTitle className="text-base">Visibilidade de Dados</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Regra de visibilidade aplicada por perfil. Define quais dados cada cargo pode acessar no sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-[140px]">Perfil</TableHead>
                  <TableHead className="text-xs w-[120px]">Visibilidade</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VISIBILITY_RULES.map(rule => (
                  <TableRow key={rule.cargo}>
                    <TableCell>
                      <Badge className={cn('text-xs capitalize', cargoColors[rule.cargo])} variant="secondary">
                        {cargoLabels[rule.cargo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {rule.level === 'global' ? (
                          <>
                            <Globe className="h-3.5 w-3.5 text-success" />
                            <span className="text-xs font-medium text-success">Global</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5 text-warning" />
                            <span className="text-xs font-medium text-warning">Restrita</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {rule.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Regra estrutural do sistema. Edição disponível em fase futura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
