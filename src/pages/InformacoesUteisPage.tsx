import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageTransition from '@/components/PageTransition';
import PageHeader from '@/components/shared/PageHeader';
import { ClipboardList, ExternalLink } from 'lucide-react';
import ProcessosCadastroTab from '@/components/info/ProcessosCadastroTab';
import LinksUteisTab from '@/components/info/LinksUteisTab';

export default function InformacoesUteisPage() {
  return (
    <PageTransition className="space-y-ds-lg">
      <PageHeader title="Informações Úteis" description="Processos, documentações e links centralizados" />

      <Tabs defaultValue="cadastro">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="cadastro" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Processos de Cadastro
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Links Úteis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro">
          <ProcessosCadastroTab />
        </TabsContent>
        <TabsContent value="links">
          <LinksUteisTab />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
