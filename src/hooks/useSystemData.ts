import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { BANKS, PRODUCTS, RESCHEDULE_REASONS, CANCEL_REASONS, STORE_STRUCTURES } from '@/data/mock-data';

export interface SystemItem {
  id: string;
  label: string;
  active: boolean;
}

export type SystemCategory = 'banks' | 'products' | 'rescheduleReasons' | 'cancelReasons' | 'storeStructures' | 'periods';

const categoryLabels: Record<SystemCategory, string> = {
  banks: 'Bancos',
  products: 'Produtos',
  rescheduleReasons: 'Justificativas de Reagendamento',
  cancelReasons: 'Justificativas de Cancelamento',
  storeStructures: 'Tipos de Loja',
  periods: 'Períodos da Agenda',
};

function buildInitial(items: readonly string[]): SystemItem[] {
  return items.map((label, i) => ({ id: `sys-${i}-${label.slice(0, 8)}`, label, active: true }));
}

const initialData: Record<SystemCategory, SystemItem[]> = {
  banks: buildInitial(BANKS),
  products: buildInitial(PRODUCTS),
  rescheduleReasons: buildInitial(RESCHEDULE_REASONS),
  cancelReasons: buildInitial(CANCEL_REASONS),
  storeStructures: buildInitial(STORE_STRUCTURES),
  periods: buildInitial(['Manhã', 'Tarde']),
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
    return data[category].filter(item => item.active).map(item => item.label);
  }, [data]);

  const getItems = useCallback((category: SystemCategory): SystemItem[] => {
    return data[category];
  }, [data]);

  return { data, addItem, toggleItem, getActiveItems, getItems };
}
