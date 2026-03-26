import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Visit, statusBgClasses, getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { ChevronDown, Filter, ArrowUpDown, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visits: Visit[];
}

export default function PartnerVisitHistory({ visits }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = [...visits];
    if (statusFilter !== 'all') result = result.filter(v => v.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(v => v.type === typeFilter);
    if (dateFrom) result = result.filter(v => v.date >= dateFrom);
    if (dateTo) result = result.filter(v => v.date <= dateTo);
    result.sort((a, b) => sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return result;
  }, [visits, statusFilter, typeFilter, dateFrom, dateTo, sortAsc]);

  if (visits.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Histórico de Visitas
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{filtered.length} de {visits.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3 w-3" />Filtros:</div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="Planejada">Planejada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
              <SelectItem value="Reagendada">Reagendada</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="prospecção">Prospecção</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px] h-8 text-xs" placeholder="De" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px] h-8 text-xs" placeholder="Até" />
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSortAsc(!sortAsc)}>
            <ArrowUpDown className="h-3 w-3" /> {sortAsc ? 'Mais antiga' : 'Mais recente'}
          </Button>
        </div>

        {/* List */}
        <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
          <AnimatePresence>
            {filtered.map(v => (
              <VisitItem key={v.id} visit={v} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma visita encontrada com os filtros selecionados</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VisitItem({ visit }: { visit: Visit }) {
  const user = getUserById(visit.userId);
  const hasDetails = visit.observations || visit.summary || visit.rescheduleReason || visit.cancelReason;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Collapsible>
        <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-[10px]', statusBgClasses[visit.status])}>{visit.status}</Badge>
                <span className="text-xs text-muted-foreground">{visit.date} • {visit.time}</span>
                <Badge variant="secondary" className="text-[10px] capitalize">{visit.type}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{visit.medio}</Badge>
              </div>
              {hasDetails && <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 transition-transform [[data-state=open]>&]:rotate-180" />}
            </div>
            <p className="text-sm mt-1">{user?.name} — {visit.medio}</p>
          </CollapsibleTrigger>
          {hasDetails && (
            <CollapsibleContent>
              <div className="mt-2 pt-2 border-t space-y-1">
                {visit.status === 'Reagendada' && visit.rescheduleReason && (
                  <p className="text-xs text-warning font-medium">Motivo do reagendamento: {visit.rescheduleReason}</p>
                )}
                {visit.status === 'Cancelada' && visit.cancelReason && (
                  <p className="text-xs text-destructive font-medium">Motivo do cancelamento: {visit.cancelReason}</p>
                )}
                {visit.summary && <p className="text-xs text-foreground">{visit.summary}</p>}
                {visit.observations && <p className="text-xs text-muted-foreground">{visit.observations}</p>}
                {visit.banks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {visit.banks.map(b => <Badge key={b} variant="outline" className="text-[9px]">{b}</Badge>)}
                  </div>
                )}
                {visit.products.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {visit.products.map(p => <Badge key={p} variant="secondary" className="text-[9px]">{p}</Badge>)}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </motion.div>
  );
}
