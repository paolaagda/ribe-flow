---
name: Agenda type branding
description: Identidade visual oficial e centralizada de Visita e Prospecção
type: design
---

Identidade visual oficial dos tipos de compromisso, centralizada em `src/lib/agenda-type-branding.ts`:

- **Visita** → ícone `Handshake` + cor `info` (azul). Classes: `text-info`, `bg-info`, `bg-info/10`, `border-info/20`.
- **Prospecção** → ícone `UserPlus` + cor `warning` (amarelo). Classes: `text-warning`, `bg-warning`, `bg-warning/10`, `border-warning/20`.

Regra: qualquer card, badge, KPI, chip, mapa, modal, lista, header ou notificação que se refira a Visita ou Prospecção DEVE importar `agendaTypeBranding` ou `getAgendaTypeBrand(type)` desse arquivo. Proibido criar variantes locais (Sparkles, MapPin, Eye, Search, violet-600, primary) para representar esses tipos.

Para charts/SVG, usar `brand.hsl` (`hsl(var(--info))` / `hsl(var(--warning))`).

Em fundos preenchidos (`bg-info`/`bg-warning`) usar `text-white` sobre info e `text-black` sobre warning para garantir contraste — os tokens `info-foreground`/`warning-foreground` não existem no design system.
