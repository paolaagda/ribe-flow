

# Evolucao da Gamificacao com Configuracao por Campanha

## Resumo

Adicionar configuracao de pontuacao, deflator por cancelamento e conquistas por campanha — tudo editavel no dialog de criar/editar campanha na aba de Configuracoes. A pagina de Campanhas exibe as regras e calcula pontuacao com base na configuracao.

## Mudancas

### 1. Modelo de dados (`src/data/campaigns.ts`)

Expandir a interface `Campaign` com configuracao de gamificacao:

```typescript
export interface GamificationConfig {
  pointsPerVisit: number;        // default 1
  pointsPerProspection: number;  // default 2
  pointsPerCancellation: number; // default -0.5
  achievements: {
    visitMilestone: number;      // ex: 10 visitas
    visitReward: number;         // ex: +10 pts
    prospectionMilestone: number; // ex: 8 prospecoes
    prospectionReward: number;   // ex: +15 pts
  };
}

export interface Campaign {
  // ...campos existentes
  gamification?: GamificationConfig;
}
```

Adicionar defaults e funcao helper `getGamificationConfig(campaign)` que retorna config ou defaults.

Adicionar funcao `getCancelledVisitsForUser(userId, startDate, endDate)` para contar cancelamentos.

Adicionar funcao `calculateUserScore(campaign, userId)` que calcula pontuacao total usando a config da campanha.

Atualizar `initialCampaigns` com configs de exemplo.

### 2. Formulario de campanha (`src/components/settings/CampaignsTab.tsx`)

Adicionar bloco "Gamificacao" no dialog de criar/editar campanha:

- Secao "Pontuacao por Atividade" com 3 inputs: pontos por visita, prospecao, cancelamento
- Secao "Conquistas" com 4 inputs: milestone e recompensa para visitas e prospecoes
- Valores pre-preenchidos com defaults
- Salvar no campo `gamification` da campanha

### 3. Pagina de Campanhas (`src/pages/CampanhasPage.tsx`)

**Calculo de score**: Substituir `score = visits + prospections` pelo `calculateUserScore` que usa a config da campanha ativa.

**Exibicao de regras**: No card da campanha ativa, mostrar as regras configuradas (pontos por acao, metas de conquista).

**Conquistas por campanha**: Substituir `badgeDefinitions` hardcoded por conquistas derivadas da config da campanha (milestone de visitas e prospecoes).

**Deflator**: Mostrar cancelamentos e seu impacto negativo no ranking e nos detalhes do usuario.

**Feedback visual**: Toast ao ganhar/perder pontos. Animacao ao completar conquista. Indicador de penalidade por cancelamento com icone vermelho.

### 4. CampaignProgress (`src/components/home/CampaignProgress.tsx`)

Atualizar ranking para usar `calculateUserScore` em vez de apenas contagem de visitas.

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/campaigns.ts` | Adicionar GamificationConfig, helpers de calculo, getCancelledVisitsForUser |
| `src/components/settings/CampaignsTab.tsx` | Adicionar secao Gamificacao no dialog de criacao/edicao |
| `src/pages/CampanhasPage.tsx` | Usar nova pontuacao, exibir regras, conquistas por campanha, feedback |
| `src/components/home/CampaignProgress.tsx` | Usar calculateUserScore no ranking |

