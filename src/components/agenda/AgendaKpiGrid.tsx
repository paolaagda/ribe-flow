import AnimatedKpiCard from "@/components/shared/AnimatedKpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle, ListTodo, Plus, Handshake, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TodayAgenda from "@/components/home/TodayAgenda";
import VisitMap from "@/components/home/VisitMap";
import InlineTasksPanel from "@/components/agenda/InlineTasksPanel";
import type { Visit } from "@/data/mock-data";

interface AgendaKpiGridProps {
  todayIndicators: { total: number; concluidas: number };
  indicators: {
    visitasCriadas: number;
    visitasConcluidas: number;
    prospecoesCriadas: number;
    prospecoesConcluidas: number;
    totalAgendas: number;
    totalConcluidas: number;
  };
  pendingTasks: { task: { createdAt: string } }[];
  completedTasks: unknown[];
  canCreate: boolean;
  showTodayPanel: boolean;
  showTasksPanel: boolean;
  togglePanel: (panel: "today" | "tasks") => void;
  todayVisits: Visit[];
  onCreateClick: () => void;
  onOpenVisit: (visitId: string) => void;
}

export default function AgendaKpiGrid({
  todayIndicators,
  indicators,
  pendingTasks,
  completedTasks,
  canCreate,
  showTodayPanel,
  showTasksPanel,
  togglePanel,
  todayVisits,
  onCreateClick,
  onOpenVisit,
}: AgendaKpiGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-ds-sm">
        <AnimatedKpiCard
          icon={CalendarDays}
          label="Agenda do dia"
          value={todayIndicators.concluidas}
          secondaryValue={todayIndicators.total}
          color="text-info"
          delay={0.1}
          onClick={() => togglePanel("today")}
          active={showTodayPanel}
        />
        <AnimatedKpiCard
          icon={ListTodo}
          label="Tarefas"
          value={completedTasks.length}
          secondaryValue={pendingTasks.length + completedTasks.length}
          color="text-warning"
          delay={0.15}
          onClick={() => togglePanel("tasks")}
          active={showTasksPanel}
          pulse={pendingTasks.some((t) => {
            const days = Math.floor((Date.now() - new Date(t.task.createdAt).getTime()) / 86400000);
            return days >= 10;
          })}
        />
        <AnimatedKpiCard
          icon={CheckCircle}
          label="Compromissos"
          value={indicators.totalConcluidas}
          secondaryValue={indicators.totalAgendas}
          color="text-success"
          delay={0.2}
        />
        <AnimatedKpiCard
          icon={Handshake}
          label="Visitas"
          value={indicators.visitasConcluidas}
          secondaryValue={indicators.visitasCriadas}
          color="text-info"
          delay={0.25}
        />
        <AnimatedKpiCard
          icon={UserPlus}
          label="Prospecções"
          value={indicators.prospecoesConcluidas}
          secondaryValue={indicators.prospecoesCriadas}
          color="text-warning"
          delay={0.3}
        />
        {canCreate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer h-full border-dashed border-2 border-primary/20 hover:border-primary/40"
              onClick={onCreateClick}
            >
              <CardContent className="p-ds-sm flex items-center gap-ds-sm h-full">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-ds-sm font-semibold text-primary">Novo</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showTodayPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm pt-ds-xs">
              <TodayAgenda viewMode="personal" todayVisits={todayVisits} />
              <VisitMap viewMode="personal" todayVisits={todayVisits} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTasksPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-ds-xs">
              <InlineTasksPanel onOpenVisit={onOpenVisit} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
