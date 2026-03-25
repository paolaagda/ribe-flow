import { useLocalStorage } from '@/hooks/useLocalStorage';
import { mockVisits, Visit } from '@/data/mock-data';

export function useVisits() {
  const [visits, setVisits] = useLocalStorage<Visit[]>('ribercred_visits_v2', mockVisits);
  return { visits, setVisits };
}
