

# Ajustes da Página Agenda

## Resumo
Sete ajustes na página de Agenda: reformular insight de valor potencial, adicionar novo insight, criar agenda ao clicar no dia, aplicar filtros no mapa, mudar período de "30 dias" para mês atual, tornar insights sensíveis aos filtros, e remover barra de progresso da HeroSection.

## Alterações

### 1. Insight de valor potencial — mostrar o dia (SmartInsights.tsx)
Linha 71-74: ao invés de somar o valor total, identificar o dia com maior valor potencial planejado e exibir:
- `"Alto valor potencial planejado em 15/04"` (data do dia com maior soma)
- Manter variante `info` e ícone `DollarSign`

### 2. Novo card de Insight (SmartInsights.tsx)
Adicionar um quarto insight para a página `agenda` — aumentar o `slice` de 3 para 4 e adicionar lógica para, por exemplo:
- Taxa de cancelamento (se > 10%): "X% das agendas foram canceladas"
- Ou contagem de prospecções no período

### 3. Criar agenda ao clicar no dia (AgendaPage.tsx)
No calendário mensal (view === 'month'), adicionar handler `onClick` na célula do dia:
- Se o clique não foi em uma visita existente, abrir o formulário de nova agenda com a data pré-preenchida (`formData.date = dayStr`)
- Verificar permissão `canWrite('agenda.create')` antes de abrir
- Adicionar indicador visual sutil (ícone `+` no hover da célula vazia)

### 4. Filtros aplicados no Mapa de Agendas (AgendaPage.tsx)
O `AgendaMap` na linha 963 já recebe `filteredVisits` que inclui os filtros de status, tipo e período. Verificar que os filtros `filterUser` e `dateRange` estão sendo aplicados corretamente no `filteredVisits` memo — atualmente já estão. O mapa já recebe dados filtrados, portanto a filtragem já funciona. Validar e confirmar.

### 5. Mudar "últimos 30 dias" para mês atual (SmartInsights.tsx)
Substituir a lógica `differenceInDays(today, d) <= 30` por:
- `startOfMonth(today)` e `endOfMonth(today)` para filtrar visitas do mês corrente
- Alterar texto de `"nos últimos 30 dias"` para `"neste mês"` (ex: `"10 visitas concluídas neste mês"`)

### 6. Insights sensíveis aos filtros da página (SmartInsights + AgendaPage)
Passar os filtros ativos (view/período, status, tipo) como props para `SmartInsights`:
- Novas props: `filterView?: 'day' | 'week' | 'month'`, `filterStatus?: string`, `filterType?: string`
- No cálculo dos insights, aplicar os filtros recebidos sobre `visibleVisits` antes de calcular as métricas
- Na AgendaPage, passar: `<SmartInsights page="agenda" filterView={view} filterStatus={filterStatus} filterType={filterType} ... />`

### 7. Remover barra de progresso da HeroSection (HeroSection.tsx)
Remover o bloco condicional `{stats.campaignProgress > 0 && (...)}` (linhas 123-131) que renderiza o `Progress` com porcentagem. Remover também o cálculo de `campaignProgress` do `useMemo` e o import de `Progress`.

## Arquivos modificados
- `src/components/shared/SmartInsights.tsx` — itens 1, 2, 5, 6
- `src/pages/AgendaPage.tsx` — itens 3, 4, 6
- `src/components/home/HeroSection.tsx` — item 7

## Detalhes técnicos

### Props adicionais em SmartInsights
```typescript
interface SmartInsightsProps {
  page: InsightPage;
  activeFilter?: string | null;
  onFilterClick?: (id: string | null) => void;
  filterView?: 'day' | 'week' | 'month';
  filterStatus?: string;
  filterType?: string;
}
```

### Clique no dia do calendário
Na célula do calendário, adicionar um `onClick` no container do dia que verifica se o target é a própria célula (não um item de visita) e abre o formulário com data pré-setada.

