

# Ajustar Cor das Barras de Rolagem no Modo Escuro

## Problema
As scrollbars (tanto as customizadas `.scrollbar-thin` quanto as do Radix ScrollArea) estão muito claras/destacadas no modo escuro.

## Alterações

### 1. `src/index.css` — scrollbar-thin no dark mode
Adicionar regra `.dark .scrollbar-thin` com cores mais escuras para track e thumb.

### 2. `src/components/ui/scroll-area.tsx` — ScrollAreaThumb
Atualmente usa `bg-muted-foreground/25` e hover `bg-muted-foreground/40`. No dark mode, `muted-foreground` é `215 12% 55%` — relativamente claro. Ajustar para usar opacidades menores no dark mode via classes condicionais: `dark:bg-muted-foreground/15 dark:hover:bg-muted-foreground/25`.

### Detalhes Técnicos

**index.css** — após o bloco `.scrollbar-thin`, adicionar:
```css
.dark .scrollbar-thin {
  scrollbar-color: hsl(var(--muted-foreground) / 0.12) transparent;
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.12);
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.25);
}
```

**scroll-area.tsx** — ScrollAreaThumb:
```
bg-muted-foreground/25 hover:bg-muted-foreground/40 dark:bg-muted-foreground/15 dark:hover:bg-muted-foreground/25
```

