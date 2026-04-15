import { useMemo, useCallback } from 'react';
import { usePartners } from '@/hooks/usePartners';
import { useInfoData } from '@/hooks/useInfoData';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { Registration } from '@/data/registrations';
import { differenceInDays } from 'date-fns';
import { AlertTriangle, UserCog, Users, Building2, ClipboardList } from 'lucide-react';
import { SummaryCardData } from '@/components/cadastro/RegistrationOperationalSummary';
import { getSlaRules } from '@/hooks/useSlaRules';

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
  const sla = getSlaRules();
  if (reg.status === 'Concluído') return 'Cadastro finalizado';
  if (reg.status === 'Cancelado') return 'Processo encerrado';
  if (reg.status === 'Em pausa') return 'Reativar cadastro';

  if (reg.status === 'Não iniciado') return 'Iniciar coleta de documentação';
  if (reg.status === 'Colhendo documentação') {
    if (pendingDocs > 0) return 'Coletar documentos pendentes';
    return 'Enviar documentação ao banco';
  }
  if (reg.status === 'Em análise') {
    if (daysSinceLastUpdate > sla.slaBanco) return 'Cobrar retorno do banco';
    return 'Aguardar retorno do banco';
  }
  if (reg.status === 'Colhendo assinaturas') return 'Obter assinaturas pendentes';

  return 'Acompanhar andamento';
}

/** Checks if a registration qualifies for "Atenção Imediata" */
function isImmediateAttention(reg: Registration, daysInProcess: number, pendingDocsCount: number): boolean {
  const sla = getSlaRules();
  if (daysInProcess >= sla.immediateAttentionDays) return true;
  if (sla.immediateAttentionPendingDocs && pendingDocsCount > 0) return true;
  if (sla.immediateAttentionManualCritical && reg.isCritical) return true;
  return false;
}

/** Checks if a registration is stalled based on SLA context threshold */
function isStalledByContext(daysSinceLastUpdate: number, context: string): boolean {
  const sla = getSlaRules();
  const contextMap: Record<string, number> = {
    'Comercial': sla.slaComercial,
    'Parceiro': sla.slaParceiro,
    'Banco': sla.slaBanco,
    'Cadastro': sla.slaCadastro,
  };
  const threshold = contextMap[context] ?? sla.slaComercial;
  return daysSinceLastUpdate > threshold;
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

    const slaConfig = getSlaRules();
    let criticality: RegistrationCriticality = 'baixa';
    const isTerminal = ['Concluído', 'Cancelado'].includes(reg.status);
    if (!isTerminal) {
      const stalledThreshold = slaConfig.immediateAttentionDays / 2; // half of attention threshold for high
      if (reg.status === 'Em pausa' || (slaConfig.criticalityByStalledTime && daysSinceLastUpdate > stalledThreshold)) {
        criticality = 'alta';
      } else if (isStalledByContext(daysSinceLastUpdate, reg.handlingWith)) {
        criticality = 'média';
      }
    }

    const isBlocked = !isTerminal && daysSinceLastUpdate > slaConfig.immediateAttentionDays / 2;
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

      if (reg.handlingWith === 'Comercial' && isStalledByContext(data.daysSinceLastUpdate, 'Comercial')) comercialStalled++;
      if (reg.handlingWith === 'Parceiro' && isStalledByContext(data.daysSinceLastUpdate, 'Parceiro')) parceiroStalled++;
      if (reg.handlingWith === 'Banco' && isStalledByContext(data.daysSinceLastUpdate, 'Banco')) bancoStalled++;
      if (reg.handlingWith === 'Cadastro' && isStalledByContext(data.daysSinceLastUpdate, 'Cadastro')) cadastroStalled++;
    });

    const sla = getSlaRules();
    return [
      {
        key: 'immediate',
        label: 'Atenção Imediata',
        subtitle: 'Prazo, documentos ou alerta crítico',
        tooltip: `Cadastros sem movimentação há ${sla.immediateAttentionDays}+ dias, documentos pendentes ou sinalização crítica.`,
        value: immediateAttention,
        icon: AlertTriangle,
        color: 'text-destructive',
        pulse: immediateAttention > 0,
      },
      {
        key: 'comercial_stalled',
        label: `Comercial > ${sla.slaComercial} dias`,
        subtitle: 'Tratando com Comercial',
        tooltip: `Contratos parados há mais de ${sla.slaComercial} dias com responsabilidade do Comercial.`,
        value: comercialStalled,
        icon: UserCog,
        color: 'text-warning',
      },
      {
        key: 'parceiro_stalled',
        label: `Parceiro > ${sla.slaParceiro} dias`,
        subtitle: 'Aguardando Parceiro',
        tooltip: `Contratos parados há mais de ${sla.slaParceiro} dias aguardando ação do Parceiro.`,
        value: parceiroStalled,
        icon: Users,
        color: 'text-info',
      },
      {
        key: 'banco_stalled',
        label: `Banco > ${sla.slaBanco} dias`,
        subtitle: 'Aguardando Banco',
        tooltip: `Contratos parados há mais de ${sla.slaBanco} dias aguardando tratativa com o Banco.`,
        value: bancoStalled,
        icon: Building2,
        color: 'text-primary',
      },
      {
        key: 'cadastro_stalled',
        label: `Cadastro > ${sla.slaCadastro} dias`,
        subtitle: 'Tratando com Cadastro',
        tooltip: `Contratos parados há mais de ${sla.slaCadastro} dias com pendência no time de Cadastro.`,
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
          return reg.handlingWith === 'Comercial' && isStalledByContext(data.daysSinceLastUpdate, 'Comercial');
        case 'parceiro_stalled':
          return reg.handlingWith === 'Parceiro' && isStalledByContext(data.daysSinceLastUpdate, 'Parceiro');
        case 'banco_stalled':
          return reg.handlingWith === 'Banco' && isStalledByContext(data.daysSinceLastUpdate, 'Banco');
        case 'cadastro_stalled':
          return reg.handlingWith === 'Cadastro' && isStalledByContext(data.daysSinceLastUpdate, 'Cadastro');
        default:
          return true;
      }
    };
  }, [getRegData]);

  return { getRegData, summaryCards, getSummaryFilter, STAGE_OWNERS };
}
