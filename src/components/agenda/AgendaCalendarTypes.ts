import { Visit } from "@/data/mock-data";

/** Shared props for all calendar view components */
export interface CalendarViewProps {
  days: Date[];
  currentDate: Date;
  today: Date;
  getVisitsForDay: (day: Date) => Visit[];
  getPartnerById: (id: string) => any;
  getParticipants: (v: Visit) => { id: string; name: string; cargo: string }[];
  user: { id: string; role: string; name: string } | null;
  canWrite: (key: string) => boolean;
  draggedVisitId: string | null;
  dragOverDay: string | null;
  handleDragStart: (e: React.DragEvent, visitId: string) => void;
  handleDragOver: (e: React.DragEvent, dayStr: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, day: Date) => void;
  handleDragEnd: () => void;
  handleOpenDetail: (visit: Visit) => void;
  handleAcceptVisitInvite: (visitId: string) => void;
  handleRejectVisitInvite: (visitId: string) => void;
  onCellClick: (dateStr: string) => void;
}

/** Extended props only for day view */
export interface DayViewProps extends CalendarViewProps {
  lastVisitMap: Map<string, { id: string; date: string }>;
  rankingLeaderId: string | null;
  hasActiveRegistration: (partnerId: string) => boolean;
}
