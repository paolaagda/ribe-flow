

# Justificativa Obrigatoria para Reagendamento e Cancelamento

## Resumo

Criar um sistema global de justificativas padronizadas para mudancas de status criticas (Reagendada/Cancelada), com modal reutilizavel, validacao em todos os fluxos, persistencia local e exibicao no historico.

## O que muda

### 1. Atualizar listas de justificativas (mock-data.ts)

Substituir as constantes `RESCHEDULE_REASONS` e `CANCEL_REASONS` existentes (linha 54-55) pelas novas listas do PRD:

- **Reagendamento**: Cliente solicitou nova data, Conflito de agenda interna, Cliente indisponivel no horario, Replanejamento estrategico, Problemas operacionais
- **Cancelamento**: Cliente nao tem interesse, Cliente nao respondeu, Dados incorretos ou invalidos, Problema interno, Parceiro descredenciado

Adicionar campo `statusChangedAt?: string` ao tipo `Visit` para registrar a data da alteracao.

### 2. Criar modal global de justificativa (novo componente)

`src/components/agenda/JustificationModal.tsx`

- Recebe: `open`, `onOpenChange`, `targetStatus` ("Reagendada" | "Cancelada"), `onConfirm(reason: string)`
- Titulo dinamico conforme status
- Select com opcoes fixas (sem texto livre, sem "Outro")
- Botao Confirmar desabilitado ate selecao
- Botao Cancelar fecha sem alterar nada
- Animacao via framer-motion (consistente com o resto do app)

### 3. Interceptar drag and drop (AgendaPage.tsx)

Alterar `handleDrop` (linha 125-138): em vez de aplicar imediatamente o status "Reagendada", abrir o modal de justificativa. So aplicar a mudanca apos confirmacao com a justificativa selecionada. Guardar temporariamente o visitId e nova data em estado local.

### 4. Interceptar mudanca de status no formulario de edicao (AgendaPage.tsx)

Quando o usuario muda o status para Reagendada/Cancelada no formulario de edicao, abrir o modal automaticamente. A justificativa ja existe no form mas sera forcada via modal com as novas opcoes.

### 5. Interceptar status no detalhe da agenda (AgendaDetailModal.tsx)

Se houver acoes de mudanca de status direta no modal de detalhe, interceptar para abrir o modal de justificativa.

### 6. Persistencia

Ao confirmar, salvar no objeto Visit:
- `status` atualizado
- `rescheduleReason` ou `cancelReason` com a justificativa
- `statusChangedAt` com `new Date().toISOString()`

### 7. Exibicao da justificativa

**AgendaDetailModal.tsx**: Exibir badge/destaque visual com o motivo quando status for Reagendada ou Cancelada.

**PartnerTimeline.tsx**: Incluir o motivo na descricao do evento: "Visita reagendada - motivo: {justificativa}".

**PartnerVisitHistory.tsx**: Exibir justificativa no historico de visitas do parceiro.

### 8. Feedback (toast)

Apos confirmacao no modal:
- "Reagendamento registrado com sucesso"
- "Cancelamento registrado com sucesso"

## Detalhes tecnicos

- Modal usa `Dialog` do radix + `Select` do shadcn (componentes ja existentes)
- Estado do modal controlado por `useState` no AgendaPage e passado para sub-componentes
- Para drag-and-drop: estado pendente `pendingDrop: { visitId, newDate } | null` que dispara o modal
- Tipo Visit extendido com `statusChangedAt?: string`
- Nenhuma API ou backend necessario

## Arquivos modificados

| Arquivo | Acao |
|---|---|
| `src/data/mock-data.ts` | Atualizar RESCHEDULE_REASONS, CANCEL_REASONS, tipo Visit |
| `src/components/agenda/JustificationModal.tsx` | Novo componente |
| `src/pages/AgendaPage.tsx` | Interceptar drag-drop e form status changes |
| `src/components/AgendaDetailModal.tsx` | Exibir justificativa, interceptar status change |
| `src/components/partners/PartnerTimeline.tsx` | Exibir motivo na timeline |
| `src/components/partners/PartnerVisitHistory.tsx` | Exibir motivo no historico |

