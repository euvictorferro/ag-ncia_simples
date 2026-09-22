# Agência Simples — Fundação + Módulo de Tarefas

Data: 2026-09-22

## Contexto

O `dashboard_cliqueboost` (dash.cliqueboost.io) é um app B2C: clientes da agência Clique Boost logam pra ver métricas, conteúdos, tarefas etc. Nenhum cliente real usa. A decisão foi pivotar: construir um produto B2B — **Agência Simples** — que centraliza, numa plataforma só, as funções que uma agência de marketing hoje espalha entre CRM, ClickUp, Trello, IAs de criação e Canva. O objetivo final é automação (atendimento, cobrança, criativo, marketing, campanhas, tarefas) com IA integrada, oferecido como produto whitelabel pra outras agências comprarem.

Este documento cobre a **fundação do projeto novo** (repositório, stack, multi-tenancy, auth) e o **primeiro módulo funcional: gestão de tarefas** (substituindo o ClickUp), escolhido como ponto de partida por ser a base sobre a qual os outros módulos (CRM, calendário de conteúdo, IA) vão se conectar depois.

Repositório: `https://github.com/euvictorferro/ag-ncia_simples.git`
Pasta local: `~/Projetos/Projetos Victor/Agência Simples`

## O que foi reaproveitado do dashboard_cliqueboost

Levantamento feito antes do design (ver `dashboard_cliqueboost/ARCHITECTURE.md` para o mapa completo daquele projeto):

**Reaproveitável:**
- Stack: Next.js (App Router) + TypeScript + Tailwind v4 + Supabase + Vercel.
- `components/ui/` (ícones, tooltip, markdown, avatares) — genéricos.
- `components/layout/` (`AppFrame`, `Header`, `Sidebar`, `Logo`) — casca do app.
- Padrão de UI de tarefas: `TasksTable` / `TaskRow` / `TaskDetailModal` / `StatusIcon` / `PriorityFlag` (hoje somente leitura, ligado ao ClickUp — aqui vira CRUD completo, ligado ao banco próprio).
- O `dashboard_cliqueboost` já tinha começado uma fundação multi-tenant (tabela `agencies`, coluna `agency_id`, migrations 0024/0025) que nunca foi adiante nesse produto — confirma que a direção multi-tenant faz sentido, mas o schema aqui é novo e independente (Supabase separado).

**Não reaproveitável:** integrações específicas do fluxo B2C atual (`meta.ts`, `trello.ts`, `clickup.ts`, `googleDrive.ts`, `googleCalendar.ts`) e páginas de cliente (`booster-ai`, `bunker`, `conteudos`, `atas`, `calendario`) — pertencem ao produto antigo, não à Agência Simples.

## Decisões de fundação

- **Multi-tenant desde o início**: o schema já nasce pensando em múltiplas agências usando o mesmo app (cada uma isolada da outra), mesmo que hoje só a Clique Boost use.
- **Autenticação: Supabase Auth** (não o cookie HMAC do dashboard atual) — habilita RLS real desde o dia 1, importante justamente por ser multi-tenant.
- **Whitelabel**: adiado. V1 usa paleta fixa preto/branco (`#111111`/`#151515` fundo, `#c3c2b7`/`#ffffff` texto, `#ffffff`/`#313130` botões). Customização de marca por agência entra no passo 5 do roadmap geral (autenticação/landing), quando o produto for vendido a outras agências.
- **Tarefas vinculadas a clientes desde já**: cada tarefa pertence a um cliente da agência (como no ClickUp hoje), não é só um board genérico da equipe.

## Arquitetura

```
src/
├── app/
│   ├── (authed)/
│   │   ├── tasks/             # módulo de tarefas
│   │   ├── clientes/          # CRUD mínimo de clientes (pré-requisito de tarefas)
│   │   └── layout.tsx         # AppFrame com Sidebar/Header
│   ├── login/                 # login via Supabase Auth
│   ├── auth/callback/
│   └── api/
├── components/
│   ├── ui/                    # portado do dashboard_cliqueboost
│   ├── layout/                # portado e simplificado (sem ThemeProvider — paleta fixa)
│   ├── tasks/                 # novo, inspirado em TasksTable/TaskRow
│   └── clientes/               # novo
├── lib/
│   ├── supabase/               # client/server helpers via @supabase/ssr
│   ├── tasks.ts
│   └── clients.ts
middleware.ts                   # protege rotas (authed)
supabase/migrations/
```

Sessão via `@supabase/ssr` (padrão oficial Next.js App Router), cookies geridos pelo Supabase. `middleware.ts` redireciona pra `/login` se não houver sessão.

## Modelo de dados

```sql
agencies
  id, name, created_at

agency_members            -- vincula auth.users a uma agência
  id, agency_id, user_id (references auth.users), role ('owner' | 'member'), created_at

clients
  id, agency_id, name, created_at

tasks
  id, agency_id, client_id, title, description,
  status ('todo' | 'doing' | 'done'),
  priority ('low' | 'medium' | 'high'),
  assignee_id (references agency_members),
  due_date, created_at, updated_at
```

**RLS:** toda tabela carrega `agency_id`. Função `is_agency_member(agency_id)` centraliza a checagem de pertencimento (usuário autenticado tem uma linha em `agency_members` para aquela agência); todas as policies de select/insert/update/delete usam essa função. RLS real (não bypassed por service role), diferente do padrão atual do dashboard.

Criação de usuários (v1): manual, via Supabase Studio — sem cadastro público. Automatizar isso é trabalho do passo 5 (auth/landing) do roadmap geral.

## Módulo de Tarefas — UI/UX

**`/tasks`**: tabela (não kanban), inspirada em `TasksTable`/`TaskRow`:
- Colunas: título, cliente, status (`StatusIcon`), prioridade (`PriorityFlag`), responsável, data de entrega.
- Filtros por cliente e por status.
- Clique na linha abre modal de edição (`TaskDetailModal`); botão "Nova tarefa" abre o mesmo modal em modo criação.

**Modal de tarefa**: título, descrição (markdown via `components/ui/markdown.tsx`), cliente (select), status, prioridade, responsável (select de `agency_members`), data de entrega.

**`/clientes`**: CRUD mínimo — nome, criar/editar/arquivar. Sem faturamento/indicações (isso pertence ao admin panel do dashboard antigo, não faz sentido aqui).

## Erros e testes

- Validação de formulário no client (campos obrigatórios).
- Erros do Supabase: mensagem genérica + toast.
- Autorização é responsabilidade do RLS — query vazia por falta de permissão é tratada como "não encontrado".
- Sem suite automatizada nesta fase (produto novo, ainda validando). Verificação manual via preview no navegador a cada parte implementada.

## Fora de escopo (adiado para specs futuras)

- CRM (funil de vendas), calendário de conteúdo, automação com IA, criativo/design — próximos sub-projetos, cada um com sua própria spec.
- Whitelabel por agência (logo/cor customizável).
- Cadastro público e landing page — passo 5 do roadmap geral do produto.
- Visualização de clientes finais (usuários dos clientes da agência acessando o produto) — passo 4 do roadmap geral, depois do app da agência estar pronto.
