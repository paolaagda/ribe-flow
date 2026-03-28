import { AppProfile } from './mock-data';

export type PermissionLevel = 'none' | 'read' | 'write';

export interface PermissionItem {
  module: string;
  action: string;
  key: string;
}

export const permissionItems: PermissionItem[] = [
  // Agenda
  { module: 'Agenda', action: 'Ver agenda', key: 'agenda.view' },
  { module: 'Agenda', action: 'Criar agenda', key: 'agenda.create' },
  { module: 'Agenda', action: 'Editar agenda', key: 'agenda.edit' },
  { module: 'Agenda', action: 'Excluir agenda', key: 'agenda.delete' },
  { module: 'Agenda', action: 'Arrastar/reagendar', key: 'agenda.drag' },
  { module: 'Agenda', action: 'Filtrar por comercial', key: 'agenda.filterCommercial' },

  // Análises
  { module: 'Análises', action: 'Ver relatórios', key: 'analysis.reports' },
  { module: 'Análises', action: 'Filtrar período', key: 'analysis.filterPeriod' },
  { module: 'Análises', action: 'Ver ranking comerciais', key: 'analysis.ranking' },
  { module: 'Análises', action: 'Ver mapa de parceiros', key: 'analysis.partnerMap' },

  // Parceiros
  { module: 'Parceiros', action: 'Ver lista', key: 'partners.list' },
  { module: 'Parceiros', action: 'Ver detalhes', key: 'partners.details' },
  { module: 'Parceiros', action: 'Criar parceiro', key: 'partners.create' },
  { module: 'Parceiros', action: 'Editar parceiro', key: 'partners.edit' },
  { module: 'Parceiros', action: 'Excluir parceiro', key: 'partners.delete' },

  // Usuários
  { module: 'Usuários', action: 'Ver lista de usuários', key: 'users.list' },
  { module: 'Usuários', action: 'Editar usuário', key: 'users.edit' },
  { module: 'Usuários', action: 'Bloquear/desbloquear', key: 'users.block' },
  { module: 'Usuários', action: 'Resetar senha', key: 'users.resetPassword' },
  { module: 'Usuários', action: 'Excluir usuário', key: 'users.delete' },
  { module: 'Usuários', action: 'Gerenciar permissões', key: 'users.permissions' },

  // Configurações
  { module: 'Configurações', action: 'Ver configurações', key: 'settings.view' },
  { module: 'Configurações', action: 'Alterar tema', key: 'settings.theme' },

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
];

const allWrite = Object.fromEntries(permissionItems.map(p => [p.key, 'write' as PermissionLevel]));

export const defaultPermissions: Record<AppProfile, Record<string, PermissionLevel>> = {
  gestor: { ...allWrite },
  nao_gestor: {
    'agenda.view': 'read',
    'agenda.create': 'write',
    'agenda.edit': 'write',
    'agenda.delete': 'none',
    'agenda.drag': 'write',
    'agenda.filterCommercial': 'none',
    'analysis.reports': 'none',
    'analysis.filterPeriod': 'none',
    'analysis.ranking': 'none',
    'analysis.partnerMap': 'none',
    'partners.list': 'read',
    'partners.details': 'read',
    'partners.create': 'none',
    'partners.edit': 'none',
    'partners.delete': 'none',
    'users.list': 'none',
    'users.edit': 'none',
    'users.block': 'none',
    'users.resetPassword': 'none',
    'users.delete': 'none',
    'users.permissions': 'none',
    'settings.view': 'none',
    'settings.theme': 'none',
    'campaigns.view': 'read',
    'campaigns.create': 'none',
    'campaigns.edit': 'none',
    'campaigns.delete': 'none',
    'gamification.view': 'read',
    'gamification.ranking': 'read',
    'gamification.badges': 'read',
    'teams.view': 'none',
    'teams.create': 'none',
    'teams.edit': 'none',
    'teams.delete': 'none',
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
