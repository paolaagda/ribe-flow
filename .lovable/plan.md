

# Revisao de Codigo — Melhorias, Correcoes e Sugestoes

## Problemas Encontrados

### 1. AgendaPage.tsx tem 1053 linhas — arquivo monolitico
O arquivo concentra formulario (3 etapas), calendario mensal, lista semanal/diaria, filtros, drag-and-drop, modais, handlers de convite, comentarios e indicadores. Dificulta manutencao.

**Sugestao**: Extrair em componentes:
- `AgendaForm.tsx` — dialog do formulario de 3 etapas (~linhas 756-1024)
- `AgendaCalendarMonth.tsx` — grid mensal (~linhas 588-680)
- `AgendaListView.tsx` — lista semanal/diaria (~linhas 681-753)
- `AgendaFilters.tsx` — barra de filtros e controles (~linhas 502-584)

### 2. Prospecao sem nome exibido no card mensal (bug visual)
Linha 636: `{partner?.name?.split(' ')[0]}` — para prospecoes, `partner` e `null` (nao tem `partnerId`), entao nada aparece. Deveria usar `visit.prospectPartner` como fallback.

**Correcao**: `{(partner?.name || v.prospectPartner || 'Sem nome')?.split(' ')[0]}`

### 3. Prospecao sem nome na lista semanal/diaria (mesmo bug)
Linha 710: `{partner?.name}` — mesmo problema. Deveria ter fallback para `v.prospectPartner`.

### 4. `getParticipants` chamado multiplas vezes por card sem memoizacao
Linhas 639, 647, 648: `getParticipants(v)` e chamado 3 vezes no mesmo render do card mensal, e 3 vezes no card semanal (721, 731, 733). Deveria salvar em variavel local.

### 5. Login sempre loga como cargo "comercial" (hardcoded)
Linha 25 de LoginPage: `login('comercial', appProfile)` — independente do toggle, o cargo e sempre `comercial`. O usuario nao consegue testar como diretor, gerente, etc.

**Sugestao**: Adicionar um seletor de cargo no login (ao menos para desenvolvimento/demo).

### 6. Seguranca: autenticacao 100% mock com localStorage
O `AuthContext` armazena usuario no `localStorage` sem nenhuma validacao. Qualquer pessoa pode manipular o perfil/role. Aceitavel para prototipo, mas deve ser documentado como limitacao.

### 7. `useCallback` com deps vazias ignora mudancas
Linha 130-141: `getParticipants` usa `getUserById` e `cargoLabels` que sao imports estaticos, entao deps `[]` e correto neste caso. OK.

### 8. Tipo duplicado de info nos cards semanais
Linha 716: `{v.type}` aparece como texto solto alem do badge de tipo (linha 712-713). Informacao duplicada — "Visita" aparece no badge E no texto "• Maria Souza • visita".

**Correcao**: Remover `• {v.type}` da linha 716.

### 9. `setVisits` com deps incompletas nos useCallback
Linhas 403-409: `handleAcceptVisitInvite` tem `[user, toast]` mas usa `setVisits` — porem `setVisits` e estavel (vem de hook), entao OK. Sem problema real.

### 10. Formulario permite salvar prospecao com status "Reagendada" na criacao
Ao criar nova agenda, o status default e "Planejada" e o seletor de status so aparece em edicao (linha 927: `editingVisit &&`). OK, sem problema.

### 11. Indicadores mostram "criadas/concluidas" mas label pode confundir
Os badges `{indicators.visitasCriadas}/{indicators.visitasConcluidas}` exibem "3/1 visitas". Nao fica claro o que e numerador e denominador.

**Sugestao**: Tooltip explicando "X criadas / Y concluidas" ou formato "Y✓ de X".

## Sugestoes de Melhoria

### A. Mascaras de input
Os campos CNPJ, telefone e CEP nao tem mascara. Adicionar formatacao automatica para melhor UX.

### B. Validacao de email no formulario de prospecao
O campo email e obrigatorio mas nao valida formato. Adicionar validacao basica.

### C. Acessibilidade
- Botoes de aceitar/rejeitar nos cards mensais (linhas 654-665) nao tem `aria-label`
- Drag and drop nao tem alternativa keyboard-accessible

### D. Empty states mais descritivos
Quando nao ha visitas no periodo filtrado, o calendario mostra celulas vazias sem feedback. Adicionar mensagem "Nenhuma agenda encontrada" com sugestao de limpar filtros.

## Plano de Implementacao

| Prioridade | Arquivo | Acao |
|---|---|---|
| Alta | `AgendaPage.tsx` L636 | Fix: fallback nome prospecao no card mensal |
| Alta | `AgendaPage.tsx` L710 | Fix: fallback nome prospecao na lista |
| Alta | `AgendaPage.tsx` L716 | Fix: remover tipo duplicado no texto |
| Media | `AgendaPage.tsx` L639+ | Otimizar: cachear getParticipants em variavel |
| Media | `AgendaPage.tsx` | Refactor: extrair 4 componentes filhos |
| Baixa | `AgendaPage.tsx` indicadores | UX: tooltip nos indicadores |
| Baixa | `LoginPage.tsx` | Feature: seletor de cargo para demo |
| Baixa | Formulario | UX: mascaras de CNPJ/telefone |

