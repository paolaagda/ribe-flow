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
    firstVisitReward: number;
    firstProspectionReward: number;
    fullVisitGoalReward: number;
    fullProspectionGoalReward: number;
    fullGoalReward: number;
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
    firstVisitReward: 3,
    firstProspectionReward: 3,
    fullVisitGoalReward: 10,
    fullProspectionGoalReward: 10,
    fullGoalReward: 25,
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
  const participant = campaign.participants.find(p => p.userId === userId);
  const visits = getCompletedVisitsForUser(userId, campaign.startDate, campaign.endDate);
  const prospections = getCompletedProspectionsForUser(userId, campaign.startDate, campaign.endDate);
  const cancellations = getCancelledVisitsForUser(userId, campaign.startDate, campaign.endDate);

  let score = 0;
  score += visits * config.pointsPerVisit;
  score += prospections * config.pointsPerProspection;
  score += cancellations * config.pointsPerCancellation;

  // Achievement bonuses
  if (visits >= 1) score += config.achievements.firstVisitReward;
  if (prospections >= 1) score += config.achievements.firstProspectionReward;
  if (visits >= config.achievements.visitMilestone) score += config.achievements.visitReward;
  if (prospections >= config.achievements.prospectionMilestone) score += config.achievements.prospectionReward;

  // Individual 100% goal rewards
  if (participant) {
    if (visits >= participant.visitGoal) score += config.achievements.fullVisitGoalReward;
    if (prospections >= participant.prospectionGoal) score += config.achievements.fullProspectionGoalReward;
    if (visits >= participant.visitGoal && prospections >= participant.prospectionGoal) {
      score += config.achievements.fullGoalReward;
    }
  }

  return Math.max(0, Math.round(score * 10) / 10);
}

export interface ScoreBreakdown {
  label: string;
  points: number;
  type: 'earn' | 'penalty' | 'achievement';
  date?: string;
  time?: string;
}

export function getUserScoreBreakdown(campaign: Campaign, userId: string): ScoreBreakdown[] {
  const config = getGamificationConfig(campaign);
  const participant = campaign.participants.find(p => p.userId === userId);
  const visits = getCompletedVisitsForUser(userId, campaign.startDate, campaign.endDate);
  const prospections = getCompletedProspectionsForUser(userId, campaign.startDate, campaign.endDate);
  const cancellations = getCancelledVisitsForUser(userId, campaign.startDate, campaign.endDate);

  // Generate mock dates within campaign period
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const now = new Date();
  const maxDate = end < now ? end : now;
  const range = maxDate.getTime() - start.getTime();

  function mockDateTime(seed: number): { date: string; time: string } {
    const offset = Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1;
    const d = new Date(start.getTime() + offset * range);
    const hours = 8 + Math.floor((offset * 1000) % 10);
    const mins = Math.floor((offset * 10000) % 60);
    return {
      date: d.toLocaleDateString('pt-BR'),
      time: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
    };
  }

  const items: ScoreBreakdown[] = [];
  let seed = userId.charCodeAt(0) + userId.charCodeAt(1);

  // Individual visit entries
  for (let i = 0; i < visits; i++) {
    const dt = mockDateTime(seed++);
    items.push({ label: `Visita concluída (+${config.pointsPerVisit}pt)`, points: config.pointsPerVisit, type: 'earn', ...dt });
  }
  for (let i = 0; i < prospections; i++) {
    const dt = mockDateTime(seed++);
    items.push({ label: `Prospecção concluída (+${config.pointsPerProspection}pt)`, points: config.pointsPerProspection, type: 'earn', ...dt });
  }
  for (let i = 0; i < cancellations; i++) {
    const dt = mockDateTime(seed++);
    items.push({ label: `Cancelamento (${config.pointsPerCancellation}pt)`, points: config.pointsPerCancellation, type: 'penalty', ...dt });
  }

  // Achievement entries
  if (visits >= 1) { const dt = mockDateTime(seed++); items.push({ label: 'Conquista: Primeira visita', points: config.achievements.firstVisitReward, type: 'achievement', ...dt }); }
  if (prospections >= 1) { const dt = mockDateTime(seed++); items.push({ label: 'Conquista: Primeira prospecção', points: config.achievements.firstProspectionReward, type: 'achievement', ...dt }); }
  if (visits >= config.achievements.visitMilestone) { const dt = mockDateTime(seed++); items.push({ label: `Conquista: Meta ${config.achievements.visitMilestone} visitas`, points: config.achievements.visitReward, type: 'achievement', ...dt }); }
  if (prospections >= config.achievements.prospectionMilestone) { const dt = mockDateTime(seed++); items.push({ label: `Conquista: Meta ${config.achievements.prospectionMilestone} prospecções`, points: config.achievements.prospectionReward, type: 'achievement', ...dt }); }
  if (participant) {
    if (visits >= participant.visitGoal) { const dt = mockDateTime(seed++); items.push({ label: 'Conquista: 100% visitas', points: config.achievements.fullVisitGoalReward, type: 'achievement', ...dt }); }
    if (prospections >= participant.prospectionGoal) { const dt = mockDateTime(seed++); items.push({ label: 'Conquista: 100% prospecções', points: config.achievements.fullProspectionGoalReward, type: 'achievement', ...dt }); }
    if (visits >= participant.visitGoal && prospections >= participant.prospectionGoal) {
      const dt = mockDateTime(seed++);
      items.push({ label: 'Conquista: 100% meta geral', points: config.achievements.fullGoalReward, type: 'achievement', ...dt });
    }
  }

  // Sort by date descending
  items.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    const [da, ma, ya] = a.date.split('/').map(Number);
    const [db, mb, yb] = b.date.split('/').map(Number);
    const dateA = new Date(ya, ma - 1, da);
    const dateB = new Date(yb, mb - 1, db);
    if (dateA.getTime() !== dateB.getTime()) return dateB.getTime() - dateA.getTime();
    return (b.time || '').localeCompare(a.time || '');
  });

  return items;
}

const today = new Date();
const thisMonth = today.toISOString().slice(0, 7);
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 7);
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
        firstVisitReward: 3,
        firstProspectionReward: 3,
        fullVisitGoalReward: 10,
        fullProspectionGoalReward: 10,
        fullGoalReward: 25,
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
        firstVisitReward: 2,
        firstProspectionReward: 2,
        fullVisitGoalReward: 8,
        fullProspectionGoalReward: 8,
        fullGoalReward: 20,
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
        firstVisitReward: 5,
        firstProspectionReward: 5,
        fullVisitGoalReward: 12,
        fullProspectionGoalReward: 12,
        fullGoalReward: 30,
      },
    },
  },
];
