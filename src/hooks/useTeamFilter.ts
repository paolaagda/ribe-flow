import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Team, initialTeams, getTeamByUserId, getTeamMembers } from '@/data/teams';
import { mockUsers, Visit, User } from '@/data/mock-data';

export function useTeamFilter() {
  const { user, role } = useAuth();
  const [teams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);

  const myTeam = useMemo(() => {
    if (!user) return undefined;
    return getTeamByUserId(user.id, teams);
  }, [user, teams]);

  const getVisibleUserIds = useMemo((): string[] => {
    if (!user || !role) return [];
    if (role === 'gestor' || role === 'diretor') return mockUsers.map(u => u.id);
    if (!myTeam) return [user.id];
    if (role === 'comercial') return [user.id];
    // ascom and gerente see their team
    return getTeamMembers(myTeam);
  }, [user, role, myTeam]);

  const getVisibleUsers = useMemo((): User[] => {
    return mockUsers.filter(u => getVisibleUserIds.includes(u.id));
  }, [getVisibleUserIds]);

  const filterVisitsByTeam = (visits: Visit[]): Visit[] => {
    if (!user || !role) return [];
    if (role === 'gestor' || role === 'diretor') return visits;
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
