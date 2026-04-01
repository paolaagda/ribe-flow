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
  contractConfirmed: boolean;
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
    requestedAt: '2025-01-15', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-01-20', time: '14:32', userId: 'u10', text: 'Solicitado documentação ao parceiro.' },
      { date: '2025-02-05', time: '09:10', userId: 'u4', text: 'Parceiro enviou parte dos documentos.' },
      { date: '2025-02-18', time: '16:00', userId: 'u10', text: 'Faltam apenas 2 documentos para completar.' },
    ],
  },
  {
    id: 'reg2', partnerId: 'p2', bank: 'BMG', cnpj: '23.456.789/0001-02', commercialUserId: 'u4',
    observation: 'Análise de compliance em andamento.',
    status: 'Em análise', solicitation: 'Indicado', handlingWith: 'Banco', code: 'BMG-012',
    requestedAt: '2025-01-10', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-01-18', time: '09:15', userId: 'u10', text: 'Documentação enviada ao banco.' },
      { date: '2025-02-01', time: '11:30', userId: 'u10', text: 'Banco solicitou comprovante de endereço atualizado.' },
      { date: '2025-02-10', time: '14:00', userId: 'u4', text: 'Documento reenviado ao banco.' },
    ],
  },
  {
    id: 'reg3', partnerId: 'p4', bank: 'C6', cnpj: '45.678.901/0001-04', commercialUserId: 'u5',
    observation: 'Credenciamento finalizado com sucesso.',
    status: 'Concluído', solicitation: 'Substabelecido EGV', handlingWith: 'Cadastro', code: 'C6-088',
    requestedAt: '2024-11-05', completedAt: '2025-01-02', contractConfirmed: true,
    updates: [
      { date: '2024-11-10', time: '10:00', userId: 'u10', text: 'Documentação recebida e verificada.' },
      { date: '2024-12-05', time: '15:30', userId: 'u10', text: 'Enviado ao banco para análise.' },
      { date: '2025-01-02', time: '16:45', userId: 'u10', text: 'Código ativo no banco. Credenciamento concluído.' },
    ],
  },
  {
    id: 'reg4', partnerId: 'p6', bank: 'ICRED', cnpj: '67.890.123/0001-06', commercialUserId: 'u4',
    observation: 'Parceiro precisa assinar procuração.',
    status: 'Colhendo assinaturas', solicitation: 'SUB - Migração de Promotora', handlingWith: 'Jurídico RIBER', code: '',
    requestedAt: '2025-02-01', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-02-10', time: '11:20', userId: 'u10', text: 'Encaminhado modelo de procuração.' },
      { date: '2025-02-25', time: '09:00', userId: 'u4', text: 'Parceiro informou que assinará na próxima semana.' },
    ],
  },
  {
    id: 'reg5', partnerId: 'p10', bank: 'PAN', cnpj: '01.234.567/0001-10', commercialUserId: 'u4',
    observation: 'Processo pausado a pedido do parceiro.',
    status: 'Em pausa', solicitation: 'Indicado', handlingWith: 'Comercial', code: 'PAN-045',
    requestedAt: '2024-12-20', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-01-15', time: '10:05', userId: 'u4', text: 'Parceiro solicitou pausa temporária.' },
      { date: '2025-03-01', time: '08:30', userId: 'u4', text: 'Tentando retomar contato com o parceiro.' },
    ],
  },
  {
    id: 'reg6', partnerId: 'p3', bank: 'DIGIO', cnpj: '34.567.890/0001-03', commercialUserId: 'u5',
    observation: 'Cancelado por falta de documentação.',
    status: 'Cancelado', solicitation: 'IND - Migração de Promotora', handlingWith: 'Parceiro', code: '',
    requestedAt: '2024-10-10', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2024-11-20', time: '15:30', userId: 'u10', text: 'Parceiro não enviou documentos no prazo.' },
      { date: '2024-12-01', time: '10:00', userId: 'u5', text: 'Processo encerrado por inatividade.' },
    ],
  },
  {
    id: 'reg7', partnerId: 'p11', bank: 'FINANTO', cnpj: '11.223.344/0001-11', commercialUserId: 'u5',
    observation: 'Início do processo de credenciamento.',
    status: 'Não iniciado', solicitation: 'Substabelecido', handlingWith: 'Cadastro', code: '',
    requestedAt: '2025-03-01', completedAt: null, contractConfirmed: false,
    updates: [],
  },
  {
    id: 'reg8', partnerId: 'p15', bank: 'BMG', cnpj: '55.667.788/0001-15', commercialUserId: 'u6',
    observation: 'Documentação completa, aguardando análise do banco.',
    status: 'Em análise', solicitation: 'Substabelecido EGV', handlingWith: 'Banco', code: 'BMG-099',
    requestedAt: '2025-02-15', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-02-20', time: '08:50', userId: 'u10', text: 'Todos os documentos foram enviados.' },
      { date: '2025-03-10', time: '14:20', userId: 'u10', text: 'Banco informou prazo de 10 dias úteis.' },
    ],
  },
  // Novos registros para cobrir mais cenários
  {
    id: 'reg9', partnerId: 'p5', bank: 'PAN', cnpj: '56.789.012/0001-05', commercialUserId: 'u6',
    observation: 'Parceiro pequeno, avaliando viabilidade.',
    status: 'Colhendo documentação', solicitation: 'Indicado', handlingWith: 'Comercial', code: '',
    requestedAt: '2025-03-20', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-03-20', time: '10:00', userId: 'u6', text: 'Solicitação de cadastro criada após visita.' },
      { date: '2025-03-25', time: '16:00', userId: 'u6', text: 'Parceiro enviou CNPJ e RG dos sócios.' },
    ],
  },
  {
    id: 'reg10', partnerId: 'p8', bank: 'C6', cnpj: '89.012.345/0001-08', commercialUserId: 'u5',
    observation: 'Processo iniciado, documentação sendo coletada.',
    status: 'Colhendo documentação', solicitation: 'Substabelecido', handlingWith: 'Parceiro', code: '',
    requestedAt: '2025-03-18', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-03-18', time: '11:00', userId: 'u5', text: 'Cadastro solicitado durante visita remota.' },
    ],
  },
  {
    id: 'reg11', partnerId: 'p12', bank: 'FINANTO', cnpj: '22.334.455/0001-12', commercialUserId: 'u6',
    observation: 'Credenciamento concluído rapidamente.',
    status: 'Concluído', solicitation: 'Substabelecido', handlingWith: 'Cadastro', code: 'FNT-042',
    requestedAt: '2025-01-05', completedAt: '2025-02-10', contractConfirmed: true,
    updates: [
      { date: '2025-01-10', time: '09:00', userId: 'u10', text: 'Documentos recebidos.' },
      { date: '2025-01-25', time: '14:30', userId: 'u10', text: 'Enviado ao banco.' },
      { date: '2025-02-10', time: '10:15', userId: 'u10', text: 'Credenciamento ativado.' },
    ],
  },
  {
    id: 'reg12', partnerId: 'p13', bank: 'BMG', cnpj: '33.445.566/0001-13', commercialUserId: 'u4',
    observation: 'Região com baixo potencial, mas parceiro insistiu.',
    status: 'Não iniciado', solicitation: 'Indicado', handlingWith: 'Cadastro', code: '',
    requestedAt: '2025-03-28', completedAt: null, contractConfirmed: false,
    updates: [],
  },
  {
    id: 'reg13', partnerId: 'p14', bank: 'ICRED', cnpj: '44.556.677/0001-14', commercialUserId: 'u5',
    observation: 'Aguardando retorno do jurídico sobre contrato.',
    status: 'Colhendo assinaturas', solicitation: 'SUB - Migração de Promotora', handlingWith: 'Jurídico RIBER', code: '',
    requestedAt: '2025-02-20', completedAt: null, contractConfirmed: false,
    updates: [
      { date: '2025-02-25', time: '10:00', userId: 'u10', text: 'Contrato enviado para revisão jurídica.' },
      { date: '2025-03-15', time: '09:30', userId: 'u10', text: 'Jurídico solicitou ajustes na cláusula 5.' },
    ],
  },
];
