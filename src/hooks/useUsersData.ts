import { useLocalStorage } from '@/hooks/useLocalStorage';
import { mockUsers, User } from '@/data/mock-data';

export function useUsersData() {
  const [users, setUsers] = useLocalStorage<User[]>('ribercred_users', mockUsers);
  return { users, setUsers };
}
