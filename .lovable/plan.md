

## Diagnóstico do Bug

O KPI "Agendas Hoje" mostra **0/0** enquanto o painel "Agenda do dia" mostra **3 itens**. A causa é uma **inconsistência de fontes de dados**:

- **KPI (`todayIndicators`)** → usa `visibleVisits` que vem do hook `useVisits()` → dados persistidos no **localStorage**. Quando o localStorage foi criado em um dia anterior, as datas "de hoje" ficaram defasadas, e ao filtrar por `todayStr` não encontra nada.

- **Painel "Agenda do dia" (`TodayAgenda`)** → importa `mockVisits` **diretamente** do módulo `mock-data.ts`, que é regenerado a cada carregamento com a data atual (`new Date()`). Por isso sempre mostra visitas "de hoje".

## Plano de Correção

### 1. Unificar fonte de dados no TodayAgenda

O componente `TodayAgenda` deve receber as visitas via **props** (vindas do mesmo `useVisits()` usado pelo resto da página), em vez de importar `mockVisits` diretamente.

**Arquivo:** `src/components/home/TodayAgenda.tsx`
- Adicionar prop `visits: Visit[]` à interface
- Remover importação direta de `mockVisits`
- Usar `visits` da prop no filtro de visitas do dia

**Arquivo:** `src/pages/AgendaPage.tsx`
- Passar `visibleVisits` como prop para `<TodayAgenda>`

### 2. Atualizar dados do localStorage quando datas ficam obsoletas

Quando o app detectar que os dados do localStorage não possuem nenhuma visita para "hoje", deve regenerar as visitas fixas com a data atual.

**Arquivo:** `src/hooks/useVisits.ts`
- Adicionar lógica de verificação: se nenhuma visita no localStorage tem a data de hoje, atualizar as visitas fixas (vt1-vt7) para a data atual
- Isso garante que o dashboard sempre tenha dados demonstrativos relevantes

### 3. Aplicar a mesma correção no VisitMap (se aplicável)

Verificar se `VisitMap` também usa `mockVisits` diretamente e corrigir para usar a mesma fonte de dados consistente.

## Resultado Esperado

- KPI e painel "Agenda do dia" sempre mostram os mesmos dados
- Dados de demonstração se atualizam automaticamente para a data corrente
- Sem inconsistências visuais entre componentes

