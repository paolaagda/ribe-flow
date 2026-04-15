import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useVisibility } from '@/hooks/useVisibility';
import { Team, initialTeams, getTeamByUserId } from '@/data/teams';
import { Visit } from '@/data/mock-data';

export function useTeamFilter() {
  const { user } = useAuth();
  const [teams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);
  const { visibleUserIds, visibleUsers, visibleCommercials, filterVisits } = useVisibility();

  const myTeam = useMemo(() => {
    if (!user) return undefined;
    return getTeamByUserId(user.id, teams);
  }, [user, teams]);

  const filterVisitsByTeam = (visits: Visit[]): Visit[] => {
    return filterVisits(visits);
  };

  return {
    myTeam,
    teams,
    getVisibleUserIds: visibleUserIds,
    getVisibleUsers: visibleUsers,
    getVisibleCommercials: visibleCommercials,
    filterVisitsByTeam,
  };
}
