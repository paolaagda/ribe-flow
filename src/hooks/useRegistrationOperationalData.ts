import { useMemo, useCallback } from 'react';
import { usePartners } from '@/hooks/usePartners';
import { useInfoData } from '@/hooks/useInfoData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Registration } from '@/data/registrations';
import { differenceInDays } from 'date-fns';

export type RegistrationCriticality = 'alta' | 'média' | 'baixa';

export interface RegistrationOperationalData {
  daysInProcess: number;
  daysSinceLastUpdate: number;
  criticality: RegistrationCriticality;
  nextAction: string;
  pendingDocsCount: number;
  totalDocsCount: number;
  currentResponsible: string;
  isBlocked: boolean;
  partnerName: string;
}

const STAGE_OWNERS: Record<string, string> = {
  'Não iniciado': 'Cadastro',
  'Colhendo documentação': 'Parceiro / Comercial',
  'Em análise': 'Banco',
  'Colhendo assinaturas': 'Jurídico / Parceiro',
  'Concluído': '—',
  'Em pausa': '—',
  'Cancelado': '—',
};

function deriveNextAction(reg: Registration, pendingDocs: number, daysSinceLastUpdate: number): string {
  if (reg.status === 'Concluído') return 'Cadastro finalizado';
  if (reg.status === 'Cancelado') return 'Processo encerrado';
  if (reg.status === 'Em pausa') return 'Reativar cadastro';

  if (reg.status === 'Não iniciado') return 'Iniciar coleta de documentação';
  if (reg.status === 'Colhendo documentação') {
    if (pendingDocs > 0) return 'Coletar documentos pendentes';
    return 'Enviar documentação ao banco';
  }
  if (reg.status === 'Em análise') {
    if (daysSinceLastUpdate > 7) return 'Cobrar retorno do banco';
    return 'Aguardar retorno do banco';
  }
  if (reg.status === 'Colhendo assinaturas') return 'Obter assinaturas pendentes';

  return 'Acompanhar andamento';
}

export function useRegistrationOperationalData(registrations: Registration[]) {
  const { getPartnerById } = usePartners();
  const { getActiveDocuments } = useInfoData();
  const [checkedDocs] = useLocalStorage<Record<string, string[]>>('ribercred_partner_docs_v1', {});

  const activeDocuments = useMemo(() => getActiveDocuments(), [getActiveDocuments]);
  const totalDocsCount = activeDocuments.length;

  const getRegData = useCallback((reg: Registration): RegistrationOperationalData => {
    const today = new Date();
    const daysInProcess = differenceInDays(today, new Date(reg.requestedAt));
    
    const lastUpdateDate = reg.updates.length > 0
      ? reg.updates[reg.updates.length - 1].date
      : reg.requestedAt;
    const daysSinceLastUpdate = differenceInDays(today, new Date(lastUpdateDate));

    // Docs from same source as partner docs
    const partnerChecked = checkedDocs[reg.partnerId] || [];
    const validChecked = partnerChecked.filter(id => activeDocuments.some(d => d.id === id)).length;
    const pendingDocsCount = Math.max(0, totalDocsCount - validChecked);

    // Criticality
    let criticality: RegistrationCriticality = 'baixa';
    const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);
    if (!isTerminal) {
      if (reg.status === 'Em pausa' || daysSinceLastUpdate > 15) {
        criticality = 'alta';
      } else if (daysSinceLastUpdate > 7) {
        criticality = 'média';
      }
    }

    const isBlocked = !isTerminal && daysSinceLastUpdate > 15;
    const nextAction = deriveNextAction(reg, pendingDocsCount, daysSinceLastUpdate);
    const partner = getPartnerById(reg.partnerId);
    const currentResponsible = STAGE_OWNERS[reg.status] || reg.handlingWith;

    return {
      daysInProcess,
      daysSinceLastUpdate,
      criticality,
      nextAction,
      pendingDocsCount,
      totalDocsCount,
      currentResponsible,
      isBlocked,
      partnerName: partner?.name || 'Parceiro removido',
    };
  }, [checkedDocs, activeDocuments, totalDocsCount, getPartnerById]);

  const summary = useMemo(() => {
    let immediateAttention = 0;
    let idleOver7 = 0;
    let awaitingPartner = 0;
    let awaitingBank = 0;

    registrations.forEach(reg => {
      const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);
      if (isTerminal) return;

      const data = getRegData(reg);
      if (data.criticality === 'alta') immediateAttention++;
      if (data.daysSinceLastUpdate > 7) idleOver7++;
      if (reg.handlingWith === 'Parceiro' || reg.handlingWith === 'Comercial') awaitingPartner++;
      if (reg.handlingWith === 'Banco') awaitingBank++;
    });

    return { immediateAttention, idleOver7, awaitingPartner, awaitingBank };
  }, [registrations, getRegData]);

  return { getRegData, summary, STAGE_OWNERS };
}
