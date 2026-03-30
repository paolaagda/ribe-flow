

# Espaçamento Vertical e Disposição dos Dados — Plano de Ajuste

## Resumo

Padronizar o espaçamento vertical entre seções de todas as páginas usando os tokens do Design System (`ds-lg` = 32px entre seções, `ds-sm` = 16px dentro de componentes, `ds-md` = 24px para padding interno). Corrigir disposição interna dos dados nos cards para melhor legibilidade.

## Problemas Identificados

- **AgendaPage**: usa `space-y-8` (32px) mas com `gap-4`/`gap-5` internos — inconsistente
- **AgendaPage**: títulos e textos com `text-2xl`, `text-xs`, `text-sm` em vez de tokens DS
- **CampanhasPage**: Pódio usa `p-6` e `gap-3`/`gap-6` hardcoded
- **CampanhasPage**: Conquistas e Histórico com `gap-3`, `mb-3`, `mb-6` hardcoded
- **Cards internos**: padding `p-4`, `p-3`, `p-2` misturados em vez de `p-ds-sm`
- **Grids**: `gap-4`, `gap-5` misturados em vez de `gap-ds-sm`

## Alterações Planejadas

### 1. AgendaPage (`src/pages/AgendaPage.tsx`)
- `space-y-8` → `space-y-ds-lg` no PageTransition
- Título `text-2xl` → `text-ds-xl`
- Textos `text-xs` → `text-ds-xs`, `text-sm` → `text-ds-sm`
- Grid de KPIs `gap-4` → `gap-ds-sm`
- Painéis expandidos `gap-5` → `gap-ds-sm`, `pt-2`/`pt-4` → `pt-ds-xs`/`pt-ds-sm`
- Card tarefas `p-4` → `p-ds-sm`
- Calendário grid interno: manter compacto (funcional), mas `p-2 sm:p-4` → `p-ds-xs sm:p-ds-sm`

### 2. CampanhasPage (`src/pages/CampanhasPage.tsx`)
- Pódio card: `p-6` → `p-ds-md`, `mb-6` → `mb-ds-sm`, `gap-3 md:gap-6` → `gap-ds-sm md:gap-ds-md`
- Conquistas: `mb-3` → `mb-ds-xs`, `gap-3` → `gap-ds-xs`
- Histórico de pontuação: `mb-3` → `mb-ds-xs`
- "Você vs Média": `gap-5` → `gap-ds-sm`, `mb-4` → `mb-ds-sm`

### 3. AnalisesPage (`src/pages/AnalisesPage.tsx`)
- Já bem padronizado — ajustar `gap-4` no grid de legendas de status (linha ~248) → `gap-ds-sm`

### 4. ParceirosPage (`src/pages/ParceirosPage.tsx`)
- Já bem padronizado — verificar e ajustar `gap-3` no search bar → `gap-ds-sm`

### 5. ConfiguracoesPage (`src/pages/ConfiguracoesPage.tsx`)
- Já usa tokens — sem alterações necessárias

### 6. Disposição interna dos cards (melhoria de dados)
- **AnimatedKpiCard**: aumentar `mt-1.5` do label para `mt-2` para melhor separação valor/label
- **Campanhas KPI cards**: adicionar `gap-1` entre valor e progress bar (`mt-2` → `mt-2.5`)
- **Pódio**: melhorar espaçamento entre avatar, nome e badge (`gap-1.5` → `gap-2`)
- **Streak card**: adicionar `gap-0.5` entre título e descrição

## Arquivos Afetados
- `src/pages/AgendaPage.tsx` — maior volume de ajustes
- `src/pages/CampanhasPage.tsx` — pódio, conquistas, histórico
- `src/pages/AnalisesPage.tsx` — ajuste menor
- `src/pages/ParceirosPage.tsx` — ajuste menor
- `src/components/shared/AnimatedKpiCard.tsx` — separação valor/label

## O que NÃO será alterado
- Lógica de negócio ou dados
- Estrutura de componentes
- Tokens do design system existentes
- Funcionalidades e interações

