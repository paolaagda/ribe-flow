import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { statusBgClasses } from "@/data/mock-data";
import { Plus, Handshake, UserPlus, Check, X } from "lucide-react";
import { formatCentavos } from "@/lib/currency";
import type { CalendarViewProps } from "./AgendaCalendarTypes";

export default function AgendaWeekView({
  days, today, getVisitsForDay, getPartnerById, getParticipants,
  user, canWrite, draggedVisitId, dragOverDay,
  handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleOpenDetail, handleAcceptVisitInvite, handleRejectVisitInvite, onCellClick,
}: CalendarViewProps) {
  return (
    <Card>
      <CardContent className="p-ds-xs sm:p-ds-sm">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {days.map((day, i) => (
            <div key={`wh-${i}`} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {format(day, "EEE", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </div>
          ))}
          {days.map((day, i) => {
            const dayVisits = getVisitsForDay(day);
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={cn(
                  "bg-card min-h-[200px] p-1.5 transition-colors group/day cursor-pointer",
                  dragOverDay === dateStr && "bg-primary/10 ring-2 ring-primary/30",
                  canWrite("agenda.create") && "hover:bg-muted/30",
                )}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-visit-item]")) return;
                  if (canWrite("agenda.create") && dayVisits.length === 0) onCellClick(dateStr);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full", isToday && "bg-primary text-primary-foreground")}>
                    {format(day, "d")}
                  </span>
                  {dayVisits.length > 0 && <span className="text-[10px] text-muted-foreground">{dayVisits.length}</span>}
                  {canWrite("agenda.create") && dayVisits.length === 0 && (
                    <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayVisits.map((v) => {
                    const partner = getPartnerById(v.partnerId);
                    const myInvite = user ? v.invitedUsers?.find((iu) => iu.userId === user.id && iu.status === "pending") : null;
                    return (
                      <div
                        key={v.id}
                        data-visit-item
                        draggable={canWrite("agenda.drag")}
                        onDragStart={(e) => canWrite("agenda.drag") && handleDragStart(e, v.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(v); }}
                        className={cn(
                          "text-[10px] px-1 py-1 rounded border cursor-pointer hover:ring-1 hover:ring-primary/40 flex flex-col gap-0.5",
                          statusBgClasses[v.status],
                          draggedVisitId === v.id && "opacity-50",
                          v.type === "prospecção" && "opacity-50 border-muted",
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {v.type === "visita" ? <Handshake className="h-2.5 w-2.5 shrink-0 text-info" /> : <UserPlus className="h-2.5 w-2.5 shrink-0 text-warning" />}
                          <span className="text-[10px] font-medium truncate leading-tight">{partner?.name || v.prospectPartner || ""}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {v.time && <span className="text-[9px] font-mono text-muted-foreground">{v.time}</span>}
                          <Badge variant="outline" className={cn("text-[8px] px-0.5 py-0 leading-tight", statusBgClasses[v.status])}>{v.status}</Badge>
                          {partner && (
                            <Badge variant="outline" className={cn("text-[8px] px-0.5 py-0 capitalize",
                              partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                              partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                              'bg-muted/50 text-muted-foreground border-border/30'
                            )}>{partner.potential}</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {(() => {
                            const participants = getParticipants(v);
                            return (
                              <TooltipProvider delayDuration={200}>
                                <div className="flex -space-x-1 shrink-0">
                                  {participants.slice(0, 2).map((p) => (
                                    <Tooltip key={p.id}>
                                      <TooltipTrigger asChild>
                                        <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                          {p.name.charAt(0)}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">{p.name} • {p.cargo}</TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {participants.length > 2 && (
                                    <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                      +{participants.length - 2}
                                    </div>
                                  )}
                                </div>
                              </TooltipProvider>
                            );
                          })()}
                          {myInvite && (
                            <span className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button aria-label="Aceitar convite" className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90" onClick={() => handleAcceptVisitInvite(v.id)}>
                                <Check className="h-2 w-2" />
                              </button>
                              <button aria-label="Recusar convite" className="h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleRejectVisitInvite(v.id)}>
                                <X className="h-2 w-2" />
                              </button>
                            </span>
                          )}
                          {v.potentialValue && v.potentialValue > 0 && (
                            <span className="text-[9px] text-muted-foreground font-medium">{formatCentavos(v.potentialValue)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dayVisits.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[60px]">
                      <p className="text-[10px] text-muted-foreground/40">—</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
