

# Tornar KPI "Agendas hoje" clicavel para mostrar Agenda do Dia e Mapa

## Resumo

Ao clicar no card "Agendas hoje" na pagina de Agenda, expandir uma secao abaixo dos KPIs mostrando os componentes `TodayAgenda` e `VisitMap` (que hoje estao no Dashboard). Esses componentes serao removidos do Dashboard.

## Mudancas

### 1. `src/components/shared/AnimatedKpiCard.tsx`
- Adicionar prop opcional `onClick?: () => void`
- Aplicar `cursor-pointer` e o handler no Card quando `onClick` estiver presente

### 2. `src/pages/AgendaPage.tsx`
- Adicionar estado `showTodayPanel` (boolean, default false)
- Passar `onClick` no primeiro `AnimatedKpiCard` ("Agendas hoje") para alternar `showTodayPanel`
- Abaixo da grid de KPIs, renderizar com `AnimatePresence` um painel condicional contendo:
  - Grid 2 colunas: `<TodayAgenda viewMode="personal" />` + `<VisitMap viewMode="personal" />`
- Importar `TodayAgenda` e `VisitMap`

### 3. `src/pages/DashboardPage.tsx`
- Remover `TodayAgenda` e `VisitMap` do Dashboard (ja foram transferidos para Agenda)
- Manter `CampaignProgress` e `StatusChart`

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/shared/AnimatedKpiCard.tsx` | Adicionar prop `onClick` |
| `src/pages/AgendaPage.tsx` | Estado toggle + painel TodayAgenda/VisitMap |
| `src/pages/DashboardPage.tsx` | Remover TodayAgenda e VisitMap |

