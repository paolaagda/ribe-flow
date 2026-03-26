

# Correcao de Dados de Parceiro + Evolucao de Analises e Dashboard

## Resumo

Tres frentes: (1) remover bancos/produtos do card do parceiro (pertencem a agenda, nao ao parceiro), (2) evoluir a pagina de Analises com graficos interativos e filtros, (3) melhorar o Dashboard com mais interatividade visual.

## Mudancas

### 1. Remover bancos/produtos do card do parceiro

**`src/components/partners/PartnerDetailView.tsx`**

- Remover linhas 180-195 (secoes "Bancos trabalhados" e "Produtos") do card de informacoes do parceiro
- Manter `stats.banks` e `stats.products` no calculo (usados nos graficos/historico) — apenas remover a exibicao no card principal
- Os bancos/produtos continuam visiveis no historico de visitas (`PartnerVisitHistory`) e nos graficos (`PartnerCharts`), onde pertencem contextualmente

### 2. Evolucao da pagina de Analises (`src/pages/AnalisesPage.tsx`)

Reescrever com melhorias:

- **KPI cards animados**: Total, Concluidas, Visitas, Prospecoes com `motion` e `tabular-nums`
- **Grafico de tendencia mensal**: manter LineChart mas adicionar `Legend`, cursor interativo, tooltip estilizado com cores do tema
- **Distribuicao por status**: PieChart com `innerRadius` (donut), legenda lateral com percentuais
- **Performance individual**: BarChart empilhado (total vs concluidas) com tooltip detalhado mostrando taxa de conversao
- **Novo grafico — Criado vs Concluido por mes**: BarChart comparativo lado a lado
- **Novo grafico — Top parceiros visitados**: BarChart horizontal dos 5 parceiros mais visitados
- **Filtro de periodo personalizado**: alem de semana/mes/ano, adicionar date range com `Popover` + `Calendar` (mesmo padrao usado na agenda)
- **Responsividade**: `grid-cols-1 md:grid-cols-2` para graficos, cards empilhados em mobile
- **Usar `useVisits()` hook** em vez de `mockVisits` diretamente (consistencia com dados reativos)

### 3. Evolucao do Dashboard (`src/pages/DashboardPage.tsx`)

Melhorias sem remover componentes existentes:

- **Novo card de resumo rapido**: row de 4 mini-KPIs entre o Hero e o toggle de gestor (Visitas hoje, Concluidas, Pendentes, Taxa de conversao) com `motion` de entrada
- **Interatividade no StatusChart**: ja tem hover/tooltip — manter como esta
- **Interatividade no VisitMap**: ja tem tooltips — manter como esta
- **Melhor transicao entre modos**: adicionar `AnimatePresence` com `mode="wait"` ao trocar personal/team para transicao suave dos dados

### 4. Componentes compartilhados

**Novo `src/components/shared/AnimatedKpiCard.tsx`**: card reutilizavel com icone, valor animado (contagem), label e cor. Usado em Analises e Dashboard.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/partners/PartnerDetailView.tsx` | Remover secoes bancos/produtos do card |
| `src/pages/AnalisesPage.tsx` | Reescrever com graficos interativos, novos graficos, date range |
| `src/pages/DashboardPage.tsx` | Adicionar mini-KPIs, AnimatePresence no toggle |
| `src/components/shared/AnimatedKpiCard.tsx` | Novo componente reutilizavel |

