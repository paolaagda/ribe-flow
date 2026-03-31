

# Ajustar Layout dos Cards KPI

## Problema
Atualmente os cards KPI usam layout horizontal (ícone à esquerda, dados à direita no desktop) e vertical centralizado no mobile. O usuário quer um layout consistente baseado na imagem de referência:
- **Linha 1**: Ícone + valor (com secondaryValue) lado a lado, alinhados horizontalmente
- **Linha 2**: Título/label abaixo
- Responsivo: dados sempre visíveis, nunca transbordando

## Alteração

### `src/components/shared/AnimatedKpiCard.tsx`

Refatorar o `CardContent` para usar layout vertical em todas as telas:

```
Linha 1:  [ícone]  1/3
Linha 2:  AGENDAS HOJE
```

Detalhes:
- Layout sempre em coluna (`flex-col items-center text-center`)
- Linha 1: `flex-row items-center gap-2` com ícone + valor+secondary
- Linha 2: label abaixo, centralizado
- Remover `whitespace-nowrap` do label — usar `text-center leading-tight` com wrap permitido para telas pequenas
- Valor: usar `text-base sm:text-lg` ao invés de `text-lg sm:text-ds-xl` para caber melhor
- Label: `text-[9px] sm:text-[10px]` uppercase, `line-clamp-2` como fallback
- Padding compacto: `p-2.5 sm:p-3`
- `min-h-[72px] sm:min-h-[80px]` para manter cards proporcionais
- `overflow-hidden` no card para segurança

### Páginas afetadas (sem alteração de código)
O componente é reutilizado em AgendaPage, AnalisesPage, CadastroPage — todas herdarão o novo layout automaticamente.

