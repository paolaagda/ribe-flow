

# Reorganizar Pagina de Campanhas

## Resumo

Reordenar secoes, remover graficos e regras, ajustar layouts de conquistas e podio, acrescentar cards de alerta e detalhar historico de pontuacao.

## Nova Ordem da Pagina

1. **Cabecalho** (imagem 4) — manter como esta: titulo, periodo, selects
2. **Retirar badge** "Pontuacao valida apenas durante esta campanha" (imagem 5)
3. **Cards de alerta** (imagem 3) — nova secao com 3 cards informativos:
   - "Faltam X visitas para sua meta em [campanha]"
   - "Campanha [nome] termina em X dias"
   - "Voce esta acima/abaixo da media da equipe"
4. **KPI Cards** (imagem 6) — manter como esta
5. **Streak + Podio** (imagem 1) — layout como era antes: streak como card compacto horizontal e podio como card separado, lado a lado (2 colunas em desktop)
6. **Voce vs Media** — card individual
7. **Conquistas** (imagem 2) — layout compacto em uma unica linha horizontal (6 colunas), cards menores com icone, nome e descricao empilhados, sem progress bar
8. **Historico de Pontuacao** — detalhar com data e hora de cada evento

## Secoes Removidas

- Graficos "Contribuicao — Visitas" e "Contribuicao — Prospecoes"
- Grafico "Comparativo entre campanhas"
- Card "Regras de pontuacao desta campanha"
- Badge "Pontuacao valida apenas durante esta campanha"

## Mudancas Tecnicas

### `src/pages/CampanhasPage.tsx`

**Remover**: imports de BarChart/Bar/XAxis/YAxis/CartesianGrid/Tooltip/ResponsiveContainer/Cell/Legend do recharts. Remover variaveis `comparisonData`, `visitChartData`, `prospChartData`, `chartColors`. Remover blocos JSX dos graficos (linhas 463-521), regras (linhas 568-608), badge (linhas 291-293).

**Acrescentar cards de alerta**: Calcular dias restantes da campanha, visitas faltantes, comparar com media. Renderizar 3 cards horizontais com icones (AlertTriangle, Clock, TrendingUp).

**Conquistas**: Trocar grid de `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` para `grid-cols-3 md:grid-cols-6` (ou `grid-cols-7` se 7 conquistas). Cards compactos: icone centralizado no topo, nome abaixo, descricao pequena. Sem progress bar, sem badge de pontos inline — layout igual a imagem 2.

**Streak + Podio**: Mudar de grid 3 colunas para grid 2 colunas (streak + podio lado a lado). Streak como card compacto com "X dias" e subtitulo. Podio separado. "Voce vs Media" abaixo como card individual.

**Historico de Pontuacao**: Expandir `getUserScoreBreakdown` em `campaigns.ts` para retornar `date` e `time` em cada item. Gerar timestamps mock baseados no periodo da campanha. Exibir coluna de data/hora na tabela do accordion.

### `src/data/campaigns.ts`

Adicionar campo `date?: string` e `time?: string` ao `ScoreBreakdown`. Atualizar `getUserScoreBreakdown` para gerar datas mock dentro do periodo da campanha.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/CampanhasPage.tsx` | Reordenar, remover graficos/regras/badge, adicionar alertas, ajustar conquistas e podio |
| `src/data/campaigns.ts` | Adicionar date/time ao ScoreBreakdown |

