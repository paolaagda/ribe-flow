import { format, isSameDay, isSameMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
import { statusDotClasses } from "@/lib/agenda-status-dots";
import VisitParticipants from "./VisitParticipants";
import VisitInviteActions from "./VisitInviteActions";
import type { CalendarViewProps } from "./AgendaCalendarTypes";

export default function AgendaMonthView({
  days, currentDate, today, getVisitsForDay, getPartnerById, getParticipants,
  user, canWrite, draggedVisitId, dragOverDay,
  handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleOpenDetail, handleAcceptVisitInvite, handleRejectVisitInvite, onCellClick,
}: CalendarViewProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-border/60" style={{ gap: "1px" }}>
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div
              key={d}
              className="bg-muted/50 px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-transparent"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const dayVisits = getVisitsForDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayStr = format(day, "yyyy-MM-dd");
            return (
              <div
                key={i}
                onDragOver={(e) => handleDragOver(e, dayStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-visit-item]")) return;
                  if (canWrite("agenda.create")) onCellClick(dayStr);
                }}
                className={cn(
                  "bg-card min-h-[96px] sm:min-h-[120px] p-1.5 transition-all group/day cursor-pointer",
                  !isCurrentMonth && "opacity-40 bg-muted/20",
                  isToday && "bg-primary/[0.04]",
                  dragOverDay === dayStr && "bg-primary/10 ring-2 ring-primary/40 ring-inset",
                  canWrite("agenda.create") && "hover:bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-md tabular-nums",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayVisits.length > 0 && (
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums px-1.5 py-0.5 rounded-full bg-muted">
                      {dayVisits.length}
                    </span>
                  )}
                  {canWrite("agenda.create") && dayVisits.length === 0 && (
                    <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayVisits.slice(0, 3).map((v) => {
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
                        aria-label={`${brand.label} ${v.status} — ${partner?.name || v.prospectPartner || ""}`}
                        className={cn(
                          "relative pl-2 pr-1 py-1 rounded-md border bg-card",
                          "cursor-pointer transition-all duration-150",
                          "hover:shadow-sm hover:-translate-y-px",
                          "flex items-center gap-1 overflow-hidden",
                          brand.colorToken === "info"
                            ? "border-info/30 hover:border-info/60 hover:bg-info/5"
                            : "border-warning/30 hover:border-warning/60 hover:bg-warning/5",
                          draggedVisitId === v.id && "opacity-50 scale-95",
                        )}
                      >
                        {/* Barra lateral mais espessa */}
                        <span
                          aria-hidden
                          className={cn("absolute left-0 top-0 bottom-0 w-[3px]", brand.bg)}
                        />
                        <Icon className={cn("h-2.5 w-2.5 shrink-0", brand.text)} />
                        <span className="text-[10px] font-semibold text-foreground truncate flex-1 leading-tight">
                          {partner?.name || v.prospectPartner || ""}
                        </span>
                        <span
                          aria-label={v.status}
                          title={v.status}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0 ring-1 ring-background",
                            statusDotClasses[v.status],
                          )}
                        />
                        {myInvite && (
                          <VisitInviteActions
                            visitId={v.id}
                            onAccept={handleAcceptVisitInvite}
                            onReject={handleRejectVisitInvite}
                          />
                        )}
                      </div>
                    );
                  })}
                  {dayVisits.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-semibold pl-1">
                      +{dayVisits.length - 3} mais
                    </span>
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
