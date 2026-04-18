---
name: Project Knowledge governance
description: Diretriz oficial de marca, nomenclatura e padronização visual do Canal Parceiro — regra ativa em toda implementação
type: design
---

Toda nova tela, componente, refatoração ou ajuste do Canal Parceiro DEVE seguir o Project Knowledge oficial:

**Direção visual**: equilibrada entre corporativa e moderna, profissional mas acessível, clara, organizada, confiável, alinhada à marca Riber. Base moderna e suave, cantos suavemente arredondados (`rounded-lg`), sombras leves (`shadow-sm`), sem exageros decorativos. Clareza > enfeite. Organização > excesso. Modernidade controlada. Semântica forte para status. Densidade adaptativa por módulo.

**Paleta**: verde institucional (`--primary`) como cor principal. Laranja/âmbar (`--warning`) só para destaque, performance, campanhas, atenção leve e Prospecção. Lilás/lavanda/azul-violeta suave só em gamificação/reconhecimento. Neutros claros para fundo, cards, bordas e textos secundários. Sempre usar tokens HSL do design system — proibido cor hardcoded em componentes.

**Componentes (sistema principal)**: cards limpos com variação controlada por módulo; badges e status discretos e elegantes; botões refinados (primário verde institucional, secundário neutro/contornado); inputs limpos com foco visível; filtros discretos; tabelas escaneáveis; gráficos comparáveis sem excesso decorativo. Exceções de expressividade só em Campanhas/Gamificação/Conquistas.

**Densidade por módulo**:
- Agenda → leve, espaçada, leitura rápida, prioridade mobile
- Dashboard → robusto, estratégico, denso, comparável
- Campanhas/Ranking → expressivos e celebrativos, ainda coerentes com a marca
- Cadastro → claro, administrativo, funcional
- Parceiros → equilibra leitura comercial, operação e acompanhamento
- Configurações → neutro, técnico, estável

**Nomenclaturas oficiais (não criar sinônimos)**: Agenda = visão temporal · Compromisso = item agendado · Visita = compromisso de parceiro existente · Prospecção = compromisso de potencial parceiro fora da base · Parceiro = relacionamento ativo · Cadastro = processo de credenciamento/habilitação · Tarefa = ação operacional do fluxo.

**Visita vs Prospecção (fonte única `src/lib/agenda-type-branding.ts`)**: Visita = `Handshake` + `info` (azul). Prospecção = `UserPlus` + `warning` (amarelo). Aplicar em todo card, badge, chip, lista, agenda, mapa, dashboard, análise, notificação, componente reutilizável e nova tela. Proibido trocar ícone, cor ou semântica entre telas.

**Evitar sempre**: visual infantil no sistema principal, excesso de cor, sombras pesadas, gradientes espalhados, layout poluído, Agenda apertada, Dashboard simplificado demais, Gamificação descolada da marca, inconsistência entre componentes, inconsistência de nomenclatura, representação visual inconsistente de Visita/Prospecção.
