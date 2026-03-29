

# Melhorar o Design Visual dos Cards e Componentes

## Resumo

Elevar a qualidade visual dos cards e componentes em todas as páginas, adicionando refinamentos sutis como bordas com gradiente, ícones com fundos coloridos nos cards de gráficos, melhor hierarquia tipográfica, e microinterações mais polidas — sem alterar lógica ou estrutura de dados.

## Alterações Planejadas

### 1. Melhorar o Card base (`src/components/ui/card.tsx`)
- Adicionar transição suave padrão no Card base (`transition-all duration-200`)
- Bordas mais refinadas com opacidade

### 2. Melhorar cards de gráficos na Análises (`src/pages/AnalisesPage.tsx`)
- Adicionar ícones coloridos nos títulos dos cards de gráficos (já usam `CardTitle` mas sem ícone visual)
- Usar `icon-container-sm` com ícone temático ao lado de cada título
- Aplicar `card-hover` nos cards de gráficos para feedback visual no hover
- Padronizar `CardHeader` com `p-ds-sm pb-2`

### 3. Melhorar cards KPI na Campanhas (`src/pages/CampanhasPage.tsx`)
- Adicionar ícones nos 5 cards KPI (atualmente só texto), usando `icon-container-sm` com ícones temáticos (Target, UserPlus, Star, CheckCircle2, Ban)
- Aplicar `card-hover` nos cards
- Card "Você vs Média": padronizar para tokens `p-ds-sm`, `text-ds-xs`
- Cards de conquistas: aplicar tokens `text-ds-xs` nos textos `text-[10px]` e `text-[9px]`

### 4. Cards de Parceiros (`src/pages/ParceirosPage.tsx`)
- Adicionar separador visual sutil entre informações do card (endereço, estruturas, responsável) usando `divide-y` ou spacing melhor
- Melhorar o badge de potencial com cores mais vibrantes

### 5. SmartInsights (`src/components/shared/SmartInsights.tsx`)
- Adicionar ícone animado sutil no header (pulse leve no Lightbulb)
- Melhorar contraste dos items de insight com `backdrop-blur-sm`

### 6. AnimatedKpiCard (`src/components/shared/AnimatedKpiCard.tsx`)
- Adicionar um gradiente sutil de fundo baseado na cor do ícone quando ativo
- Melhorar a separação visual entre valor e label

### 7. HeroSection (`src/components/home/HeroSection.tsx`)
- Melhorar os `stat-chip` com ícones mais proeminentes e melhor separação visual

### 8. Estilos globais (`src/index.css`)
- Adicionar utility `.card-section-title` para padronizar títulos de seções dentro de cards
- Adicionar `.badge-potential-alto/medio/baixo` com cores semânticas

## Arquivos Afetados
- `src/components/ui/card.tsx`
- `src/index.css`
- `src/components/shared/AnimatedKpiCard.tsx`
- `src/components/shared/SmartInsights.tsx`
- `src/components/home/HeroSection.tsx`
- `src/pages/AnalisesPage.tsx`
- `src/pages/CampanhasPage.tsx`
- `src/pages/ParceirosPage.tsx`

## O que NÃO será alterado
- Lógica de negócio ou dados
- Estrutura de rotas
- Funcionalidades existentes
- Tokens do design system já definidos

