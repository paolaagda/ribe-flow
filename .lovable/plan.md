

# Criar Notificacoes, Agendas e Convites para Hoje

## Resumo

Enriquecer os dados mock para que o dia de hoje tenha agendas com convidados, notificacoes de convite pendentes e variedade de status — garantindo que o usuario veja dados ao abrir o app.

## Mudancas

### 1. Visitas de hoje com convidados (`src/data/mock-data.ts`)

As 5 visitas fixas de hoje (vt1–vt5) atualmente tem `invitedUsers: []`. Adicionar convidados reais:

- **vt1** (Credito Facil, u4): convidar u2 (accepted), u3 (pending)
- **vt2** (Express, u4): convidar u5 (pending), u9 (accepted)
- **vt3** (Casa Emprestimo, u5): convidar u4 (pending)
- **vt5** (Mega Financeira, u4): convidar u7 (accepted), u6 (pending)

### 2. Notificacoes de hoje (`src/contexts/NotificationContext.tsx`)

Atualmente gera 4 notificacoes mock (2 pending, 1 accepted, 1 rejected). Ajustar para incluir convites vinculados as visitas de hoje:

- Convite pendente para vt1 (hoje 09:00, Credito Facil) — de u4
- Convite pendente para vt2 (hoje 10:30, Express) — de u4
- Convite pendente para vt3 (hoje 11:00, Casa Emprestimo) — de u5
- Manter 1 convite aceito (amanha) e 1 rejeitado (passado) para variedade no historico

Usar `visitId` correspondente aos IDs reais (vt1, vt2, vt3) para consistencia.

### 3. Garantir inicializacao

O `ensureInitialized` so gera mocks se `allNotifications.length === 0` e perfil `nao_gestor`. Manter essa logica — os mocks serao gerados no primeiro acesso. Se o localStorage ja tiver dados antigos, o usuario pode limpar historico para resetar.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/mock-data.ts` | Adicionar invitedUsers nas visitas vt1-vt5 |
| `src/contexts/NotificationContext.tsx` | Atualizar mocks para convites de hoje com visitIds reais |

