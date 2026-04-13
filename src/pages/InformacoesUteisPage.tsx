import PageTransition from '@/components/PageTransition';
import PageHeader from '@/components/shared/PageHeader';
import ProcessosCadastroTab from '@/components/info/ProcessosCadastroTab';

export default function InformacoesUteisPage() {
  return (
    <PageTransition className="space-y-ds-lg">
      <PageHeader title="Informações Úteis" description="Processos, documentações e recursos centralizados" />
      <ProcessosCadastroTab />
    </PageTransition>
  );
}
