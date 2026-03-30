import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PermissionLevel, defaultPermissions } from '@/data/permissions';
import { AppProfile } from '@/data/mock-data';

export function usePermission() {
  const { profile } = useAuth();
  const [permissions] = useLocalStorage<Record<AppProfile, Record<string, PermissionLevel>>>(
    'ribercred_permissions_v6',
    defaultPermissions
  );

  const can = (key: string): PermissionLevel => {
    if (!profile) return 'none';
    return permissions[profile]?.[key] || 'none';
  };

  const canRead = (key: string): boolean => can(key) !== 'none';
  const canWrite = (key: string): boolean => can(key) === 'write';

  return { can, canRead, canWrite };
}
