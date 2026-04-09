import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import PageHeader from '@/components/shared/PageHeader';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, FileText, Clock, CheckCircle2, AlertCircle, PauseCircle, XCircle, PenLine, ShieldAlert, Filter, Users, Building2, ChevronDown, CalendarIcon, X, LayoutGrid, Table as TableIcon, ArrowUpDown, ArrowUp, ArrowDown, FileCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useRegistrationOperationalData } from '@/hooks/useRegistrationOperationalData';
import { useSystemData } from '@/hooks/useSystemData';
import { useInfoData } from '@/hooks/useInfoData';
import RegistrationCard from '@/components/cadastro/RegistrationCard';
import RegistrationOperationalSummary from '@/components/cadastro/RegistrationOperationalSummary';
import RegistrationModal from '@/components/cadastro/RegistrationModal';
import { Registration } from '@/data/registrations';
import { mockUsers } from '@/data/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/shared/PaginationControls';

const statusKpiConfig: Record<string, { icon: any; color: string }> = {
  'Não iniciado': { icon: FileText, color: 'text-muted-foreground' },
  'Colhendo documentação': { icon: Clock, color: 'text-info' },
  'Em análise': { icon: AlertCircle, color: 'text-warning' },
  'Colhendo assinaturas': { icon: PenLine, color: 'text-violet-500' },
  'Concluído': { icon: CheckCircle2, color: 'text-success' },
  'Em pausa': { icon: PauseCircle, color: 'text-orange-500' },
  'Cancelado': { icon: XCircle, color: 'text-destructive' },
};

type DateMode = 'none' | 'day' | 'period' | 'weekly' | 'monthly';
type ViewMode = 'cards' | 'table';
type SortField = 'partner' | 'status' | 'date' | 'bank' | 'none';
type SortDir = 'asc' | 'desc';

const statusColorMap: Record<string, string> = {
  'Não iniciado': 'bg-muted text-muted-foreground',
  'Colhendo documentação': 'bg-info/15 text-info border-info/30',
  'Em análise': 'bg-warning/15 text-warning border-warning/30',
  'Colhendo assinaturas': 'bg-violet-500/15 text-violet-500 border-violet-500/30',
  'Concluído': 'bg-success/15 text-success border-success/30',
  'Em pausa': 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  'Cancelado': 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function CadastroPage() {
  const { registrations, updateRegistration, deleteRegistration } = useRegistrations();
  const { getPartnerById } = usePartners();
  const { getActiveItems } = useSystemData();
  const { getActiveBanks } = useInfoData();
  const infoBanks = getActiveBanks();
  const { getAvatar } = useUserAvatars();
  const { canRead, canWrite } = usePermission();
  const { toast } = useToast();
  const { addLog } = useAuditLog();
  const navigate = useNavigate();
  const { getRegData, summaryCards, getSummaryFilter } = useRegistrationOperationalData(registrations);
  const { user } = useAuth();

  // Permission flags
  const canEditReg = canWrite('registration.edit');
  const canChangeStatus = canWrite('registration.changeStatus');
  const canEditObs = canWrite('registration.editObservation');
  const canDelete = canEditReg && (user?.role === 'diretor' || user?.role === 'gerente');

  const [search, setSearch] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterBanks, setFilterBanks] = useState<string[]>([]);
  const [filterCommercial, setFilterCommercial] = useState('all');
  const [filterSolicitation, setFilterSolicitation] = useState('all');
  const [filterHandlers, setFilterHandlers] = useState<string[]>([]);
  const [filterDateMode, setFilterDateMode] = useState<DateMode>('none');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [filterCriticality, setFilterCriticality] = useState<'all' | 'alta' | 'média' | 'baixa'>('all');
  const [activeSummaryCard, setActiveSummaryCard] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [kpiTab, setKpiTab] = useState('status');

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('ribercred_cadastro_view', 'cards');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

  const cadastroListRef = useRef<HTMLDivElement>(null);
  const statuses = getActiveItems('registrationStatuses');
  const banks = infoBanks.map(b => b.name);
  const solicitations = getActiveItems('registrationSolicitations');
  const handlers = getActiveItems('registrationHandlers');
  const commercialUsers = mockUsers.filter(u => u.role === 'comercial' && u.active);

  // Count active filters (excluding search)
  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const activeFilterCount = [
    filterStatuses.length > 0,
    filterBanks.length > 0,
    filterCommercial !== 'all',
    filterSolicitation !== 'all',
    filterHandlers.length > 0,
    filterDateMode !== 'none',
    filterCriticality !== 'all',
  ].filter(Boolean).length;

  const getLastUpdateDate = (reg: Registration): string => {
    if (reg.updates.length > 0) return reg.updates[reg.updates.length - 1].date;
    return reg.requestedAt;
  };

  const isDateInRange = (dateStr: string): boolean => {
    if (filterDateMode === 'none') return true;
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    if (filterDateMode === 'day' && filterDateFrom) return format(date, 'yyyy-MM-dd') === format(filterDateFrom, 'yyyy-MM-dd');
    if (filterDateMode === 'period' && filterDateFrom && filterDateTo) return isWithinInterval(date, { start: startOfDay(filterDateFrom), end: endOfDay(filterDateTo) });
    if (filterDateMode === 'weekly') { const ws = startOfWeek(now, { weekStartsOn: 1 }); const we = endOfWeek(now, { weekStartsOn: 1 }); return isWithinInterval(date, { start: ws, end: we }); }
    if (filterDateMode === 'monthly') return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
    return true;
  };

  // Base filter: everything except status/handler/bank card filters
  const baseFiltered = useMemo(() => {
    return registrations.filter(r => {
      if (filterCommercial !== 'all' && r.commercialUserId !== filterCommercial) return false;
      if (filterSolicitation !== 'all' && r.solicitation !== filterSolicitation) return false;
      if (!isDateInRange(getLastUpdateDate(r))) return false;
      if (filterCriticality !== 'all' && getRegData(r).criticality !== filterCriticality) return false;
      if (search) {
        const q = search.toLowerCase();
        const partnerName = getPartnerById(r.partnerId)?.name?.toLowerCase() || '';
        const matchesSearch = r.observation.toLowerCase().includes(q) ||
          r.bank.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.handlingWith.toLowerCase().includes(q) ||
          partnerName.includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [registrations, filterCommercial, filterSolicitation, filterDateMode, filterDateFrom, filterDateTo, filterCriticality, search, getRegData]);

  const filtered = useMemo(() => {
    return baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      if (activeSummaryCard) {
        const predicate = getSummaryFilter(activeSummaryCard);
        if (!predicate(r)) return false;
      }
      return true;
    });
  }, [baseFiltered, filterStatuses, filterBanks, filterHandlers, activeSummaryCard, getSummaryFilter]);

  // Each group counts from base filtered by OTHER card groups only (not its own)
  const statusCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return true;
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterBanks, filterHandlers]);

  const handlerCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      return true;
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.handlingWith] = (counts[r.handlingWith] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterStatuses, filterBanks]);

  const bankCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return true;
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.bank] = (counts[r.bank] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterStatuses, filterHandlers]);

  // Percentage base: non-completed registrations in the relevant subset
  const statusPctBase = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return r.status !== 'Concluído';
    });
    return subset.length;
  }, [baseFiltered, filterBanks, filterHandlers]);

  const handlerPctBase = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      return r.status !== 'Concluído';
    });
    return subset.length;
  }, [baseFiltered, filterStatuses, filterBanks]);

  const bankPctBase = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return r.status !== 'Concluído';
    });
    return subset.length;
  }, [baseFiltered, filterStatuses, filterHandlers]);

  // Non-completed counts for percentages
  const statusNonCompletedCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return r.status !== 'Concluído';
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterBanks, filterHandlers]);

  const handlerNonCompletedCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterBanks.length > 0 && !filterBanks.includes(r.bank)) return false;
      return r.status !== 'Concluído';
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.handlingWith] = (counts[r.handlingWith] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterStatuses, filterBanks]);

  const bankNonCompletedCounts = useMemo(() => {
    const subset = baseFiltered.filter(r => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(r.status)) return false;
      if (filterHandlers.length > 0 && !filterHandlers.includes(r.handlingWith)) return false;
      return r.status !== 'Concluído';
    });
    const counts: Record<string, number> = {};
    subset.forEach(r => { counts[r.bank] = (counts[r.bank] || 0) + 1; });
    return counts;
  }, [baseFiltered, filterStatuses, filterHandlers]);

  const sorted = useMemo(() => {
    if (sortField === 'none') return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'partner') cmp = a.partnerId.localeCompare(b.partnerId);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'bank') cmp = a.bank.localeCompare(b.bank);
      else if (sortField === 'date') cmp = getLastUpdateDate(a).localeCompare(getLastUpdateDate(b));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const cadastroPagination = usePagination(sorted, { pageSize: viewMode === "cards" ? 12 : 15, scrollToTopRef: cadastroListRef as React.RefObject<HTMLElement> });

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const startEditing = useCallback((id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    updateRegistration(id, { [field]: editValue });
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateRegistration]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const getPartnerName = useCallback((reg: Registration) => {
    const partner = getPartnerById(reg.partnerId);
    return partner?.name || reg.partnerId;
  }, [getPartnerById]);

  const getCommercialName = useCallback((userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || userId;
  }, []);

  const getLastUpdater = useCallback((reg: Registration) => {
    if (reg.updates.length === 0) return '';
    const lastUpdate = reg.updates[reg.updates.length - 1];
    return mockUsers.find(u => u.id === lastUpdate.userId)?.name || lastUpdate.userId;
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const handleCardClick = (reg: Registration) => navigate(`/cadastro/${reg.id}`);
  const handleNew = () => { setSelectedReg(null); setModalOpen(true); };
  const handleEdit = (reg: Registration) => { setSelectedReg(reg); setModalOpen(true); };

  const handleTogglePause = (reg: Registration) => {
    const newStatus = reg.status === 'Em pausa' ? 'Não iniciado' : 'Em pausa';
    updateRegistration(reg.id, { status: newStatus });
    addLog({ module: 'Cadastro', action: 'status_change', entityId: reg.id, entityLabel: `Cadastro - ${reg.bank}`, field: 'Status', oldValue: reg.status, newValue: newStatus, description: `Alterou status de "${reg.status}" para "${newStatus}"` });
    toast({ title: newStatus === 'Em pausa' ? 'Cadastro pausado' : 'Cadastro reativado' });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteRegistration(deleteTarget.id);
      addLog({ module: 'Cadastro', action: 'delete', entityId: deleteTarget.id, entityLabel: `Cadastro - ${deleteTarget.bank}`, description: `Excluiu cadastro do banco ${deleteTarget.bank}` });
      toast({ title: 'Cadastro excluído' });
      setDeleteTarget(null);
    }
  };

  const clearFilters = () => {
    setFilterStatuses([]);
    setFilterBanks([]);
    setFilterCommercial('all');
    setFilterSolicitation('all');
    setFilterHandlers([]);
    setFilterDateMode('none');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setFilterCriticality('all');
  };

  const handleDateModeSelect = (mode: DateMode) => {
    setFilterDateMode(mode);
    if (mode === 'none') { setFilterDateFrom(undefined); setFilterDateTo(undefined); }
    if (mode === 'weekly' || mode === 'monthly') { setFilterDateFrom(undefined); setFilterDateTo(undefined); }
  };

  if (!canRead('registration.view')) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-md">Você não tem permissão para acessar esta página.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-ds-lg">
        <PageHeader title="Cadastro" description="Gerencie o credenciamento de parceiros com bancos.">
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-none h-8 px-2.5"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none h-8 px-2.5"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-primary-foreground text-primary text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {canWrite('registration.create') && (
              <Button onClick={handleNew} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Cadastro
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Operational KPIs */}
        <RegistrationOperationalSummary
          cards={summaryCards}
          activeCard={activeSummaryCard}
          onCardClick={(key) => setActiveSummaryCard(prev => prev === key ? null : key)}
        />

        {/* Search always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por parceiro, observação, banco, código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtros avançados</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                      <X className="h-3 w-3" /> Limpar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  <Select value={filterStatuses.length === 0 ? 'all' : filterStatuses[0]} onValueChange={v => setFilterStatuses(v === 'all' ? [] : [v])}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterBanks.length === 0 ? 'all' : filterBanks[0]} onValueChange={v => setFilterBanks(v === 'all' ? [] : [v])}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os bancos</SelectItem>
                      {banks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterCommercial} onValueChange={setFilterCommercial}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os comerciais</SelectItem>
                      {commercialUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterSolicitation} onValueChange={setFilterSolicitation}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Solicitação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as solicitações</SelectItem>
                      {solicitations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterHandlers.length === 0 ? 'all' : filterHandlers[0]} onValueChange={v => setFilterHandlers(v === 'all' ? [] : [v])}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tratando com" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {handlers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterCriticality} onValueChange={v => setFilterCriticality(v as any)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Criticidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as criticidades</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date filter */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-9 justify-start text-left font-normal gap-2", filterDateMode === 'none' && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4" />
                        {filterDateMode === 'none' && 'Data de atualização'}
                        {filterDateMode === 'day' && filterDateFrom && format(filterDateFrom, 'dd/MM/yyyy')}
                        {filterDateMode === 'period' && filterDateFrom && filterDateTo && `${format(filterDateFrom, 'dd/MM')} — ${format(filterDateTo, 'dd/MM')}`}
                        {filterDateMode === 'period' && filterDateFrom && !filterDateTo && `A partir de ${format(filterDateFrom, 'dd/MM')}`}
                        {filterDateMode === 'weekly' && 'Esta semana'}
                        {filterDateMode === 'monthly' && 'Este mês'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { mode: 'none' as DateMode, label: 'Todas' },
                            { mode: 'day' as DateMode, label: 'Dia' },
                            { mode: 'period' as DateMode, label: 'Período' },
                            { mode: 'weekly' as DateMode, label: 'Semanal' },
                            { mode: 'monthly' as DateMode, label: 'Mensal' },
                          ].map(({ mode, label }) => (
                            <Button
                              key={mode}
                              variant={filterDateMode === mode ? 'default' : 'outline'}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleDateModeSelect(mode)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                        {filterDateMode === 'day' && (
                          <Calendar
                            mode="single"
                            selected={filterDateFrom}
                            onSelect={setFilterDateFrom}
                            locale={ptBR}
                            className="p-3 pointer-events-auto"
                          />
                        )}
                        {filterDateMode === 'period' && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">De:</p>
                            <Calendar
                              mode="single"
                              selected={filterDateFrom}
                              onSelect={setFilterDateFrom}
                              locale={ptBR}
                              className="p-3 pointer-events-auto"
                            />
                            <p className="text-xs text-muted-foreground font-medium">Até:</p>
                            <Calendar
                              mode="single"
                              selected={filterDateTo}
                              onSelect={setFilterDateTo}
                              locale={ptBR}
                              className="p-3 pointer-events-auto"
                            />
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status / Tratando Com / Bancos - Tabs */}
        <Tabs value={kpiTab} onValueChange={setKpiTab} className="w-full">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="status" className="gap-1.5">
              <FileCheck className="h-3.5 w-3.5" /> Status
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">{Object.values(statusCounts).reduce((a, b) => a + b, 0)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="handlers" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Tratando Com
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">{Object.values(handlerCounts).reduce((a, b) => a + b, 0)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="banks" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Bancos
              <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">{Object.values(bankCounts).reduce((a, b) => a + b, 0)}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-3">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {[
                { status: 'all', label: 'Total', icon: FileText, color: 'text-primary', count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
                ...Object.entries(statusKpiConfig).map(([status, config]) => ({
                  status, label: status, icon: config.icon, color: config.color, count: statusCounts[status] || 0,
                })),
              ].filter(({ status, count }) => status === 'all' || count > 0).map(({ status, label, icon: Icon, color, count }, i) => {
                const isSelected = status === 'all' ? filterStatuses.length === 0 : filterStatuses.includes(status);
                const pct = status !== 'all' && status !== 'Concluído' && statusPctBase > 0
                  ? Math.round(((statusNonCompletedCounts[status] || 0) / statusPctBase) * 100)
                  : null;
                return (
                  <Tooltip key={status}>
                    <TooltipTrigger asChild>
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                        <Card
                          className={cn(
                            'cursor-pointer overflow-hidden group transition-all duration-200',
                            'hover:shadow-md hover:-translate-y-0.5',
                            isSelected
                              ? 'ring-2 ring-primary border-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]'
                              : 'border-border/50 card-interactive',
                          )}
                          onClick={() => {
                            if (status === 'all') {
                              setFilterStatuses([]);
                            } else {
                              toggleFilter(filterStatuses, status, setFilterStatuses);
                            }
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-1 p-3">
                            <div className={cn('relative transition-transform duration-200 group-hover:scale-110', color)}>
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                              {status === 'Em análise' && count > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                              )}
                            </div>
                            <span className="text-base sm:text-lg font-bold tabular-nums text-foreground leading-none">{count}</span>
                            {pct !== null && (
                              <span className="text-[9px] font-medium text-muted-foreground tabular-nums">{pct}%</span>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-medium">{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="handlers" className="mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Object.keys(handlerCounts).filter(h => (handlerCounts[h] || 0) > 0).map((handler, i) => {
                const count = handlerCounts[handler] || 0;
                const isActive = filterHandlers.includes(handler);
                const pct = handlerPctBase > 0
                  ? Math.round(((handlerNonCompletedCounts[handler] || 0) / handlerPctBase) * 100)
                  : null;
                return (
                  <motion.div key={handler} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                    <Card
                      className={cn(
                        'cursor-pointer overflow-hidden group transition-all duration-200',
                        'hover:shadow-md hover:-translate-y-0.5',
                        isActive
                          ? 'ring-2 ring-primary border-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]'
                          : 'border-border/50 card-interactive',
                      )}
                      onClick={() => toggleFilter(filterHandlers, handler, setFilterHandlers)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3">
                        <Users className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-base sm:text-lg font-bold tabular-nums text-foreground leading-none">{count}</span>
                        {pct !== null && pct > 0 && (
                          <span className="text-[9px] font-medium text-muted-foreground tabular-nums">{pct}%</span>
                        )}
                        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase leading-tight text-center line-clamp-2">{handler}</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="banks" className="mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Object.keys(bankCounts).filter(b => (bankCounts[b] || 0) > 0).map((bank, i) => {
                const count = bankCounts[bank] || 0;
                const isActive = filterBanks.includes(bank);
                const pct = bankPctBase > 0
                  ? Math.round(((bankNonCompletedCounts[bank] || 0) / bankPctBase) * 100)
                  : null;
                return (
                  <motion.div key={bank} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                    <Card
                      className={cn(
                        'cursor-pointer overflow-hidden group transition-all duration-200',
                        'hover:shadow-md hover:-translate-y-0.5',
                        isActive
                          ? 'ring-2 ring-primary border-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]'
                          : 'border-border/50 card-interactive',
                      )}
                      onClick={() => toggleFilter(filterBanks, bank, setFilterBanks)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3">
                        <Building2 className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-base sm:text-lg font-bold tabular-nums text-foreground leading-none">{count}</span>
                        {pct !== null && pct > 0 && (
                          <span className="text-[9px] font-medium text-muted-foreground tabular-nums">{pct}%</span>
                        )}
                        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase leading-tight text-center line-clamp-2">{bank}</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div ref={cadastroListRef} />
        {/* Content - Cards or Table */}
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum cadastro encontrado.</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cadastroPagination.paginatedItems.map(reg => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                operationalData={getRegData(reg)}
                onClick={() => handleCardClick(reg)}
                onEdit={canEditReg ? () => handleEdit(reg) : undefined}
                onChangeStatus={canChangeStatus ? () => handleEdit(reg) : undefined}
                onTogglePause={canChangeStatus ? () => handleTogglePause(reg) : undefined}
                onDelete={canDelete ? () => setDeleteTarget(reg) : undefined}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden border-border/50">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="cursor-pointer select-none whitespace-nowrap min-w-[220px]" onClick={() => toggleSort('partner')}>
                      <span className="flex items-center">Parceiro <SortIcon field="partner" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('status')}>
                      <span className="flex items-center">Status <SortIcon field="status" /></span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Tratando com</TableHead>
                    <TableHead className="min-w-[200px]">Observação</TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap min-w-[200px]" onClick={() => toggleSort('date')}>
                      <span className="flex items-center">Atualização <SortIcon field="date" /></span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">Contrato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cadastroPagination.paginatedItems.map(reg => {
                    const lastUpdate = reg.updates.length > 0 ? reg.updates[reg.updates.length - 1] : null;
                    const lastUpdateUser = lastUpdate ? mockUsers.find(u => u.id === lastUpdate.userId) : null;
                    const isEditing = (field: string) => editingCell?.id === reg.id && editingCell?.field === field;
                    
                    return (
                      <TableRow
                        key={reg.id}
                        className="cursor-pointer group"
                        onClick={() => handleCardClick(reg)}
                      >
                        {/* Parceiro (resumo: nome + CNPJ + banco + solicitação) */}
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <span className="font-semibold text-sm text-foreground block truncate">{getPartnerName(reg)}</span>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] tabular-nums text-muted-foreground">{reg.cnpj}</span>
                              <span className="text-muted-foreground/40">·</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{reg.bank}</Badge>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{reg.solicitation}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell className="whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {isEditing('status') ? (
                            <Select value={editValue} onValueChange={v => { setEditValue(v); updateRegistration(reg.id, { status: v }); setEditingCell(null); }}>
                              <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              className={cn(
                                'text-[10px] font-semibold border',
                                statusColorMap[reg.status] || 'bg-muted',
                                canChangeStatus ? 'cursor-pointer' : 'cursor-default',
                              )}
                              onClick={() => canChangeStatus && startEditing(reg.id, 'status', reg.status)}
                            >
                              {reg.status}
                            </Badge>
                          )}
                        </TableCell>
                        
                        {/* Tratando com */}
                        <TableCell className="whitespace-nowrap text-xs" onClick={e => e.stopPropagation()}>
                          {isEditing('handlingWith') ? (
                            <Select value={editValue} onValueChange={v => { setEditValue(v); updateRegistration(reg.id, { handlingWith: v }); setEditingCell(null); }}>
                              <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{handlers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={cn(
                                'transition-colors',
                                canEditReg ? 'cursor-pointer hover:text-primary' : 'cursor-default',
                              )}
                              onClick={() => canEditReg && startEditing(reg.id, 'handlingWith', reg.handlingWith)}
                            >
                              {reg.handlingWith}
                            </span>
                          )}
                        </TableCell>
                        
                        {/* Observação */}
                        <TableCell className="max-w-[300px]" onClick={e => e.stopPropagation()}>
                          {isEditing('observation') ? (
                            <Input
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                              className="h-7 text-xs"
                            />
                          ) : (
                            <p
                              className={cn(
                                'text-xs text-muted-foreground line-clamp-2',
                                canEditObs ? 'cursor-pointer hover:text-foreground transition-colors' : 'cursor-default',
                              )}
                              onClick={() => canEditObs && startEditing(reg.id, 'observation', reg.observation)}
                            >
                              {reg.observation || '—'}
                            </p>
                          )}
                        </TableCell>
                        
                        {/* Atualização (avatar + nome + data + hora) */}
                        <TableCell className="text-xs text-muted-foreground min-w-[200px]">
                          {lastUpdate && lastUpdateUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5 shrink-0">
                                {getAvatar(lastUpdate.userId) && <AvatarImage src={getAvatar(lastUpdate.userId)} />}
                                <AvatarFallback className="text-[7px] bg-muted">
                                  {lastUpdateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate tabular-nums">
                                {lastUpdateUser.name.split(' ')[0]} · {format(new Date(lastUpdate.date), 'dd/MM/yyyy', { locale: ptBR })}{lastUpdate.time ? ` · ${lastUpdate.time}` : ''}
                              </span>
                            </div>
                          ) : '—'}
                        </TableCell>

                        {/* Contrato */}
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={reg.contractConfirmed ?? false}
                            onCheckedChange={canEditReg ? (checked) => updateRegistration(reg.id, { contractConfirmed: !!checked }) : undefined}
                            disabled={!canEditReg}
                            className="mx-auto"
                          />
                        </TableCell>
                        
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {cadastroPagination.showPagination && (
          <PaginationControls
            currentPage={cadastroPagination.currentPage}
            totalPages={cadastroPagination.totalPages}
            totalItems={cadastroPagination.totalItems}
            onPageChange={cadastroPagination.goToPage}
          />
        )}

        <RegistrationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          registration={selectedReg}
          canEdit={canWrite('registration.edit')}
          canChangeStatus={canWrite('registration.changeStatus')}
          canEditObservation={canWrite('registration.editObservation')}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cadastro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
