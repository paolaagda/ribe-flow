import { mockVisits, mockUsers, Visit } from './mock-data';

export interface CampaignParticipant {
  userId: string;
  visitGoal: number;
  prospectionGoal: number;
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  participants: CampaignParticipant[];
}

export type CampaignStatus = 'Ativa' | 'Encerrada' | 'Futura';

export function getCampaignStatus(campaign: Campaign): CampaignStatus {
  const today = new Date().toISOString().split('T')[0];
  if (campaign.startDate > today) return 'Futura';
  if (campaign.endDate < today) return 'Encerrada';
  return 'Ativa';
}

export const campaignStatusColors: Record<CampaignStatus, string> = {
  Ativa: 'bg-success/10 text-success border-success/20',
  Encerrada: 'bg-muted text-muted-foreground border-border',
  Futura: 'bg-info/10 text-info border-info/20',
};

export function getCompletedVisitsForUser(userId: string, startDate: string, endDate: string, visits: Visit[] = mockVisits): number {
  return visits.filter(v =>
    v.userId === userId &&
    v.type === 'visita' &&
    v.status === 'Concluída' &&
    v.date >= startDate &&
    v.date <= endDate
  ).length;
}

export function getCompletedProspectionsForUser(userId: string, startDate: string, endDate: string, visits: Visit[] = mockVisits): number {
  return visits.filter(v =>
    v.userId === userId &&
    v.type === 'prospecção' &&
    v.status === 'Concluída' &&
    v.date >= startDate &&
    v.date <= endDate
  ).length;
}

const today = new Date();
const thisMonth = today.toISOString().slice(0, 7);
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 7);

function lastDayOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).getDate().toString().padStart(2, '0');
}

export const initialCampaigns: Campaign[] = [
  {
    id: 'camp1',
    name: 'Campanha de Março',
    startDate: `${thisMonth}-01`,
    endDate: `${thisMonth}-${lastDayOfMonth(thisMonth)}`,
    participants: [
      { userId: 'u4', visitGoal: 20, prospectionGoal: 10 },
      { userId: 'u5', visitGoal: 15, prospectionGoal: 8 },
      { userId: 'u6', visitGoal: 18, prospectionGoal: 12 },
    ],
  },
  {
    id: 'camp2',
    name: 'Campanha Anterior',
    startDate: `${lastMonth}-01`,
    endDate: `${lastMonth}-28`,
    participants: [
      { userId: 'u4', visitGoal: 15, prospectionGoal: 8 },
      { userId: 'u5', visitGoal: 12, prospectionGoal: 6 },
    ],
  },
  {
    id: 'camp3',
    name: 'Campanha Futura',
    startDate: `${nextMonth}-01`,
    endDate: `${nextMonth}-${lastDayOfMonth(nextMonth)}`,
    participants: [
      { userId: 'u4', visitGoal: 25, prospectionGoal: 15 },
      { userId: 'u5', visitGoal: 20, prospectionGoal: 10 },
      { userId: 'u6', visitGoal: 22, prospectionGoal: 12 },
    ],
  },
];
