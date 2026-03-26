

# Simplificar Indicadores de Visitas e Prospecções

## Resumo

Mover os indicadores de Visitas e Prospecções para dentro da linha do header, entre o titulo "Agenda" e o botão "Nova agenda", em formato compacto inline (sem cards separados).

## Mudancas

### `src/pages/AgendaPage.tsx`

**Remover o bloco de cards (linhas 488-523)** — os dois `Card` com `motion.div` que ocupam uma row inteira.

**Inserir indicadores compactos no header (linhas 476-486)** — dentro do `div` flex que contem o titulo e o botão, adicionar badges/chips inline entre o titulo e o botão:

```
[Agenda (titulo)]  [🤝 X/Y visitas] [👤 X/Y prospecções]  [+ Nova agenda]
```

Implementacao:
- Dois `Badge` ou `div` compactos com icone pequeno (h-3.5 w-3.5) + texto "X/Y" 
- Cores: info para visitas, warning para prospecções
- Layout: o header flex ja tem `justify-between`, adicionar os badges no meio com `flex-1` ou como parte do bloco esquerdo
- Manter os valores reativos de `indicators.*`
- Remover `motion.div` e `motion.span` dos indicadores (simplificar)

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/AgendaPage.tsx` | Mover indicadores para header inline, remover cards |

