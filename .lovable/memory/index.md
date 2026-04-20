# Project Memory

## Core
Nome: Canal Parceiro. Ícone: Handshake. pt-BR completo. Marca alinhada à Riber.
Direção visual: corporativa+moderna, clara, sombras leves, rounded-lg, sem gradientes espalhados, sem visual infantil.
Paleta: verde institucional (primary) principal; warning só para destaque/Prospecção; lilás só em gamificação; neutros claros base.
Densidade por módulo: Agenda leve · Dashboard robusto · Campanhas expressivas · Cadastro funcional · Configurações neutro.
Nomenclaturas oficiais (sem sinônimos): Agenda, Compromisso, Visita, Prospecção, Parceiro, Cadastro, Tarefa.
Visita = Handshake + info (azul). Prospecção = UserPlus + warning (amarelo). Sempre via src/lib/agenda-type-branding.ts.
Dark/light mode. Design system com tokens semânticos HSL. Proibido cor hardcoded em componentes.
localStorage com sync via custom events. Mock data, sem backend real.
5 cargos: Diretor, Gerente, Comercial, ASCOM, Cadastro.
useVisibility é fonte única de visibilidade. Não duplicar checagens de cargo.

## Memories
- [Visibility rules](mem://architecture/visibility-rules) — useVisibility hook, global vs restricted roles, filterVisits/filterPartners
- [Permissions model](mem://architecture/permissions-model) — RBAC with 65 keys, 5 roles
- [Stability patterns](mem://architecture/stability-patterns) — AuditTimeline fallbacks, icon support
- [Data persistence](mem://architecture/data-persistence) — localStorage with reactive sync
- [Notification system](mem://architecture/notification-system) — Single-dispatch from hooks
- [Notification system UI](mem://architecture/notification-system-ui) — 3-tab inbox layout
- [Task management unified view](mem://features/task-management/unified-view) — /tarefas page with filters
- [Quick tasks popover](mem://features/task-management/quick-tasks-popover) — Header popover, personal-only, ignores global views
- [Partner management](mem://features/partner-management/operational-center) — Operational cards and filters
- [Partner logic](mem://features/partner-management/logic) — Criticidade, classification, usePartnerOperationalData
- [Document validation flow](mem://features/partner-management/document-validation-flow) — Cadastro validates/rejects docs
- [Partner contextual actions](mem://features/partner-management/contextual-actions) — Nova visita shortcut
- [Registration permissions](mem://features/registration-management/permissions) — Global view for authorized roles
- [Registration filter logic](mem://features/registration-management/filter-logic-v6-final) — Cross-filtering cards
- [Registration operational logic](mem://features/registration-management/operational-logic) — Smart Summary 5 filters
- [Registration search](mem://features/registration-management/search-and-filtering) — Search by partner, status
- [Bank registration flow](mem://features/integration/bank-registration-flow) — Modal-initiated bank reg
- [Bank validation flow](mem://features/registration-management/bank-validation-flow) — Cadastro validates bank regs
- [Agenda map view](mem://features/agenda/map-view) — Global territorial analysis
- [Map markers style](mem://style/agenda/map-markers) — Zoom/pan affects base only
- [Compromisso hub](mem://features/compromisso/operational-hub) — AgendaDetailModal as edit center
- [Agenda KPI logic](mem://features/agenda/kpi-logic) — 5 KPIs completed/total
- [Agenda follow-up](mem://features/agenda/follow-up-logic) — Pre-filled follow-up creation
- [Agenda reschedule](mem://features/agenda/reschedule-logic) — Date change = reagendamento
- [Agenda form simplification](mem://features/agenda/form-simplification) — Removed Observações/Resultado
- [Agenda weekly grid](mem://features/agenda/weekly-grid) — 7-column grid layout
- [Agenda layout preference](mem://features/agenda/layout-preference) — Weekly view structure
- [Agenda potential suggestion](mem://features/agenda/potential-suggestion-v2) — Previous visit value suggestion
- [Agenda visual refinement](mem://features/agenda/visual-refinement-v2) — Monthly calendar style
- [Agenda gamification visuals](mem://features/agenda/gamification-visuals) — Crown icon for leaders
- [System data management](mem://features/system-data-management) — Dynamic lists by context
- [Justification groups](mem://features/system-data/justification-groups) — 8 groups by format
- [Campaign strategy hub](mem://features/campaign-strategy-hub) — Comparative accordion
- [Gamification rules](mem://features/gamification-rules) — Campaign-linked scoring
- [Smart insights](mem://features/smart-insights) — 4 reactive metric cards
- [Prospect management](mem://features/prospect-management) — Partner vs Prospect distinction
- [Analytics page](mem://features/analytics-page) — Strategic dashboard
- [Collaborator profiles](mem://features/collaborator-profiles) — Detailed profile page
- [Mobile gestures](mem://features/mobile-gestures) — Swipe navigation
- [Bulk partners](mem://features/data-management/bulk-partners) — CSV import/export
- [Commercial rules](mem://features/commercial-rules) — 5 roles, partner ownership
- [Dashboard backlog](mem://features/dashboard/strategic-backlog) — Refactoring plan in plan.md
- [Tablet support](mem://features/tablet-support) — 768-1023px breakpoint
- [Navigation structure](mem://navigation/structure) — Sidebar hierarchy
- [Pagination](mem://navigation/pagination) — Numbered desktop, simplified mobile
- [Terminology](mem://preferences/terminology-and-locking) — Agenda vs Compromisso distinction
- [Localization](mem://preferences/localization) — pt-BR throughout
- [Development approach](mem://preferences/development-approach) — Evolve existing code, no rewrites
- [Product focus](mem://product/strategic-focus) — Visit/prospect monitoring
- [Branding](mem://style/branding) — Canal Parceiro, Handshake icon
- [Design system](mem://style/design-system) — ds-xs to ds-xl tokens
- [Color palette dark](mem://style/color-palette/dark-mode) — High contrast dark palette
- [Partner class colors](mem://style/color-palette/partner-classes) — A/B/C/D semantic colors
- [Visual effects](mem://style/visual-effects) — Glassmorphism, gradients
- [UX patterns](mem://style/ux-patterns) — Irreversible actions need confirmation
- [UX philosophy agenda](mem://style/ux-philosophy/agenda) — Fast, low-bureaucracy tool
- [Hero section](mem://style/hero-section) — Greeting + campaign progress
- [Layout header](mem://style/layout-header) — Sticky h-14 z-40 topbar
- [Layout standards](mem://style/layout-standards) — 8px spacing scale
- [Partner detail UI](mem://style/partner-detail-ui) — Name priority, no truncation
- [Scrollbars](mem://style/scrollbars) — 6px compact, rounded
- [Filter animations](mem://style/filtering-animations) — AnimatedFilterContent
- [Theme toggle](mem://style/theme-toggle) — Header icons light/dark
- [Agenda type branding](mem://style/agenda-type-branding) — Visita=Handshake+info, Prospecção=UserPlus+warning, fonte única
- [Project Knowledge governance](mem://style/project-knowledge-governance) — Diretriz oficial completa de marca, nomenclatura e padronização visual
- [Shared visual primitives](mem://style/shared-visual-primitives) — Base oficial reutilizável em src/components/shared (IconTile, ToneBar, ToneBlock, ToneKpiCard, SurfaceCard, StatusPill, SectionHeader, ModalHeaderShell/FooterShell, ToneTabs)
- [Partner stores](mem://entities/partner-stores) — 1:1 store-partner relation
- [Auth flow](mem://auth/forgot-password-flow) — Simulated password recovery
- [Informações layout](mem://features/informacoes-uteis/layout) — Doc/process cards
- [Project docs](mem://documentation/arquivos-de-projeto) — PDF + technical docs
