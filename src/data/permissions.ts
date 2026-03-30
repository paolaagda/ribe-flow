import { AppProfile } from './mock-data';

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

  // Insights
  { module: 'Insights', action: 'Ver insights inteligentes', key: 'insights.view' },
];

const allWrite = Object.fromEntries(permissionItems.map(p => [p.key, 'write' as PermissionLevel]));

export const defaultPermissions: Record<AppProfile, Record<string, PermissionLevel>> = {
  gestor: { ...allWrite },
  nao_gestor: {
    // Dashboard
    'dashboard.view': 'read',
    'dashboard.kpis': 'read',
    'dashboard.map': 'none',

    // Agenda
    'agenda.view': 'read',
    'agenda.create': 'write',
    'agenda.edit': 'write',
    'agenda.delete': 'none',
    'agenda.drag': 'write',
    'agenda.filterCommercial': 'none',
    'agenda.viewOthers': 'none',
    'agenda.export': 'none',

    // Tarefas
    'tasks.view': 'read',
    'tasks.create': 'write',
    'tasks.complete': 'write',
    'tasks.delete': 'none',
    'tasks.viewOthers': 'none',

    // Análises
    'analysis.reports': 'none',
    'analysis.filterPeriod': 'none',
    'analysis.ranking': 'none',
    'analysis.partnerMap': 'none',
    'analysis.export': 'none',

    // Parceiros
    'partners.list': 'read',
    'partners.details': 'read',
    'partners.create': 'none',
    'partners.edit': 'none',
    'partners.delete': 'none',
    'partners.exportPdf': 'none',
    'partners.bulkImport': 'none',

    // Lojas
    'stores.view': 'read',
    'stores.create': 'none',
    'stores.edit': 'none',
    'stores.delete': 'none',

    // Colaboradores
    'users.list': 'none',
    'users.create': 'none',
    'users.edit': 'none',
    'users.block': 'none',
    'users.resetPassword': 'none',
    'users.delete': 'none',
    'users.permissions': 'none',
    'users.profile': 'none',

    // Configurações
    'settings.view': 'none',
    'settings.theme': 'none',
    'settings.systemData': 'none',

    // Campanhas
    'campaigns.view': 'read',
    'campaigns.create': 'none',
    'campaigns.edit': 'none',
    'campaigns.delete': 'none',

    // Gamificação
    'gamification.view': 'read',
    'gamification.ranking': 'read',
    'gamification.badges': 'read',

    // Equipes
    'teams.view': 'none',
    'teams.create': 'none',
    'teams.edit': 'none',
    'teams.delete': 'none',

    // Notificações
    'notifications.view': 'read',
    'notifications.manage': 'none',

    // Cadastro
    'registration.view': 'read',
    'registration.create': 'none',
    'registration.edit': 'none',
    'registration.changeStatus': 'none',
    'registration.editObservation': 'none',

    // Insights
    'insights.view': 'read',
  },
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
