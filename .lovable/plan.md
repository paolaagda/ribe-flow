

# Ajustes da Página de Cadastro

## Resumo
Adicionar filtros expandíveis, filtro de data com múltiplos modos, e cards indicadores para "Tratando Com" e "Bancos" — todos com seções colapsáveis.

## Alterações em `src/pages/CadastroPage.tsx`

### 1. Filtros expandíveis (padrão Agenda)
- Adicionar estado `showFilters` com botão "Filtros" ao lado do título (mesmo padrão da AgendaPage com `Filter` icon + badge de filtros ativos)
- Mover os selects existentes (Status, Banco) para dentro do painel expansível
- Manter o campo de busca sempre visível fora do painel

### 2. Novos filtros dentro do painel
- **Comercial**: Select com lista de usuários comerciais (`mockUsers.filter(u => u.role === 'comercial')`) filtrando por `commercialUserId`
- **Solicitação**: Select com `getActiveItems('registrationSolicitations')` filtrando por `solicitation`
- **Tratando com**: Select com `getActiveItems('registrationHandlers')` filtrando por `handlingWith`
- **Data de atualização**: Popover com Calendar + modos (dia específico, período com data inicial/final, e presets mensal/semanal/diário). Filtra pela data do último update ou `requestedAt`

### 3. Cards indicadores de "Tratando Com" (com título visível)
- Novo bloco de cards similar aos status KPIs mas com **título textual** visível (não tooltip)
- Conta registrations por `handlingWith`
- Ícone genérico (ex: `Users`) + contagem + label abaixo
- Clicável para filtrar

### 4. Cards indicadores de "Bancos" (com título visível)
- Mesmo padrão: cards com ícone `Building2` + contagem + label do banco
- Clicável para filtrar por banco

### 5. Seções colapsáveis para indicadores
- Wrap cada grupo de cards (Status, Tratando Com, Bancos) em um `Collapsible` com título de seção
- Estado individual por grupo (`expandStatus`, `expandHandlers`, `expandBanks`)
- Animação suave com `AnimatePresence` + `motion.div`

### Estados novos
```
filterCommercial, filterSolicitation, filterHandler, filterDateMode, filterDateFrom, filterDateTo, showFilters, expandStatus, expandHandlers, expandBanks
```

### Lógica de filtro `filtered` (useMemo)
Acrescentar verificações para os novos filtros: `commercialUserId`, `solicitation`, `handlingWith`, e data (verificar `updates[last].date` ou `requestedAt`).

### Arquivo afetado
- `src/pages/CadastroPage.tsx` — único arquivo modificado

