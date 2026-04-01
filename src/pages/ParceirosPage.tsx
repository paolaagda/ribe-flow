import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getUserById } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useStores } from '@/hooks/useStores';
import { useVisits } from '@/hooks/useVisits';
import { Search, Building2, MapPin, ShieldOff, User, Store as StoreIcon, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import PartnerDetailView from '@/components/partners/PartnerDetailView';
import SmartInsights from '@/components/shared/SmartInsights';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO } from 'date-fns';
import AnimatedFilterContent from '@/components/shared/AnimatedFilterContent';
import PageHeader from '@/components/shared/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/shared/PaginationControls';

export default function ParceirosPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'parceiros' | 'lojas'>('parceiros');
  const { canRead } = usePermission();
  const { user, profile } = useAuth();
  const { partners } = usePartners();
  const { stores } = useStores();
  const { visits } = useVisits();

  // Filter partners by role: comercial only sees their own partners
  const visiblePartners = useMemo(() => {
    if (profile === 'nao_gestor' && user) {
      return partners.filter(p => p.responsibleUserId === user.id);
    }
    return partners;
  }, [profile, user, partners]);

  const visibleStores = useMemo(() => {
    const visiblePartnerIds = new Set(visiblePartners.map(p => p.id));
    return stores.filter(s => visiblePartnerIds.has(s.partnerId));
  }, [stores, visiblePartners]);

  const filtered = useMemo(() => {
    const today = new Date();
    let base = visiblePartners;

    // Apply insight filter
    if (activeInsight === 'parc_alto_potencial') {
      base = base.filter(p => p.potential === 'alto');
    } else if (activeInsight === 'parc_sem_visita_30d') {
      const last30ConcludedPartnerIds = new Set(
        visits.filter(v => {
          const d = parseISO(v.date);
          return v.status === 'Concluída' && differenceInDays(today, d) >= 0 && differenceInDays(today, d) <= 30;
        }).map(v => v.partnerId)
      );
      base = base.filter(p => !last30ConcludedPartnerIds.has(p.id));
    }

    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(p => p.name.toLowerCase().includes(q) || p.cnpj.includes(q) || p.address.toLowerCase().includes(q));
  }, [search, visiblePartners, activeInsight, visits]);

  const filteredStores = useMemo(() => {
    const filteredPartnerIds = new Set(filtered.map(p => p.id));
    let base = visibleStores;
    if (activeInsight) {
      base = base.filter(s => filteredPartnerIds.has(s.partnerId));
    }
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      partners.find(p => p.id === s.partnerId)?.name.toLowerCase().includes(q)
    );
  }, [search, visibleStores, partners, activeInsight, filtered]);

  const potentialBadgeClass: Record<string, string> = { alto: 'badge-potential-alto', médio: 'badge-potential-medio', baixo: 'badge-potential-baixo' };

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
    <PageTransition className="space-y-ds-lg">
      <PageHeader
        title="Parceiros"
        description={profile === 'nao_gestor' ? 'Seus parceiros vinculados' : 'Gerencie lojas e parceiros'}
      />

      <SmartInsights page="parceiros" activeFilter={activeInsight} onFilterClick={setActiveInsight} />

      <div className="flex items-center gap-ds-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ ou endereço..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <Button
            variant={viewMode === 'parceiros' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode('parceiros')}
          >
            <Building2 className="h-3.5 w-3.5" /> Parceiros
          </Button>
          <Button
            variant={viewMode === 'lojas' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode('lojas')}
          >
            <StoreIcon className="h-3.5 w-3.5" /> Lojas
          </Button>
        </div>
      </div>

      <AnimatedFilterContent filterKey={activeInsight}>
      {viewMode === 'parceiros' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-ds-sm">
          {filtered.map(p => {
            const responsible = getUserById(p.responsibleUserId);
            return (
              <Card
                key={p.id}
                className={cn(
                  canRead('partners.details') ? 'card-interactive cursor-pointer' : 'card-flat',
                  'group overflow-hidden relative'
                )}
                onClick={() => canRead('partners.details') && setSelectedId(p.id)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gradient-primary" />
                <CardContent className="p-ds-sm space-y-0 divide-y divide-border/40 relative min-w-0">
                  <div className="flex items-start justify-between gap-2 pb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="icon-container-sm icon-container-primary transition-transform duration-300 group-hover:scale-105 shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ds-sm font-semibold truncate">{p.name}</p>
                        <p className="text-ds-xs text-muted-foreground truncate">{p.cnpj}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-ds-xs capitalize shrink-0', potentialBadgeClass[p.potential])}>
                      {p.potential}
                    </Badge>
                  </div>
                  <div className="py-2.5 space-y-2">
                    <p className="text-ds-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{p.address}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.structures.map(s => <Badge key={s} variant="secondary" className="text-ds-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="pt-2.5">
                    <p className="text-ds-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {responsible?.name}
                    </p>
                  </div>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-ds-sm">
          {filteredStores.map(store => {
            const partner = partners.find(p => p.id === store.partnerId);
            return (
              <Card key={store.id} className="card-flat group overflow-hidden relative hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-0.5">
                <CardContent className="p-ds-sm space-y-3.5">
                  <div className="flex items-center gap-3">
                     <div className="icon-container-sm">
                       <StoreIcon className="h-4 w-4 text-muted-foreground" />
                     </div>
                    <div className="min-w-0">
                       <p className="text-ds-sm font-semibold truncate">{store.name}</p>
                       <p className="text-ds-xs text-muted-foreground">Centro de custo</p>
                    </div>
                  </div>
                  <p className="text-ds-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" /> {store.address}
                  </p>
                  <p className="text-ds-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" /> {store.phone} — {store.contact}
                  </p>
                  {partner && (
                    <p className="text-ds-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Parceiro: <span className="font-medium text-foreground">{partner.name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredStores.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <StoreIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma loja encontrada</p>
            </div>
          )}
        </div>
      )}
      </AnimatedFilterContent>

    </PageTransition>
  );
}
