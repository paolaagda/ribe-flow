

# Reordenacao do Menu + Evolucao do Podio

## Resumo

Reordenar os itens de navegacao (Agenda primeiro) e transformar o podio em um componente mais visual, com destaque para o 1o lugar, animacoes e microinteracoes.

## Mudancas

### 1. Reordenar menu

**`src/components/AppLayout.tsx`** — alterar array `navItems`:
```
Agenda → Campanhas → Analises → Parceiros → Configuracoes
```

**`src/components/MobileMenuDrawer.tsx`** — alterar array `allNavItems` na mesma ordem (remover Dashboard que ja nao existe).

**`src/App.tsx`** — alterar redirect de `/` para `/agenda` (priorizar uso diario).

### 2. Evoluir Podio (`src/pages/CampanhasPage.tsx`)

Substituir o bloco do podio (linhas 339-376) por um componente mais elaborado:

- **Layout**: 1o lugar centralizado e elevado, 2o a esquerda, 3o a direita — formato classico de podio
- **1o lugar**: Avatar maior (h-16), borda dourada com glow (`ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20`), icone de coroa/estrela acima, confetti ao carregar
- **2o e 3o**: Avatares medios (h-12), bordas prata e bronze
- **Barras do podio**: Alturas diferenciadas (h-24, h-16, h-10) com gradientes mais vivos
- **Informacoes**: Nome, pontuacao, cargo (em fonte menor)
- **Microinteracoes**: `whileHover={{ scale: 1.05 }}` no motion.div, transicao spring com stagger
- **Animacao de entrada**: Barras crescem de baixo para cima com delay escalonado
- **Mobile**: Em telas pequenas, reduzir gap e tamanhos de avatar proporcionalmente

### 3. Confetti para 1o lugar

Usar `canvas-confetti` (ja importado) para disparar uma animacao sutil ao montar o podio, celebrando o lider.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/AppLayout.tsx` | Reordenar navItems |
| `src/components/MobileMenuDrawer.tsx` | Reordenar allNavItems, remover Dashboard |
| `src/App.tsx` | Redirect `/` para `/agenda` |
| `src/pages/CampanhasPage.tsx` | Redesign do podio com visual premium |

