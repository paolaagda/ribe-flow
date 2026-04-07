import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Building2, Store as StoreIcon } from 'lucide-react';
import { Criticality } from '@/hooks/usePartnerOperationalData';
import { getUserById, mockUsers } from '@/data/mock-data';

export interface PartnerFilters {
  search: string;
  criticality: Criticality | 'all';
  responsibleUserId: string;
  hasPendingDocs: boolean;
  hasOpenTasks: boolean;
  hasActiveRegistration: boolean;
}

interface Props {
  filters: PartnerFilters;
  onFiltersChange: (filters: PartnerFilters) => void;
  viewMode: 'parceiros' | 'lojas';
  onViewModeChange: (mode: 'parceiros' | 'lojas') => void;
}

const criticalityLabels: Record<string, string> = {
  all: 'Todas',
  alta: 'Alta',
  média: 'Média',
  baixa: 'Baixa',
};

export const defaultFilters: PartnerFilters = {
  search: '',
  criticality: 'all',
  responsibleUserId: 'all',
  hasPendingDocs: false,
  hasOpenTasks: false,
  hasActiveRegistration: false,
};

export default function PartnersFilterBar({ filters, onFiltersChange, viewMode, onViewModeChange }: Props) {
  const commercialUsers = mockUsers.filter(u => u.role === 'comercial' && u.active);
  const hasActiveFilters = filters.criticality !== 'all' || filters.responsibleUserId !== 'all' || filters.hasPendingDocs || filters.hasOpenTasks || filters.hasActiveRegistration;

  const update = (partial: Partial<PartnerFilters>) => onFiltersChange({ ...filters, ...partial });
  const toggleFilter = (key: 'hasPendingDocs' | 'hasOpenTasks' | 'hasActiveRegistration') => update({ [key]: !filters[key] });

  return (
    <div className="space-y-ds-xs">
      <div className="flex items-center gap-ds-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou endereço..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <Button
            variant={viewMode === 'parceiros' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => onViewModeChange('parceiros')}
          >
            <Building2 className="h-3.5 w-3.5" /> Parceiros
          </Button>
          <Button
            variant={viewMode === 'lojas' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => onViewModeChange('lojas')}
          >
            <StoreIcon className="h-3.5 w-3.5" /> Lojas
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filters.criticality} onValueChange={v => update({ criticality: v as Criticality | 'all' })}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Criticidade" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(criticalityLabels).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.responsibleUserId} onValueChange={v => update({ responsibleUserId: v })}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            {commercialUsers.map(u => (
              <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge
          variant={filters.hasPendingDocs ? 'default' : 'outline'}
          className="cursor-pointer text-xs h-8 px-3 hover:bg-primary/10 transition-colors"
          onClick={() => toggleFilter('hasPendingDocs')}
        >
          Docs pendentes
        </Badge>
        <Badge
          variant={filters.hasOpenTasks ? 'default' : 'outline'}
          className="cursor-pointer text-xs h-8 px-3 hover:bg-primary/10 transition-colors"
          onClick={() => toggleFilter('hasOpenTasks')}
        >
          Tarefas abertas
        </Badge>
        <Badge
          variant={filters.hasActiveRegistration ? 'default' : 'outline'}
          className="cursor-pointer text-xs h-8 px-3 hover:bg-primary/10 transition-colors"
          onClick={() => toggleFilter('hasActiveRegistration')}
        >
          Cadastro ativo
        </Badge>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={() => onFiltersChange({ ...defaultFilters, search: filters.search })}>
            <X className="h-3 w-3" /> Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
