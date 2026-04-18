import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
import { statusDotClasses } from "@/lib/agenda-status-dots";
import { formatCentavos } from "@/lib/currency";
import VisitParticipants from "./VisitParticipants";
import VisitInviteActions from "./VisitInviteActions";
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
            <div
              key={`wh-${i}`}
              className="bg-muted px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
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
                  "bg-card min-h-[220px] p-2 transition-colors group/day cursor-pointer",
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
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayVisits.length > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {dayVisits.length}
                    </span>
                  )}
                  {canWrite("agenda.create") && dayVisits.length === 0 && (
                    <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayVisits.map((v) => {
                    const partner = getPartnerById(v.partnerId);
                    const myInvite = user
                      ? v.invitedUsers?.find((iu) => iu.userId === user.id && iu.status === "pending")
                      : null;
                    const brand = getAgendaTypeBrand(v.type);
                    const Icon = brand.icon;
                    return (
                      <div
                        key={v.id}
                        data-visit-item
                        draggable={canWrite("agenda.drag")}
                        onDragStart={(e) => canWrite("agenda.drag") && handleDragStart(e, v.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(v); }}
                        aria-label={`${brand.label} ${v.status}${v.time ? ` às ${v.time}` : ""} — ${partner?.name || v.prospectPartner || ""}`}
                        className={cn(
                          "relative pl-2 pr-1.5 py-1 rounded-md bg-card border border-border/60",
                          "cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm",
                          "flex flex-col gap-0.5 overflow-hidden",
                          draggedVisitId === v.id && "opacity-50",
                        )}
                      >
                        {/* Barra lateral de tipo: Visita=info / Prospecção=warning */}
                        <span
                          aria-hidden
                          className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md", brand.bg)}
                        />
                        {/* Linha 1: horário + tipo + status (dot) */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {v.time ? (
                            <span className="text-[10px] font-mono font-semibold text-foreground tabular-nums leading-none">
                              {v.time}
                            </span>
                          ) : (
                            <Icon className={cn("h-3 w-3 shrink-0", brand.text)} />
                          )}
                          <span
                            aria-label={v.status}
                            title={v.status}
                            className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDotClasses[v.status])}
                          />
                          <span className="ml-auto">
                            <Icon className={cn("h-2.5 w-2.5", brand.text)} />
                          </span>
                        </div>
                        {/* Linha 2: parceiro (destaque principal) */}
                        <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                          {partner?.name || v.prospectPartner || "—"}
                        </p>
                        {/* Linha 3: rodapé compacto */}
                        <div className="flex items-center justify-between gap-1">
                          <VisitParticipants participants={getParticipants(v)} />
                          {myInvite ? (
                            <VisitInviteActions
                              visitId={v.id}
                              onAccept={handleAcceptVisitInvite}
                              onReject={handleRejectVisitInvite}
                            />
                          ) : v.potentialValue && v.potentialValue > 0 ? (
                            <span className="text-[9px] text-muted-foreground font-medium tabular-nums">
                              {formatCentavos(v.potentialValue)}
                            </span>
                          ) : null}
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
