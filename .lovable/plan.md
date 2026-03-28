

# Gerar PDF — Documentacao Completa do Canal Parceiro

## Objetivo

Criar um PDF detalhado documentando toda a estrutura do app, paginas, regras de acesso, permissoes por perfil e funcionalidades.

## Conteudo do Documento

### 1. Capa
- Nome do app: Canal Parceiro
- Subtitulo: Documentacao de Estrutura, Acessos e Permissoes

### 2. Visao Geral
- App de gestao comercial com foco em visitas, prospecoes e campanhas de gamificacao
- Stack: React + Vite + Tailwind + TypeScript
- Autenticacao simulada com selecao de Cargo e Perfil do App

### 3. Modelo de Acesso
- **Perfil do App (2 niveis)**: Gestor (acesso total) e Nao Gestor (acesso restrito)
- **Cargos da Empresa (5 tipos)**: Diretor, Gerente, ASCOM, Comercial, Cadastro
- Permissoes controladas pelo Perfil do App, nao pelo Cargo
- Cargo define o contexto/label do usuario, Perfil define o que ele pode fazer

### 4. Paginas do Sistema (uma secao por pagina)

**Agenda** — Calendario de visitas e prospecoes com views dia/semana/mes, CRUD de agendamentos, filtro por comercial (gestor), mapa de visitas do dia, KPIs, convidados, justificativas obrigatorias para cancelamento/reagendamento, comentarios

**Campanhas** — Centro estrategico de gamificacao: KPIs, alertas, streak de dias consecutivos, podio animado com confetti, conquistas (badges), ranking, historico de pontuacao detalhado, filtro por comercial

**Analises** — Graficos e relatorios: distribuicao por status, evolucao temporal, ranking de comerciais, filtro por periodo e data customizada

**Parceiros** — Lista de parceiros com busca, detalhe com timeline, graficos, historico de visitas, informacoes de contato e lojas vinculadas

**Configuracoes** — 5 abas: Usuarios (lista, editar, bloquear, resetar senha, permissoes), Campanhas (criar/editar com gamificacao configuravel), Parceiros (gestao), Aparencia (tema claro/escuro), Dados do Sistema (bancos, produtos, estruturas, motivos)

### 5. Tabela Completa de Permissoes
Tabela com todas as 40+ permissoes organizadas por modulo, mostrando o nivel (none/read/write) para Gestor e Nao Gestor

### 6. Regras de Visibilidade de Dados
- Nao Gestor ve apenas agendas que criou ou foi convidado
- Nao Gestor ve apenas parceiros vinculados ao seu usuario
- Gestor ve todos os dados e pode filtrar por comercial
- Convidados tem permissao de leitura (ver detalhes e comentar), mas nao editam status

### 7. Gamificacao
- Pontos por visita, prospecao, conquistas e deflator por cancelamento
- Conquistas: Primeira Visita, Primeira Prospecao, Milestones, 100% Visitas, 100% Prospecoes, 100% Meta Geral
- Tudo configuravel por campanha

## Execucao

Script Python com `reportlab` gerando PDF formatado com:
- Capa estilizada
- Secoes com titulos e paragrafos
- Tabelas de permissoes com cores
- Output em `/mnt/documents/canal_parceiro_documentacao.pdf`

