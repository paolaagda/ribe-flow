import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { Registration, mockRegistrations } from '@/data/registrations';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { mockUsers, mockPartners } from '@/data/mock-data';
import { getRandomMessage } from '@/data/notification-messages';

export function useRegistrations() {
  const [registrations, setRegistrations] = useLocalStorage<Registration[]>('ribercred_registrations', mockRegistrations);
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();

  const addRegistration = useCallback((reg: Omit<Registration, 'id' | 'requestedAt' | 'completedAt' | 'updates'>) => {
    const newReg: Registration = {
      ...reg,
      id: `reg-${Date.now()}`,
      requestedAt: new Date().toISOString().split('T')[0],
      completedAt: reg.status === 'Concluído' ? new Date().toISOString().split('T')[0] : null,
      contractConfirmed: reg.contractConfirmed ?? false,
      isCritical: reg.isCritical ?? false,
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

  // === Validation flow for bank registrations ===

  const submitRegistrationForValidation = useCallback((id: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;

    setRegistrations(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        validationStatus: 'in_validation' as const,
        validationSubmittedBy: user?.id,
        validationUpdatedAt: new Date().toISOString(),
      };
    }));

    // Notify Cadastro users — single dispatch
    const partner = mockPartners.find(p => p.id === reg.partnerId);
    const cadastroUsers = mockUsers.filter(u => u.role === 'cadastro' && u.active);
    const today = new Date().toISOString().split('T')[0];

    cadastroUsers.forEach(cadastroUser => {
      addNotification({
        type: 'reg_validation_submitted',
        visitId: '',
        fromUserId: user?.id || '',
        toUserId: cadastroUser.id,
        partnerId: reg.partnerId,
        partnerName: partner?.name || '',
        date: today,
        time: '',
        status: 'pending',
        message: getRandomMessage('reg_validation_submitted', {
          parceiro: partner?.name || '',
          nome: user?.name || '',
          banco: reg.bank,
        }),
        bankName: reg.bank,
        registrationId: id,
      });
    });
  }, [registrations, setRegistrations, user, addNotification]);

  const validateRegistration = useCallback((id: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        validationStatus: 'validated' as const,
        validationRejectionReason: undefined,
        validationUpdatedAt: new Date().toISOString(),
      };
    }));
    // No notification on approval per requirements
  }, [setRegistrations]);

  const rejectRegistration = useCallback((id: string, reason: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;

    setRegistrations(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        validationStatus: 'rejected' as const,
        validationRejectionReason: reason,
        validationUpdatedAt: new Date().toISOString(),
      };
    }));

    // Notify the Comercial who submitted — single dispatch
    const submittedBy = reg.validationSubmittedBy || reg.commercialUserId;
    if (submittedBy) {
      const partner = mockPartners.find(p => p.id === reg.partnerId);
      const today = new Date().toISOString().split('T')[0];

      addNotification({
        type: 'reg_validation_rejected',
        visitId: '',
        fromUserId: user?.id || '',
        toUserId: submittedBy,
        partnerId: reg.partnerId,
        partnerName: partner?.name || '',
        date: today,
        time: '',
        status: 'pending',
        message: getRandomMessage('reg_validation_rejected', {
          parceiro: partner?.name || '',
          banco: reg.bank,
          motivo: reason,
        }),
        bankName: reg.bank,
        registrationId: id,
        rejectionReason: reason,
      });
    }
  }, [registrations, setRegistrations, user, addNotification]);

  const revokeRegistrationValidation = useCallback((id: string, reason: string) => {
    rejectRegistration(id, reason);
  }, [rejectRegistration]);

  return {
    registrations,
    addRegistration,
    updateRegistration,
    deleteRegistration,
    getById,
    submitRegistrationForValidation,
    validateRegistration,
    rejectRegistration,
    revokeRegistrationValidation,
  };
}
