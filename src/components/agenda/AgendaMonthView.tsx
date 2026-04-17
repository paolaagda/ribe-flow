import { format, isSameDay, isSameMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statusBgClasses } from "@/data/mock-data";
import { Plus } from "lucide-react";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
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
    <Card>
      <CardContent className="p-ds-xs sm:p-ds-sm">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
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
                  "bg-card min-h-[80px] sm:min-h-[100px] p-1.5 transition-colors group/day cursor-pointer",
                  !isCurrentMonth && "opacity-40",
                  dragOverDay === dayStr && "bg-primary/10 ring-2 ring-primary/30",
                  canWrite("agenda.create") && "hover:bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full", isToday && "bg-primary text-primary-foreground")}>
                    {format(day, "d")}
                  </span>
                  {canWrite("agenda.create") && dayVisits.length === 0 && (
                    <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayVisits.slice(0, 3).map((v) => {
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
                          "text-[10px] px-1 py-0.5 rounded border cursor-pointer hover:ring-1 hover:ring-primary/40 flex items-center gap-1",
                          statusBgClasses[v.status],
                          draggedVisitId === v.id && "opacity-50",
                          v.type === "prospecção" && "opacity-50 border-muted",
                        )}
                      >
                        {(() => { const brand = getAgendaTypeBrand(v.type); const Icon = brand.icon; return <Icon className={cn("h-2.5 w-2.5 shrink-0", brand.text)} />; })()}
                        <span className="text-[9px] truncate max-w-[60px]">{partner?.name || v.prospectPartner || ""}</span>
                        <VisitParticipants participants={getParticipants(v)} />
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
                  {dayVisits.length > 3 && <span className="text-[10px] text-muted-foreground pl-1">+{dayVisits.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
