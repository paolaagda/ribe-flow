import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers, Visit, Partner, User } from '@/data/mock-data';
import { useVisibilityConfig, DEFAULT_VISIBILITY } from '@/hooks/useVisibilityConfig';

/**
 * Fonte única de verdade para regras de visibilidade do Canal Parceiro.
 * Lê a configuração persistida em localStorage via useVisibilityConfig.
 */
export function useVisibility() {
  const { user } = useAuth();
  const { config } = useVisibilityConfig();

  /** Whether the current user has global (unrestricted) visibility */
  const hasGlobalView = useMemo(() => {
    if (!user) return false;
    const level = config[user.role] ?? DEFAULT_VISIBILITY[user.role] ?? 'restrita';
    return level === 'global';
  }, [user, config]);

  /** Whether the current user has restricted visibility */
  const isRestricted = !hasGlobalView && !!user;

  /** IDs of all users visible to the current user */
  const visibleUserIds = useMemo((): string[] => {
    if (!user) return [];
    if (hasGlobalView) return mockUsers.map(u => u.id);
    return [user.id];
  }, [user, hasGlobalView]);

  /** All user objects visible to the current user */
  const visibleUsers = useMemo((): User[] => {
    if (hasGlobalView) return mockUsers;
    return mockUsers.filter(u => visibleUserIds.includes(u.id));
  }, [hasGlobalView, visibleUserIds]);

  /** Visible commercial users */
  const visibleCommercials = useMemo((): User[] => {
    return visibleUsers.filter(u => u.role === 'comercial');
  }, [visibleUsers]);

  /**
   * Filter visits by visibility rules:
   * - Global: all visits
   * - Restricted: own visits, created by user, or accepted invites
   */
  const filterVisits = useCallback((visits: Visit[]): Visit[] => {
    if (!user) return [];
    if (hasGlobalView) return visits;
    return visits.filter(
      v =>
        v.userId === user.id ||
        v.createdBy === user.id ||
        v.invitedUsers?.some(iu => iu.userId === user.id && iu.status === 'accepted'),
    );
  }, [user, hasGlobalView]);

  /**
   * Filter partners by visibility rules:
   * - Global: all partners
   * - Restricted: only partners where user is responsible
   */
  const filterPartners = useCallback((partners: Partner[]): Partner[] => {
    if (!user) return [];
    if (hasGlobalView) return partners;
    return partners.filter(p => p.responsibleUserId === user.id);
  }, [user, hasGlobalView]);

  return {
    hasGlobalView,
    isRestricted,
    visibleUserIds,
    visibleUsers,
    visibleCommercials,
    filterVisits,
    filterPartners,
  };
}
