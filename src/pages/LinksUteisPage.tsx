import PageTransition from '@/components/PageTransition';
import PageHeader from '@/components/shared/PageHeader';
import LinksUteisTab from '@/components/info/LinksUteisTab';

export default function LinksUteisPage() {
  return (
    <PageTransition className="space-y-ds-lg">
      <PageHeader title="Links Úteis" description="Links e recursos externos centralizados" />
      <LinksUteisTab />
    </PageTransition>
  );
}
