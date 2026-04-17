import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ViewMode = "day" | "week" | "month";

interface AgendaFiltersBarProps {
  view: ViewMode;
  currentDate: Date;
  navigateCalendar: (dir: "prev" | "next") => void;
  setCurrentDate: (d: Date) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
}

export default function AgendaFiltersBar({
  view, currentDate, navigateCalendar, setCurrentDate,
  filterStatus, setFilterStatus, filterType, setFilterType,
  showFilters, setShowFilters,
}: AgendaFiltersBarProps) {
  const hasActiveFilters = filterStatus !== "all" || filterType !== "all";

  const rangeLabel =
    view === "day"
      ? format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
      : view === "week"
        ? `${format(startOfWeek(currentDate, { locale: ptBR }), "dd/MM")} — ${format(endOfWeek(currentDate, { locale: ptBR }), "dd/MM/yyyy")}`
        : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-ds-xl font-bold shrink-0">Agenda</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateCalendar("prev")}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-ds-xs font-medium min-w-[140px] text-center capitalize">
              {rangeLabel}
            </span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateCalendar("next")}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant={showFilters ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5 relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-wrap py-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="Planejada">Planejada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Reagendada">Reagendada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                  <SelectItem value="Inconclusa">Inconclusa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tipos</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                  <SelectItem value="prospecção">Prospecção</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => { setFilterStatus("all"); setFilterType("all"); }}
                >
                  <X className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
