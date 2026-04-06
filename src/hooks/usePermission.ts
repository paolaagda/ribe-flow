import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PermissionLevel, defaultPermissions } from '@/data/permissions';
import { CompanyCargo } from '@/data/mock-data';

export function usePermission() {
  const { user } = useAuth();
  const [permissions] = useLocalStorage<Record<CompanyCargo, Record<string, PermissionLevel>>>(
    'ribercred_permissions_v7',
    defaultPermissions
  );

  const can = (key: string): PermissionLevel => {
    if (!user) return 'none';
    return permissions[user.role]?.[key] || 'none';
  };

  const canRead = (key: string): boolean => can(key) !== 'none';
  const canWrite = (key: string): boolean => can(key) === 'write';

  return { can, canRead, canWrite };
}
