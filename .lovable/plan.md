

# Controle de Permissões para Página "Cadastro"

## Resumo

Adicionar permissões granulares para a página Cadastro, seguindo o padrão existente do sistema (`permissions.ts` + `usePermission`). Inclui 5 novas chaves de permissão, configuração padrão por perfil, e aplicação nos componentes da página.

## Alterações

### 1. `src/data/permissions.ts`
- Adicionar nova seção "Cadastro" no array `permissionItems` com 5 entradas:
  - `registration.view` — Visualizar cadastros
  - `registration.create` — Criar cadastro
  - `registration.edit` — Editar cadastro
  - `registration.changeStatus` — Alterar status
  - `registration.editObservation` — Editar observação
- Atualizar `defaultPermissions`:
  - **Gestor**: todas em `write`(já coberto pelo `allWrite`)
  - **Não Gestor**: `registration.view` = `read`, restante = `none`

### 2. `src/components/AppLayout.tsx` (linha 52)
- Alterar `permKey` do item Cadastro de `'partners.list'` para `'registration.view'`
- O menu já oculta itens sem permissão de leitura

### 3. `src/pages/CadastroPage.tsx`
- Importar `usePermission`
- Adicionar guard no topo: se `!canRead('registration.view')` → exibir tela de acesso restrito (padrão igual ao de ConfiguracoesPage)
- Condicionar botão "Novo Cadastro": visível apenas se `canWrite('registration.create')`
- Passar flags de permissão para `RegistrationCard` e `RegistrationModal`

### 4. `src/components/cadastro/RegistrationModal.tsx`
- Receber props de permissão (`canEdit`, `canChangeStatus`, `canEditObservation`)
- Desabilitar campos de edição geral se `!canEdit`
- Desabilitar select de Status se `!canChangeStatus`
- Desabilitar textarea de Observação se `!canEditObservation`
- Desabilitar select de "Tratando com" se `!canChangeStatus` (vinculado à mesma permissão)
- Exibir tooltip "Sem permissão" nos campos desabilitados

### 5. `src/components/cadastro/RegistrationCard.tsx`
- Nenhuma alteração necessária (card é somente leitura, ação de clique abre modal que já terá os controles)

## Arquivos Afetados
- `src/data/permissions.ts` — novas chaves e defaults
- `src/components/AppLayout.tsx` — corrigir permKey
- `src/pages/CadastroPage.tsx` — guard + condicional do botão
- `src/components/cadastro/RegistrationModal.tsx` — campos condicionais

## O que NÃO será alterado
- Lógica de dados ou localStorage
- Estrutura visual dos componentes
- Outras permissões existentes

