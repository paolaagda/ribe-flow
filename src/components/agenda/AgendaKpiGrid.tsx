import AnimatedKpiCard from "@/components/shared/AnimatedKpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CalendarRange, CalendarClock, Plus, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type ViewMode = "day" | "week" | "month";

interface AgendaKpiGridProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  todayIndicators: { total: number; concluidas: number };
  weekIndicators: { total: number; concluidas: number };
  monthIndicators: { total: number; concluidas: number };
  visitIndicators: { total: number; concluidas: number };
  prospectIndicators: { total: number; concluidas: number };
  filterType: string;
  setFilterType: (t: string) => void;
  canCreate: boolean;
  onCreateClick: () => void;
}

export default function AgendaKpiGrid({
  view,
  setView,
  todayIndicators,
  weekIndicators,
  monthIndicators,
  visitIndicators,
  prospectIndicators,
  filterType,
  setFilterType,
  canCreate,
  onCreateClick,
}: AgendaKpiGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-ds-sm">
      <AnimatedKpiCard
        icon={CalendarDays}
        label="Agenda do dia"
        value={todayIndicators.concluidas}
        secondaryValue={todayIndicators.total}
        color="text-info"
        delay={0.05}
        onClick={() => setView("day")}
        active={view === "day"}
      />
      <AnimatedKpiCard
        icon={CalendarRange}
        label="Agenda da semana"
        value={weekIndicators.concluidas}
        secondaryValue={weekIndicators.total}
        color="text-warning"
        delay={0.1}
        onClick={() => setView("week")}
        active={view === "week"}
      />
      <AnimatedKpiCard
        icon={CalendarClock}
        label="Agenda do mês"
        value={monthIndicators.concluidas}
        secondaryValue={monthIndicators.total}
        color="text-success"
        delay={0.15}
        onClick={() => setView("month")}
        active={view === "month"}
      />
      <AnimatedKpiCard
        icon={MapPin}
        label="Visitas"
        value={visitIndicators.concluidas}
        secondaryValue={visitIndicators.total}
        color="text-primary"
        delay={0.2}
        onClick={() => setFilterType(filterType === "visita" ? "all" : "visita")}
        active={filterType === "visita"}
      />
      <AnimatedKpiCard
        icon={Sparkles}
        label="Prospecções"
        value={prospectIndicators.concluidas}
        secondaryValue={prospectIndicators.total}
        color="text-accent-foreground"
        delay={0.25}
        onClick={() => setFilterType(filterType === "prospecção" ? "all" : "prospecção")}
        active={filterType === "prospecção"}
      />
      {canCreate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer h-full border-dashed border-2 border-primary/20 hover:border-primary/40"
            onClick={onCreateClick}
          >
            <CardContent className="p-ds-sm flex flex-col items-center justify-center gap-1.5 h-full text-center">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <p className="text-ds-sm font-semibold text-primary">Novo</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
