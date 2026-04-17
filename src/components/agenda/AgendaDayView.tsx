import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusBgClasses, getUserById } from "@/data/mock-data";
import { Clock as ClockIcon, FileText, ListTodo } from "lucide-react";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
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
                <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs", isSameDay(day, today) ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {format(day, "d")}
                </span>
                <span className="capitalize">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {dayVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma visita agendada</p>
              ) : (
                dayVisits.map((v) => {
                  const partner = getPartnerById(v.partnerId);
                  const vUser = getUserById(v.userId);
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleOpenDetail(v)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className={cn("px-2 py-0.5 rounded text-[10px] font-medium border shrink-0", statusBgClasses[v.status])}>
                        {v.status}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{partner?.name || v.prospectPartner || "Sem nome"}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {(() => { const brand = getAgendaTypeBrand(v.type); const Icon = brand.icon; return (
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 gap-0.5", brand.badge)}>
                              <Icon className="h-2.5 w-2.5" />{brand.label}
                            </Badge>
                          ); })()}
                          {v.time ? <span>{v.time}</span> : <span className="flex items-center gap-0.5"><ClockIcon className="h-3 w-3" /> Sem horário</span>}
                          <span>• {vUser?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {partner && (
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 capitalize",
                              partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                              partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                              'bg-muted/50 text-muted-foreground border-border/30'
                            )}>{partner.potential}</Badge>
                          )}
                          {v.type === 'visita' && partner && (() => {
                            const lastConcluded = lastVisitMap.get(v.partnerId);
                            if (!lastConcluded || lastConcluded.id === v.id) return <span className="text-[10px] text-muted-foreground/70">Primeira visita</span>;
                            const daysAgo = Math.floor((Date.now() - new Date(lastConcluded.date).getTime()) / 86400000);
                            return <span className="text-[10px] text-muted-foreground/70">Última visita: {daysAgo}d atrás</span>;
                          })()}
                          {v.status === 'Concluída' && !v.summary?.trim() && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted/50 text-muted-foreground border-border/30 gap-0.5">
                              <FileText className="h-2 w-2" /> Sem resumo
                            </Badge>
                          )}
                          {(() => {
                            const pendingCount = v.comments?.filter(c => c.type === 'task' && !c.taskCompleted).length || 0;
                            if (pendingCount === 0) return null;
                            return (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-warning/10 text-warning border-warning/20 gap-0.5">
                                <ListTodo className="h-2 w-2" /> {pendingCount} tarefa{pendingCount > 1 ? 's' : ''}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      <VisitParticipants
                        participants={getParticipants(v)}
                        variant="full"
                        maxVisible={4}
                        rankingLeaderId={rankingLeaderId}
                      />
                      <div className="flex items-center gap-1.5">
                        {hasActiveRegistration(v.partnerId) && (
                          <Badge variant="outline" className="text-[9px] bg-info/10 text-info border-info/20 gap-0.5">
                            <FileText className="h-2.5 w-2.5" />Cadastro
                          </Badge>
                        )}
                        {v.potentialValue && (
                          <Badge variant="outline" className={cn("text-[9px]", v.potentialValue >= 1000000 ? "bg-warning/10 text-warning border-warning/20" : "")}>
                            {formatCentavos(v.potentialValue)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] capitalize">{v.medio}</Badge>
                      </div>
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
