

# Filtros Compactos e Calendário em Português

## Mudanças

### 1. `src/pages/AgendaPage.tsx` — Compactar filtros

- Reduzir largura dos SelectTriggers: `w-28` → `w-24`, `w-32` → `w-28`
- Reduzir altura: `h-9` → `h-8`
- Reduzir fonte dos triggers: adicionar `text-xs`
- Compactar gap entre filtros: `gap-2` → `gap-1.5`

### 2. `src/pages/AgendaPage.tsx` — Calendário do Período em português

- Passar `locale={ptBR}` nos dois `<Calendar>` dentro do Popover de Período (linhas 581-596)
- O `ptBR` já está importado no arquivo

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/AgendaPage.tsx` | Compactar filtros + adicionar locale ptBR nos calendários do período |

