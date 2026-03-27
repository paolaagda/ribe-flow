

# Ajustar KPI Cards e Remover Badges Inline

## Resumo

1. **Remover** os badges inline "6✓ de 9 visitas" e "4✓ de 10 prospecções" (linhas 514-537)
2. **Alterar** os KPI cards de Visitas e Prospecções para mostrar "concluído vs criado" (ex: valor "6✓ de 9" em vez de apenas "9")

## Mudancas

### `src/pages/AgendaPage.tsx`

- **Remover** o bloco `<TooltipProvider>` com os dois badges inline (linhas 514-537)
- **Alterar** os dois ultimos KPI cards para passar `value` como string formatada:
  - Visitas: `value={\`${indicators.visitasConcluidas}✓ de ${indicators.visitasCriadas}\`}`
  - Prospecções: `value={\`${indicators.prospecoesConcluidas}✓ de ${indicators.prospecoesCriadas}\`}`

### Nenhuma alteracao em outros arquivos

O `AnimatedKpiCard` ja aceita `value: number | string` — quando string, exibe direto sem animacao de contagem.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/AgendaPage.tsx` | Remover badges inline, atualizar value dos KPIs |

