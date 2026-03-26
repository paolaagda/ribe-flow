import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Team, initialTeams, getTeamByUserId, getTeamMembers } from '@/data/teams';
import { mockUsers, Visit, User } from '@/data/mock-data';

export function useTeamFilter() {
  const { user, profile } = useAuth();
  const [teams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);

  const myTeam = useMemo(() => {
    if (!user) return undefined;
    return getTeamByUserId(user.id, teams);
  }, [user, teams]);

  const getVisibleUserIds = useMemo((): string[] => {
    if (!user || !profile) return [];
    if (profile === 'gestor') return mockUsers.map(u => u.id);
    // nao_gestor sees only themselves
    return [user.id];
  }, [user, profile]);

  const getVisibleUsers = useMemo((): User[] => {
    return mockUsers.filter(u => getVisibleUserIds.includes(u.id));
  }, [getVisibleUserIds]);

  const filterVisitsByTeam = (visits: Visit[]): Visit[] => {
    if (!user || !profile) return [];
    if (profile === 'gestor') return visits;
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
