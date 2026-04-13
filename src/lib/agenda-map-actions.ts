export const AGENDA_MAP_OPEN_VISIT_DETAIL_EVENT = 'agenda-map:open-visit-detail';
export const AGENDA_MAP_CREATE_VISIT_EVENT = 'agenda-map:create-visit';

export interface AgendaMapOpenVisitDetailPayload {
  visitId: string;
}

export interface AgendaMapCreateVisitPayload {
  partnerId: string;
  suggestedDate: string;
}