

# Sistema de Tarefas Relacionadas a Agenda e Parceiro

## Resumo

Criar um sistema de tarefas que extrai as tarefas dos comentarios das visitas (ja existentes como `VisitComment` com `type: 'task'`), centraliza-as em um hook dedicado, e exibe paineis de tarefas pendentes na agenda do dia, no detalhe do parceiro e no sistema de notificacoes.

## Situacao Atual

- Tarefas ja existem como `VisitComment` com `type: 'task'` e `taskCompleted` dentro de cada `Visit`
- Sao criadas via `AgendaComments` no modal de detalhe da agenda
- O parceiro ja exibe contagem de tarefas pendentes nos KPIs
- Nao ha visao centralizada, notificacoes de pendencia, nem links diretos entre tarefa/agenda/parceiro

## Mudancas

### 1. Hook centralizado `useTasks` (`src/hooks/useTasks.ts`)

Novo hook que agrega todas as tarefas de todos os `visits.comments` com `type: 'task'`. Retorna:
- `allTasks` — lista de objetos `{ task: VisitComment, visit: Visit, partner }` 
- `pendingTasks` — filtro de nao concluidas
- `completedTasks` — filtro de concluidas
- `getTasksByPartnerId(id)` — tarefas de um parceiro
- `getTasksByVisitId(id)` — tarefas de uma visita
- `overdueTasks` — pendentes ha mais de 10 dias (baseado em `createdAt`)
- `toggleTask(visitId, commentId)` — alterna completado

### 2. Card de Tarefas Pendentes na Agenda (`src/components/agenda/PendingTasksCard.tsx`)

Card compacto exibido na pagina de Agenda (ao lado ou abaixo dos KPIs existentes) mostrando:
- Contagem de tarefas pendentes e atrasadas
- Lista das 5 mais antigas com nome do parceiro, texto da tarefa e data de criacao
- Checkbox para concluir direto do card
- Clique abre o modal de detalhe da agenda correspondente
- Badge de alerta para tarefas com mais de 10 dias

### 3. Secao de Tarefas no Detalhe do Parceiro (`PartnerDetailView.tsx`)

Novo card entre Insights e Charts com:
- Resumo: X pendentes, Y concluidas
- Lista de tarefas pendentes com link para a agenda (abre modal de detalhe)
- Accordion com historico de tarefas concluidas
- Cada item mostra: texto, data de criacao, agenda vinculada

### 4. Notificacoes de Tarefas Atrasadas (`NotificationContext.tsx`)

Adicionar novo tipo de notificacao `'task_overdue'`:
- No `ensureInitialized`, verificar tarefas pendentes ha mais de 10 dias
- Gerar notificacao automatica para cada tarefa atrasada (max 5)
- Exibir na aba "Recentes" do NotificationInbox com icone de tarefa
- Ao clicar, navegar para a agenda correspondente

### 5. Historico de tarefas no modal de detalhe da agenda (`AgendaDetailModal.tsx`)

Melhorar a secao de AgendaComments para destacar visualmente as tarefas pendentes com badge de dias pendentes (ex: "ha 5 dias"). Ja funciona mas ganhar indicador temporal.

### 6. Integracao na pagina de Agenda (`AgendaPage.tsx`)

Inserir o `PendingTasksCard` no layout, visivel quando `showTodayPanel` esta ativo ou como card fixo acima do calendario. Respeitar visibilidade: nao gestor ve apenas suas tarefas.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useTasks.ts` | Criar — hook centralizado |
| `src/components/agenda/PendingTasksCard.tsx` | Criar — card de tarefas pendentes |
| `src/pages/AgendaPage.tsx` | Inserir PendingTasksCard |
| `src/components/partners/PartnerDetailView.tsx` | Adicionar secao de tarefas do parceiro |
| `src/contexts/NotificationContext.tsx` | Adicionar tipo task_overdue e geracao automatica |
| `src/components/agenda/AgendaComments.tsx` | Adicionar indicador de dias pendentes |
| `src/data/mock-data.ts` | Adicionar tipo `task_overdue` ao NotificationType se necessario |

