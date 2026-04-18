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
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-border/60" style={{ gap: "1px" }}>
          {/* Header de dias da semana */}
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={`wh-${i}`}
                className={cn(
                  "px-2 py-2.5 text-center border-b-2 transition-colors",
                  isToday
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/50 border-transparent",
                )}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                </div>
                <div
                  className={cn(
                    "text-base font-bold tabular-nums mt-0.5",
                    isToday ? "text-primary" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
          {/* Células de dias */}
          {days.map((day, i) => {
            const dayVisits = getVisitsForDay(day);
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={cn(
                  "bg-card min-h-[240px] p-2 transition-all group/day cursor-pointer",
                  isToday && "bg-primary/[0.02]",
                  dragOverDay === dateStr && "bg-primary/10 ring-2 ring-primary/40 ring-inset",
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
                {dayVisits.length > 0 && (
                  <div className="flex items-center justify-end mb-1.5">
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums px-1.5 py-0.5 rounded-full bg-muted">
                      {dayVisits.length}
                    </span>
                  </div>
                )}
                {canWrite("agenda.create") && dayVisits.length === 0 && (
                  <div className="flex items-center justify-center h-full opacity-0 group-hover/day:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                )}
                <div className="space-y-1.5">
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
                          "group/item relative pl-2.5 pr-1.5 py-1.5 rounded-lg bg-card border",
                          "cursor-pointer transition-all duration-200",
                          "hover:shadow-md hover:-translate-y-px",
                          "flex flex-col gap-1 overflow-hidden",
                          brand.colorToken === "info"
                            ? "border-info/30 hover:border-info/60"
                            : "border-warning/30 hover:border-warning/60",
                          draggedVisitId === v.id && "opacity-50 scale-95",
                        )}
                      >
                        {/* Barra lateral espessa */}
                        <span
                          aria-hidden
                          className={cn("absolute left-0 top-0 bottom-0 w-1", brand.bg)}
                        />
                        {/* Fundo tonal sutil */}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity",
                            brand.colorToken === "info" ? "bg-info/5" : "bg-warning/5",
                          )}
                        />
                        {/* Linha 1: horário + ícone do tipo + status */}
                        <div className="relative flex items-center gap-1.5 min-w-0">
                          {v.time ? (
                            <span className="text-[10px] font-bold text-foreground tabular-nums leading-none">
                              {v.time}
                            </span>
                          ) : (
                            <Icon className={cn("h-3 w-3 shrink-0", brand.text)} />
                          )}
                          <span
                            aria-label={v.status}
                            title={v.status}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0 ring-1 ring-background",
                              statusDotClasses[v.status],
                            )}
                          />
                          <Icon className={cn("h-3 w-3 ml-auto shrink-0", brand.text)} />
                        </div>
                        {/* Linha 2: parceiro */}
                        <p className="relative text-[11px] font-semibold text-foreground truncate leading-tight">
                          {partner?.name || v.prospectPartner || "—"}
                        </p>
                        {/* Linha 3: rodapé */}
                        <div className="relative flex items-center justify-between gap-1">
                          <VisitParticipants participants={getParticipants(v)} />
                          {myInvite ? (
                            <VisitInviteActions
                              visitId={v.id}
                              onAccept={handleAcceptVisitInvite}
                              onReject={handleRejectVisitInvite}
                            />
                          ) : v.potentialValue && v.potentialValue > 0 ? (
                            <span className="text-[9px] text-muted-foreground font-semibold tabular-nums">
                              {formatCentavos(v.potentialValue)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
