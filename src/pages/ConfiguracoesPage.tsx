import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { usePermission } from '@/hooks/usePermission';
import { ShieldOff, Users, Trophy, Building2, Database, Store, ScrollText, Gauge } from 'lucide-react';
import UsersTab from '@/components/settings/UsersTab';
import CampaignsTab from '@/components/settings/CampaignsTab';
import PartnersTab from '@/components/settings/PartnersTab';
import SystemDataTab from '@/components/settings/SystemDataTab';
import StoresTab from '@/components/settings/StoresTab';
import LogsTab from '@/components/settings/LogsTab';
import ClassificationTab from '@/components/settings/ClassificationTab';
import PageHeader from '@/components/shared/PageHeader';

export default function ConfiguracoesPage() {
  const { canRead } = usePermission();

  if (!canRead('settings.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-ds-lg">
      <PageHeader title="Configurações" description="Centro administrativo do sistema" />

      <Tabs defaultValue="usuarios">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="usuarios" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="parceiros" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Parceiros
          </TabsTrigger>
          <TabsTrigger value="lojas" className="gap-1.5">
            <Store className="h-3.5 w-3.5" /> Lojas
          </TabsTrigger>
          <TabsTrigger value="classificacao" className="gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> Classificação
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <Database className="h-3.5 w-3.5" /> Dados do Sistema
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card>
            <CardContent className="p-5 md:p-7">
              <UsersTab />
            </CardContent>

          </Card>
        </TabsContent>

        <TabsContent value="campanhas">
          <Card>
            <CardContent className="p-5 md:p-7">
              <CampaignsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parceiros">
          <Card>
            <CardContent className="p-5 md:p-7">
              <PartnersTab />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="lojas">
          <Card>
            <CardContent className="p-5 md:p-7">
              <StoresTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classificacao">
          <Card>
            <CardContent className="p-5 md:p-7">
              <ClassificationTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados">
          <Card>
            <CardContent className="p-5 md:p-7">
              <SystemDataTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-5 md:p-7">
              <LogsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
