import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditModule, AuditAction, actionLabels, actionColors, moduleLabels } from '@/data/audit-log';
import AuditTimeline from '@/components/shared/AuditTimeline';
import { Search, Filter } from 'lucide-react';
import { mockUsers } from '@/data/mock-data';

const allModules: AuditModule[] = ['Agenda', 'Parceiros', 'Campanhas', 'Cadastro', 'Colaboradores', 'Configurações'];
const allActions: AuditAction[] = ['create', 'edit', 'delete', 'status_change', 'permission_change'];

export default function LogsTab() {
  const { logs } = useAuditLog();
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [search, setSearch] = useState('');

  const uniqueUserIds = useMemo(() => {
    const ids = new Set(logs.map(l => l.userId));
    return Array.from(ids);
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterModule !== 'all' && l.module !== filterModule) return false;
      if (filterAction !== 'all' && l.action !== filterAction) return false;
      if (filterUser !== 'all' && l.userId !== filterUser) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.description.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.entityLabel.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, filterModule, filterAction, filterUser, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros</span>
        <Badge variant="secondary" className="text-[10px]">{filtered.length} registros</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {allModules.map(m => (
              <SelectItem key={m} value={m}>{moduleLabels[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {allActions.map(a => (
              <SelectItem key={a} value={a}>{actionLabels[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder="Usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {uniqueUserIds.map(uid => {
              const u = mockUsers.find(mu => mu.id === uid);
              return <SelectItem key={uid} value={uid}>{u?.name || uid}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <AuditTimeline logs={filtered} />
    </div>
  );
}
