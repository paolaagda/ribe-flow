

# Ajustes de Icones na Agenda + Estrutura Usuarios/Parceiros/Lojas

## Resumo

Tres frentes: (1) trocar icones de periodo (Sun/Moon) por icones de tipo (Visita/Prospecao) na agenda, (2) remover "parceiro" e "loja" como cargos de usuario do sistema, (3) adicionar conceito de Loja vinculada a Parceiro.

## Mudancas

### 1. Icones na Agenda — Trocar periodo por tipo

**Onde aparece Sun/Moon hoje:**
- Calendario mensal (linha 542 AgendaPage) — icone antes do nome
- Lista semanal/diaria (linha 604 AgendaPage) — badge com emoji
- Detalhe da agenda (linha 80 AgendaDetailModal) — icone no grid
- Form de periodo no formulario (linhas 669-675 AgendaPage) — manter aqui, e so no select
- TodayAgenda (home) — badge de tipo ja existe, sem Sun/Moon

**Acao:**
- No calendario mensal: substituir `Sun`/`Moon` por `Handshake` (visita) / `UserPlus` (prospecao)
- Na lista semanal/diaria: substituir badge `☀ Manha`/`🌙 Tarde` por badge colorida `Visita` (azul) / `Prospecao` (laranja) com icone
- No detalhe (AgendaDetailModal): remover icone Sun/Moon do periodo, manter texto do periodo como badge simples; adicionar badge de tipo com icone
- No form de periodo: manter Sun/Moon no select (faz sentido ali)
- Na TodayAgenda: adicionar icone de tipo (Handshake/UserPlus) antes do nome

### 2. Remover "parceiro" e "loja" como usuarios do sistema

**mock-data.ts:**
- Remover u11 (Roberto, cargo parceiro) e u12 (Carla, cargo loja) do mockUsers
- Remover `'parceiro'` e `'loja'` de `CompanyCargo` e `allCargos`
- Remover entradas de `cargoLabels` e `cargoColors` para parceiro/loja

**LoginPage.tsx:**
- Remover opcoes "Parceiro" e "Loja" do array `cargos`

**UsersTab.tsx:**
- Atualizar se referencia esses cargos

### 3. Estrutura de Lojas vinculadas a Parceiro

**mock-data.ts:**
- Criar interface `Store` com: `id`, `partnerId`, `name`, `address`, `phone`, `contact`
- Criar `mockStores` com 2-3 lojas vinculadas a parceiros existentes (ex: Mega Financeira com 2 filiais)

**Partner:**
- Nao precisa mudar o tipo Partner (a relacao e feita pelo `partnerId` na Store)

**hooks/useStores.ts (novo):**
- Hook simples com useLocalStorage para stores
- Funcao `getStoresByPartnerId`

**Exibicao:**
- No `PartnerDetailView.tsx`: adicionar secao "Lojas" listando as lojas do parceiro

### 4. Vinculo comercial → parceiro

- Ja existe: `Partner.responsibleUserId` — campo ja presente e populado
- Nenhuma mudanca necessaria, apenas confirmar que esta sendo usado corretamente nos filtros de visibilidade (ja esta)

### 5. Estrutura de equipe

- Ja existe em `teams.ts` com diretor, gerente, ascom, comercial — nenhuma mudanca necessaria
- Cadastro (u10) precisa ser adicionavel a equipes: adicionar campo opcional `cadastroIds: string[]` ao tipo Team

## Arquivos Modificados

| Arquivo | Acao |
|---|---|
| `src/data/mock-data.ts` | Remover cargos parceiro/loja, remover u11/u12, adicionar Store interface e mockStores, adicionar cadastroIds ao Team |
| `src/data/teams.ts` | Adicionar `cadastroIds` ao tipo Team |
| `src/pages/AgendaPage.tsx` | Trocar Sun/Moon por Handshake/UserPlus no calendario e lista |
| `src/components/AgendaDetailModal.tsx` | Remover icone Sun/Moon do periodo, adicionar badge de tipo |
| `src/components/home/TodayAgenda.tsx` | Adicionar icone de tipo antes do nome |
| `src/pages/LoginPage.tsx` | Remover opcoes parceiro e loja |
| `src/hooks/useStores.ts` | Novo hook para lojas |
| `src/components/partners/PartnerDetailView.tsx` | Adicionar secao de lojas do parceiro |
| `src/components/settings/UsersTab.tsx` | Remover cargos parceiro/loja das opcoes |

