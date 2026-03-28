

# Ajuste de Gamificacao (100% Metas) + Padronizacao Visual dos Cards

## Resumo

Separar a conquista "100% Meta Geral" em tres conquistas independentes com pontuacao configuravel: 100% Visitas, 100% Prospecoes e 100% Meta Geral. Adicionar campos de configuracao na aba de Campanhas. Padronizar altura dos cards em toda a pagina.

## Mudancas

### 1. Modelo de dados (`src/data/campaigns.ts`)

Expandir `GamificationConfig.achievements` com dois novos campos:
- `fullVisitGoalReward: number` — pontos por atingir 100% das visitas
- `fullProspectionGoalReward: number` — pontos por atingir 100% das prospecoes

Atualizar `defaultGamification` com valores padrao (ex: 10 cada).

Atualizar `calculateUserScore`:
- Adicionar bonus separado quando `visits >= participant.visitGoal` → `+fullVisitGoalReward`
- Adicionar bonus separado quando `prospections >= participant.prospectionGoal` → `+fullProspectionGoalReward`

Atualizar `getUserScoreBreakdown` com entradas separadas para cada conquista de 100%.

Atualizar `initialCampaigns` com os novos campos.

### 2. Configuracao (`src/components/settings/CampaignsTab.tsx`)

Na secao "Conquistas adicionais", adicionar 2 novos campos:
- "Pts 100% visitas"
- "Pts 100% prospecoes"

(ao lado do campo existente "Pts 100% meta geral", formando grid de 5 ou reorganizar em 2 linhas)

### 3. Conquistas na pagina (`src/pages/CampanhasPage.tsx`)

Atualizar array `achievements` (linhas 128-129) para usar `reward: config.achievements.fullVisitGoalReward` e `reward: config.achievements.fullProspectionGoalReward` em vez de `reward: 0`.

### 4. Padronizacao visual dos cards

Aplicar `min-h-[X]` consistente nos cards:
- **KPI cards** (linhas 278-321): adicionar `min-h-[120px]` em cada Card
- **Alert cards** (linhas 264-272): adicionar `min-h-[56px]`
- **Achievement cards** (linhas 427-437): adicionar `min-h-[120px]`
- **Streak card**: ja tem altura consistente, manter
- **Voce vs Media**: adicionar `min-h-[100px]`

Adicionar `hover:shadow-md transition-shadow` em todos os cards interativos para feedback consistente.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/campaigns.ts` | Adicionar fullVisitGoalReward e fullProspectionGoalReward ao GamificationConfig, atualizar calculo e breakdown |
| `src/components/settings/CampaignsTab.tsx` | Adicionar campos de configuracao para 100% visitas e 100% prospecoes |
| `src/pages/CampanhasPage.tsx` | Usar novos rewards nas conquistas, padronizar min-h e hover nos cards |

