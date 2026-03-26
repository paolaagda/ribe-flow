

# Hierarquia Dupla (App vs Empresa) e Clareza Parceiro/Prospecção

## Resumo

Separar o conceito atual de `role` (que mistura cargo e permissao) em duas camadas independentes: **perfil do app** (gestor/nao_gestor) para permissoes e **cargo da empresa** (informativo). Adicionar novos cargos. Reforcar a distincao visual entre parceiro e prospecção na agenda.

## Estado Atual

- `UserRole` = gestor | diretor | gerente | ascom | comercial — usado para TUDO (permissoes, visibilidade, cargo)
- Permissoes mapeadas por role com 5 perfis diferentes
- Visibilidade filtrada por `role === 'comercial'` em varios lugares
- Agenda ja diferencia visita vs prospecção com campos distintos

## Mudancas

### 1. Modelo de Dados (mock-data.ts)

- Criar `AppProfile = 'gestor' | 'nao_gestor'`
- Criar `CompanyCargo = 'diretor' | 'gerente' | 'ascom' | 'comercial' | 'cadastro' | 'parceiro' | 'loja'`
- Manter `UserRole` como alias para `CompanyCargo` (compatibilidade)
- Adicionar campo `profile: AppProfile` ao tipo `User`
- Atualizar mockUsers com `profile` para cada usuario (u1 Carlos = gestor, u9 Lucas = gestor, demais = nao_gestor)
- Adicionar mock users para novos cargos (cadastro, parceiro, loja — ao menos 1 de cada)

### 2. Permissoes (permissions.ts)

- Simplificar `defaultPermissions` para 2 perfis: `gestor` (tudo write) e `nao_gestor` (acessos limitados)
- Permissoes mapeadas por `AppProfile` em vez de `UserRole`

### 3. Hook de Permissao (usePermission.ts)

- Ler `user.profile` em vez de `role` para determinar permissoes

### 4. AuthContext (AuthContext.tsx)

- Expor `profile` alem de `role` (cargo)
- Login busca usuario por cargo selecionado (manter comportamento)

### 5. Login (LoginPage.tsx)

- Manter seletor de cargo (empresa) com novos cargos
- Adicionar toggle ou indicador de perfil do app (gestor/nao_gestor)
- Mostrar claramente as duas camadas

### 6. Visibilidade Global

Substituir todas as checagens `role === 'comercial'` e similares por logica baseada em `profile`:

- **AgendaPage.tsx**: `profile === 'nao_gestor'` → ve so suas visitas
- **ParceirosPage.tsx**: `profile === 'nao_gestor'` → ve so seus parceiros
- **DashboardPage.tsx**: `profile === 'gestor'` → ve tudo / equipe
- **useTeamFilter.ts**: usar `profile` para decidir visibilidade
- **NotificationContext.tsx**: ajustar geracao de notificacoes mock

### 7. UsersTab (settings/UsersTab.tsx)

- Separar edicao de cargo (empresa) e perfil (app)
- Atualizar roleColors e roleLabels com novos cargos
- Permissoes editaveis por perfil (gestor/nao_gestor) em vez de por cargo
- Manter estrutura de equipes

### 8. Distincao Visual Parceiro vs Prospecção (AgendaPage.tsx)

- Adicionar tag/badge visual nos cards da agenda: "Visita" (azul) vs "Prospecção" (laranja)
- No calendario mensal: icone diferente para prospecção
- Na lista diaria/semanal: badge colorida diferenciando tipo

### 9. Preparacao para Conversao (futuro, sem implementar)

- Adicionar campo opcional `convertedToPartnerId?: string` no tipo Visit (apenas no tipo, sem logica)

## Arquivos Modificados

| Arquivo | Acao |
|---|---|
| `src/data/mock-data.ts` | Novos tipos, campo profile, novos mock users |
| `src/data/permissions.ts` | Simplificar para gestor/nao_gestor |
| `src/hooks/usePermission.ts` | Usar profile |
| `src/contexts/AuthContext.tsx` | Expor profile |
| `src/pages/LoginPage.tsx` | Novos cargos, indicador de perfil |
| `src/pages/AgendaPage.tsx` | Visibilidade por profile, badges visuais |
| `src/pages/ParceirosPage.tsx` | Visibilidade por profile |
| `src/pages/DashboardPage.tsx` | Visibilidade por profile |
| `src/pages/AnalisesPage.tsx` | Filtro por profile |
| `src/pages/CampanhasPage.tsx` | Filtro por profile |
| `src/hooks/useTeamFilter.ts` | Logica por profile |
| `src/contexts/NotificationContext.tsx` | Ajustar mock |
| `src/components/settings/UsersTab.tsx` | Dois campos (cargo+perfil), novas labels |
| `src/components/home/HeroSection.tsx` | Visibilidade por profile |

## Detalhes Tecnicos

- `AppProfile` controla permissoes; `CompanyCargo` e informativo
- localStorage key muda para `ribercred_permissions_v2` (2 perfis em vez de 5)
- Nenhum backend necessario
- Evolucao sem quebra: campos existentes mantidos, novos adicionados

