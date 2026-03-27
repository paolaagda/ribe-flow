

# Remocao do Dashboard + Reformulacao da Pagina de Campanhas

## Resumo

Remover a pagina Dashboard (rota, componente, menu). Redirecionar `/dashboard` para `/campanhas`. Reescrever completamente a pagina de Campanhas como centro estrategico unico, sem abas, com todas as secoes visiveis em scroll. Expandir conquistas com novas categorias. Adicionar comparativo entre campanhas, historico de pontuacao e streak.

## Mudancas

### 1. Remover Dashboard

**`src/App.tsx`**
- Remover import de `DashboardPage`
- Remover rota `/dashboard`
- Alterar redirect de `/` para `/campanhas`
- Manter redirect de `/dashboard` para `/campanhas` (compatibilidade)

**`src/components/AppLayout.tsx`**
- Remover item `Dashboard` do array `navItems`

**`src/pages/DashboardPage.tsx`**
- Deletar arquivo

**`src/data/permissions.ts`**
- Remover permissoes `dashboard.*` (linhas 13-16)

### 2. Expandir modelo de conquistas (`src/data/campaigns.ts`)

Adicionar ao `GamificationConfig.achievements`:
```typescript
achievements: {
  // existentes
  visitMilestone: number;
  visitReward: number;
  prospectionMilestone: number;
  prospectionReward: number;
  // novos
  firstVisitReward: number;        // pts por primeira visita
  firstProspectionReward: number;  // pts por primeira prospecao
  fullGoalReward: number;          // pts por 100% meta geral
};
```

Atualizar `defaultGamification`, `initialCampaigns` e `calculateUserScore` para incluir as novas conquistas.

### 3. Reescrever `src/pages/CampanhasPage.tsx`

Pagina inteira sem abas, tudo em scroll continuo. Layout:

**A) Cabecalho + Filtros**
- Titulo da campanha selecionada + periodo
- Select de campanha (default: ativa, permite ver anteriores, oculta futuras)
- Select de comercial (visivel apenas para diretor/gerente/ascom/cadastro)

**B) Reforco visual**
- Badge: "Pontuacao valida apenas durante esta campanha"

**C) Indicadores (cards KPI)**
- Visitas concluidas / meta
- Prospecoes concluidas / meta
- Pontuacao total
- Taxa de conclusao
- Cancelamentos

**D) Conquistas (inline, sem aba)**
- Cards de conquista com: nome, descricao, progresso, status, pontuacao
- Conquistas: Primeira visita, Primeira prospecao, Milestone visitas, Milestone prospecoes, 100% meta visitas, 100% meta prospecoes, 100% meta geral
- Animacao ao concluir

**E) Streak + Podio + Voce vs Media (grid 3 colunas)**
- Streak: dias consecutivos com atividade
- Podio: ranking por pontuacao total (remover criterios paralelos)
- Voce vs Media (remover Voce vs Lider)

**F) Graficos — Contribuicao por visitas e prospecoes (bar charts existentes)**

**G) Comparativo entre campanhas**
- Grafico de barras comparando campanha atual vs anteriores (excluir futuras)
- Dados: visitas, prospecoes, pontuacao, taxa conclusao, cancelamentos

**H) Historico de pontuacao (accordion)**
- Comercial: ve apenas seus dados
- Outros cargos: ve geral com filtro por usuario
- Tabela com detalhes de pontuacao por acao

**I) Estados vazios**
- Sem campanha: "Nenhuma campanha ativa no momento"
- Sem dados: "Sem dados suficientes"

### 4. Ajustar `src/components/settings/CampaignsTab.tsx`

Adicionar campos para as novas conquistas no formulario:
- Pontos por primeira visita
- Pontos por primeira prospecao
- Pontos por 100% meta geral

### 5. Componentes removidos/ajustados

- `src/components/home/CampaignProgress.tsx` — remover (era usado no Dashboard)
- `src/components/home/StatusChart.tsx` — remover (era usado no Dashboard)
- `src/components/home/HeroSection.tsx` — avaliar se ainda e usado, remover se nao

### 6. MobileMenuDrawer / MobileNav

- Atualizar para refletir remocao do Dashboard (item nao aparecera pois `navItems` foi atualizado)

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/App.tsx` | Remover rota Dashboard, redirect para /campanhas |
| `src/components/AppLayout.tsx` | Remover Dashboard do navItems |
| `src/pages/DashboardPage.tsx` | Deletar |
| `src/data/permissions.ts` | Remover permissoes dashboard.* |
| `src/data/campaigns.ts` | Expandir achievements com novas conquistas |
| `src/pages/CampanhasPage.tsx` | Reescrever completa — sem abas, scroll unico |
| `src/components/settings/CampaignsTab.tsx` | Adicionar campos novas conquistas |
| `src/components/home/CampaignProgress.tsx` | Deletar |
| `src/components/home/StatusChart.tsx` | Deletar |

