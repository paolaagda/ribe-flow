import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Filter, CalendarRange, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type ViewMode = "day" | "week" | "month";

interface AgendaFiltersBarProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  currentDate: Date;
  navigateCalendar: (dir: "prev" | "next") => void;
  setCurrentDate: (d: Date) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
  dateRange: { from?: Date; to?: Date };
  setDateRange: (r: { from?: Date; to?: Date }) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
}

export default function AgendaFiltersBar({
  view, setView, currentDate, navigateCalendar, setCurrentDate,
  filterStatus, setFilterStatus, filterType, setFilterType,
  dateRange, setDateRange, showFilters, setShowFilters,
}: AgendaFiltersBarProps) {
  const hasActiveFilters = filterStatus !== "all" || filterType !== "all" || !!dateRange.from || !!dateRange.to;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-ds-xl font-bold shrink-0">Agenda</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateCalendar("prev")}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-ds-xs font-medium min-w-[100px] text-center capitalize">
              {view === "day"
                ? format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                : view === "week"
                  ? `${format(startOfWeek(currentDate, { locale: ptBR }), "dd/MM")} — ${format(endOfWeek(currentDate, { locale: ptBR }), "dd/MM/yyyy")}`
                  : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
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
              <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
                <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                </SelectContent>
              </Select>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 text-xs gap-1", hasActiveFilters && "border-primary text-primary")}
                  >
                    <CalendarRange className="h-3 w-3" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "dd/MM")} — ${format(dateRange.to, "dd/MM")}`
                      : dateRange.from
                        ? `A partir de ${format(dateRange.from, "dd/MM")}`
                        : "Período"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Data inicial</p>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(d) => setDateRange({ ...dateRange, from: d || undefined })}
                        className="p-2 pointer-events-auto"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Data final</p>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(d) => setDateRange({ ...dateRange, to: d || undefined })}
                        disabled={(d) => (dateRange.from ? d < dateRange.from : false)}
                        className="p-2 pointer-events-auto"
                      />
                    </div>
                    {(dateRange.from || dateRange.to) && (
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateRange({})}>
                        Limpar período
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => { setFilterStatus("all"); setFilterType("all"); setDateRange({}); }}
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
