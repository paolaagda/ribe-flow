import { useMemo, useCallback } from 'react';
import { usePartners } from '@/hooks/usePartners';
import { useInfoData } from '@/hooks/useInfoData';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { Registration } from '@/data/registrations';
import { differenceInDays } from 'date-fns';
import { AlertTriangle, UserCog, Users, Building2, ClipboardList } from 'lucide-react';
import { SummaryCardData } from '@/components/cadastro/RegistrationOperationalSummary';

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

/** Checks if a registration qualifies for "Atenção Imediata" */
function isImmediateAttention(reg: Registration, daysInProcess: number, pendingDocsCount: number): boolean {
  // Condition 1: created 30+ days ago and not completed
  if (daysInProcess >= 30) return true;
  // Condition 2: has pending documents
  if (pendingDocsCount > 0) return true;
  // Condition 3: manual critical flag
  if (reg.isCritical) return true;
  return false;
}

/** Checks if a registration is stalled (>7 days since last update) */
function isStalledOver7(daysSinceLastUpdate: number): boolean {
  return daysSinceLastUpdate > 7;
}

export function useRegistrationOperationalData(registrations: Registration[]) {
  const { getPartnerById } = usePartners();
  const { getActiveDocuments } = useInfoData();
  const { getPendingValidationCount: getDocPendingCount } = useDocumentValidation();

  const activeDocuments = useMemo(() => getActiveDocuments(), [getActiveDocuments]);
  const totalDocsCount = activeDocuments.length;
  const activeDocIds = useMemo(() => activeDocuments.map(d => d.id), [activeDocuments]);

  const getRegData = useCallback((reg: Registration): RegistrationOperationalData => {
    const today = new Date();
    const daysInProcess = differenceInDays(today, new Date(reg.requestedAt));
    
    const lastUpdateDate = reg.updates.length > 0
      ? reg.updates[reg.updates.length - 1].date
      : reg.requestedAt;
    const daysSinceLastUpdate = differenceInDays(today, new Date(lastUpdateDate));

    const pendingDocsCount = getDocPendingCount(reg.partnerId, activeDocIds);

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
  }, [getDocPendingCount, activeDocIds, activeDocuments, totalDocsCount, getPartnerById]);

  // Build the 5 summary cards
  const summaryCards = useMemo((): SummaryCardData[] => {
    let immediateAttention = 0;
    let comercialStalled = 0;
    let parceiroStalled = 0;
    let bancoStalled = 0;
    let cadastroStalled = 0;

    registrations.forEach(reg => {
      const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);
      if (isTerminal) return;

      const data = getRegData(reg);

      if (isImmediateAttention(reg, data.daysInProcess, data.pendingDocsCount)) {
        immediateAttention++;
      }

      if (isStalledOver7(data.daysSinceLastUpdate)) {
        if (reg.handlingWith === 'Comercial') comercialStalled++;
        if (reg.handlingWith === 'Parceiro') parceiroStalled++;
        if (reg.handlingWith === 'Banco') bancoStalled++;
        if (reg.handlingWith === 'Cadastro') cadastroStalled++;
      }
    });

    return [
      {
        key: 'immediate',
        label: 'Atenção Imediata',
        subtitle: 'Prazo, documentos ou alerta crítico',
        tooltip: 'Cadastros com prazo acima de 30 dias sem conclusão, documentos pendentes ou sinalização crítica manual.',
        value: immediateAttention,
        icon: AlertTriangle,
        color: 'text-destructive',
        pulse: immediateAttention > 0,
      },
      {
        key: 'comercial_stalled',
        label: 'Comercial > 7 dias',
        subtitle: 'Tratando com Comercial',
        tooltip: 'Contratos parados há mais de 7 dias com responsabilidade do Comercial.',
        value: comercialStalled,
        icon: UserCog,
        color: 'text-warning',
      },
      {
        key: 'parceiro_stalled',
        label: 'Parceiro > 7 dias',
        subtitle: 'Aguardando Parceiro',
        tooltip: 'Contratos parados há mais de 7 dias aguardando ação do Parceiro.',
        value: parceiroStalled,
        icon: Users,
        color: 'text-info',
      },
      {
        key: 'banco_stalled',
        label: 'Banco > 7 dias',
        subtitle: 'Aguardando Banco',
        tooltip: 'Contratos parados há mais de 7 dias aguardando tratativa com o Banco.',
        value: bancoStalled,
        icon: Building2,
        color: 'text-primary',
      },
      {
        key: 'cadastro_stalled',
        label: 'Cadastro > 7 dias',
        subtitle: 'Tratando com Cadastro',
        tooltip: 'Contratos parados há mais de 7 dias com pendência no time de Cadastro.',
        value: cadastroStalled,
        icon: ClipboardList,
        color: 'text-violet-500',
      },
    ];
  }, [registrations, getRegData]);

  /** Filter function: given a card key, returns a predicate for registrations */
  const getSummaryFilter = useCallback((cardKey: string) => {
    return (reg: Registration): boolean => {
      const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);
      if (isTerminal) return false;
      const data = getRegData(reg);

      switch (cardKey) {
        case 'immediate':
          return isImmediateAttention(reg, data.daysInProcess, data.pendingDocsCount);
        case 'comercial_stalled':
          return reg.handlingWith === 'Comercial' && isStalledOver7(data.daysSinceLastUpdate);
        case 'parceiro_stalled':
          return reg.handlingWith === 'Parceiro' && isStalledOver7(data.daysSinceLastUpdate);
        case 'banco_stalled':
          return reg.handlingWith === 'Banco' && isStalledOver7(data.daysSinceLastUpdate);
        case 'cadastro_stalled':
          return reg.handlingWith === 'Cadastro' && isStalledOver7(data.daysSinceLastUpdate);
        default:
          return true;
      }
    };
  }, [getRegData]);

  return { getRegData, summaryCards, getSummaryFilter, STAGE_OWNERS };
}
