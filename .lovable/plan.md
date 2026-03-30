

# Página de Gestão de Cadastros / Credenciamento de Parceiros

## Resumo

Criar a página **Cadastro** para gerenciar credenciamento de parceiros com bancos. Inclui listagem via cards, criação/edição via modal, preenchimento automático de dados do parceiro, histórico de atualizações e integração com Dados do Sistema para listas dinâmicas.

## Arquivos a Criar

### 1. `src/data/registrations.ts` — Tipos e dados mock
- Interface `Registration` com campos: id, partnerId, bank, cnpj (auto), commercialUserId (auto), observation, status, solicitation, handlingWith, code, requestedAt, completedAt, updates (array de {date, userId, text})
- Constantes para status, solicitação e "tratando com" iniciais
- Dados mock (~8 registros) vinculados a parceiros existentes

### 2. `src/hooks/useRegistrations.ts` — Hook de estado local
- CRUD via `useLocalStorage` (padrão do projeto)
- Funções: add, update, getById
- Lógica automática: ao alterar observação → push no array de updates; ao status = Concluído → preencher completedAt

### 3. `src/pages/CadastroPage.tsx` — Página principal
- PageHeader + filtros (status, banco, busca)
- Grid responsivo de cards
- Botão "Novo Cadastro" abrindo modal
- Seguir layout padrão das outras páginas (PageTransition, espaçamento ds-lg)

### 4. `src/components/cadastro/RegistrationCard.tsx` — Card de listagem
- Ordem fixa: nome parceiro (título) → avatar+comercial → banco (badge) → solicitação (badge) → status (badge com cor) → tratando com → observação (truncada) → última atualização (data + avatar + nome)
- Hover com elevação, clique abre modal de detalhes
- Responsivo com truncamento controlado

### 5. `src/components/cadastro/RegistrationModal.tsx` — Modal de criação/edição
- Select de Parceiro → auto-preenche CNPJ e Comercial (avatar + nome)
- Selects de Banco, Status, Solicitação, Tratando Com (todos vindos de `useSystemData`)
- Campo Observação (textarea)
- Campo Código (texto curto)
- Campos informativos: Solicitado em, Atualização, Concluído (automáticos)

## Arquivos a Modificar

### 6. `src/hooks/useSystemData.ts`
- Adicionar 4 novas categorias ao `SystemCategory`: `registrationStatuses`, `registrationSolicitations`, `registrationHandlers`, `registrationBanks`
- Valores iniciais conforme especificação (Não iniciado, Colhendo documentação, etc.)
- Atualizar `categoryLabels`

### 7. `src/components/settings/SystemDataTab.tsx`
- Adicionar ícones e incluir as 4 novas categorias no array `categories`

### 8. `src/App.tsx`
- Importar CadastroPage e adicionar rota `/cadastro`

### 9. `src/components/AppLayout.tsx`
- Adicionar item "Cadastro" no `navItems` (ícone `ClipboardList`, entre Parceiros e Configurações)

## Comportamentos Automáticos
- Selecionar parceiro → CNPJ e comercial preenchidos via `usePartners`
- Alterar observação → push de registro em `updates[]` com data, userId e texto
- Status = "Concluído" → campo `completedAt` = data atual
- Badges com cores semânticas por status (verde=concluído, amarelo=em análise, cinza=não iniciado, vermelho=cancelado)

## O que NÃO será alterado
- Lógica de negócio existente
- Estrutura de parceiros ou visitas
- Backend — tudo em estado local com localStorage

