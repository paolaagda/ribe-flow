import { useLocalStorage } from '@/hooks/useLocalStorage';
import { mockVisits, Visit } from '@/data/mock-data';
import { useEffect } from 'react';

export function useVisits() {
  const [visits, setVisits] = useLocalStorage<Visit[]>('ribercred_visits_v3', mockVisits);

  // Auto-refresh demo visits when none match today's date
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayVisits = visits.some(v => v.date === todayStr);
    
    if (!hasTodayVisits) {
      const demoIds = ['vt1', 'vt2', 'vt3', 'vt4', 'vt5', 'vt6', 'vt7'];
      const freshMock = mockVisits;
      const updatedVisits = visits.map(v => {
        if (demoIds.includes(v.id)) {
          const fresh = freshMock.find(m => m.id === v.id);
          return fresh ? { ...v, date: fresh.date } : v;
        }
        return v;
      });
      setVisits(updatedVisits);
    }
  }, [visits, setVisits]);

  return { visits, setVisits };
}
