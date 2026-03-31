import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { Registration, mockRegistrations } from '@/data/registrations';
import { useAuth } from '@/contexts/AuthContext';

export function useRegistrations() {
  const [registrations, setRegistrations] = useLocalStorage<Registration[]>('ribercred_registrations', mockRegistrations);
  const { user } = useAuth();

  const addRegistration = useCallback((reg: Omit<Registration, 'id' | 'requestedAt' | 'completedAt' | 'updates'>) => {
    const newReg: Registration = {
      ...reg,
      id: `reg-${Date.now()}`,
      requestedAt: new Date().toISOString().split('T')[0],
      completedAt: reg.status === 'Concluído' ? new Date().toISOString().split('T')[0] : null,
      contractConfirmed: reg.contractConfirmed ?? false,
      updates: reg.observation ? [{
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        userId: user?.id || 'u1',
        text: reg.observation,
      }] : [],
    };
    setRegistrations(prev => [newReg, ...prev]);
    return newReg;
  }, [setRegistrations, user]);

  const updateRegistration = useCallback((id: string, changes: Partial<Registration>) => {
    setRegistrations(prev => prev.map(reg => {
      if (reg.id !== id) return reg;

      const updated = { ...reg, ...changes };

      // If observation changed, push update
      if (changes.observation && changes.observation !== reg.observation) {
        updated.updates = [
          ...reg.updates,
          {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            userId: user?.id || 'u1',
            text: changes.observation,
          },
        ];
      }

      // If status changed to Concluído, set completedAt
      if (changes.status === 'Concluído' && reg.status !== 'Concluído') {
        updated.completedAt = new Date().toISOString().split('T')[0];
      } else if (changes.status && changes.status !== 'Concluído') {
        updated.completedAt = null;
      }

      return updated;
    }));
  }, [setRegistrations, user]);

  const deleteRegistration = useCallback((id: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
  }, [setRegistrations]);

  const getById = useCallback((id: string) => {
    return registrations.find(r => r.id === id);
  }, [registrations]);

  return { registrations, addRegistration, updateRegistration, deleteRegistration, getById };
}
