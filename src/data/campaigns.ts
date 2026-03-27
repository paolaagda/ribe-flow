import { mockVisits, mockUsers, Visit } from './mock-data';

export interface GamificationConfig {
  pointsPerVisit: number;
  pointsPerProspection: number;
  pointsPerCancellation: number;
  achievements: {
    visitMilestone: number;
    visitReward: number;
    prospectionMilestone: number;
    prospectionReward: number;
  };
}

export const defaultGamification: GamificationConfig = {
  pointsPerVisit: 1,
  pointsPerProspection: 2,
  pointsPerCancellation: -0.5,
  achievements: {
    visitMilestone: 10,
    visitReward: 10,
    prospectionMilestone: 8,
    prospectionReward: 15,
  },
};

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
  gamification?: GamificationConfig;
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

export function getGamificationConfig(campaign: Campaign): GamificationConfig {
  return campaign.gamification || defaultGamification;
}

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

export function getCancelledVisitsForUser(userId: string, startDate: string, endDate: string, visits: Visit[] = mockVisits): number {
  return visits.filter(v =>
    v.userId === userId &&
    v.status === 'Cancelada' &&
    v.date >= startDate &&
    v.date <= endDate
  ).length;
}

export function calculateUserScore(campaign: Campaign, userId: string): number {
  const config = getGamificationConfig(campaign);
  const visits = getCompletedVisitsForUser(userId, campaign.startDate, campaign.endDate);
  const prospections = getCompletedProspectionsForUser(userId, campaign.startDate, campaign.endDate);
  const cancellations = getCancelledVisitsForUser(userId, campaign.startDate, campaign.endDate);

  let score = 0;
  score += visits * config.pointsPerVisit;
  score += prospections * config.pointsPerProspection;
  score += cancellations * config.pointsPerCancellation;

  // Achievement bonuses
  if (visits >= config.achievements.visitMilestone) {
    score += config.achievements.visitReward;
  }
  if (prospections >= config.achievements.prospectionMilestone) {
    score += config.achievements.prospectionReward;
  }

  return Math.max(0, Math.round(score * 10) / 10);
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
    gamification: {
      pointsPerVisit: 1,
      pointsPerProspection: 2,
      pointsPerCancellation: -0.5,
      achievements: {
        visitMilestone: 15,
        visitReward: 10,
        prospectionMilestone: 8,
        prospectionReward: 15,
      },
    },
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
    gamification: {
      pointsPerVisit: 1,
      pointsPerProspection: 2,
      pointsPerCancellation: -0.5,
      achievements: {
        visitMilestone: 10,
        visitReward: 8,
        prospectionMilestone: 6,
        prospectionReward: 12,
      },
    },
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
    gamification: {
      pointsPerVisit: 1.5,
      pointsPerProspection: 3,
      pointsPerCancellation: -1,
      achievements: {
        visitMilestone: 20,
        visitReward: 15,
        prospectionMilestone: 10,
        prospectionReward: 20,
      },
    },
  },
];
