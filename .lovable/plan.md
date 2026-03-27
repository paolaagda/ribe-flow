

# Melhorar Disposicao dos KPI Cards Visitas/Prospecoes

## Resumo

Alterar os cards de Visitas e Prospecoes para mostrar o numero de concluidos em destaque (fonte grande) e o de criados em fonte menor ao lado, com layout mais claro — similar a imagem de referencia.

## Mudancas

### 1. `src/components/shared/AnimatedKpiCard.tsx`

- Adicionar prop opcional `secondaryValue?: number | string` — exibido ao lado do valor principal em fonte menor e cor muted
- Quando `secondaryValue` esta presente, renderizar: `<span class="text-2xl font-bold">{value}</span><span class="text-sm text-muted-foreground">✓ de </span><span class="text-base text-muted-foreground">{secondaryValue}</span>`

### 2. `src/pages/AgendaPage.tsx`

- Card Visitas: `value={indicators.visitasConcluidas}` + `secondaryValue={indicators.visitasCriadas}`
- Card Prospecoes: `value={indicators.prospecoesConcluidas}` + `secondaryValue={indicators.prospecoesCriadas}`

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/shared/AnimatedKpiCard.tsx` | Adicionar prop `secondaryValue` com renderizacao |
| `src/pages/AgendaPage.tsx` | Passar `value` e `secondaryValue` separados |

