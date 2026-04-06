import { CompanyCargo } from './mock-data';

export type PermissionLevel = 'none' | 'read' | 'write';

export interface PermissionItem {
  module: string;
  action: string;
  key: string;
}

export const permissionItems: PermissionItem[] = [
  // Home / Dashboard
  { module: 'Dashboard', action: 'Ver dashboard', key: 'dashboard.view' },
  { module: 'Dashboard', action: 'Ver KPIs gerais', key: 'dashboard.kpis' },
  { module: 'Dashboard', action: 'Ver mapa de visitas', key: 'dashboard.map' },

  // Agenda
  { module: 'Agenda', action: 'Ver agenda', key: 'agenda.view' },
  { module: 'Agenda', action: 'Criar agenda', key: 'agenda.create' },
  { module: 'Agenda', action: 'Editar agenda', key: 'agenda.edit' },
  { module: 'Agenda', action: 'Excluir agenda', key: 'agenda.delete' },
  { module: 'Agenda', action: 'Arrastar/reagendar', key: 'agenda.drag' },
  { module: 'Agenda', action: 'Filtrar por comercial', key: 'agenda.filterCommercial' },
  { module: 'Agenda', action: 'Ver agenda de outros', key: 'agenda.viewOthers' },
  { module: 'Agenda', action: 'Exportar agenda', key: 'agenda.export' },

  // Tarefas
  { module: 'Tarefas', action: 'Ver tarefas', key: 'tasks.view' },
  { module: 'Tarefas', action: 'Criar tarefa', key: 'tasks.create' },
  { module: 'Tarefas', action: 'Concluir tarefa', key: 'tasks.complete' },
  { module: 'Tarefas', action: 'Excluir tarefa', key: 'tasks.delete' },
  { module: 'Tarefas', action: 'Ver tarefas de outros', key: 'tasks.viewOthers' },

  // Análises
  { module: 'Análises', action: 'Ver relatórios', key: 'analysis.reports' },
  { module: 'Análises', action: 'Filtrar período', key: 'analysis.filterPeriod' },
  { module: 'Análises', action: 'Ver ranking comerciais', key: 'analysis.ranking' },
  { module: 'Análises', action: 'Ver mapa de parceiros', key: 'analysis.partnerMap' },
  { module: 'Análises', action: 'Exportar relatórios', key: 'analysis.export' },

  // Parceiros
  { module: 'Parceiros', action: 'Ver lista', key: 'partners.list' },
  { module: 'Parceiros', action: 'Ver detalhes', key: 'partners.details' },
  { module: 'Parceiros', action: 'Criar parceiro', key: 'partners.create' },
  { module: 'Parceiros', action: 'Editar parceiro', key: 'partners.edit' },
  { module: 'Parceiros', action: 'Excluir parceiro', key: 'partners.delete' },
  { module: 'Parceiros', action: 'Exportar PDF do parceiro', key: 'partners.exportPdf' },
  { module: 'Parceiros', action: 'Importar parceiros em lote', key: 'partners.bulkImport' },

  // Lojas / Centro de Custo
  { module: 'Lojas', action: 'Ver lojas', key: 'stores.view' },
  { module: 'Lojas', action: 'Criar loja', key: 'stores.create' },
  { module: 'Lojas', action: 'Editar loja', key: 'stores.edit' },
  { module: 'Lojas', action: 'Excluir loja', key: 'stores.delete' },

  // Colaboradores (Usuários)
  { module: 'Colaboradores', action: 'Ver lista de colaboradores', key: 'users.list' },
  { module: 'Colaboradores', action: 'Criar colaborador', key: 'users.create' },
  { module: 'Colaboradores', action: 'Editar colaborador', key: 'users.edit' },
  { module: 'Colaboradores', action: 'Bloquear/desbloquear', key: 'users.block' },
  { module: 'Colaboradores', action: 'Resetar senha', key: 'users.resetPassword' },
  { module: 'Colaboradores', action: 'Excluir colaborador', key: 'users.delete' },
  { module: 'Colaboradores', action: 'Gerenciar permissões', key: 'users.permissions' },
  { module: 'Colaboradores', action: 'Ver perfil detalhado', key: 'users.profile' },

  // Configurações
  { module: 'Configurações', action: 'Ver configurações', key: 'settings.view' },
  { module: 'Configurações', action: 'Alterar tema', key: 'settings.theme' },
  { module: 'Configurações', action: 'Gerenciar dados do sistema', key: 'settings.systemData' },

  // Campanhas
  { module: 'Campanhas', action: 'Ver campanhas', key: 'campaigns.view' },
  { module: 'Campanhas', action: 'Criar campanha', key: 'campaigns.create' },
  { module: 'Campanhas', action: 'Editar campanha', key: 'campaigns.edit' },
  { module: 'Campanhas', action: 'Excluir campanha', key: 'campaigns.delete' },

  // Gamificação
  { module: 'Gamificação', action: 'Ver gamificação', key: 'gamification.view' },
  { module: 'Gamificação', action: 'Ver ranking', key: 'gamification.ranking' },
  { module: 'Gamificação', action: 'Ver badges', key: 'gamification.badges' },

  // Equipes
  { module: 'Equipes', action: 'Ver equipes', key: 'teams.view' },
  { module: 'Equipes', action: 'Criar equipe', key: 'teams.create' },
  { module: 'Equipes', action: 'Editar equipe', key: 'teams.edit' },
  { module: 'Equipes', action: 'Excluir equipe', key: 'teams.delete' },

  // Notificações
  { module: 'Notificações', action: 'Ver notificações', key: 'notifications.view' },
  { module: 'Notificações', action: 'Gerenciar notificações', key: 'notifications.manage' },

  // Cadastro
  { module: 'Cadastro', action: 'Visualizar cadastros', key: 'registration.view' },
  { module: 'Cadastro', action: 'Criar cadastro', key: 'registration.create' },
  { module: 'Cadastro', action: 'Editar cadastro', key: 'registration.edit' },
  { module: 'Cadastro', action: 'Alterar status', key: 'registration.changeStatus' },
  { module: 'Cadastro', action: 'Editar observação', key: 'registration.editObservation' },

  // Logs
  { module: 'Logs', action: 'Ver logs do sistema', key: 'logs.view' },

  // Insights
  { module: 'Insights', action: 'Ver insights inteligentes', key: 'insights.view' },
];

// Helper to create a full permission map for a cargo
function makePerms(overrides: Record<string, PermissionLevel>): Record<string, PermissionLevel> {
  const base: Record<string, PermissionLevel> = {};
  for (const item of permissionItems) {
    base[item.key] = overrides[item.key] ?? 'none';
  }
  return base;
}

const allWrite = Object.fromEntries(permissionItems.map(p => [p.key, 'write' as PermissionLevel]));

const diretorPerms = { ...allWrite };

const gerentePerms = makePerms({
  ...allWrite,
  'users.delete': 'none',
  'teams.delete': 'none',
});

const comercialPerms = makePerms({
  'dashboard.view': 'read',
  'dashboard.kpis': 'read',
  'dashboard.map': 'read',
  'agenda.view': 'read',
  'agenda.create': 'write',
  'agenda.edit': 'write',
  'agenda.drag': 'write',
  'tasks.view': 'read',
  'tasks.create': 'write',
  'tasks.complete': 'write',
  'partners.list': 'read',
  'partners.details': 'read',
  'partners.exportPdf': 'read',
  'stores.view': 'read',
  'users.profile': 'read',
  'settings.theme': 'write',
  'campaigns.view': 'read',
  'gamification.view': 'read',
  'gamification.ranking': 'read',
  'gamification.badges': 'read',
  'teams.view': 'read',
  'notifications.view': 'read',
  'registration.view': 'read',
  'registration.create': 'write',
  'registration.editObservation': 'write',
  'insights.view': 'read',
});

const ascomPerms = makePerms({
  'dashboard.view': 'read',
  'dashboard.kpis': 'read',
  'dashboard.map': 'read',
  'agenda.view': 'read',
  'agenda.viewOthers': 'read',
  'tasks.view': 'read',
  'analysis.reports': 'read',
  'analysis.filterPeriod': 'read',
  'analysis.ranking': 'read',
  'analysis.partnerMap': 'read',
  'partners.list': 'read',
  'partners.details': 'read',
  'partners.exportPdf': 'read',
  'stores.view': 'read',
  'users.list': 'read',
  'users.profile': 'read',
  'settings.theme': 'write',
  'campaigns.view': 'read',
  'gamification.view': 'read',
  'gamification.ranking': 'read',
  'gamification.badges': 'read',
  'teams.view': 'read',
  'notifications.view': 'read',
  'insights.view': 'read',
});

const cadastroPerms = makePerms({
  'settings.theme': 'write',
  'tasks.view': 'read',
  'tasks.create': 'write',
  'tasks.complete': 'write',
  'partners.list': 'read',
  'partners.details': 'read',
  'gamification.view': 'read',
  'gamification.ranking': 'read',
  'gamification.badges': 'read',
  'notifications.view': 'read',
  'registration.view': 'write',
  'registration.create': 'write',
  'registration.edit': 'write',
  'registration.changeStatus': 'read',
  'registration.editObservation': 'write',
});

export const defaultPermissions: Record<CompanyCargo, Record<string, PermissionLevel>> = {
  diretor: diretorPerms,
  gerente: gerentePerms,
  comercial: comercialPerms,
  ascom: ascomPerms,
  cadastro: cadastroPerms,
};

// Group permission items by module
export function groupedPermissions(): Record<string, PermissionItem[]> {
  const groups: Record<string, PermissionItem[]> = {};
  for (const item of permissionItems) {
    if (!groups[item.module]) groups[item.module] = [];
    groups[item.module].push(item);
  }
  return groups;
}
