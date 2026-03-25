

# Redesign da Página de Login

## Visão Geral
Modernizar a página de login com um layout mais sofisticado: fundo com gradiente sutil, ícone atualizado (trocar o "R" por um ícone de Handshake do Lucide, representando parceria), card com glassmorphism, e melhorias tipográficas.

## Alterações — `src/pages/LoginPage.tsx`

### Ícone do App
- Substituir o quadrado com letra "R" por um ícone `Handshake` do lucide-react
- Ícone maior (h-8 w-8) dentro de um container com gradiente primário e sombra
- Container circular com efeito de glow sutil

### Fundo da Página
- Adicionar gradiente decorativo sutil no background (círculos de cor primária com blur)
- Manter compatibilidade com dark mode

### Card
- Adicionar `backdrop-blur` e bordas mais suaves
- Sombra mais pronunciada (`shadow-2xl`)

### Tipografia
- Adicionar subtítulo "Acesse sua conta" abaixo do nome do app
- Melhorar espaçamento e hierarquia visual

### Seletor de Perfil
- Melhorar o grid: ícones por perfil (lucide icons para cada role)
- Layout mais compacto e visualmente distinto

### Botão Entrar
- Adicionar gradiente ou sombra para dar mais destaque
- Transição hover mais suave

### Também atualizar em `src/components/AppLayout.tsx`
- Trocar o "R" do sidebar e mobile header pelo mesmo ícone `Handshake`

## Arquivos
1. `src/pages/LoginPage.tsx` — redesign completo
2. `src/components/AppLayout.tsx` — atualizar ícone do logo (2 ocorrências: sidebar + mobile header)

