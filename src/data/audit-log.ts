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
};

export const actionColors: Record<AuditAction, string> = {
  create: 'text-success',
  edit: 'text-foreground',
  delete: 'text-destructive',
  status_change: 'text-warning',
  permission_change: 'text-primary',
  reject: 'text-destructive',
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
    id: 'log-1',
    timestamp: '2025-03-28T14:32:00',
    userId: 'u1',
    userName: 'Carlos Diretor',
    module: 'Cadastro',
    action: 'create',
    entityId: 'reg-1',
    entityLabel: 'Cadastro - Loja ABC / Itaú',
    description: 'Criou cadastro para Loja ABC com banco Itaú',
  },
  {
    id: 'log-2',
    timestamp: '2025-03-29T10:12:00',
    userId: 'u3',
    userName: 'Maria ASCOM',
    module: 'Cadastro',
    action: 'edit',
    entityId: 'reg-1',
    entityLabel: 'Cadastro - Loja ABC / Itaú',
    field: 'Observação',
    oldValue: '',
    newValue: 'Documentação enviada ao banco',
    description: 'Atualizou observação do cadastro',
  },
  {
    id: 'log-3',
    timestamp: '2025-03-30T09:45:00',
    userId: 'u2',
    userName: 'Ana Gerente',
    module: 'Cadastro',
    action: 'status_change',
    entityId: 'reg-1',
    entityLabel: 'Cadastro - Loja ABC / Itaú',
    field: 'Status',
    oldValue: 'Não iniciado',
    newValue: 'Em análise',
    description: 'Alterou status de "Não iniciado" para "Em análise"',
  },
  {
    id: 'log-4',
    timestamp: '2025-03-29T16:00:00',
    userId: 'u1',
    userName: 'Carlos Diretor',
    module: 'Parceiros',
    action: 'edit',
    entityId: 'p1',
    entityLabel: 'Parceiro - Loja ABC',
    field: 'Endereço',
    oldValue: 'Rua A, 100',
    newValue: 'Rua B, 200',
    description: 'Editou endereço do parceiro',
  },
  {
    id: 'log-5',
    timestamp: '2025-03-28T11:00:00',
    userId: 'u4',
    userName: 'Pedro Comercial',
    module: 'Agenda',
    action: 'create',
    entityId: 'a1',
    entityLabel: 'Agenda - Visita Loja ABC',
    description: 'Criou agenda de visita para Loja ABC',
  },
];
