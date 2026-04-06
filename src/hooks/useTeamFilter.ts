import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Team, initialTeams, getTeamByUserId, getTeamMembers } from '@/data/teams';
import { mockUsers, Visit, User } from '@/data/mock-data';

// Roles that have global visibility (can see all users' data)
const GLOBAL_VIEW_ROLES = ['diretor', 'gerente', 'ascom'];

export function useTeamFilter() {
  const { user } = useAuth();
  const [teams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);

  const myTeam = useMemo(() => {
    if (!user) return undefined;
    return getTeamByUserId(user.id, teams);
  }, [user, teams]);

  const getVisibleUserIds = useMemo((): string[] => {
    if (!user) return [];
    if (GLOBAL_VIEW_ROLES.includes(user.role)) return mockUsers.map(u => u.id);
    return [user.id];
  }, [user]);

  const getVisibleUsers = useMemo((): User[] => {
    return mockUsers.filter(u => getVisibleUserIds.includes(u.id));
  }, [getVisibleUserIds]);

  const filterVisitsByTeam = (visits: Visit[]): Visit[] => {
    if (!user) return [];
    if (GLOBAL_VIEW_ROLES.includes(user.role)) return visits;
    return visits.filter(v => getVisibleUserIds.includes(v.userId));
  };

  const getVisibleCommercials = useMemo((): User[] => {
    return getVisibleUsers.filter(u => u.role === 'comercial');
  }, [getVisibleUsers]);

  return {
    myTeam,
    teams,
    getVisibleUserIds,
    getVisibleUsers,
    getVisibleCommercials,
    filterVisitsByTeam,
  };
}
