# Navegação: separar contexto Agência x contexto Cliente

Data: 2026-09-22

## Contexto

O app hoje tem uma sidebar única e plana (Tarefas / Clientes) que mistura tudo num nível só. Conforme a Agência Simples cresce (mais módulos por cliente: conteúdo, CRM, etc.), essa estrutura não escala — não dá pra saber, olhando a sidebar, o que é "coisa da agência como um todo" e o que é "coisa de um cliente específico".

Referência de UX: ClickUp separa navegação em duas camadas — uma rail fina de ícones para as seções de mais alto nível, e uma sidebar larga e contextual que mostra as sub-páginas da seção selecionada (Spaces, dentro deles pastas, dentro delas páginas).

Este documento especifica a versão adaptada dessa estrutura de duas camadas pro Agência Simples, junto com a primeira "Visão geral" da agência e o primeiro workspace por cliente (escopado a Tarefas por enquanto).

## Decisões

- **Rail fina fixa**: só o ícone/logo da agência. Não um ícone por cliente (não escala — uma agência pode ter dezenas de clientes). Clicar nela sempre leva ao contexto Agência.
- **Sidebar larga contextual**: o conteúdo muda conforme a rota atual pertence ao contexto Agência ou ao contexto de um Cliente específico.
- **Workspace por cliente**: cada cliente ganha uma área própria (`/clientes/[id]/...`), hoje só com "Tarefas" escopadas àquele cliente, mas a estrutura já fica pronta para módulos futuros (Conteúdo, CRM) viverem no mesmo contexto.
- **CRUD de clientes continua existindo** como página própria ("Gerenciar clientes", a `/clientes` de hoje) dentro do contexto Agência — a lista de clientes que aparece na sidebar serve só para navegar para o workspace de cada um, não para editar.
- **Visão geral nova**: primeira tela do contexto Agência, com um resumo simples (clientes ativos, tarefas por status, próximas entregas). Vira a página padrão pós-login.
- **Reuso, não duplicação**: a tabela/modal de tarefas ganha um modo "cliente travado" em vez de existirem duas implementações.
- **Middleware vira allowlist**: em vez de uma lista fixa de rotas protegidas (que cresce a cada rota nova e pode ser esquecida), o middleware passa a proteger tudo por padrão, com uma lista pequena de rotas públicas.

## Arquitetura da navegação

```
Rail (ícones, fixa, 100% das telas autenticadas):
  [Logo/Ícone Agência] → sempre navega para /overview

Sidebar larga — contexto Agência (rotas /overview, /tasks, /clientes):
  Visão geral            → /overview
  Todas as tarefas        → /tasks
  ─── Clientes ───
  <lista de clientes ativos>   → cada um navega para /clientes/[id]/tarefas
  + Novo cliente           → abre ClientFormModal (modo criação)
  Gerenciar clientes       → /clientes

Sidebar larga — contexto Cliente (rotas /clientes/[id]/...):
  ← <Nome do Cliente>       → volta para /overview
  Tarefas               → /clientes/[id]/tarefas
```

A Sidebar recebe um `context` que determina qual dos dois modos renderizar:

```ts
type SidebarContext =
  | { type: "agency"; active: "overview" | "tasks" | "clients" }
  | { type: "client"; clientId: string; clientName: string; active: "tasks" };
```

O `AppFrame` deriva o `pageLabel` do Header a partir desse mesmo `context` (ex.: "Clique Boost / Visão geral", "Clique Boost / Cliente A / Tarefas").

A lista de clientes ativos exibida na sidebar (seção "Clientes") é buscada com `listClients(supabase, agencyId)` (já existe, exclui arquivados por padrão) — a Sidebar recebe essa lista já carregada via prop, buscada uma vez em cada `page.tsx`/layout, sem duplicar query.

## Rotas

| Rota | Status | Descrição |
|---|---|---|
| `/overview` | **Nova** | Visão geral da agência. Vira o destino padrão pós-login (troca o redirect de `/tasks` para `/overview` em `login/page.tsx` e `auth/callback/route.ts`). |
| `/tasks` | Inalterada | "Todas as tarefas" — mesma tabela de hoje, todos os clientes, com coluna Cliente e filtro por cliente. Passa a viver dentro do contexto Agência na sidebar. |
| `/clientes` | Inalterada | "Gerenciar clientes" — CRUD completo que já existe (criar/editar/arquivar). |
| `/clientes/[id]` | **Nova** | Redireciona para `/clientes/[id]/tarefas` (única sub-página por enquanto). |
| `/clientes/[id]/tarefas` | **Nova** | Tarefas escopadas a esse cliente: mesma `TasksTable`, mas sem coluna "Cliente", sem filtro de cliente, e o modal de nova tarefa vem com o cliente travado (não editável). Se o `id` não corresponder a um cliente da agência (RLS vazio ou não encontrado), renderiza uma mensagem "Cliente não encontrado" com link de volta para `/overview`. |

## Conteúdo da Visão geral (`/overview`)

Página server component, sem interatividade além de links. Busca `listClients` e `listTasks` (já existem) e agrega no server:

- **Clientes ativos**: contagem de `clients.length` (já vem filtrado sem arquivados).
- **Tarefas por status**: contagem de tasks agrupadas por `status` (todo/doing/done), exibida como 3 cartões simples.
- **Próximas entregas**: as 5 tarefas com `due_date` mais próximo (não nulo, ordenado ascendente, sem filtro de status — inclui tarefas já em andamento), cada uma como uma linha simples (título, cliente, data formatada com o mesmo helper `formatDueDate` de `TaskRow.tsx`, evitando o bug de fuso horário já corrigido).

Sem gráficos, sem período configurável, sem exportação — é um resumo textual/numérico simples. Cartões usam os mesmos tokens de design já existentes (`bg-muted`, `border-border`, `--radius-card`).

## Modo "cliente travado" em TasksTable/TaskDetailModal

Em vez de criar uma segunda tabela e um segundo modal para o contexto de cliente, `TasksTable` e `TaskDetailModal` ganham uma prop opcional:

```ts
lockedClientId?: string  // quando presente, a tabela já filtra por esse cliente
                          // e o modal esconde o select de cliente, usando esse id fixo
```

Quando `lockedClientId` está presente:
- `TasksTable` não renderiza a coluna "Cliente" nem o filtro de cliente (grid muda de 6 para 5 colunas).
- `TaskDetailModal` não renderiza o `<select>` de cliente; ao criar, usa `lockedClientId` diretamente como `client_id`.
- A busca inicial de tarefas (`listTasks`) já filtra por `client_id` no server (nova função `listTasksByClient(supabase, agencyId, clientId)` em `lib/tasks.ts`, reaproveitando a mesma query com um `.eq("client_id", clientId)` a mais).

`/tasks` continua chamando `TasksTable` sem essa prop (comportamento atual inalterado).

## Middleware: allowlist em vez de lista protegida

Hoje: `src/lib/supabase/middleware.ts` verifica `pathname.startsWith("/tasks") || pathname.startsWith("/clientes")` para decidir se redireciona. Cada rota nova (`/overview`, `/clientes/[id]/tarefas`) precisaria ser adicionada manualmente — risco de esquecimento (`/overview` ficaria acessível sem sessão).

Nova regra: todas as rotas exigem sessão, **exceto** uma lista pequena de públicas:

```ts
const PUBLIC_PATHS = ["/login", "/auth"];
const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
if (!user && !isPublic) → redireciona para /login
```

A raiz `/` (hoje uma página placeholder estática, não protegida) passa a exigir sessão também — deixa de ser um "beco sem saída" não autenticado; passa a redirecionar para `/login` (sem sessão) e, como não temos handler próprio em `/`, o mais simples é fazer `/` redirecionar direto para `/overview` (que por sua vez exige sessão via layout).

## Fora de escopo (adiado)

- Conteúdo/CRM por cliente (só a estrutura de rota fica pronta; os módulos em si são specs futuras).
- Gráficos ou métricas avançadas na Visão geral.
- Renomear/mover clientes entre agências, transferir owner, etc.
- Edição inline de cliente na sidebar (criar continua sendo via modal, editar continua sendo só em "Gerenciar clientes").
