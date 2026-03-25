import { getUserById } from './mock-data';

export { getUserById };

export interface Team {
  id: string;
  name: string;
  directorId?: string;
  managerId: string;
  ascomIds: string[];
  commercialIds: string[];
}

export const initialTeams: Team[] = [
  {
    id: 'team1',
    name: 'Equipe Sul',
    directorId: 'u9',
    managerId: 'u2',
    ascomIds: ['u3'],
    commercialIds: ['u4', 'u5'],
  },
  {
    id: 'team2',
    name: 'Equipe Norte',
    directorId: 'u9',
    managerId: 'u7',
    ascomIds: [],
    commercialIds: ['u6'],
  },
];

export function getTeamByUserId(userId: string, teams: Team[]): Team | undefined {
  return teams.find(t =>
    t.directorId === userId ||
    t.managerId === userId ||
    t.ascomIds.includes(userId) ||
    t.commercialIds.includes(userId)
  );
}

export function getTeamMembers(team: Team): string[] {
  return [
    ...(team.directorId ? [team.directorId] : []),
    team.managerId,
    ...team.ascomIds,
    ...team.commercialIds,
  ];
}

