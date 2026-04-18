import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusBgClasses, getUserById } from "@/data/mock-data";
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
    <div className="space-y-3">
      {days.map((day, i) => {
        const dayVisits = getVisitsForDay(day);
        return (
          <Card key={i}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                    isSameDay(day, today) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="capitalize font-semibold">
                  {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4 pt-0 space-y-2">
              {dayVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum compromisso agendado</p>
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
                        "relative flex items-stretch gap-3 pl-3 pr-3 py-2.5 rounded-lg",
                        "bg-card border border-border/70 hover:border-primary/40 hover:shadow-sm",
                        "transition-all cursor-pointer overflow-hidden",
                      )}
                    >
                      {/* Barra lateral de tipo: Visita=info / Prospecção=warning */}
                      <span
                        aria-hidden
                        className={cn("absolute left-0 top-0 bottom-0 w-1", brand.bg)}
                      />

                      {/* Coluna 1: Horário em destaque */}
                      <div className="flex flex-col items-center justify-center min-w-[52px] shrink-0 pl-1 pr-1 border-r border-border/50">
                        {v.time ? (
                          <span className="text-base font-mono font-semibold text-foreground tabular-nums leading-none">
                            {v.time}
                          </span>
                        ) : (
                          <span className="flex flex-col items-center gap-0.5 text-muted-foreground">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span className="text-[9px] uppercase tracking-wide">s/ hora</span>
                          </span>
                        )}
                      </div>

                      {/* Coluna 2: Conteúdo principal */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {/* Linha topo: tipo + status (compactos e discretos) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] h-5 px-1.5 gap-1 font-medium", brand.badge)}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {brand.label}
                          </Badge>
                          <span
                            aria-label={v.status}
                            title={v.status}
                            className={cn("h-2 w-2 rounded-full shrink-0", statusDotClasses[v.status])}
                          />
                          <span className="text-[11px] font-medium text-muted-foreground">{v.status}</span>
                        </div>

                        {/* Nome do parceiro/prospect: hierarquia principal */}
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                          {partner?.name || v.prospectPartner || "Sem nome"}
                        </p>

                        {/* Metadados secundários (responsável + contexto) */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          {vUser && <span className="truncate max-w-[160px]">{vUser.name}</span>}
                          {(isFirstVisit || daysAgo !== null) && <span aria-hidden>•</span>}
                          {isFirstVisit ? (
                            <span className="text-[11px]">Primeira visita</span>
                          ) : daysAgo !== null ? (
                            <span className="text-[11px]">Última visita há {daysAgo}d</span>
                          ) : null}
                        </div>

                        {/* Indicadores secundários: só aparecem quando relevantes */}
                        {(hasActiveRegistration(v.partnerId) ||
                          (v.status === "Concluída" && !v.summary?.trim()) ||
                          pendingTasks > 0) && (
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {hasActiveRegistration(v.partnerId) && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 gap-0.5 bg-info/10 text-info border-info/20"
                              >
                                <FileText className="h-2.5 w-2.5" />Cadastro
                              </Badge>
                            )}
                            {v.status === "Concluída" && !v.summary?.trim() && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 gap-0.5 bg-muted/50 text-muted-foreground border-border/40"
                              >
                                <FileText className="h-2.5 w-2.5" /> Sem resumo
                              </Badge>
                            )}
                            {pendingTasks > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 gap-0.5 bg-warning/10 text-warning border-warning/20"
                              >
                                <ListTodo className="h-2.5 w-2.5" /> {pendingTasks} tarefa{pendingTasks > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coluna 3: Participantes (oculto em mobile estreito) */}
                      <div className="hidden sm:flex items-center shrink-0">
                        <VisitParticipants
                          participants={getParticipants(v)}
                          variant="full"
                          maxVisible={4}
                          rankingLeaderId={rankingLeaderId}
                        />
                      </div>

                      {/* Coluna 4: Valor potencial (alinhado à direita) */}
                      {v.potentialValue && v.potentialValue > 0 && (
                        <div className="hidden md:flex flex-col items-end justify-center shrink-0 min-w-[80px]">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Potencial</span>
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
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
