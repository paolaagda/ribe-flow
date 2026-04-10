import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { PRODUCTS, RESCHEDULE_REASONS, CANCEL_REASONS, STORE_STRUCTURES } from '@/data/mock-data';
import { REGISTRATION_STATUSES, REGISTRATION_SOLICITATIONS, REGISTRATION_HANDLERS } from '@/data/registrations';

export interface SystemItem {
  id: string;
  label: string;
  active: boolean;
}

export type SystemCategory = 'products' | 'rescheduleReasons' | 'cancelReasons' | 'storeStructures' | 'periods' | 'registrationStatuses' | 'registrationSolicitations' | 'registrationHandlers' | 'inviteRejectionReasons' | 'registrationRejectionReasons' | 'completionReasons_visita_presencial' | 'completionReasons_visita_remota' | 'completionReasons_prospeccao_presencial' | 'completionReasons_prospeccao_remota';

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
  registrationRejectionReasons: 'Justificativas de Recusa de Cadastro',
  completionReasons_visita_presencial: 'Visita presencial',
  completionReasons_visita_remota: 'Visita remota',
  completionReasons_prospeccao_presencial: 'Prospecção presencial',
  completionReasons_prospeccao_remota: 'Prospecção remota',
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
  registrationRejectionReasons: buildInitial([
    'Documentação incompleta',
    'Parceiro não atende requisitos mínimos',
    'Região sem potencial comercial',
    'Parceiro já cadastrado em outra promotora',
    'Dados inconsistentes',
    'Fora da área de atuação',
  ]),
  completionReasons_visita_presencial: buildInitial([
    'Loja fechada',
    'Parceiro ausente',
    'Responsável não estava no local',
    'Parceiro sem tempo para atendimento',
    'Visita não pôde ser realizada no momento',
    'Parceiro pediu reagendamento',
    'Problema operacional no local',
    'Não foi possível avançar na pauta da visita',
  ]),
  completionReasons_visita_remota: buildInitial([
    'Parceiro não atendeu',
    'Parceiro não respondeu',
    'Responsável indisponível no horário',
    'Problema de conexão/chamada',
    'Reunião remota não aconteceu',
    'Parceiro pediu reagendamento',
    'Não foi possível avançar na pauta da visita',
  ]),
  completionReasons_prospeccao_presencial: buildInitial([
    'Loja fechada',
    'Responsável ausente',
    'Não conseguiu falar com o decisor',
    'Sem interesse no momento',
    'Já possui parceria com concorrente',
    'Não aceitou apresentação/proposta',
    'Não tem perfil para captação',
    'Pediu retorno futuro',
    'Prospecção realizada, mas sem avanço',
  ]),
  completionReasons_prospeccao_remota: buildInitial([
    'Não atendeu',
    'Não respondeu',
    'Não conseguiu falar com o decisor',
    'Sem interesse no momento',
    'Já possui parceria com concorrente',
    'Não aceitou apresentação/proposta',
    'Problema de conexão/chamada',
    'Pediu retorno futuro',
    'Prospecção realizada, mas sem avanço',
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
