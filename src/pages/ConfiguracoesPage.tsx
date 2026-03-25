import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { usePermission } from '@/hooks/usePermission';
import { ShieldOff, Users, Trophy, Palette, Building2 } from 'lucide-react';
import UsersTab from '@/components/settings/UsersTab';
import CampaignsTab from '@/components/settings/CampaignsTab';
import PartnersTab from '@/components/settings/PartnersTab';
import AppearanceTab from '@/components/settings/AppearanceTab';

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
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Centro administrativo do sistema</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="parceiros" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Parceiros
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card>
            <CardContent className="p-4 md:p-6">
              <UsersTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campanhas">
          <Card>
            <CardContent className="p-4 md:p-6">
              <CampaignsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parceiros">
          <Card>
            <CardContent className="p-4 md:p-6">
              <PartnersTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardContent className="p-4 md:p-6">
              <AppearanceTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
