import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { PRODUCTS, RESCHEDULE_REASONS, CANCEL_REASONS, STORE_STRUCTURES } from '@/data/mock-data';
import { REGISTRATION_STATUSES, REGISTRATION_SOLICITATIONS, REGISTRATION_HANDLERS } from '@/data/registrations';

export interface SystemItem {
  id: string;
  label: string;
  active: boolean;
}

export type SystemCategory = 'products' | 'rescheduleReasons' | 'cancelReasons' | 'storeStructures' | 'periods' | 'registrationStatuses' | 'registrationSolicitations' | 'registrationHandlers' | 'inviteRejectionReasons';

const categoryLabels: Record<SystemCategory, string> = {
  products: 'Produtos',
  rescheduleReasons: 'Justificativas de Reagendamento',
  cancelReasons: 'Justificativas de Cancelamento',
  storeStructures: 'Tipos de Loja',
  periods: 'Períodos da Agenda',
  registrationStatuses: 'Status de Cadastro',
  registrationSolicitations: 'Tipos de Solicitação',
  registrationHandlers: 'Tratando Com',
  inviteRejectionReasons: 'Justificativas de Rejeição de Convite',
};

function buildInitial(items: readonly string[]): SystemItem[] {
  return items.map((label, i) => ({ id: `sys-${i}-${label.slice(0, 8)}`, label, active: true }));
}

const initialData: Record<SystemCategory, SystemItem[]> = {
  products: buildInitial(PRODUCTS),
  rescheduleReasons: buildInitial(RESCHEDULE_REASONS),
  cancelReasons: buildInitial(CANCEL_REASONS),
  storeStructures: buildInitial(STORE_STRUCTURES),
  periods: buildInitial(['Manhã', 'Tarde']),
  registrationStatuses: buildInitial(REGISTRATION_STATUSES),
  registrationSolicitations: buildInitial(REGISTRATION_SOLICITATIONS),
  registrationHandlers: buildInitial(REGISTRATION_HANDLERS),
  inviteRejectionReasons: buildInitial([
    'Conflito de agenda',
    'Não é responsável pelo parceiro',
    'Já estou em outra visita',
    'Não faz parte da minha função',
    'Sem necessidade de participação',
  ]),
};

export { categoryLabels };

export function useSystemData() {
  const [data, setData] = useLocalStorage<Record<SystemCategory, SystemItem[]>>('ribercred_system_data', initialData);

  const addItem = useCallback((category: SystemCategory, label: string) => {
    setData(prev => ({
      ...prev,
      [category]: [...prev[category], { id: `sys-${Date.now()}`, label, active: true }],
    }));
  }, [setData]);

  const toggleItem = useCallback((category: SystemCategory, id: string) => {
    setData(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, active: !item.active } : item
      ),
    }));
  }, [setData]);

  const getActiveItems = useCallback((category: SystemCategory): string[] => {
    const items = data[category] || initialData[category] || [];
    return items.filter(item => item.active).map(item => item.label);
  }, [data]);

  const getItems = useCallback((category: SystemCategory): SystemItem[] => {
    return data[category] || initialData[category] || [];
  }, [data]);

  return { data, addItem, toggleItem, getActiveItems, getItems };
}
