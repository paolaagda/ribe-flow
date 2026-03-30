import { useMemo } from 'react';
import { useRegistrations } from './useRegistrations';

export function useRegistrationBadge(partnerId: string | undefined) {
  const { registrations } = useRegistrations();

  return useMemo(() => {
    if (!partnerId) return { hasActive: false, activeCount: 0, regs: [] };
    const partnerRegs = registrations.filter(r => r.partnerId === partnerId);
    const active = partnerRegs.filter(r => !['Concluído', 'Cancelado'].includes(r.status));
    return { hasActive: active.length > 0, activeCount: active.length, regs: active };
  }, [registrations, partnerId]);
}
