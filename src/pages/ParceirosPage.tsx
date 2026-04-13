import { useState, useMemo, useRef } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserById } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useStores } from '@/hooks/useStores';
import { useVisits } from '@/hooks/useVisits';
import { Building2, MapPin, ShieldOff, Phone, Store as StoreIcon, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import PartnerDetailView from '@/components/partners/PartnerDetailView';
import SmartInsights from '@/components/shared/SmartInsights';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/shared/PaginationControls';
import PartnersOperationalSummary, { SummaryFilterKey } from '@/components/partners/PartnersOperationalSummary';
import PartnersFilterBar, { PartnerFilters, defaultFilters } from '@/components/partners/PartnersFilterBar';
import PartnerListItemCard from '@/components/partners/PartnerListItemCard';
import { usePartnerOperationalData } from '@/hooks/usePartnerOperationalData';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const criticalityLegend = [
  { color: 'bg-destructive', label: 'Alta criticidade' },
  { color: 'bg-warning', label: 'Média criticidade' },
  { color: 'bg-success', label: 'Baixa criticidade' },
];

export default function ParceirosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'parceiros' | 'lojas'>('parceiros');
  const [filters, setFilters] = useState<PartnerFilters>(defaultFilters);
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilterKey | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const { canRead, canWrite } = usePermission();
  const { user } = useAuth();
  const { partners } = usePartners();
  const { stores } = useStores();
  const { visits } = useVisits();
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);

  // Filter partners by role
  const visiblePartners = useMemo(() => {
    if (user && ['comercial', 'cadastro'].includes(user.role)) {
      return partners.filter(p => p.responsibleUserId === user.id);
    }
    return partners;
  }, [user, partners]);

  const { getPartnerData, summary } = usePartnerOperationalData(visiblePartners);

  const visibleStores = useMemo(() => {
    const visiblePartnerIds = new Set(visiblePartners.map(p => p.id));
    return stores.filter(s => visiblePartnerIds.has(s.partnerId));
  }, [stores, visiblePartners]);

  // Toggle summary card filter
  const handleSummaryFilterToggle = (key: SummaryFilterKey) => {
    setSummaryFilter(prev => prev === key ? null : key);
  };

  // Apply smart insight filter first
  const insightFiltered = useMemo(() => {
    const today = new Date();
    let base = visiblePartners;

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
    return base;
  }, [visiblePartners, activeInsight, visits]);

  // Apply operational filters
  const filtered = useMemo(() => {
    let base = insightFiltered;

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      base = base.filter(p => p.name.toLowerCase().includes(q) || p.cnpj.includes(q) || p.address.toLowerCase().includes(q));
    }

    // Criticality
    if (filters.criticality !== 'all') {
      base = base.filter(p => getPartnerData(p.id).criticality === filters.criticality);
    }

    // Responsible
    if (filters.responsibleUserId !== 'all') {
      base = base.filter(p => p.responsibleUserId === filters.responsibleUserId);
    }

    // Toggle filters from filter bar
    if (filters.hasPendingDocs) {
      base = base.filter(p => getPartnerData(p.id).pendingDocsCount > 0);
    }
    if (filters.hasOpenTasks) {
      base = base.filter(p => getPartnerData(p.id).pendingTasksCount > 0);
    }
    if (filters.hasActiveRegistration) {
      base = base.filter(p => getPartnerData(p.id).activeRegistrationsCount > 0);
    }

    // Partner class
    if (filters.partnerClass !== 'all') {
      base = base.filter(p => p.partnerClass === filters.partnerClass);
    }

    // Summary card filters
    if (summaryFilter === 'withPendencies') {
      base = base.filter(p => {
        const d = getPartnerData(p.id);
        return d.criticality === 'alta' || d.criticality === 'média';
      });
    } else if (summaryFilter === 'pendingDocs') {
      base = base.filter(p => getPartnerData(p.id).pendingDocsCount > 0);
    } else if (summaryFilter === 'openTasks') {
      base = base.filter(p => getPartnerData(p.id).pendingTasksCount > 0);
    } else if (summaryFilter === 'activeRegistrations') {
      base = base.filter(p => getPartnerData(p.id).activeRegistrationsCount > 0);
    }

    return base;
  }, [insightFiltered, filters, getPartnerData, summaryFilter]);

  const filteredStores = useMemo(() => {
    const filteredPartnerIds = new Set(filtered.map(p => p.id));
    let base = visibleStores;
    if (activeInsight || filters.criticality !== 'all') {
      base = base.filter(s => filteredPartnerIds.has(s.partnerId));
    }
    if (!filters.search) return base;
    const q = filters.search.toLowerCase();
    return base.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      partners.find(p => p.id === s.partnerId)?.name.toLowerCase().includes(q)
    );
  }, [filters.search, visibleStores, partners, activeInsight, filtered, filters.criticality]);

  const partnersPagination = usePagination(filtered, { pageSize: 9, scrollToTopRef: listRef as React.RefObject<HTMLElement> });
  const storesPagination = usePagination(filteredStores, { pageSize: 9, scrollToTopRef: listRef as React.RefObject<HTMLElement> });

  // Count active filters (for collapsed indicator)
  const hasActiveBarFilters = filters.criticality !== 'all' || filters.responsibleUserId !== 'all' || filters.hasPendingDocs || filters.hasOpenTasks || filters.hasActiveRegistration || filters.partnerClass !== 'all';
  const activeFilterCount = [
    filters.criticality !== 'all',
    filters.responsibleUserId !== 'all',
    filters.hasPendingDocs,
    filters.hasOpenTasks,
    filters.hasActiveRegistration,
    filters.partnerClass !== 'all',
  ].filter(Boolean).length;

  if (!canRead('partners.list')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  // Detail view: Sheet on desktop, Drawer on mobile
  const detailContent = selectedId ? <PartnerDetailView partnerId={selectedId} onBack={() => setSelectedId(null)} /> : null;

  return (
    <PageTransition className="space-y-ds-lg">
      <PageHeader
        title="Parceiros"
        description={user && ['comercial', 'cadastro'].includes(user.role) ? 'Seus parceiros vinculados' : 'Central operacional da base de parceiros'}
      >
        {canWrite('partners.create') && (
          <Button size="sm" className="gap-2">
            <Building2 className="h-4 w-4" /> Novo Parceiro
          </Button>
        )}
      </PageHeader>

      <PartnersOperationalSummary
        summary={summary}
        activeFilter={summaryFilter}
        onFilterToggle={handleSummaryFilterToggle}
      />

      <SmartInsights page="parceiros" activeFilter={activeInsight} onFilterClick={setActiveInsight} scopedPartners={visiblePartners} />

      {/* Collapsible filter bar */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
              <Filter className="h-3.5 w-3.5" />
              {filtersOpen ? 'Recolher filtros' : 'Expandir filtros'}
              {!filtersOpen && hasActiveBarFilters && (
                <Badge variant="default" className="h-4 px-1.5 text-[9px] ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>

          {/* Criticality legend */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {criticalityLegend.map(item => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-default">
                      <span className={cn('w-2.5 h-2.5 rounded-sm shrink-0', item.color)} />
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{item.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <CollapsibleContent className="mt-1">
          <PartnersFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </CollapsibleContent>
      </Collapsible>

      <div ref={listRef} />

      {viewMode === 'parceiros' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-ds-sm">
            {partnersPagination.paginatedItems.map(p => (
              <PartnerListItemCard
                key={p.id}
                partner={p}
                operationalData={getPartnerData(p.id)}
                onClick={() => setSelectedId(p.id)}
                canOpenDetail={canRead('partners.details')}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum parceiro encontrado</p>
              </div>
            )}
          </div>
          {partnersPagination.showPagination && (
            <PaginationControls
              currentPage={partnersPagination.currentPage}
              totalPages={partnersPagination.totalPages}
              totalItems={partnersPagination.totalItems}
              onPageChange={partnersPagination.goToPage}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-ds-sm">
            {storesPagination.paginatedItems.map(store => {
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
          {storesPagination.showPagination && (
            <PaginationControls
              currentPage={storesPagination.currentPage}
              totalPages={storesPagination.totalPages}
              totalItems={storesPagination.totalItems}
              onPageChange={storesPagination.goToPage}
            />
          )}
        </>
      )}

      {/* Detail view: Sheet (desktop) or Drawer (mobile) */}
      {isMobile ? (
        <Drawer open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
          <DrawerContent className="max-h-[92vh] overflow-y-auto p-4">
            {detailContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
          <SheetContent side="right" className="w-[680px] sm:max-w-[680px] overflow-y-auto p-6">
            {detailContent}
          </SheetContent>
        </Sheet>
      )}
    </PageTransition>
  );
}
