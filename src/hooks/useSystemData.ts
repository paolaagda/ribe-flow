import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { PRODUCTS, STORE_STRUCTURES } from '@/data/mock-data';
import { REGISTRATION_STATUSES, REGISTRATION_SOLICITATIONS, REGISTRATION_HANDLERS } from '@/data/registrations';

export interface SystemItem {
  id: string;
  label: string;
  active: boolean;
}

export type SystemCategory =
  | 'products'
  | 'storeStructures'
  | 'periods'
  | 'registrationStatuses'
  | 'registrationSolicitations'
  | 'registrationHandlers'
  | 'registrationRejectionReasons'
  // 8 format-specific justification categories
  | 'reagendamentoPresencial'
  | 'reagendamentoRemota'
  | 'cancelamentoPresencial'
  | 'cancelamentoRemota'
  | 'prospeccaoInconclusaPresencial'
  | 'prospeccaoInconclusaRemota'
  | 'recusaConvidadoPresencial'
  | 'recusaConvidadoRemota';

const categoryLabels: Record<SystemCategory, string> = {
  products: 'Produtos',
  storeStructures: 'Tipos de Loja',
  periods: 'Períodos da Agenda',
  registrationStatuses: 'Status de Cadastro',
  registrationSolicitations: 'Tipos de Solicitação',
  registrationHandlers: 'Tratando Com',
  registrationRejectionReasons: 'Justificativas de Recusa de Cadastro',
  reagendamentoPresencial: 'Reagendamento presencial',
  reagendamentoRemota: 'Reagendamento remota',
  cancelamentoPresencial: 'Cancelamento presencial',
  cancelamentoRemota: 'Cancelamento remota',
  prospeccaoInconclusaPresencial: 'Prospecção inconclusa presencial',
  prospeccaoInconclusaRemota: 'Prospecção inconclusa remota',
  recusaConvidadoPresencial: 'Recusa de convidado presencial',
  recusaConvidadoRemota: 'Recusa de convidado remota',
};

function buildInitial(items: readonly string[]): SystemItem[] {
  return items.map((label, i) => ({ id: `sys-${i}-${label.slice(0, 8)}`, label, active: true }));
}

const initialData: Record<SystemCategory, SystemItem[]> = {
  products: buildInitial(PRODUCTS),
  storeStructures: buildInitial(STORE_STRUCTURES),
  periods: buildInitial(['Manhã', 'Tarde']),
  registrationStatuses: buildInitial(REGISTRATION_STATUSES),
  registrationSolicitations: buildInitial(REGISTRATION_SOLICITATIONS),
  registrationHandlers: buildInitial(REGISTRATION_HANDLERS),
  registrationRejectionReasons: buildInitial([
    'Documentação incompleta',
    'Parceiro não atende requisitos mínimos',
    'Região sem potencial comercial',
    'Parceiro já cadastrado em outra promotora',
    'Dados inconsistentes',
    'Fora da área de atuação',
  ]),
  reagendamentoPresencial: buildInitial([
    'Parceiro ausente',
    'Loja fechada',
    'Responsável indisponível',
    'Problema operacional no local',
    'Parceiro pediu reagendamento',
    'Conflito de agenda do comercial',
  ]),
  reagendamentoRemota: buildInitial([
    'Parceiro não atendeu',
    'Parceiro pediu reagendamento',
    'Problema de conexão/chamada',
    'Responsável indisponível no horário',
    'Conflito de agenda do comercial',
  ]),
  cancelamentoPresencial: buildInitial([
    'Parceiro encerrou atividades',
    'Parceiro não deseja mais atendimento',
    'Região fora de cobertura',
    'Solicitação do gerente',
    'Duplicidade de compromisso',
  ]),
  cancelamentoRemota: buildInitial([
    'Parceiro encerrou atividades',
    'Parceiro não deseja mais atendimento',
    'Solicitação do gerente',
    'Duplicidade de compromisso',
    'Sem retorno após múltiplas tentativas',
  ]),
  prospeccaoInconclusaPresencial: buildInitial([
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
  prospeccaoInconclusaRemota: buildInitial([
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
  recusaConvidadoPresencial: buildInitial([
    'Conflito de agenda',
    'Não é responsável pelo parceiro',
    'Já estou em outra visita',
    'Não faz parte da minha função',
    'Sem necessidade de participação',
  ]),
  recusaConvidadoRemota: buildInitial([
    'Conflito de agenda',
    'Não é responsável pelo parceiro',
    'Já estou em outra reunião',
    'Não faz parte da minha função',
    'Sem necessidade de participação',
  ]),
};

export { categoryLabels };

// Helper to resolve the correct justification category based on status and medio
export function getJustificationCategory(
  targetStatus: 'Reagendada' | 'Cancelada' | 'Inconclusa',
  medio: 'presencial' | 'remoto'
): SystemCategory {
  const isPresencial = medio === 'presencial';
  switch (targetStatus) {
    case 'Reagendada':
      return isPresencial ? 'reagendamentoPresencial' : 'reagendamentoRemota';
    case 'Cancelada':
      return isPresencial ? 'cancelamentoPresencial' : 'cancelamentoRemota';
    case 'Inconclusa':
      return isPresencial ? 'prospeccaoInconclusaPresencial' : 'prospeccaoInconclusaRemota';
  }
}

export function getInviteRejectionCategory(
  medio: 'presencial' | 'remoto'
): SystemCategory {
  return medio === 'presencial' ? 'recusaConvidadoPresencial' : 'recusaConvidadoRemota';
}

export function useSystemData() {
  const [data, setData] = useLocalStorage<Record<SystemCategory, SystemItem[]>>('ribercred_system_data_v2', initialData);

  const addItem = useCallback((category: SystemCategory, label: string) => {
    setData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), { id: `sys-${Date.now()}`, label, active: true }],
    }));
  }, [setData]);

  const toggleItem = useCallback((category: SystemCategory, id: string) => {
    setData(prev => ({
      ...prev,
      [category]: (prev[category] || []).map(item =>
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
