export type AuditModule = 'Agenda' | 'Parceiros' | 'Campanhas' | 'Cadastro' | 'Colaboradores' | 'Configurações';
export type AuditAction = 'create' | 'edit' | 'delete' | 'status_change' | 'permission_change' | 'reject' | 'approve';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: AuditModule;
  action: AuditAction;
  entityId: string;
  entityLabel: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
}

export const actionLabels: Record<AuditAction, string> = {
  create: 'Criou',
  edit: 'Editou',
  delete: 'Excluiu',
  status_change: 'Alterou status',
  permission_change: 'Alterou permissão',
  reject: 'Rejeitou',
  approve: 'Aprovou',
};

export const actionColors: Record<AuditAction, string> = {
  create: 'text-success',
  edit: 'text-foreground',
  delete: 'text-destructive',
  status_change: 'text-warning',
  permission_change: 'text-primary',
  reject: 'text-destructive',
  approve: 'text-success',
};

export const moduleLabels: Record<AuditModule, string> = {
  Agenda: 'Agenda',
  Parceiros: 'Parceiros',
  Campanhas: 'Campanhas',
  Cadastro: 'Cadastro',
  Colaboradores: 'Colaboradores',
  Configurações: 'Configurações',
};

// Mock initial logs
export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1', timestamp: '2025-03-28T14:32:00', userId: 'u1', userName: 'Carlos Silva',
    module: 'Cadastro', action: 'create', entityId: 'reg1', entityLabel: 'Cadastro - Crédito Fácil / FINANTO',
    description: 'Criou cadastro para Crédito Fácil com banco FINANTO',
  },
  {
    id: 'log-2', timestamp: '2025-03-29T10:12:00', userId: 'u10', userName: 'Tatiana Freitas',
    module: 'Cadastro', action: 'edit', entityId: 'reg1', entityLabel: 'Cadastro - Crédito Fácil / FINANTO',
    field: 'Observação', oldValue: '', newValue: 'Documentação enviada ao banco',
    description: 'Atualizou observação do cadastro',
  },
  {
    id: 'log-3', timestamp: '2025-03-30T09:45:00', userId: 'u2', userName: 'Ana Oliveira',
    module: 'Cadastro', action: 'status_change', entityId: 'reg2', entityLabel: 'Cadastro - Financeira Express / BMG',
    field: 'Status', oldValue: 'Não iniciado', newValue: 'Em análise',
    description: 'Alterou status de "Não iniciado" para "Em análise"',
  },
  {
    id: 'log-4', timestamp: '2025-03-29T16:00:00', userId: 'u4', userName: 'Maria Souza',
    module: 'Parceiros', action: 'edit', entityId: 'p1', entityLabel: 'Parceiro - Loja Crédito Fácil',
    field: 'Endereço', oldValue: 'Rua Augusta, 1000', newValue: 'Rua Augusta, 1200',
    description: 'Editou endereço do parceiro',
  },
  {
    id: 'log-5', timestamp: '2025-03-28T11:00:00', userId: 'u4', userName: 'Maria Souza',
    module: 'Agenda', action: 'create', entityId: 'vt1', entityLabel: 'Visita - Loja Crédito Fácil',
    description: 'Criou agenda de visita para Loja Crédito Fácil',
  },
  {
    id: 'log-6', timestamp: '2025-03-27T09:30:00', userId: 'u5', userName: 'João Costa',
    module: 'Agenda', action: 'create', entityId: 'vt3', entityLabel: 'Visita - Casa do Empréstimo',
    description: 'Criou agenda de visita para Casa do Empréstimo',
  },
  {
    id: 'log-7', timestamp: '2025-03-27T14:15:00', userId: 'u6', userName: 'Fernanda Lima',
    module: 'Agenda', action: 'status_change', entityId: 'vt4', entityLabel: 'Visita - Consig Center',
    field: 'Status', oldValue: 'Planejada', newValue: 'Reagendada',
    description: 'Reagendou visita ao Consig Center',
  },
  {
    id: 'log-8', timestamp: '2025-03-26T10:00:00', userId: 'u2', userName: 'Ana Oliveira',
    module: 'Cadastro', action: 'approve', entityId: 'reg3', entityLabel: 'Cadastro - Consig Center / C6',
    description: 'Aprovou cadastro do Consig Center no C6',
  },
  {
    id: 'log-9', timestamp: '2025-03-26T16:30:00', userId: 'u1', userName: 'Carlos Silva',
    module: 'Colaboradores', action: 'edit', entityId: 'u8', entityLabel: 'Juliana Mendes',
    field: 'Status', oldValue: 'Ativo', newValue: 'Inativo',
    description: 'Desativou colaboradora Juliana Mendes',
  },
  {
    id: 'log-10', timestamp: '2025-03-25T11:45:00', userId: 'u1', userName: 'Carlos Silva',
    module: 'Configurações', action: 'permission_change', entityId: 'perm-gerente', entityLabel: 'Permissões - Gerente',
    field: 'Agenda', oldValue: 'Leitura', newValue: 'Escrita',
    description: 'Alterou permissão de Agenda para Gerente',
  },
  {
    id: 'log-11', timestamp: '2025-03-25T08:00:00', userId: 'u9', userName: 'Lucas Ribeiro',
    module: 'Campanhas', action: 'create', entityId: 'camp1', entityLabel: 'Campanha de Março',
    description: 'Criou campanha "Campanha de Março" com 3 participantes',
  },
  {
    id: 'log-12', timestamp: '2025-03-24T15:20:00', userId: 'u4', userName: 'Maria Souza',
    module: 'Parceiros', action: 'create', entityId: 'p15', entityLabel: 'Prime Consignado',
    description: 'Cadastrou novo parceiro Prime Consignado',
  },
  {
    id: 'log-13', timestamp: '2025-03-24T10:00:00', userId: 'u7', userName: 'Ricardo Alves',
    module: 'Cadastro', action: 'reject', entityId: 'reg6', entityLabel: 'Cadastro - Casa do Empréstimo / DIGIO',
    description: 'Rejeitou cadastro por documentação incompleta',
  },
  {
    id: 'log-14', timestamp: '2025-03-23T09:00:00', userId: 'u6', userName: 'Fernanda Lima',
    module: 'Agenda', action: 'create', entityId: 'vt6', entityLabel: 'Visita - Crédito Popular',
    description: 'Criou agenda de visita para Crédito Popular',
  },
  {
    id: 'log-15', timestamp: '2025-03-22T14:00:00', userId: 'u5', userName: 'João Costa',
    module: 'Agenda', action: 'status_change', entityId: 'v10', entityLabel: 'Prospecção - Capital Consig',
    field: 'Status', oldValue: 'Planejada', newValue: 'Concluída',
    description: 'Concluiu prospecção no Capital Consig',
  },
  {
    id: 'log-16', timestamp: '2025-03-21T11:30:00', userId: 'u10', userName: 'Tatiana Freitas',
    module: 'Cadastro', action: 'status_change', entityId: 'reg4', entityLabel: 'Cadastro - Mega Financeira / ICRED',
    field: 'Status', oldValue: 'Colhendo documentação', newValue: 'Colhendo assinaturas',
    description: 'Avançou cadastro para fase de assinaturas',
  },
  {
    id: 'log-17', timestamp: '2025-03-20T08:30:00', userId: 'u1', userName: 'Carlos Silva',
    module: 'Configurações', action: 'edit', entityId: 'sys-products', entityLabel: 'Dados do Sistema - Produtos',
    description: 'Adicionou produto "CNC" à lista de produtos',
  },
];
