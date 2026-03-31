

# Pódio Animado e Divertido

## Objetivo
Tornar o componente de pódio na página de Campanhas mais dinâmico, com animações elaboradas, efeitos visuais e microinterações que transmitam celebração.

## Alterações em `src/pages/CampanhasPage.tsx`

### Animações de entrada
- **Barras do pódio**: animação de "crescimento" de baixo para cima (height de 0 ao valor final) com stagger entre 2º → 1º → 3º
- **Avatares**: bounce com spring mais expressivo, entrada com scale de 0→1
- **Estrela do 1º lugar**: animação de rotação + pulse contínuo
- **Badge de pontos**: fade-in com delay após o avatar aparecer
- **Posição (1º, 2º, 3º)**: counter animation, aparecendo após a barra crescer

### Efeitos visuais contínuos
- **1º lugar**: glow pulsante dourado ao redor do avatar (animate com keyframes de shadow)
- **Estrela**: rotação lenta contínua + escala pulsante
- **Barra do 1º**: shimmer/brilho sutil percorrendo (gradiente animado via CSS)
- **Confetti particles**: partículas decorativas sutis (pequenos pontos dourados animados com framer-motion) ao redor do 1º lugar

### Interatividade
- **Hover no avatar**: scale up + elevação (translateY negativo) + intensificação do glow
- **Hover na barra**: leve aumento de brilho no gradiente
- **Tap/click**: pequeno bounce de feedback

### Detalhes técnicos
- Usar `motion.div` com `animate` para glow pulsante (loop infinito via `repeat: Infinity`)
- CSS keyframes para shimmer na barra (via className inline ou index.css)
- Confetti: 5-8 pequenos `motion.span` posicionados absolutamente com animações de float aleatórias
- Manter responsividade existente

### Arquivo afetado
- `src/pages/CampanhasPage.tsx` — refatorar o bloco do pódio (linhas ~330-378)
- `src/index.css` — adicionar keyframe `shimmer` para brilho na barra do 1º lugar

