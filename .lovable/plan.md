

# Expansao de Convites na Agenda para Todos os Cargos

## Resumo

Atualmente o campo "Convidados" no formulario da agenda filtra apenas usuarios com `role === 'comercial'`. A mudanca e simples: expandir para todos os usuarios ativos do sistema, agrupados por cargo, com exibicao do cargo ao lado do nome.

## Estado Atual

- Linha 423 de AgendaPage: `const commercials = mockUsers.filter(u => u.role === 'comercial' && u.active)`
- Linhas 773-786: lista de checkboxes mostrando apenas comerciais
- AgendaDetailModal ja exibe participantes com avatar e status
- Notificacoes ja sao enviadas para cada convidado

## Mudancas

### 1. AgendaPage.tsx — Expandir lista de convidados

**Linha 423**: Renomear `commercials` para `invitableUsers` e remover filtro por cargo:
```ts
const invitableUsers = mockUsers.filter(u => u.active);
```

**Linhas 769-791**: Substituir a lista simples por lista agrupada por cargo:
- Agrupar usuarios por `role` (usando `cargoLabels` para rotulo)
- Exibir nome do cargo como separador
- Mostrar cargo ao lado do nome em texto menor
- Excluir o usuario logado da lista
- Manter campo de busca por nome

### 2. AgendaDetailModal.tsx — Exibir cargo dos participantes

Na secao de participantes (linha 214+), adicionar o cargo do usuario ao lado do nome:
```
Avatar | Nome | Cargo (badge) | Status
```

### 3. Nenhuma mudanca em notificacoes

O sistema de notificacoes ja envia convites para qualquer userId — nao tem filtro por cargo. Nada a alterar.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/AgendaPage.tsx` | Expandir filtro de usuarios, agrupar por cargo, campo de busca |
| `src/components/AgendaDetailModal.tsx` | Exibir cargo dos participantes |

