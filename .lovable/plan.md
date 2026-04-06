

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

