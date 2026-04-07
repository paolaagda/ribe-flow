

## Plano: Gerar Documentação de Arquitetura Funcional (Markdown)

Gerar um arquivo `Canal_Parceiro_Documentacao_Arquitetura.md` em `/mnt/documents/` com base exclusiva no código-fonte analisado.

### Estrutura do Documento

O Markdown terá as seguintes seções, cada uma diferenciando explicitamente o que é **implementado**, **parcial**, **ausente** ou **hipótese**, com indicação de origem técnica:

1. **Visão Geral do Produto** — SPA React/TS, dados em localStorage, sem backend
2. **Módulos Implementados** — tabela com status de cada módulo
3. **Telas Existentes** — mapeamento de todas as 12 rotas com componentes e funcionalidades
4. **Entidades e Relacionamentos** — User, Partner, Visit, Registration, Campaign, Team, Store, Notification, AuditLog + diagrama ASCII dos relacionamentos
5. **Fluxos Principais** — Login, criação de agenda, convite/aceitação, solicitação de cadastro, aprovação/recusa pelo gerente, gamificação, tarefas/documentos
6. **Regras de Negócio Identificadas** — permissões (48 ações, 13 módulos), visibilidade por perfil, sincronização tarefa-documento, auto-refresh de datas mock, notificações automáticas
7. **Componentes de Interface** — shared (PageHeader, AnimatedKpiCard, SmartInsights, PaginationControls), domínio (agenda, partners, cadastro, campaigns, settings, info, notifications), UI (shadcn/ui)
8. **Padrões Visuais** — tema claro/escuro (CSS vars), design tokens, cor primária verde (#16a34a), framer-motion, sidebar colapsável, bottom nav mobile, responsividade (useIsMobile/useIsTablet), swipe gestures
9. **Automações Existentes** — notificações de convite, task_overdue, registration_approval, sync bidirecional tarefa↔checklist de documentos, regeneração de datas de visitas demo
10. **Pendências Estruturais** — sem backend real, sem autenticação real, sem persistência de dados entre dispositivos, campanhas usam mockVisits direto em vez de localStorage, sem testes funcionais
11. **Pontos de Melhoria** — inconsistências identificadas no código
12. **Resumo Executivo do Estado Atual** — sólido, funcional-incompleto, frágil, top 10 prioridades

### Inconsistências Identificadas (a documentar)
- `CampanhasPage` importa `mockVisits` diretamente em vez de `useVisits()` → pontuação de campanhas não reflete dados atualizados do localStorage
- Login sem validação real (qualquer cargo + perfil = acesso)
- `useTeamFilter` referencia `mockUsers` diretamente em vez de dados dinâmicos
- Dados de equipes são estáticos em `initialTeams`, editáveis apenas se houver UI (parcial nas Configurações)

### Implementação
- Script Python que escreve o arquivo `.md` completo em `/mnt/documents/`
- Conteúdo 100% baseado na análise de código já realizada
- Estimativa: ~2500 linhas de Markdown

---

## STATUS ATUAL DO PRODUTO

> **A Agenda é a tela principal do app neste momento.**
> O refinamento da Agenda como núcleo operacional é a prioridade atual.
> O Dashboard estratégico está registrado como backlog para fase posterior.
> **Nenhuma implementação de código deve ser feita para o Dashboard até decisão explícita.**

---

## Backlog Estratégico: PRD — Refatoração do Dashboard

**Status: 🟡 BACKLOG — NÃO EXECUTAR AGORA**

> Este PRD é material de referência estratégica. Nenhuma rota, componente ou lógica deve ser criada para o Dashboard até aprovação explícita.

---

### 1. Contexto

O Canal Parceiro é uma plataforma operacional para equipes comerciais que realizam visitas e prospecções a parceiros de negócio. O foco principal é analisar e monitorar a atividade comercial — visitas, prospecções, conversões e evolução da carteira. O cadastro bancário é consequência de uma visita ou prospecção bem-sucedida, não o centro do produto.

Cada comercial possui uma carteira de parceiros classificada em A, B, C e D, o que orienta priorização de esforço e frequência de visitas.

### 2. Problema

A tela Index atual funciona como hub de navegação com cards de atalho, sem apresentar dados analíticos ou operacionais relevantes. Não há visão consolidada da performance comercial, do estado da carteira, nem do funil de conversão. O gerente não tem como comparar desempenho entre comerciais ou identificar gargalos sem navegar por múltiplas telas.

### 3. Objetivo

Transformar o Dashboard (Index) em painel analítico-operacional que:
- Para o **Comercial**: mostre sua carteira, atividade recente, prioridades do dia e evolução pessoal
- Para o **Gerente**: mostre visão comparativa da equipe, funil de conversão, gargalos e tendências

### 4. Papel estratégico do Dashboard

| Aspecto | Descrição |
|---|---|
| Entrada principal | Primeira tela após login |
| Decisão rápida | O comercial vê o que fazer hoje; o gerente vê onde intervir |
| Dados, não atalhos | Substituir cards de navegação por indicadores reais |
| Consistência | Usar os mesmos dados de `useVisits()`, `usePartners()`, `useRegistrations()` |

### 5. Visão do Dashboard — Comercial

| Seção | Conteúdo |
|---|---|
| Saudação contextual | "Bom dia, [nome]" + resumo do dia (X visitas, Y prospecções) |
| Minha Carteira | Distribuição A/B/C/D com contagem e % |
| Atividade recente | Últimas 5 visitas realizadas com status |
| Prioridades | Parceiros A/B sem visita há mais de X dias |
| Agenda do dia | Próximas visitas de hoje (link direto para Agenda) |

### 6. Visão do Dashboard — Gerente

| Seção | Conteúdo |
|---|---|
| Comparativo de equipe | Ranking de comerciais por visitas realizadas no período |
| Funil comercial | Prospecções → Visitas → Cadastros → Concluídos |
| Gargalos | Cadastros parados há mais de X dias, parceiros sem visita |
| Evolução | Gráfico de tendência semanal/mensal |

### 7. Carteira de parceiros — Classificação A/B/C/D

**Novo campo na entidade Partner:**
```typescript
partnerClass: 'A' | 'B' | 'C' | 'D'
```

| Classe | Cor sugerida | Significado |
|---|---|---|
| A | `hsl(var(--success))` | Parceiro estratégico, alta prioridade |
| B | `hsl(var(--info))` | Parceiro ativo, manutenção regular |
| C | `hsl(var(--warning))` | Parceiro com potencial, precisa de atenção |
| D | `hsl(var(--muted-foreground))` | Parceiro inativo ou baixo potencial |

**Regras iniciais:**
- Classificação manual pelo comercial ou gerente
- Exibida como badge colorido em todas as telas que mostram parceiros
- Filtrável na lista de parceiros e no Dashboard

### 8. Funil comercial

**Visão Comercial:**
```
Prospecções realizadas → Visitas agendadas → Cadastros solicitados → Cadastros concluídos
```

**Visão Gerente:**
```
Total prospecções (equipe) → Total visitas → Total cadastros → Conversão %
```

### 9. Indicadores estratégicos

**Comercial:**

| Indicador | Fonte |
|---|---|
| Visitas realizadas (período) | `useVisits()` filtrado por userId e status |
| Prospecções convertidas | Visitas tipo 'prospecção' com cadastro vinculado |
| Carteira por classe | `usePartners()` agrupado por `partnerClass` |
| Taxa de reagendamento | Visitas com status 'Reagendada' / total |
| Parceiros sem visita (>30d) | Último registro de visita por parceiro |

**Gerente:**

| Indicador | Fonte |
|---|---|
| Ranking de comerciais | Visitas por userId, ordenado |
| Funil de conversão | Contagem por etapa |
| Cadastros pendentes | `useRegistrations()` filtrado por status |
| Tempo médio de cadastro | Data solicitação → data conclusão |
| Cobertura da carteira | % de parceiros visitados no período |

### 10. Regras de negócio

1. Comercial vê apenas seus próprios dados
2. Gerente vê dados consolidados da equipe
3. Classificação A/B/C/D é editável por comercial (própria carteira) e gerente (qualquer)
4. Período padrão: mês atual, com seletor de período
5. Indicadores usam dados reais de `useVisits()`, `usePartners()`, `useRegistrations()`
6. Prospecção é tipo de visita, não entidade separada
7. Cadastro vinculado a parceiro via `partnerId`
8. Funil calculado em tempo real, não armazenado
9. Dashboard não duplica funcionalidade da Agenda — apenas resume
10. Parceiros sem classe definida = classe D por padrão
11. Ranking do gerente não expõe dados individuais para comerciais
12. Cards do Dashboard são links contextuais (clicáveis para a tela de detalhe)

### 11. Ajustes de UX/UI

- Layout responsivo: cards empilhados em mobile, grid em desktop
- Cores A/B/C/D consistentes com design tokens existentes
- Gráficos via Recharts (já instalado)
- Transições com framer-motion (já instalado)
- Tema claro/escuro respeitado em todos os novos componentes
- Sem scroll horizontal em nenhum breakpoint

### 12. O que deve ser mantido

- Estrutura de navegação atual (sidebar + bottom nav)
- `AppLayout` como wrapper
- Hooks existentes (`useVisits`, `usePartners`, `useRegistrations`)
- Sistema de permissões (`usePermission`)
- Padrão visual dos KPI cards (`AnimatedKpiCard`)
- Sistema de temas e design tokens

### 13. O que NÃO deve acontecer

- Dashboard não substitui a Agenda como tela operacional
- Dashboard não deve ter formulários de criação/edição
- Não criar backend apenas para o Dashboard
- Não duplicar dados em novo localStorage key
- Não quebrar rotas existentes
- Não remover a página Index atual antes de ter o Dashboard pronto

### 14. Critérios de aceite

1. Comercial vê sua carteira por classe A/B/C/D
2. Comercial vê indicadores pessoais do período
3. Comercial vê agenda do dia resumida
4. Comercial vê prioridades (parceiros A/B sem visita recente)
5. Gerente vê ranking comparativo de comerciais
6. Gerente vê funil de conversão da equipe
7. Gerente vê gargalos (cadastros parados, parceiros inativos)
8. Gerente vê gráfico de evolução temporal
9. Classificação A/B/C/D editável e persistida em localStorage
10. Filtro de período funcional (semana, mês, trimestre)
11. Todos os indicadores usam hooks existentes como fonte
12. Responsivo em mobile, tablet e desktop
13. Tema claro/escuro funcional
14. Sem regressão nas telas existentes
15. Performance: Dashboard carrega em < 1s com dados mock

### 15. Impactos esperados

- Redução de tempo para decisão operacional (comercial sabe o que fazer ao abrir o app)
- Visibilidade gerencial sem navegar por múltiplas telas
- Classificação de carteira permite priorização estratégica
- Funil comercial visível incentiva conversão

### 16. Prioridade da entrega

| Fase | Escopo | Dependência |
|---|---|---|
| Fase 1 | Campo `partnerClass` + badge em telas de parceiros | Nenhuma |
| Fase 2 | Dashboard Comercial (carteira, atividade, agenda do dia) | Fase 1 |
| Fase 3 | Dashboard Gerente (ranking, funil, gráficos) | Fase 2 |

**Arquivos impactados (estimativa):**

| Arquivo | Tipo de alteração |
|---|---|
| `src/data/mock-data.ts` | Adicionar `partnerClass` à interface Partner |
| `src/pages/Index.tsx` | Refatorar para Dashboard analítico |
| `src/components/dashboard/*` | Novos componentes de Dashboard |
| `src/components/partners/PartnerListItemCard.tsx` | Exibir badge de classe |
| `src/components/partners/PartnerDetailView.tsx` | Exibir/editar classe |
| `src/hooks/useDashboardData.ts` | Novo hook de agregação |
