import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getUserById } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { Search, Building2, MapPin, ShieldOff, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import PartnerDetailView from '@/components/partners/PartnerDetailView';
import SmartInsights from '@/components/shared/SmartInsights';

export default function ParceirosPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { canRead } = usePermission();
  const { user, profile } = useAuth();
  const { partners } = usePartners();

  // Filter partners by role: comercial only sees their own partners
  const visiblePartners = useMemo(() => {
    if (profile === 'nao_gestor' && user) {
      return partners.filter(p => p.responsibleUserId === user.id);
    }
    return partners;
  }, [profile, user, partners]);

  const filtered = useMemo(() => {
    if (!search) return visiblePartners;
    const q = search.toLowerCase();
    return visiblePartners.filter(p => p.name.toLowerCase().includes(q) || p.cnpj.includes(q) || p.address.toLowerCase().includes(q));
  }, [search, visiblePartners]);

  const potentialColors = { alto: 'text-success', médio: 'text-warning', baixo: 'text-muted-foreground' };

  if (!canRead('partners.list')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (selectedId) {
    return <PartnerDetailView partnerId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <PageTransition className="space-y-6">
      <SmartInsights page="parceiros" />
      <div>
        <h1 className="text-2xl font-bold">Parceiros</h1>
        <p className="text-muted-foreground text-sm">
          {profile === 'nao_gestor' ? 'Seus parceiros vinculados' : 'Gerencie lojas e parceiros'}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CNPJ ou endereço..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const responsible = getUserById(p.responsibleUserId);
          return (
            <Card
              key={p.id}
              className={cn('card-hover', canRead('partners.details') && 'cursor-pointer')}
              onClick={() => canRead('partners.details') && setSelectedId(p.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.cnpj}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] capitalize', potentialColors[p.potential])}>
                    {p.potential}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {p.structures.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> {responsible?.name}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum parceiro encontrado</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
