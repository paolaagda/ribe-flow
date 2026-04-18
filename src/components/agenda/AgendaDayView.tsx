import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUserById } from "@/data/mock-data";
import { Clock as ClockIcon, FileText, ListTodo } from "lucide-react";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
import { statusDotClasses } from "@/lib/agenda-status-dots";
import { formatCentavos } from "@/lib/currency";
import VisitParticipants from "./VisitParticipants";
import type { DayViewProps } from "./AgendaCalendarTypes";

export default function AgendaDayView({
  days, today, getVisitsForDay, getPartnerById, getParticipants,
  handleOpenDetail, lastVisitMap, rankingLeaderId, hasActiveRegistration,
}: DayViewProps) {
  return (
    <div className="space-y-4">
      {days.map((day, i) => {
        const dayVisits = getVisitsForDay(day);
        const isToday = isSameDay(day, today);
        return (
          <Card key={i} className="overflow-hidden border-border/60 shadow-sm">
            {/* Header do dia: maior presença visual */}
            <CardHeader
              className={cn(
                "py-3 px-4 border-b",
                isToday
                  ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20"
                  : "bg-muted/40 border-border/60",
              )}
            >
              <CardTitle className="text-sm flex items-center gap-3">
                <span
                  className={cn(
                    "w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground border border-border/60",
                  )}
                >
                  <span className="text-base font-bold leading-none tabular-nums">{format(day, "d")}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-80 leading-none mt-0.5">
                    {format(day, "MMM", { locale: ptBR })}
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="capitalize font-semibold text-foreground leading-tight">
                    {format(day, "EEEE", { locale: ptBR })}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {dayVisits.length === 0
                      ? "Nenhum compromisso"
                      : `${dayVisits.length} compromisso${dayVisits.length > 1 ? "s" : ""}`}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 py-3 space-y-2">
              {dayVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 py-8 text-center">
                  Nenhum compromisso agendado para este dia
                </p>
              ) : (
                dayVisits.map((v) => {
                  const partner = getPartnerById(v.partnerId);
                  const vUser = getUserById(v.userId);
                  const brand = getAgendaTypeBrand(v.type);
                  const TypeIcon = brand.icon;
                  const pendingTasks = v.comments?.filter(c => c.type === 'task' && !c.taskCompleted).length || 0;
                  const lastConcluded = v.type === 'visita' && partner ? lastVisitMap.get(v.partnerId) : null;
                  const isFirstVisit = v.type === 'visita' && partner && (!lastConcluded || lastConcluded.id === v.id);
                  const daysAgo = lastConcluded && lastConcluded.id !== v.id
                    ? Math.floor((Date.now() - new Date(lastConcluded.date).getTime()) / 86400000)
                    : null;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleOpenDetail(v)}
                      aria-label={`${brand.label} ${v.status}${v.time ? ` às ${v.time}` : ""} — ${partner?.name || v.prospectPartner || ""}`}
                      className={cn(
                        "group relative flex items-stretch gap-3 pl-4 pr-3 py-3 rounded-xl",
                        "bg-card border border-border/60",
                        "hover:border-primary/30 hover:shadow-md hover:-translate-y-px",
                        "transition-all duration-200 cursor-pointer overflow-hidden",
                      )}
                    >
                      {/* Barra lateral espessa com gradiente — distinção forte de tipo */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5",
                          brand.bg,
                          "after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/30 after:to-transparent",
                        )}
                      />
                      {/* Tinta sutil de fundo na lateral esquerda */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-1.5 top-0 bottom-0 w-12 opacity-40 pointer-events-none",
                          "bg-gradient-to-r",
                          brand.colorToken === "info"
                            ? "from-info/10 to-transparent"
                            : "from-warning/10 to-transparent",
                        )}
                      />

                      {/* Coluna 1: Time pill destacado */}
                      <div className="relative z-10 flex flex-col items-center justify-center min-w-[60px] shrink-0">
                        {v.time ? (
                          <div
                            className={cn(
                              "flex flex-col items-center justify-center px-2 py-1.5 rounded-lg",
                              "bg-background border shadow-sm",
                              brand.colorToken === "info" ? "border-info/30" : "border-warning/30",
                            )}
                          >
                            <span className="text-base font-bold text-foreground tabular-nums leading-none">
                              {v.time.split(":")[0]}
                              <span className="text-muted-foreground">:</span>
                              {v.time.split(":")[1]}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5 text-muted-foreground/70">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-[9px] uppercase tracking-wide">s/ hora</span>
                          </div>
                        )}
                      </div>

                      {/* Coluna 2: Conteúdo principal */}
                      <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-1.5">
                        {/* Topo: tipo (com presença) + status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-5 px-2 gap-1 font-semibold uppercase tracking-wide",
                              brand.badge,
                            )}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {brand.label}
                          </Badge>
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-label={v.status}
                              title={v.status}
                              className={cn(
                                "h-2 w-2 rounded-full shrink-0 ring-2 ring-background",
                                statusDotClasses[v.status],
                              )}
                            />
                            <span className="text-[11px] font-medium text-muted-foreground">{v.status}</span>
                          </span>
                        </div>

                        {/* Nome do parceiro: hierarquia principal mais forte */}
                        <p className="text-[15px] font-semibold text-foreground truncate leading-snug group-hover:text-primary transition-colors">
                          {partner?.name || v.prospectPartner || "Sem nome"}
                        </p>

                        {/* Metadados secundários */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          {vUser && <span className="truncate max-w-[160px]">{vUser.name}</span>}
                          {(isFirstVisit || daysAgo !== null) && <span aria-hidden className="opacity-50">•</span>}
                          {isFirstVisit ? (
                            <span className="text-[11px] italic">Primeira visita</span>
                          ) : daysAgo !== null ? (
                            <span className="text-[11px]">Última há {daysAgo}d</span>
                          ) : null}
                        </div>

                        {/* Indicadores secundários */}
                        {(hasActiveRegistration(v.partnerId) ||
                          (v.status === "Concluída" && !v.summary?.trim()) ||
                          pendingTasks > 0) && (
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {hasActiveRegistration(v.partnerId) && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 gap-0.5 bg-info/10 text-info border-info/20"
                              >
                                <FileText className="h-2.5 w-2.5" />Cadastro
                              </Badge>
                            )}
                            {v.status === "Concluída" && !v.summary?.trim() && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 gap-0.5 bg-muted/50 text-muted-foreground border-border/40"
                              >
                                <FileText className="h-2.5 w-2.5" /> Sem resumo
                              </Badge>
                            )}
                            {pendingTasks > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 gap-0.5 bg-warning/10 text-warning border-warning/20"
                              >
                                <ListTodo className="h-2.5 w-2.5" /> {pendingTasks} tarefa{pendingTasks > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coluna 3: Participantes */}
                      <div className="hidden sm:flex items-center shrink-0 relative z-10">
                        <VisitParticipants
                          participants={getParticipants(v)}
                          variant="full"
                          maxVisible={4}
                          rankingLeaderId={rankingLeaderId}
                        />
                      </div>

                      {/* Coluna 4: Valor potencial */}
                      {v.potentialValue && v.potentialValue > 0 && (
                        <div className="hidden md:flex flex-col items-end justify-center shrink-0 min-w-[88px] relative z-10 pl-3 border-l border-border/40">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                            Potencial
                          </span>
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              v.potentialValue >= 1000000 ? "text-warning" : "text-foreground",
                            )}
                          >
                            {formatCentavos(v.potentialValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
