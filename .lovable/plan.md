

# Reestruturar Pagina de Agenda — Cards, Filtros e Localizacao

## Resumo

Reorganizar a pagina de Agenda com nova ordem de elementos, novos cards de KPI, filtros ao lado do titulo abaixo do hero, calendario em pt-BR e ajustes no HeroSection.

## Nova Ordem da Pagina (top-down)

```text
1. HeroSection (saudacao + stats ajustados)
2. Titulo "Agenda" + seletor de mes + filtros (mesma linha)
3. Grade de 6 cards KPI:
   [Agenda hoje] [Tarefas] [Agendas] [Visitas] [Prospecoes] [+ Nova agenda]
4. Painel expandivel (TodayAgenda + Mapa + PendingTasks)
5. Calendario
```

## Mudancas

### 1. HeroSection (`src/components/home/HeroSection.tsx`)

Ajustar a secao de stats para mostrar apenas contagens de **concluidas**:
- Icone `Handshake` + `{visitasConcluidas} visitas` (em vez de Eye + total)
- Icone `UserPlus` + `{prospecoesConcluidas} prospecoes` (em vez de Target + total)
- Manter barra de progresso da campanha

### 2. Titulo + Filtros abaixo do Hero (`src/pages/AgendaPage.tsx`)

Mover o bloco de titulo "Agenda" e todos os controles (navegacao mes, selects de modo/status/tipo, periodo) para logo abaixo do HeroSection, antes dos KPI cards. Layout em uma unica linha responsiva:
- Esquerda: "Agenda" (titulo sem subtitulo)
- Direita: navegacao mes `< Marco 2026 >` + Hoje + selects (Mensal, Status, Tipo) + Periodo

### 3. Reestruturar KPI cards

**Card 1 — Agenda hoje** (dados do dia atual apenas):
- Valor: `{concluidasHoje}` / secondaryValue: `{totalHoje}`
- Label: "Agendas hoje"
- Interativo (abre painel)

**Card 2 — Tarefas** (novo):
- Valor: `{tarefasConcluidas}` / secondaryValue: `{tarefasPendentes}`
- Label: "Tarefas"
- Interativo: abre modal/drawer com lista completa de tarefas
- Comercial ve suas tarefas; gestor ve todas com filtros

**Card 3 — Agendas** (controle geral):
- Valor: `{totalConcluidas}` / secondaryValue: `{totalAgendas}`
- Label: "Agendas"

**Card 4 — Visitas**:
- Manter como esta (concluidas/criadas)

**Card 5 — Prospecoes**:
- Manter como esta (concluidas/criadas)

**Card 6 — + Nova agenda** (botao como card):
- Card com icone Plus, label "Nova agenda"
- Ao clicar abre o form de criacao
- Visivel apenas se `canWrite('agenda.create')`

Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`

### 4. Calendario em pt-BR (`src/components/ui/calendar.tsx`)

Adicionar `locale={ptBR}` ao `DayPicker` para que o calendario do seletor de periodo exiba meses e dias em portugues.

### 5. Indicadores para hoje

Criar `todayIndicators` separado dos `indicators` filtrados, contando apenas visitas do dia atual para o card "Agenda hoje".

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/AgendaPage.tsx` | Reordenar layout, novos cards, mover filtros, add card Tarefas e +Nova agenda |
| `src/components/home/HeroSection.tsx` | Trocar icones/stats para mostrar concluidas com Handshake/UserPlus |
| `src/components/ui/calendar.tsx` | Adicionar locale pt-BR ao DayPicker |
| `src/components/shared/AnimatedKpiCard.tsx` | Nenhuma mudanca necessaria |

