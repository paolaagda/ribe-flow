import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';
import { BANKS } from '@/data/mock-data';

// ============ TYPES ============

export interface InfoBank {
  id: string;
  name: string;
  imageUrl: string;
  active: boolean;
}

export interface InfoDocument {
  id: string;
  name: string;
  active: boolean;
  bankIds: string[]; // linked bank IDs
}

export interface InfoUserProcess {
  id: string;
  type: 'aprovador' | 'digitador';
  title: string;
  documents: string[];
  data: string[];
  steps: string[];
  active: boolean;
}

export interface InfoLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  active: boolean;
}

export interface InfoOperationalField {
  id: string;
  name: string;
  active: boolean;
  bankIds: string[];
}

// ============ INITIAL DATA ============

const bankLogos: Record<string, string> = {
  BMG: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Logo_BMG.svg/512px-Logo_BMG.svg.png',
  Bradesco: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Bradesco_logo_%28horizontal%29.svg/512px-Bradesco_logo_%28horizontal%29.svg.png',
  'Banco do Brasil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Banco_do_Brasil_logo.svg/512px-Banco_do_Brasil_logo.svg.png',
  BV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/BV_logo.svg/512px-BV_logo.svg.png',
  C6: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/C6_Bank_logo.svg/512px-C6_Bank_logo.svg.png',
  Crefaz: '',
  Crefisa: '',
  Daycoval: '',
  Digio: '',
  Finanto: '',
  Icred: '',
  Itaú: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banco_Ita%C3%BA_logo.svg/512px-Banco_Ita%C3%BA_logo.svg.png',
  Mercantil: '',
  'Novo Saque': '',
  PAN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Logo_Banco_Pan.svg/512px-Logo_Banco_Pan.svg.png',
  Paulista: '',
  Safra: '',
  Santander: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/512px-Banco_Santander_Logotipo.svg.png',
};

const initialBanks: InfoBank[] = [
  ...BANKS.map((name, i) => ({
    id: `ib-${i}-${name.slice(0, 6)}`,
    name,
    imageUrl: bankLogos[name] || '',
    active: true,
  })),
  { id: 'ib-bradesco', name: 'Bradesco', imageUrl: bankLogos['Bradesco'] || '', active: true },
  { id: 'ib-bb', name: 'Banco do Brasil', imageUrl: bankLogos['Banco do Brasil'] || '', active: true },
  { id: 'ib-bv', name: 'BV', imageUrl: bankLogos['BV'] || '', active: true },
  { id: 'ib-crefaz', name: 'Crefaz', imageUrl: '', active: true },
  { id: 'ib-crefisa', name: 'Crefisa', imageUrl: '', active: true },
  { id: 'ib-mercantil', name: 'Mercantil', imageUrl: '', active: true },
  { id: 'ib-novosaque', name: 'Novo Saque', imageUrl: '', active: true },
  { id: 'ib-paulista', name: 'Paulista', imageUrl: '', active: true },
  { id: 'ib-safra', name: 'Safra', imageUrl: '', active: true },
  { id: 'ib-santander', name: 'Santander', imageUrl: bankLogos['Santander'] || '', active: true },
  { id: 'ib-pan', name: 'PAN', imageUrl: bankLogos['PAN'] || '', active: true },
];

const initialDocuments: InfoDocument[] = [
  { id: 'doc-1', name: 'Cartão CNPJ', active: true, bankIds: ['ib-0-Riber ', 'ib-bradesco', 'ib-1-Finant'] },
  { id: 'doc-2', name: 'Contrato Social', active: true, bankIds: ['ib-0-Riber ', 'ib-bradesco', 'ib-bb'] },
  { id: 'doc-3', name: 'RG / CNH dos Sócios', active: true, bankIds: ['ib-0-Riber ', 'ib-bradesco', 'ib-bb', 'ib-bv'] },
  { id: 'doc-4', name: 'Comprovante de Endereço', active: true, bankIds: ['ib-0-Riber ', 'ib-1-Finant', 'ib-2-Icred'] },
  { id: 'doc-5', name: 'Certidão Negativa de Débitos', active: true, bankIds: ['ib-bradesco', 'ib-bb'] },
  { id: 'doc-6', name: 'Alvará de Funcionamento', active: true, bankIds: ['ib-0-Riber ', 'ib-1-Finant'] },
  { id: 'doc-7', name: 'Declaração de Faturamento', active: true, bankIds: [] },
  { id: 'doc-8', name: 'Foto da Fachada', active: true, bankIds: ['ib-0-Riber '] },
  { id: 'doc-9', name: 'Foto Interna do Estabelecimento', active: true, bankIds: [] },
  { id: 'doc-10', name: 'Certificado Digital', active: true, bankIds: [] },
];

const initialUserProcesses: InfoUserProcess[] = [
  {
    id: 'up-1',
    type: 'aprovador',
    title: 'Aprovador',
    documents: ['RG / CNH', 'Comprovante de Endereço', 'Certificado de Regularidade'],
    data: ['Nome completo', 'CPF', 'E-mail corporativo', 'Telefone'],
    steps: [
      'Solicitar credenciais ao gestor',
      'Preencher formulário de cadastro',
      'Enviar documentação digitalizada',
      'Aguardar validação do compliance',
      'Receber acesso ao sistema',
    ],
    active: true,
  },
  {
    id: 'up-2',
    type: 'digitador',
    title: 'Digitador',
    documents: ['RG / CNH', 'Comprovante de Endereço'],
    data: ['Nome completo', 'CPF', 'E-mail', 'Telefone'],
    steps: [
      'Solicitar acesso ao responsável',
      'Preencher ficha de cadastro',
      'Enviar cópias dos documentos',
      'Aguardar liberação de perfil',
      'Realizar treinamento inicial',
    ],
    active: true,
  },
];

const initialLinks: InfoLink[] = [
  { id: 'link-1', name: 'Portal do Agente', url: 'https://example.com/agente', icon: 'ExternalLink', active: true },
  { id: 'link-2', name: 'Central de Ajuda', url: 'https://example.com/ajuda', icon: 'HelpCircle', active: true },
  { id: 'link-3', name: 'Tabela de Comissões', url: 'https://example.com/comissoes', icon: 'Table', active: true },
];

const initialOperationalFields: InfoOperationalField[] = [
  { id: 'op-1', name: 'Chave PIX', active: true, bankIds: [] },
  { id: 'op-2', name: 'Regra de Repasse', active: true, bankIds: [] },
  { id: 'op-3', name: 'Prazo de Pagamento', active: true, bankIds: [] },
  { id: 'op-4', name: 'Forma de Pagamento', active: true, bankIds: [] },
  { id: 'op-5', name: 'Contato', active: true, bankIds: [] },
  { id: 'op-6', name: 'Observações', active: true, bankIds: [] },
];

// ============ HOOK ============

interface InfoDataState {
  banks: InfoBank[];
  documents: InfoDocument[];
  userProcesses: InfoUserProcess[];
  links: InfoLink[];
  operationalFields: InfoOperationalField[];
}

const initialState: InfoDataState = {
  banks: initialBanks,
  documents: initialDocuments,
  userProcesses: initialUserProcesses,
  links: initialLinks,
  operationalFields: initialOperationalFields,
};

export function useInfoData() {
  const [state, setState] = useLocalStorage<InfoDataState>('ribercred_info_data_v2', initialState);

  // === Banks ===
  const getBanks = useCallback(() => state.banks, [state.banks]);
  const getActiveBanks = useCallback(() => state.banks.filter(b => b.active), [state.banks]);

  const addBank = useCallback((name: string, imageUrl: string) => {
    setState(prev => ({
      ...prev,
      banks: [...prev.banks, { id: `ib-${Date.now()}`, name, imageUrl, active: true }],
    }));
  }, [setState]);

  const updateBank = useCallback((id: string, updates: Partial<Pick<InfoBank, 'name' | 'imageUrl'>>) => {
    setState(prev => ({
      ...prev,
      banks: prev.banks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, [setState]);

  const toggleBank = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      banks: prev.banks.map(b => b.id === id ? { ...b, active: !b.active } : b),
    }));
  }, [setState]);

  // === Documents ===
  const getDocuments = useCallback(() => state.documents, [state.documents]);
  const getActiveDocuments = useCallback(() => state.documents.filter(d => d.active), [state.documents]);

  const getDocumentsForBank = useCallback((bankId: string) => {
    return state.documents.filter(d => d.active && d.bankIds.includes(bankId));
  }, [state.documents]);

  const getAllActiveDocuments = useCallback(() => {
    return state.documents.filter(d => d.active);
  }, [state.documents]);

  const addDocument = useCallback((name: string, bankIds: string[]) => {
    setState(prev => ({
      ...prev,
      documents: [...prev.documents, { id: `doc-${Date.now()}`, name, active: true, bankIds }],
    }));
  }, [setState]);

  const updateDocument = useCallback((id: string, updates: Partial<Pick<InfoDocument, 'name' | 'bankIds'>>) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, ...updates } : d),
    }));
  }, [setState]);

  const toggleDocument = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, active: !d.active } : d),
    }));
  }, [setState]);

  // === User Processes ===
  const getUserProcesses = useCallback(() => state.userProcesses, [state.userProcesses]);

  const updateUserProcess = useCallback((id: string, updates: Partial<Pick<InfoUserProcess, 'documents' | 'data' | 'steps'>>) => {
    setState(prev => ({
      ...prev,
      userProcesses: prev.userProcesses.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [setState]);

  // === Links ===
  const getLinks = useCallback(() => state.links, [state.links]);
  const getActiveLinks = useCallback(() => state.links.filter(l => l.active), [state.links]);

  const addLink = useCallback((name: string, url: string, icon: string) => {
    setState(prev => ({
      ...prev,
      links: [...prev.links, { id: `link-${Date.now()}`, name, url, icon, active: true }],
    }));
  }, [setState]);

  const updateLink = useCallback((id: string, updates: Partial<Pick<InfoLink, 'name' | 'url' | 'icon'>>) => {
    setState(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  }, [setState]);

  const deleteLink = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== id),
    }));
  }, [setState]);

  return {
    getBanks, getActiveBanks, addBank, updateBank, toggleBank,
    getDocuments, getActiveDocuments, getDocumentsForBank, getAllActiveDocuments, addDocument, updateDocument, toggleDocument,
    getUserProcesses, updateUserProcess,
    getLinks, getActiveLinks, addLink, updateLink, deleteLink,
  };
}
