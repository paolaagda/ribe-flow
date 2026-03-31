export interface RegistrationUpdate {
  date: string;
  time: string;
  userId: string;
  text: string;
}

export interface Registration {
  id: string;
  partnerId: string;
  bank: string;
  cnpj: string;
  commercialUserId: string;
  observation: string;
  status: string;
  solicitation: string;
  handlingWith: string;
  code: string;
  requestedAt: string;
  completedAt: string | null;
  updates: RegistrationUpdate[];
}

export const REGISTRATION_STATUSES = [
  'Não iniciado',
  'Colhendo documentação',
  'Em análise',
  'Colhendo assinaturas',
  'Concluído',
  'Em pausa',
  'Cancelado',
] as const;

export const REGISTRATION_SOLICITATIONS = [
  'Substabelecido',
  'Substabelecido EGV',
  'Indicado',
  'SUB - Migração de Promotora',
  'IND - Migração de Promotora',
] as const;

export const REGISTRATION_HANDLERS = [
  'Banco',
  'Parceiro',
  'Comercial',
  'Cadastro',
  'Lucas',
  'Jurídico RIBER',
  'Gerente',
  'ASCOM',
  'Fauzi',
  'Lupércio',
] as const;

export const REGISTRATION_BANKS = [
  'FINANTO',
  'BMG',
  'ICRED',
  'PAN',
  'C6',
  'DIGIO',
] as const;

export const statusColors: Record<string, string> = {
  'Não iniciado': 'bg-muted text-muted-foreground',
  'Colhendo documentação': 'bg-info/10 text-info',
  'Em análise': 'bg-warning/10 text-warning',
  'Colhendo assinaturas': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'Concluído': 'bg-success/10 text-success',
  'Em pausa': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Cancelado': 'bg-destructive/10 text-destructive',
};

export const mockRegistrations: Registration[] = [
  {
    id: 'reg1', partnerId: 'p1', bank: 'FINANTO', cnpj: '12.345.678/0001-01', commercialUserId: 'u4',
    observation: 'Aguardando envio do contrato social atualizado.',
    status: 'Colhendo documentação', solicitation: 'Substabelecido', handlingWith: 'Parceiro', code: 'FNT-001',
    requestedAt: '2025-01-15', completedAt: null,
    updates: [{ date: '2025-01-20', time: '14:32', userId: 'u10', text: 'Solicitado documentação ao parceiro.' }],
  },
  {
    id: 'reg2', partnerId: 'p2', bank: 'BMG', cnpj: '23.456.789/0001-02', commercialUserId: 'u4',
    observation: 'Análise de compliance em andamento.',
    status: 'Em análise', solicitation: 'Indicado', handlingWith: 'Banco', code: 'BMG-012',
    requestedAt: '2025-01-10', completedAt: null,
    updates: [{ date: '2025-01-18', time: '09:15', userId: 'u10', text: 'Documentação enviada ao banco.' }],
  },
  {
    id: 'reg3', partnerId: 'p4', bank: 'C6', cnpj: '45.678.901/0001-04', commercialUserId: 'u5',
    observation: 'Credenciamento finalizado com sucesso.',
    status: 'Concluído', solicitation: 'Substabelecido EGV', handlingWith: 'Cadastro', code: 'C6-088',
    requestedAt: '2024-11-05', completedAt: '2025-01-02',
    updates: [{ date: '2025-01-02', time: '16:45', userId: 'u10', text: 'Código ativo no banco.' }],
  },
  {
    id: 'reg4', partnerId: 'p6', bank: 'ICRED', cnpj: '67.890.123/0001-06', commercialUserId: 'u4',
    observation: 'Parceiro precisa assinar procuração.',
    status: 'Colhendo assinaturas', solicitation: 'SUB - Migração de Promotora', handlingWith: 'Jurídico RIBER', code: '',
    requestedAt: '2025-02-01', completedAt: null,
    updates: [{ date: '2025-02-10', time: '11:20', userId: 'u10', text: 'Encaminhado modelo de procuração.' }],
  },
  {
    id: 'reg5', partnerId: 'p10', bank: 'PAN', cnpj: '01.234.567/0001-10', commercialUserId: 'u4',
    observation: 'Processo pausado a pedido do parceiro.',
    status: 'Em pausa', solicitation: 'Indicado', handlingWith: 'Comercial', code: 'PAN-045',
    requestedAt: '2024-12-20', completedAt: null,
    updates: [{ date: '2025-01-15', userId: 'u4', text: 'Parceiro solicitou pausa temporária.' }],
  },
  {
    id: 'reg6', partnerId: 'p3', bank: 'DIGIO', cnpj: '34.567.890/0001-03', commercialUserId: 'u5',
    observation: 'Cancelado por falta de documentação.',
    status: 'Cancelado', solicitation: 'IND - Migração de Promotora', handlingWith: 'Parceiro', code: '',
    requestedAt: '2024-10-10', completedAt: null,
    updates: [{ date: '2024-11-20', userId: 'u10', text: 'Parceiro não enviou documentos no prazo.' }],
  },
  {
    id: 'reg7', partnerId: 'p11', bank: 'FINANTO', cnpj: '11.223.344/0001-11', commercialUserId: 'u5',
    observation: 'Início do processo de credenciamento.',
    status: 'Não iniciado', solicitation: 'Substabelecido', handlingWith: 'Cadastro', code: '',
    requestedAt: '2025-03-01', completedAt: null,
    updates: [],
  },
  {
    id: 'reg8', partnerId: 'p15', bank: 'BMG', cnpj: '55.667.788/0001-15', commercialUserId: 'u6',
    observation: 'Documentação completa, aguardando análise do banco.',
    status: 'Em análise', solicitation: 'Substabelecido EGV', handlingWith: 'Banco', code: 'BMG-099',
    requestedAt: '2025-02-15', completedAt: null,
    updates: [{ date: '2025-02-20', userId: 'u10', text: 'Todos os documentos foram enviados.' }],
  },
];
