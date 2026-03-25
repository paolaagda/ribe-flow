import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PermissionLevel, defaultPermissions } from '@/data/permissions';
import { UserRole } from '@/data/mock-data';

export function usePermission() {
  const { role } = useAuth();
  const [permissions] = useLocalStorage<Record<UserRole, Record<string, PermissionLevel>>>(
    'ribercred_permissions',
    defaultPermissions
  );

  const can = (key: string): PermissionLevel => {
    if (!role) return 'none';
    return permissions[role]?.[key] || 'none';
  };

  const canRead = (key: string): boolean => can(key) !== 'none';
  const canWrite = (key: string): boolean => can(key) === 'write';

  return { can, canRead, canWrite };
}
