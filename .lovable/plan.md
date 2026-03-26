

# Avatares nos Cards da Agenda + Indicadores de Performance + Filtro por Periodo

## Resumo

Tres adições na pagina de agenda: (1) avatares dos participantes nos cards, (2) cards de indicadores visita/prospecção no topo, (3) filtro de periodo personalizado com date range.

## Mudancas

### 1. Avatares nos cards da agenda (`AgendaPage.tsx`)

**Calendario mensal (cards pequenos ~linha 528-562):**
- Apos o nome do parceiro, adicionar mini-avatares (max 2-3) dos participantes (userId + invitedUsers aceitos)
- Usar circulos de 14px com inicial do nome
- Se > 2, mostrar "+N"
- Tooltip com nome + cargo no hover

**Lista semanal/diaria (cards maiores ~linha 596-622):**
- Adicionar stack horizontal de avatares (Avatar component, h-6 w-6, overlap -ml-1.5)
- Mostrar ate 4 avatares + "+N" badge
- Tooltip com nome + cargo
- Posicionar apos as badges existentes (valor, medio)

### 2. Cards de indicadores no topo (`AgendaPage.tsx`)

Adicionar entre o header e os controles (apos linha 448, antes de linha 450):

Dois cards lado a lado (grid-cols-2):
- **Card Visitas**: icone Handshake, "X criadas / Y concluidas" — filtra `filteredVisits` por `type === 'visita'`
- **Card Prospecções**: icone UserPlus, "X criadas / Y concluidas" — filtra por `type === 'prospecção'`

Concluidas = `status === 'Concluída'`

Os indicadores devem reagir a todos os filtros aplicados (status, tipo, usuario, e o novo filtro de periodo).

### 3. Filtro por periodo personalizado (`AgendaPage.tsx`)

Novo estado:
```ts
const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
```

Adicionar na barra de filtros (junto aos selects existentes):
- Popover com dois campos de data (inicio/fim) usando Calendar component
- Botao "Limpar" para resetar
- Placeholder "Periodo personalizado"

Integrar no `filteredVisits`:
- Se dateRange.from/to definidos, filtrar visitas dentro do intervalo
- Os indicadores e a lista reagem automaticamente

### 4. Imports necessarios

- `Avatar`, `AvatarFallback` de `@/components/ui/avatar`
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` de `@/components/ui/tooltip`
- `Popover`, `PopoverTrigger`, `PopoverContent` de `@/components/ui/popover`
- `Calendar` de `@/components/ui/calendar`

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/AgendaPage.tsx` | Adicionar avatares nos cards, cards de indicadores, filtro de periodo |

Nenhum arquivo novo necessario — tudo dentro de AgendaPage usando componentes UI existentes.

