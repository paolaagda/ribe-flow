import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { usePermission } from '@/hooks/usePermission';
import { ShieldOff, Users, Trophy, Building2, Database, Store, ScrollText, Gauge, ShieldCheck, Settings2 } from 'lucide-react';
import UsersTab from '@/components/settings/UsersTab';
import CampaignsTab from '@/components/settings/CampaignsTab';
import PartnersTab from '@/components/settings/PartnersTab';
import SystemDataTab from '@/components/settings/SystemDataTab';
import StoresTab from '@/components/settings/StoresTab';
import LogsTab from '@/components/settings/LogsTab';
import ClassificationTab from '@/components/settings/ClassificationTab';
import RulesPermissionsTab from '@/components/settings/RulesPermissionsTab';
import PageTransition from '@/components/PageTransition';

export default function ConfiguracoesPage() {
  const { canRead, canWrite } = usePermission();

  if (!canRead('settings.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <div className="h-14 w-14 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center">
          <ShieldOff className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const tabs = [
    { value: 'usuarios', label: 'Usuários', icon: Users, component: <UsersTab />, show: true },
    { value: 'regras', label: 'Regras e Permissões', icon: ShieldCheck, component: <RulesPermissionsTab />, show: canWrite('users.permissions') },
    { value: 'campanhas', label: 'Campanhas', icon: Trophy, component: <CampaignsTab />, show: true },
    { value: 'parceiros', label: 'Parceiros', icon: Building2, component: <PartnersTab />, show: true },
    { value: 'lojas', label: 'Lojas', icon: Store, component: <StoresTab />, show: true },
    { value: 'classificacao', label: 'Classificação', icon: Gauge, component: <ClassificationTab />, show: true },
    { value: 'dados', label: 'Dados do Sistema', icon: Database, component: <SystemDataTab />, show: true },
    { value: 'logs', label: 'Logs', icon: ScrollText, component: <LogsTab />, show: true },
  ].filter(t => t.show);

  return (
    <PageTransition className="space-y-ds-lg">
      {/* Refined header with institutional tile + lateral accent */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/70 via-primary/40 to-primary/10" aria-hidden />
        <div className="flex items-center gap-4 p-5 md:p-6 pl-6 md:pl-7">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-ds-xl font-bold tracking-tight leading-tight">Configurações</h1>
            <p className="text-ds-sm text-muted-foreground mt-0.5">
              Centro administrativo de governança, regras e parametrizações do sistema.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-ds-md">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-1.5">
          <TabsList className="w-full justify-start md:justify-center flex-wrap gap-1 bg-transparent h-auto p-0">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 h-8 px-3 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60 rounded-lg transition-all"
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map(({ value, component }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5 md:p-7">
                {component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </PageTransition>
  );
}
