# Design system estilo ClickUp — Design Doc

## Contexto

O Agência Simples já usa uma paleta escura (`--background: #111111`, `--foreground-strong: #ffffff`, `--border: #313130`, `--muted: #1c1c1b`) muito próxima da paleta extraída do ClickUp (`docs/superpowers/specs/design-system-clickup.yaml` — cores de referência: fundo `rgb(17,17,17)`, texto `rgb(238,238,238)`, acento roxo `#7b68ee`/`#5f48ea`, bordas `rgb(42,42,42)`, cantos 6–12px). O que falta não é o tema em si, e sim: acento de cor (hoje botões/ativo são brancos, sem roxo), hierarquia de navegação (a sidebar de clientes hoje é uma lista plana, sem árvore expansível) e agrupamento na lista de tarefas (hoje é uma tabela simples, sem grupos por status/cliente).

Referência visual: print anexado do ClickUp (Space "Booster Space" > árvore de clientes na sidebar; view "Overview" com lista de tarefas agrupada por cliente e por status).

## Decisões já tomadas (brainstorming)

- Tema: escuro, igual ao ClickUp (não claro, não toggle).
- Estrutura de navegação: mantém o rail fixo de 5 ícones (Home/Inbox/Clientes/Chats/Nodes) que já existe — **não** vira uma sidebar única estilo ClickUp puro.
- Árvore Space/Folder/List do ClickUp é **mapeada**, não replicada genericamente: Agência = cabeçalho fixo tipo "Space", Cliente = item expansível da árvore. Sem novas entidades no banco (nada de tabelas `spaces`/`folders`/`lists`).
- Tabela de Tarefas passa a agrupar visualmente por status (e por cliente quando mostra todos os clientes), como no print.
- Telas placeholder ("Em breve") ganham tratamento de empty-state (ícone + texto centralizado), não só herdam cor.

## Arquitetura

### 1. Tokens de cor (`src/app/globals.css`)

Adiciona tokens novos sem remover os existentes:

```css
--accent: #5f48ea;
--accent-strong: #7b68ee;
--accent-foreground: #ffffff;
```

Expostos em `@theme inline` como `--color-accent`, `--color-accent-strong`, `--color-accent-foreground`.

Uso:
- `--button`/`--button-foreground` (botões primários: "Nova tarefa", "+ Novo cliente", salvar em modais) passam a usar `bg-accent text-accent-foreground` no lugar de `bg-button text-button-foreground`. **`--button`/`--button-foreground` são removidos** dos componentes que os usam hoje (não ficam dois sistemas de botão primário em paralelo) — grep por `bg-button` confirma os usos antes de trocar.
- Item ativo na sidebar (rail e árvore de clientes) troca o destaque atual (`bg-muted text-foreground-strong`) por `bg-accent/15 text-accent-strong` nos itens ativos da árvore de clientes; o ícone ativo do rail mantém fundo neutro (`bg-muted`) mas o ícone em si vira `text-accent-strong` quando ativo — a rail continua discreta, só o item realmente selecionado na árvore ganha a cor de marca.
- Cores de status (`StatusIcon`) e prioridade (`PriorityFlag`) não mudam — já são funcionalmente distintas e próximas do ClickUp.

### 2. Árvore de clientes na sidebar

**Arquivos:** `src/components/layout/Sidebar.tsx`, `src/components/layout/AppFrame.tsx`, `src/app/(authed)/clientes/page.tsx`, `src/app/(authed)/clientes/[id]/**/page.tsx` (6 rotas: tarefas/dashboard/anuncios/organico/financeiro/conteudos).

`SidebarContext` ganha uma lista de clientes nos dois variants que hoje representam a seção Clientes:

```ts
export type ClientTreeItem = { id: string; name: string };

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients"; clients: ClientTreeItem[] }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab; clients: ClientTreeItem[] }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" };
```

Todas as 7 rotas de Clientes (`clientes/page.tsx` + as 6 sob `clientes/[id]/`) já chamam `listClients(supabase, agencyId)` hoje (para montar a grade ou para achar o cliente pelo `id`) — só precisam passar esse array (mapeado pra `{id, name}`) no `context`. Nenhuma query nova.

**Render da árvore (`Sidebar.tsx`):** novo componente `ClientsTree({ clients, activeClientId }: { clients: ClientTreeItem[]; activeClientId?: string })`, client-side (`useState` pro conjunto de ids expandidos):

- Estado inicial: se `activeClientId` existe, começa com só ele no set de expandidos; senão, set vazio.
- Cabeçalho estático (não clicável, sem link): nome da agência com um glifo, imitando o cabeçalho "Space" do ClickUp — não é um item de navegação, só rótulo.
- Cada cliente é uma linha com: chevron (▸/▾, clique só faz toggle do set de expandidos, não navega) + nome do cliente (link pra `/clientes/{id}/tarefas`, comportamento igual ao `ClientCard` de hoje).
- Cliente expandido mostra as 6 abas indentadas (mesmo `CLIENT_TABS` que `ClientPanel` já usa hoje), cada uma um link pra `/clientes/{id}/{path}`, destacando a ativa.
- Sem busca/filtro nesta rodada (a grade em `/clientes` continua sendo o lugar de achar um cliente entre muitos; a árvore é navegação rápida pra quem já está numa página de cliente).

`ClientPanel` (o painel que hoje só mostra as 6 abas de um cliente) é **removido** — a árvore substitui ele completamente, inclusive quando `context.type === "client"` (a árvore já expande o cliente ativo e mostra as abas).

`AppFrame`: sem mudança de assinatura própria, só repassa `context` pro `Sidebar` como já faz — o novo campo `clients` já vem dentro do `context`.

### 3. Tabela de Tarefas agrupada

**Arquivos:** `src/components/tasks/TasksTable.tsx` (reescrito), `src/components/tasks/TaskRow.tsx` (ajustado), novo `src/components/tasks/TaskGroupHeader.tsx`.

Estrutura de agrupamento:

```ts
type Group = { key: string; label: string; tasks: Task[] };
```

- Quando `showClient` (Home > Tasks, sem `lockedClientId`): agrupa primeiro por `client_id` (label = nome do cliente, ordenado alfabeticamente; tarefas sem cliente ficam num grupo "Sem cliente" ao final) e, dentro de cada grupo de cliente, sub-agrupa por status (`todo` → `doing` → `done`, nessa ordem fixa, rótulos de `STATUS_LABEL` que já existe em `StatusIcon.tsx`).
- Quando `!showClient` (workspace de um cliente): agrupa só por status, mesma ordem fixa.
- Grupos vazios (nenhuma tarefa) não aparecem.
- Cada grupo (de status — o nível que sempre existe) tem um header colapsável: chevron + label do status + contador (`{tasks.length}`), fundo `bg-muted/40`, clique dá toggle (estado local `useState<Set<string>>` de grupos colapsados, inicia tudo expandido). Quando `showClient`, o grupo de cliente é só um rótulo não-colapsável acima dos grupos de status dele (igual ao "Booster Space / Clientes / Débora" do print, que não tem chevron de colapso no nível do cliente — só os status colapsam).
- Linha da tarefa (`TaskRow`) perde a coluna "Cliente" (não faz mais sentido, o cliente já é o header do grupo) e perde a badge de status inline (`StatusIcon` — redundante com o header do grupo de status). Colunas finais: Nome | Responsável | Entrega | Prioridade. `PriorityFlag` continua igual.
- Filtro de status (`statusFilter` no topo) continua existindo — filtra quais grupos de status aparecem, igual comportamento de hoje.
- Filtro de cliente (`clientFilter`) continua existindo só quando `showClient` — ao selecionar um cliente específico, ele vira o único grupo de cliente exibido.

### 4. Placeholders "Em breve"

**Arquivo:** `src/components/shared/PlaceholderSection.tsx`.

Troca a caixa com borda por um empty-state centralizado verticalmente (ícone genérico circular — um glifo de "relógio"/"em construção" simples em SVG inline, sem lib nova — título em `text-foreground-strong`, subtítulo "Em breve" em `text-muted-foreground`), ocupando a altura disponível da área de conteúdo. Mesma assinatura `{ title }`, nenhuma mudança nas 9 páginas que o usam.

## Fora de escopo (YAGNI)

- Nenhuma entidade nova no banco (Spaces/Folders/Lists genéricos).
- Nenhuma busca/filtro dentro da árvore de clientes.
- Nenhuma mudança nas rotas ou nos dados de `listClients`/`listTasks`.
- Toggle claro/escuro.
- Drag-and-drop, views alternativas (Board/Calendar/Gantt) — só a lista continua existindo, agora agrupada.

## Arquivos tocados (resumo)

- `src/app/globals.css` — tokens de acento.
- `src/components/layout/Sidebar.tsx` — `ClientTreeItem`, `ClientsTree`, remove `ClientPanel`.
- `src/components/layout/AppFrame.tsx` — sem mudança de assinatura, tipos seguem o `Sidebar`.
- `src/app/(authed)/clientes/page.tsx` — passa `clients` no context.
- `src/app/(authed)/clientes/[id]/{tarefas,dashboard,anuncios,organico,financeiro,conteudos}/page.tsx` — passam `clients` no context (6 arquivos).
- `src/components/tasks/TasksTable.tsx` — agrupamento.
- `src/components/tasks/TaskRow.tsx` — remove coluna Cliente e badge de status.
- `src/components/tasks/TaskGroupHeader.tsx` — novo.
- `src/components/shared/PlaceholderSection.tsx` — empty-state.
- Qualquer componente usando `bg-button`/`text-button-foreground` hoje (grep antes de implementar) — migra pro token `accent`.

## Verificação

- `npm run build` limpo depois de cada etapa (mesmo padrão dos planos anteriores deste projeto).
- Checagem manual via `npm run dev`: abrir `/clientes`, expandir/colapsar clientes na árvore, entrar num cliente e ver a aba ativa destacada; abrir `/home/tasks` e conferir grupos por cliente → status; abrir uma rota placeholder (`/inbox`) e ver o empty-state novo.
