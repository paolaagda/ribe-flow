

# Nova Aba "Dados do Sistema" + Simplificacao do Login

## Resumo

Criar uma aba "Dados do Sistema" em Configuracoes para gerenciar listas dinamicas (bancos, produtos, justificativas, tipos de loja, periodos) com ativar/inativar. Simplificar o login removendo o seletor de cargo. Remover icones Sun/Moon do formulario de periodo.

## Mudancas

### 1. Hook de dados do sistema (novo: `src/hooks/useSystemData.ts`)

Hook com `useLocalStorage` que gerencia 6 categorias de itens configuráveis:

```
interface SystemItem { id: string; label: string; active: boolean }
```

Categorias (inicializadas a partir dos dados mock existentes):
- `banks` — de `BANKS`
- `products` — de `PRODUCTS`
- `rescheduleReasons` — de `RESCHEDULE_REASONS`
- `cancelReasons` — de `CANCEL_REASONS`
- `storeStructures` — de `STORE_STRUCTURES`
- `periods` — de `VisitPeriod` (manhã, tarde)

Funcoes: `addItem(category, label)`, `toggleItem(category, id)`, `getActiveItems(category)`

### 2. Componente da aba (novo: `src/components/settings/SystemDataTab.tsx`)

- 6 secoes colapsáveis (Accordion), uma por categoria
- Cada secao: lista de itens com nome + Switch ativo/inativo + botao "Adicionar"
- Input inline para adicionar novo item
- Toast de feedback ao adicionar/inativar

### 3. Registrar aba em ConfiguracoesPage.tsx

- Adicionar tab "Dados do Sistema" com icone `Database`
- Novo `TabsContent` renderizando `SystemDataTab`

### 4. Consumir dados dinamicos nos formularios

**AgendaPage.tsx:**
- Selects de bancos, produtos, periodo → usar `getActiveItems()` em vez das constantes
- Remover icones Sun/Moon do select de periodo (manter apenas texto)

**JustificationModal.tsx:**
- Opcoes de justificativa → usar `getActiveItems('rescheduleReasons')` ou `getActiveItems('cancelReasons')`

**Formulario de parceiro (PartnersTab.tsx / PartnerDetailView.tsx):**
- Estruturas de loja → usar `getActiveItems('storeStructures')`

### 5. Simplificar login (LoginPage.tsx)

- Remover o seletor de cargo (RadioGroup com 5 opcoes)
- Manter apenas o toggle Gestor/Nao Gestor
- Login busca um usuario mock qualquer e aplica o perfil selecionado
- Remover imports de `CompanyCargo` e icones de cargo

### 6. Remover icones Sun/Moon do periodo no formulario

- No select de periodo (AgendaPage linha 672-677): remover `<Sun>` e `<Moon>`, manter apenas texto "Manhã" / "Tarde"

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useSystemData.ts` | Novo hook |
| `src/components/settings/SystemDataTab.tsx` | Novo componente |
| `src/pages/ConfiguracoesPage.tsx` | Adicionar aba |
| `src/pages/AgendaPage.tsx` | Consumir dados dinamicos, remover Sun/Moon do periodo |
| `src/components/agenda/JustificationModal.tsx` | Consumir justificativas dinamicas |
| `src/pages/LoginPage.tsx` | Remover seletor de cargo, manter so toggle perfil |

