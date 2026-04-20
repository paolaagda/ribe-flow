---
name: Shared visual primitives
description: Base oficial reutilizável de componentes visuais do Canal Parceiro em src/components/shared — usar sempre em vez de recriar estruturas tonais ad-hoc
type: design
---

Base oficial de componentes visuais reutilizáveis em `src/components/shared`. Toda nova tela, modal ou refatoração DEVE usar estes componentes em vez de recriar headers/blocos/badges/tiles ad-hoc.

**Tons semânticos oficiais** (`./tone.ts`): `primary` (verde institucional), `info` (azul, Visita), `warning` (amarelo, Prospecção/atenção), `destructive` (vermelho, irreversível), `success` (verde concluído), `muted` (neutro). Sempre via tokens HSL — proibido cor hardcoded. Consumir via `getTone(tone)` que retorna `bar`, `tile`, `iconColor`, `badgeBg/Text/Border`, `softBg/Border`, `button`, `optionSelected`, `optionDot`.

**Primitivos**:
- `IconTile` — bloco quadrado tonal com ícone (sm 9, md 11, lg 14). Usado em headers, banners, KPIs.
- `ToneBar` — barra lateral vertical tonal (`absolute left-0 w-1`). Container pai precisa `relative`.

**Blocos compostos**:
- `ToneBlock` — bloco semântico tonal (barra lateral + tile + eyebrow/title/description). Substitui banners ad-hoc de Próxima ação, justificativas, devolutiva, prospecção.
- `ToneKpiCard` — KPI oficial com barra lateral tonal, suporta `active`/`onClick` (filtros).
- `SurfaceCard` — card padronizado (border-border/60 + shadow-sm + header tonal `bg-muted/30` opcional com tile). Padrão das páginas refatoradas.
- `StatusPill` — badge discreto e elegante (variants soft/outline/solid, sizes sm/md). Sistema principal usa soft+sm. Gamificação tem componentes próprios.
- `SectionHeader` — cabeçalho de seção (ícone tonal pequeno + label uppercase tracking + linha divisória). Padrão de AgendaFormDialog, TaskCreateModal, TaskDetailModal.

**Modal shells** (use dentro de `<DialogContent className="p-0 gap-0 overflow-hidden">`):
- `ModalHeaderShell` — barra lateral tonal + tile + eyebrow + title + subtitle + meta + actions.
- `ModalFooterShell` — `bg-muted/20 border-t border-border/60 px-6 py-4`.

**Tabs tonais**:
- `ToneTabsList` / `ToneTabsTrigger` — fundo `bg-muted/40` + trigger ativo branco com sombra. Padrão de Detalhe do Parceiro/Cadastro/Configurações.

**Tokens adicionados ao design system** (em `index.css` + `tailwind.config.ts`): `--success-foreground`, `--warning-foreground`, `--info-foreground` (light + dark). Agora `text-warning-foreground`, `bg-info text-info-foreground` etc. funcionam corretamente para botões/dots tonais.

**Lembrete oficial Visita/Prospecção**: Visita = `Handshake` + `tone="info"` · Prospecção = `UserPlus` + `tone="warning"`. Aplicar em todo IconTile, ToneBlock, StatusPill, ModalHeaderShell que represente esses tipos.

**Migração**: JustificationModal já consome `ModalHeaderShell`, `ModalFooterShell` e `ToneBlock`. Próximas refatorações devem migrar AgendaFormDialog, TaskCreateModal, TaskDetailModal, AgendaDetailModal, CadastroDetalhePage e PartnerDetailView para consumirem esses primitivos sem alterar layout aprovado.

Importar via barrel: `import { ModalHeaderShell, ToneBlock, IconTile, getTone, type Tone } from '@/components/shared';`
