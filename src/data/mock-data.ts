// ============ TYPES ============
export type CompanyCargo = 'diretor' | 'gerente' | 'ascom' | 'comercial' | 'cadastro';

// Keep UserRole as alias for backward compatibility
export type UserRole = CompanyCargo;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: UserRole;
  active: boolean;
}

export type VisitStatus = 'Planejada' | 'Concluída' | 'Reagendada' | 'Cancelada';
export type VisitType = 'visita' | 'prospecção';
export type VisitMedio = 'presencial' | 'remoto';

export const STORE_STRUCTURES = ['Help', 'Venda Online', 'Call-center', 'Loja balcão'] as const;
export const BANKS = ['Riber Seguros', 'Finanto', 'Icred', 'Itaú', 'Digio', 'Daycoval', 'C6', 'BMG'] as const;
export const PRODUCTS = ['Imobiliário', 'Veículos', 'INSS', 'Cartão Benefício/Consignado', 'FGTS', 'CLT', 'Seguros', 'Convênios Públicos', 'CNC'] as const;

export interface Partner {
  id: string;
  name: string;
  razaoSocial: string;
  cnpj: string;
  address: string;
  lat: number;
  lng: number;
  structures: string[];
  potential: 'alto' | 'médio' | 'baixo';
  phone: string;
  contact: string;
  responsibleUserId: string;
}

export interface InvitedUser {
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export type TaskCategory = 'document' | 'data' | 'general';

export interface VisitComment {
  id: string;
  userId: string;
  text: string;
  type: 'observation' | 'task';
  taskCompleted?: boolean;
  taskCategory?: TaskCategory;
  taskSourceId?: string; // doc id or field id for sync
  taskBankName?: string;
  parentId?: string;
  createdAt: string;
}

export type VisitPeriod = 'manhã' | 'tarde';

export const RESCHEDULE_REASONS = [
  'Cliente solicitou nova data',
  'Conflito de agenda interna',
  'Cliente indisponível no horário',
  'Replanejamento estratégico',
  'Problemas operacionais',
] as const;

export const CANCEL_REASONS = [
  'Cliente não tem interesse',
  'Cliente não respondeu',
  'Dados incorretos ou inválidos',
  'Problema interno',
  'Parceiro descredenciado',
] as const;

export interface Visit {
  id: string;
  partnerId: string;
  userId: string;
  createdBy: string;
  invitedUsers: InvitedUser[];
  date: string;
  time: string;
  period: VisitPeriod;
  type: VisitType;
  medio: VisitMedio;
  status: VisitStatus;
  structures: string[];
  banks: string[];
  products: string[];
  observations: string;
  summary: string;
  potentialValue?: number; // centavos
  prospectEmail?: string;
  rescheduleReason?: string;
  cancelReason?: string;
  statusChangedAt?: string;
  comments: VisitComment[];
  prospectPartner?: string;
  prospectCnpj?: string;
  prospectAddress?: string;
  prospectPhone?: string;
  prospectContact?: string;
  convertedToPartnerId?: string;
}

// ============ CARGO LABELS & COLORS ============
export const cargoLabels: Record<CompanyCargo, string> = {
  diretor: 'Diretor',
  gerente: 'Gerente',
  ascom: 'ASCOM',
  comercial: 'Comercial',
  cadastro: 'Cadastro',
};

export const cargoColors: Record<CompanyCargo, string> = {
  diretor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  gerente: 'bg-info/10 text-info',
  ascom: 'bg-warning/10 text-warning',
  comercial: 'bg-success/10 text-success',
  cadastro: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};


export const allCargos: CompanyCargo[] = ['diretor', 'gerente', 'ascom', 'comercial', 'cadastro'];

// ============ MOCK USERS ============
export const mockUsers: User[] = [
  { id: 'u1', name: 'Carlos Silva', email: 'carlos@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Carlos+Silva&background=6366f1&color=fff&size=128&bold=true', bio: 'Diretor geral da equipe comercial', role: 'diretor', active: true },
  { id: 'u9', name: 'Lucas Ribeiro', email: 'lucas@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Lucas+Ribeiro&background=8b5cf6&color=fff&size=128&bold=true', bio: 'Diretor comercial — estratégia e expansão', role: 'diretor', active: true },
  { id: 'u2', name: 'Ana Oliveira', email: 'ana@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Ana+Oliveira&background=ec4899&color=fff&size=128&bold=true', bio: 'Gerente regional Sul', role: 'gerente', active: true },
  { id: 'u3', name: 'Pedro Santos', email: 'pedro@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Pedro+Santos&background=f59e0b&color=fff&size=128&bold=true', bio: 'Assessor de comunicação', role: 'ascom', active: true },
  { id: 'u4', name: 'Maria Souza', email: 'maria@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Maria+Souza&background=10b981&color=fff&size=128&bold=true', bio: 'Comercial sênior — 5 anos de experiência', role: 'comercial', active: true },
  { id: 'u5', name: 'João Costa', email: 'joao@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Joao+Costa&background=3b82f6&color=fff&size=128&bold=true', bio: 'Comercial pleno', role: 'comercial', active: true },
  { id: 'u6', name: 'Fernanda Lima', email: 'fernanda@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=f43f5e&color=fff&size=128&bold=true', bio: 'Comercial júnior', role: 'comercial', active: true },
  { id: 'u7', name: 'Ricardo Alves', email: 'ricardo@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Ricardo+Alves&background=0ea5e9&color=fff&size=128&bold=true', bio: 'Gerente regional Norte', role: 'gerente', active: true },
  { id: 'u8', name: 'Juliana Mendes', email: 'juliana@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Juliana+Mendes&background=a855f7&color=fff&size=128&bold=true', bio: 'Comercial pleno — foco INSS', role: 'comercial', active: false },
  { id: 'u10', name: 'Tatiana Freitas', email: 'tatiana@ribercred.com', avatar: 'https://ui-avatars.com/api/?name=Tatiana+Freitas&background=14b8a6&color=fff&size=128&bold=true', bio: 'Responsável por credenciamento bancário', role: 'cadastro', active: true },
];

// ============ STORE (LOJA) ============
export interface Store {
  id: string;
  partnerId: string;
  name: string;
  address: string;
  phone: string;
  contact: string;
}

export const mockStores: Store[] = [
  { id: 's1', partnerId: 'p6', name: 'Mega Financeira — Filial Centro', address: 'Rua da Bahia, 200 — Belo Horizonte, MG', phone: '(31) 3000-2001', contact: 'Carla Vieira' },
  { id: 's2', partnerId: 'p6', name: 'Mega Financeira — Filial Savassi', address: 'Av. Cristóvão Colombo, 500 — Belo Horizonte, MG', phone: '(31) 3000-2002', contact: 'Fernando Reis' },
  { id: 's3', partnerId: 'p1', name: 'Crédito Fácil — Filial Pinheiros', address: 'Rua dos Pinheiros, 800 — São Paulo, SP', phone: '(11) 3000-2003', contact: 'Roberto Dias' },
  { id: 's4', partnerId: 'p10', name: 'Sul Empréstimos — Filial Moinhos', address: 'Rua Padre Chagas, 150 — Porto Alegre, RS', phone: '(51) 3000-2004', contact: 'Daniel Moreira' },
];

// ============ MOCK PARTNERS ============
export const mockPartners: Partner[] = [
  { id: 'p1', name: 'Loja Crédito Fácil', razaoSocial: 'Crédito Fácil Ltda', cnpj: '12.345.678/0001-01', address: 'Rua Augusta, 1200 — São Paulo, SP', lat: -23.5505, lng: -46.6333, structures: ['Help', 'Loja balcão'], potential: 'alto', phone: '(11) 3000-1001', contact: 'Roberto Dias', responsibleUserId: 'u4' },
  { id: 'p2', name: 'Financeira Express', razaoSocial: 'Express Financeira S.A.', cnpj: '23.456.789/0001-02', address: 'Av. Paulista, 900 — São Paulo, SP', lat: -23.5615, lng: -46.6559, structures: ['Venda Online', 'Call-center'], potential: 'alto', phone: '(11) 3000-1002', contact: 'Marcia Rocha', responsibleUserId: 'u4' },
  { id: 'p3', name: 'Casa do Empréstimo', razaoSocial: 'Casa do Empréstimo ME', cnpj: '34.567.890/0001-03', address: 'Rua XV de Novembro, 300 — Curitiba, PR', lat: -25.4284, lng: -49.2733, structures: ['Loja balcão'], potential: 'médio', phone: '(41) 3000-1003', contact: 'Fábio Nunes', responsibleUserId: 'u5' },
  { id: 'p4', name: 'Consig Center', razaoSocial: 'Consig Center Ltda', cnpj: '45.678.901/0001-04', address: 'Av. Brasil, 500 — Rio de Janeiro, RJ', lat: -22.9068, lng: -43.1729, structures: ['Help', 'Call-center'], potential: 'alto', phone: '(21) 3000-1004', contact: 'Lúcia Ferreira', responsibleUserId: 'u5' },
  { id: 'p5', name: 'Ponto do Crédito', razaoSocial: 'Ponto do Crédito ME', cnpj: '56.789.012/0001-05', address: 'Rua Halfeld, 150 — Juiz de Fora, MG', lat: -21.7642, lng: -43.3503, structures: ['Loja balcão'], potential: 'baixo', phone: '(32) 3000-1005', contact: 'André Martins', responsibleUserId: 'u6' },
  { id: 'p6', name: 'Mega Financeira', razaoSocial: 'Mega Financeira S.A.', cnpj: '67.890.123/0001-06', address: 'Av. Afonso Pena, 800 — Belo Horizonte, MG', lat: -19.9167, lng: -43.9345, structures: ['Venda Online', 'Help'], potential: 'alto', phone: '(31) 3000-1006', contact: 'Carla Vieira', responsibleUserId: 'u4' },
  { id: 'p7', name: 'Crédito Popular', razaoSocial: 'Crédito Popular Ltda', cnpj: '78.901.234/0001-07', address: 'Av. Goiás, 200 — Goiânia, GO', lat: -16.6869, lng: -49.2648, structures: ['Loja balcão', 'Call-center'], potential: 'médio', phone: '(62) 3000-1007', contact: 'Paulo Ramos', responsibleUserId: 'u6' },
  { id: 'p8', name: 'Solução Financeira', razaoSocial: 'Solução Financeira ME', cnpj: '89.012.345/0001-08', address: 'Rua da Aurora, 50 — Recife, PE', lat: -8.0476, lng: -34.877, structures: ['Help'], potential: 'médio', phone: '(81) 3000-1008', contact: 'Renata Lopes', responsibleUserId: 'u5' },
  { id: 'p9', name: 'Norte Crédito', razaoSocial: 'Norte Crédito Ltda', cnpj: '90.123.456/0001-09', address: 'Av. Djalma Batista, 1100 — Manaus, AM', lat: -3.1190, lng: -60.0217, structures: ['Venda Online'], potential: 'baixo', phone: '(92) 3000-1009', contact: 'Thiago Araújo', responsibleUserId: 'u6' },
  { id: 'p10', name: 'Sul Empréstimos', razaoSocial: 'Sul Empréstimos S.A.', cnpj: '01.234.567/0001-10', address: 'Rua dos Andradas, 400 — Porto Alegre, RS', lat: -30.0346, lng: -51.2177, structures: ['Loja balcão', 'Help'], potential: 'alto', phone: '(51) 3000-1010', contact: 'Vanessa Castro', responsibleUserId: 'u4' },
  { id: 'p11', name: 'Capital Consig', razaoSocial: 'Capital Consig Ltda', cnpj: '11.223.344/0001-11', address: 'SBS Quadra 2, Brasília, DF', lat: -15.7942, lng: -47.8822, structures: ['Call-center', 'Venda Online'], potential: 'alto', phone: '(61) 3000-1011', contact: 'Marcos Pereira', responsibleUserId: 'u5' },
  { id: 'p12', name: 'Litoral Finanças', razaoSocial: 'Litoral Finanças ME', cnpj: '22.334.455/0001-12', address: 'Av. Atlântica, 600 — Florianópolis, SC', lat: -27.5954, lng: -48.5480, structures: ['Loja balcão'], potential: 'médio', phone: '(48) 3000-1012', contact: 'Aline Barros', responsibleUserId: 'u6' },
  { id: 'p13', name: 'Sertão Crédito', razaoSocial: 'Sertão Crédito ME', cnpj: '33.445.566/0001-13', address: 'Rua Barão do Rio Branco, 80 — Campina Grande, PB', lat: -7.2172, lng: -35.8811, structures: ['Help', 'Loja balcão'], potential: 'baixo', phone: '(83) 3000-1013', contact: 'Diego Souza', responsibleUserId: 'u4' },
  { id: 'p14', name: 'Centro Oeste Finanças', razaoSocial: 'Centro Oeste Finanças Ltda', cnpj: '44.556.677/0001-14', address: 'Av. Mato Grosso, 350 — Campo Grande, MS', lat: -20.4697, lng: -54.6201, structures: ['Call-center'], potential: 'médio', phone: '(67) 3000-1014', contact: 'Priscila Melo', responsibleUserId: 'u5' },
  { id: 'p15', name: 'Prime Consignado', razaoSocial: 'Prime Consignado S.A.', cnpj: '55.667.788/0001-15', address: 'Rua Chile, 120 — Salvador, BA', lat: -12.9714, lng: -38.5124, structures: ['Venda Online', 'Help', 'Loja balcão'], potential: 'alto', phone: '(71) 3000-1015', contact: 'Bruno Teixeira', responsibleUserId: 'u6' },
];

// ============ GENERATE VISITS ============
function generateVisits(): Visit[] {
  const statuses: VisitStatus[] = ['Planejada', 'Concluída', 'Reagendada', 'Cancelada'];
  const types: VisitType[] = ['visita', 'prospecção'];
  const medios: VisitMedio[] = ['presencial', 'remoto'];
  const visits: Visit[] = [];
  const today = new Date();

  const commercialUsers = mockUsers.filter(u => u.role === 'comercial');

  // Simple seeded pseudo-random for stable data across imports
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 55; i++) {
    const daysOffset = Math.floor(seededRandom() * 60) - 30;
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    const isPast = daysOffset < 0;
    const isToday = daysOffset === 0;

    let status: VisitStatus;
    if (isPast) {
      status = seededRandom() > 0.25 ? 'Concluída' : (seededRandom() > 0.5 ? 'Cancelada' : 'Reagendada');
    } else if (isToday) {
      status = seededRandom() > 0.5 ? 'Concluída' : 'Planejada';
    } else {
      status = 'Planejada';
    }

    const partner = mockPartners[Math.floor(seededRandom() * mockPartners.length)];
    const user = commercialUsers[Math.floor(seededRandom() * commercialUsers.length)];
    const type: VisitType = seededRandom() < 0.9 ? 'visita' : 'prospecção';

    const period: VisitPeriod = parseInt(visits.length > 0 ? '1' : '0') >= 0 && seededRandom() > 0.5 ? 'tarde' : 'manhã';
    const hour = 8 + Math.floor(seededRandom() * 10);
    const potentialValue = seededRandom() > 0.4 ? Math.floor(seededRandom() * 5000000) : undefined; // centavos

    visits.push({
      id: `v${i + 1}`,
      partnerId: partner.id,
      userId: user.id,
      createdBy: user.id,
      invitedUsers: [],
      date: d.toISOString().split('T')[0],
      time: `${hour}:${seededRandom() > 0.5 ? '00' : '30'}`,
      period,
      type,
      medio: medios[Math.floor(seededRandom() * medios.length)],
      status,
      structures: partner.structures.slice(0, Math.ceil(seededRandom() * partner.structures.length)),
      banks: [...BANKS].sort(() => seededRandom() - 0.5).slice(0, Math.ceil(seededRandom() * 3)),
      products: [...PRODUCTS].sort(() => seededRandom() - 0.5).slice(0, Math.ceil(seededRandom() * 4)),
      observations: status === 'Concluída' ? 'Reunião produtiva com o parceiro.' : '',
      summary: status === 'Concluída' ? 'Parceiro demonstrou interesse nos produtos apresentados.' : '',
      potentialValue,
      comments: i % 7 === 0 ? [
        { id: `c-gen-${i}-1`, userId: user.id, text: 'Verificar documentação pendente do parceiro.', type: 'observation' as const, createdAt: d.toISOString() },
        { id: `c-gen-${i}-2`, userId: user.id, text: 'Coletar assinatura no contrato', type: 'task' as const, taskCompleted: isPast, taskCategory: 'general' as const, createdAt: d.toISOString() },
      ] : i % 5 === 0 ? [
        { id: `c-gen-${i}-1`, userId: user.id, text: 'Parceiro solicitou informações sobre FGTS.', type: 'observation' as const, createdAt: d.toISOString() },
      ] : [],
    });
  }

  // ---- Visitas fixas para HOJE (garantir dados no dashboard) ----
  const todayStr = today.toISOString().split('T')[0];

  visits.push(
    {
      id: 'vt1', partnerId: 'p1', userId: 'u4', createdBy: 'u4', invitedUsers: [{ userId: 'u2', status: 'accepted' }, { userId: 'u3', status: 'pending' }],
      date: todayStr, time: '09:00', period: 'manhã', type: 'visita', medio: 'presencial', status: 'Concluída',
      structures: ['Help', 'Loja balcão'], banks: ['Riber Seguros', 'Itaú'], products: ['INSS', 'FGTS'],
      observations: 'Reunião produtiva, parceiro satisfeito.', summary: 'Alinhamento sobre metas do trimestre.',
      potentialValue: 1500000, comments: [
        { id: 'ct1-1', userId: 'u4', text: 'Parceiro muito receptivo, demonstrou interesse em ampliar portfólio.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15).toISOString() },
        { id: 'ct1-2', userId: 'u2', text: 'Confirmar renovação do contrato até sexta-feira.', type: 'task' as const, taskCompleted: false, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString() },
        { id: 'ct1-3', userId: 'u4', text: 'Enviar proposta comercial atualizada por e-mail.', type: 'task' as const, taskCompleted: true, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 45).toISOString() },
        { id: 'ct1-4', userId: 'u3', text: 'Material de marketing entregue ao parceiro.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString() },
      ],
    },
    {
      id: 'vt2', partnerId: 'p2', userId: 'u4', createdBy: 'u4', invitedUsers: [{ userId: 'u5', status: 'pending' }, { userId: 'u9', status: 'accepted' }],
      date: todayStr, time: '10:30', period: 'manhã', type: 'prospecção', medio: 'remoto', status: 'Planejada',
      structures: ['Venda Online'], banks: ['Finanto', 'C6'], products: ['Veículos', 'CLT'],
      observations: '', summary: '',
      potentialValue: 2500000, prospectEmail: 'contato@express.com', comments: [
        { id: 'ct2-1', userId: 'u4', text: '📄 Enviar: Cartão CNPJ', type: 'task' as const, taskCompleted: false, taskCategory: 'document' as const, taskSourceId: 'doc-1', taskBankName: 'Finanto', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString() },
        { id: 'ct2-2', userId: 'u4', text: '📄 Enviar: Contrato Social', type: 'task' as const, taskCompleted: false, taskCategory: 'document' as const, taskSourceId: 'doc-2', taskBankName: 'Finanto', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString() },
        { id: 'ct2-3', userId: 'u4', text: '🧾 Preencher: Chave PIX', type: 'task' as const, taskCompleted: false, taskCategory: 'data' as const, taskSourceId: 'op-1', taskBankName: 'Finanto', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString() },
        { id: 'ct2-4', userId: 'u4', text: 'Preparar apresentação dos produtos para prospecção.', type: 'task' as const, taskCompleted: false, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30).toISOString() },
      ],
    },
    {
      id: 'vt3', partnerId: 'p3', userId: 'u5', createdBy: 'u5', invitedUsers: [{ userId: 'u4', status: 'pending' }],
      date: todayStr, time: '11:00', period: 'manhã', type: 'visita', medio: 'presencial', status: 'Planejada',
      structures: ['Loja balcão'], banks: ['Daycoval'], products: ['Imobiliário'],
      observations: '', summary: '',
      comments: [
        { id: 'ct3-1', userId: 'u5', text: '📄 Enviar: RG / CNH dos Sócios', type: 'task' as const, taskCompleted: true, taskCategory: 'document' as const, taskSourceId: 'doc-3', taskBankName: 'Daycoval', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString() },
        { id: 'ct3-2', userId: 'u5', text: '📄 Enviar: Comprovante de Endereço', type: 'task' as const, taskCompleted: false, taskCategory: 'document' as const, taskSourceId: 'doc-4', taskBankName: 'Daycoval', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString() },
        { id: 'ct3-3', userId: 'u5', text: '🧾 Preencher: Regra de Repasse', type: 'task' as const, taskCompleted: false, taskCategory: 'data' as const, taskSourceId: 'op-2', taskBankName: 'Daycoval', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString() },
        { id: 'ct3-4', userId: 'u5', text: 'Levar material impresso da tabela de comissões.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30).toISOString() },
      ],
    },
    {
      id: 'vt4', partnerId: 'p4', userId: 'u6', createdBy: 'u6', invitedUsers: [],
      date: todayStr, time: '14:00', period: 'tarde', type: 'visita', medio: 'presencial', status: 'Reagendada',
      structures: ['Help', 'Call-center'], banks: ['BMG', 'Icred'], products: ['Cartão Benefício/Consignado'],
      observations: 'Parceiro pediu reagendamento.', summary: '',
      rescheduleReason: 'Cliente solicitou nova data', comments: [
        { id: 'ct4-1', userId: 'u6', text: 'Parceiro viajou, remarcar para próxima semana.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString() },
        { id: 'ct4-2', userId: 'u6', text: 'Ligar para o parceiro para confirmar nova data.', type: 'task' as const, taskCompleted: false, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30).toISOString() },
      ],
    },
    {
      id: 'vt5', partnerId: 'p6', userId: 'u4', createdBy: 'u4', invitedUsers: [{ userId: 'u7', status: 'accepted' }, { userId: 'u6', status: 'pending' }],
      date: todayStr, time: '16:00', period: 'tarde', type: 'visita', medio: 'presencial', status: 'Planejada',
      structures: ['Venda Online', 'Help'], banks: ['Riber Seguros'], products: ['Seguros', 'CNC'],
      observations: '', summary: '',
      potentialValue: 3200000, comments: [
        { id: 'ct5-1', userId: 'u4', text: '📄 Enviar: Alvará de Funcionamento', type: 'task' as const, taskCompleted: false, taskCategory: 'document' as const, taskSourceId: 'doc-6', taskBankName: 'Riber Seguros', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString() },
        { id: 'ct5-2', userId: 'u4', text: '📄 Enviar: Foto da Fachada', type: 'task' as const, taskCompleted: false, taskCategory: 'document' as const, taskSourceId: 'doc-8', taskBankName: 'Riber Seguros', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString() },
        { id: 'ct5-3', userId: 'u4', text: '🧾 Preencher: Forma de Pagamento', type: 'task' as const, taskCompleted: true, taskCategory: 'data' as const, taskSourceId: 'op-4', taskBankName: 'Riber Seguros', createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString() },
        { id: 'ct5-4', userId: 'u7', text: 'Alinhar estratégia de vendas de seguros com o parceiro.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString() },
        { id: 'ct5-5', userId: 'u4', text: 'Negociar condições especiais para CNC.', type: 'task' as const, taskCompleted: false, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30).toISOString() },
      ],
    },
    // Visita cancelada de hoje
    {
      id: 'vt6', partnerId: 'p7', userId: 'u6', createdBy: 'u6', invitedUsers: [{ userId: 'u5', status: 'rejected' }],
      date: todayStr, time: '15:00', period: 'tarde', type: 'visita', medio: 'presencial', status: 'Cancelada',
      structures: ['Loja balcão', 'Call-center'], banks: ['C6'], products: ['FGTS', 'CLT'],
      observations: 'Parceiro informou que não pode mais atender.', summary: '',
      cancelReason: 'Cliente não respondeu', comments: [
        { id: 'ct6-1', userId: 'u6', text: 'Tentei contato 3 vezes, parceiro não atendeu.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 45).toISOString() },
      ],
    },
    // Prospecção concluída de hoje
    {
      id: 'vt7', partnerId: 'p11', userId: 'u5', createdBy: 'u5', invitedUsers: [],
      date: todayStr, time: '08:30', period: 'manhã', type: 'prospecção', medio: 'remoto', status: 'Concluída',
      structures: ['Call-center', 'Venda Online'], banks: ['BMG', 'PAN'], products: ['INSS', 'Cartão Benefício/Consignado'],
      observations: 'Prospecção bem-sucedida, lead qualificado.', summary: 'Parceiro em potencial demonstrou forte interesse. Agendar visita presencial.',
      potentialValue: 4500000, prospectEmail: 'capital@consig.com', comments: [
        { id: 'ct7-1', userId: 'u5', text: 'Lead muito qualificado, já opera com consignado.', type: 'observation' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45).toISOString() },
        { id: 'ct7-2', userId: 'u5', text: 'Agendar visita presencial para próxima semana.', type: 'task' as const, taskCompleted: false, taskCategory: 'general' as const, createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString() },
      ],
    },
  );

  return visits;
}

// Generate once with a stable seed — consumers should use useVisits() for persistence
export const mockVisits: Visit[] = generateVisits();

// ============ GOALS ============
export const monthlyGoals = {
  visits: 80,
  prospections: 40,
};

// ============ HELPERS ============
export const statusColors: Record<VisitStatus, string> = {
  'Planejada': 'hsl(199 89% 48%)',
  'Concluída': 'hsl(142 76% 36%)',
  'Reagendada': 'hsl(45 93% 47%)',
  'Cancelada': 'hsl(0 84% 60%)',
};

export const statusBgClasses: Record<VisitStatus, string> = {
  'Planejada': 'bg-info/10 text-info border-info/20',
  'Concluída': 'bg-success/10 text-success border-success/20',
  'Reagendada': 'bg-warning/10 text-warning border-warning/20',
  'Cancelada': 'bg-destructive/10 text-destructive border-destructive/20',
};

export function getPartnerById(id: string) {
  return mockPartners.find(p => p.id === id);
}

export function getUserById(id: string) {
  return mockUsers.find(u => u.id === id);
}
