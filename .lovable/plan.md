

# Criar Notificacoes de Convite para Todos os Perfis

## Problema Atual

O `ensureInitialized` em `NotificationContext.tsx` so gera notificacoes mock quando:
1. `allNotifications.length === 0` (localStorage vazio)
2. `user?.profile === 'nao_gestor'`

Isso significa que gestores nunca recebem notificacoes mock, e se o localStorage ja tiver dados antigos, nenhum perfil recebe novos mocks.

## Mudancas

### `src/contexts/NotificationContext.tsx`

1. **Remover restricao de perfil**: trocar `user?.profile === 'nao_gestor'` por apenas `user` — todos os perfis recebem convites mock
2. **Verificar por usuario**: em vez de checar `allNotifications.length === 0`, verificar se o usuario atual ja tem notificacoes (`allNotifications.filter(n => n.toUserId === user.id).length === 0`) — permite que diferentes usuarios no mesmo browser recebam seus mocks
3. **Manter logica existente**: os 3 convites pendentes para hoje (vt1, vt2, vt3) + 1 aceito + 1 rejeitado permanecem iguais

## Arquivo

| Arquivo | Acao |
|---|---|
| `src/contexts/NotificationContext.tsx` | Ajustar `ensureInitialized` para todos os perfis |

