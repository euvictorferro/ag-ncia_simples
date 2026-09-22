# Navegação estilo ClickUp (esqueleto de 5 seções) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir a rail de um ícone (Agência) para 5 ícones fixos (Home, Inbox, Clientes, Chats, Nodes), mover o conteúdo funcional de hoje (Dashboard, Tasks, CRUD de clientes) pra dentro dessa nova estrutura, fundir a tela de clientes com uma grade de blocos, e criar as rotas placeholder "em breve" para tudo que ainda não existe.

**Architecture:** `Sidebar`/`AppFrame` são reescritos com um `SidebarContext` novo de 6 variantes (`home`, `clients`, `client`, `inbox`, `chats`, `nodes`) — a rail sempre mostra os 5 ícones fixos, a sidebar larga muda conforme o contexto. `clients` deixa de ser uma prop passada por todo `page.tsx` (a lista de clientes não aparece mais na sidebar). Rotas antigas (`/overview`, `/tasks`) são substituídas por `/home/dashboard` e `/home/tasks` sem redirect de compatibilidade. Um componente `PlaceholderSection` compartilhado cobre as 9 rotas novas ainda sem funcionalidade real.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + Supabase (mesmo projeto já em produção).

**Spec:** `docs/superpowers/specs/2026-09-22-navegacao-clickup-style-design.md`

## Global Constraints

- Paleta e tokens de design já fixos (`bg-background-elevated`, `border-border`, `text-muted-foreground`, `text-foreground-strong`, `bg-muted`, `bg-button`, `text-button-foreground`, `--radius-card`) — todo componente novo usa esses tokens.
- Sem suite automatizada nesta fase — cada task termina com `npm run build` + verificação manual via `npm run dev`/curl, não testes automatizados.
- Rail sempre com os mesmos 5 ícones fixos, nessa ordem: Home, Inbox, Clientes, Chats, Nodes. Nunca um ícone dinâmico (por cliente ou por qualquer outra entidade).
- Só **Tasks** (dentro de Home e dentro do workspace de cliente) e o CRUD de clientes são funcionais nesta rodada. Todo o resto (Financeiro, Inbox, Chats, Nodes, Dashboard/Anúncios/Orgânico/Financeiro/Conteúdos por cliente) é placeholder "em breve" — sem lógica, sem busca de dados além do necessário pra montar a navegação.
- Sem redirect de compatibilidade para `/overview`/`/tasks` — essas rotas são deletadas nesta mudança.

---

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                          # reescrito (Task 1)
│   │   └── AppFrame.tsx                          # reescrito (Task 1)
│   ├── clientes/
│   │   ├── ClientCard.tsx                        # novo (Task 3)
│   │   ├── ClientsGrid.tsx                        # novo (Task 3)
│   │   ├── ClientRow.tsx                          # deletado (Task 3)
│   │   ├── ClientsTable.tsx                       # deletado (Task 3)
│   │   └── ClientFormModal.tsx                    # inalterado
│   └── shared/
│       └── PlaceholderSection.tsx                 # novo (Task 4)
└── app/
    ├── page.tsx                                    # modificado (Task 2)
    ├── login/page.tsx                              # modificado (Task 2)
    ├── auth/callback/route.ts                      # modificado (Task 2)
    └── (authed)/
        ├── overview/                                # deletado (Task 2)
        ├── tasks/                                    # deletado (Task 2)
        ├── home/
        │   ├── dashboard/page.tsx                    # novo (Task 2)
        │   ├── financeiro/page.tsx                   # novo (Task 4)
        │   └── tasks/page.tsx                        # novo (Task 2)
        ├── inbox/page.tsx                            # novo (Task 4)
        ├── chats/page.tsx                            # novo (Task 4)
        ├── nodes/page.tsx                            # novo (Task 4)
        └── clientes/
            ├── page.tsx                               # reescrito (Task 3)
            └── [id]/
                ├── page.tsx                            # inalterado
                ├── tarefas/page.tsx                    # modificado (Task 2)
                ├── dashboard/page.tsx                  # novo (Task 4)
                ├── anuncios/page.tsx                   # novo (Task 4)
                ├── organico/page.tsx                   # novo (Task 4)
                ├── financeiro/page.tsx                 # novo (Task 4)
                └── conteudos/page.tsx                  # novo (Task 4)
```

---

### Task 1: Sidebar de 5 seções + AppFrame simplificado

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppFrame.tsx`

**Interfaces:**
- Consumes: nada novo (mesmos imports de `next/link`, `next/navigation`).
- Produces: `type HomeTab = "dashboard" | "financeiro" | "tasks"`, `type ClientTab = "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos"`, `type SidebarContext = { type: "home"; active: HomeTab } | { type: "clients" } | { type: "client"; clientId: string; clientName: string; active: ClientTab } | { type: "inbox" } | { type: "chats" } | { type: "nodes" }` exportado de `Sidebar.tsx`. `Sidebar({ context, agencyName })` e `AppFrame({ context, agencyName, children })` — **ambos perdem as props `agencyId` e `clients`** que tinham antes (a lista de clientes não aparece mais na sidebar; a criação de cliente agora vive só na grade de `/clientes`, ver Task 3). Consumido pelas Tasks 2, 3 e 4 — todo `page.tsx` que hoje chama `<AppFrame active="..." agencyId={...} clients={...}>` precisa migrar pro novo formato (feito nessas tasks, não nesta).

- [ ] **Step 1: Reescrever `src/components/layout/Sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";

export type HomeTab = "dashboard" | "financeiro" | "tasks";
export type ClientTab = "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos";

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients" }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" };

function navClass(isActive: boolean): string {
  return `truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

function HomePanel({ active }: { active: HomeTab }) {
  return (
    <nav className="flex flex-col gap-1">
      <Link href="/home/dashboard" className={navClass(active === "dashboard")}>
        Dashboard
      </Link>
      <Link href="/home/financeiro" className={navClass(active === "financeiro")}>
        Financeiro
      </Link>
      <Link href="/home/tasks" className={navClass(active === "tasks")}>
        Tasks
      </Link>
    </nav>
  );
}

const CLIENT_TABS: { key: ClientTab; label: string; path: string }[] = [
  { key: "dashboard", label: "Dashboard", path: "dashboard" },
  { key: "anuncios", label: "Anúncios", path: "anuncios" },
  { key: "organico", label: "Orgânico", path: "organico" },
  { key: "financeiro", label: "Financeiro", path: "financeiro" },
  { key: "tasks", label: "Tarefas", path: "tarefas" },
  { key: "conteudos", label: "Conteúdos", path: "conteudos" },
];

function ClientPanel({
  clientId,
  clientName,
  active,
}: {
  clientId: string;
  clientName: string;
  active: ClientTab;
}) {
  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/clientes"
        className="mb-3 flex items-center gap-1 truncate px-3 text-sm text-muted-foreground hover:text-foreground-strong"
      >
        <span aria-hidden="true">←</span>
        <span className="truncate">{clientName}</span>
      </Link>
      {CLIENT_TABS.map((tab) => (
        <Link key={tab.key} href={`/clientes/${clientId}/${tab.path}`} className={navClass(active === tab.key)}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function InboxGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 3h12l2 7v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-5l2-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M1 10h4.5l1 2h5l1-2H17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ClientsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 11.5c2 0 3.5 1.3 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14v8H7l-3 3v-3H2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function NodesGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.7 5.3 8 12M12.3 5.3 10 12M6 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RailIcon({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ context, agencyName }: { context: SidebarContext; agencyName: string }) {
  const agencyInitial = agencyName.trim().charAt(0).toUpperCase() || "A";
  const isClientsSection = context.type === "clients" || context.type === "client";

  return (
    <div className="flex h-screen shrink-0">
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-background-elevated py-5">
        <RailIcon href="/home/dashboard" label="Home" active={context.type === "home"}>
          <span className="text-sm font-semibold">{agencyInitial}</span>
        </RailIcon>
        <RailIcon href="/inbox" label="Inbox" active={context.type === "inbox"}>
          <InboxGlyph />
        </RailIcon>
        <RailIcon href="/clientes" label="Clientes" active={isClientsSection}>
          <ClientsGlyph />
        </RailIcon>
        <RailIcon href="/chats" label="Chats" active={context.type === "chats"}>
          <ChatsGlyph />
        </RailIcon>
        <RailIcon href="/nodes" label="Nodes" active={context.type === "nodes"}>
          <NodesGlyph />
        </RailIcon>
      </aside>
      <aside className="flex w-56 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-background-elevated px-4 py-5">
        {context.type === "home" && <HomePanel active={context.active} />}
        {context.type === "client" && (
          <ClientPanel clientId={context.clientId} clientName={context.clientName} active={context.active} />
        )}
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Reescrever `src/components/layout/AppFrame.tsx`**

```tsx
import { Sidebar, type SidebarContext } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const HOME_LABEL: Record<"dashboard" | "financeiro" | "tasks", string> = {
  dashboard: "Dashboard",
  financeiro: "Financeiro",
  tasks: "Tasks",
};

const CLIENT_TAB_LABEL: Record<
  "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos",
  string
> = {
  dashboard: "Dashboard",
  anuncios: "Anúncios",
  organico: "Orgânico",
  financeiro: "Financeiro",
  tasks: "Tarefas",
  conteudos: "Conteúdos",
};

function pageLabelFor(context: SidebarContext): string {
  switch (context.type) {
    case "home":
      return `Home / ${HOME_LABEL[context.active]}`;
    case "clients":
      return "Clientes";
    case "client":
      return `${context.clientName} / ${CLIENT_TAB_LABEL[context.active]}`;
    case "inbox":
      return "Inbox";
    case "chats":
      return "Chats";
    case "nodes":
      return "Nodes";
  }
}

export function AppFrame({
  context,
  agencyName,
  children,
}: {
  context: SidebarContext;
  agencyName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar context={context} agencyName={agencyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header agencyName={agencyName} pageLabel={pageLabelFor(context)} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificação manual**

```bash
npm run build
```

Vai falhar porque `overview/page.tsx`, `tasks/page.tsx`, `clientes/page.tsx` e `clientes/[id]/tarefas/page.tsx` ainda chamam `<AppFrame context={{ type: "agency", ... }} agencyId={...} clients={...}>` (formato antigo, tipo `"agency"` não existe mais). **Isso é esperado neste ponto** — a Task 2 corrige as três primeiras rotas (deletando `overview`/`tasks` e criando as de `home`), a Task 3 corrige `clientes/page.tsx`. Confirmar que o erro de build é exatamente sobre essas chamadas, não outro erro inesperado.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/AppFrame.tsx
git commit -m "feat: sidebar de 5 seções (Home/Inbox/Clientes/Chats/Nodes)"
```

---

### Task 2: Mover Dashboard e Tasks para `/home/*`, atualizar workspace de cliente e redirects

**Files:**
- Create: `src/app/(authed)/home/dashboard/page.tsx`
- Create: `src/app/(authed)/home/tasks/page.tsx`
- Delete: `src/app/(authed)/overview/page.tsx` (e a pasta `overview/`)
- Delete: `src/app/(authed)/tasks/page.tsx` (e a pasta `tasks/`)
- Modify: `src/app/(authed)/clientes/[id]/tarefas/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `requireAgencyMembership` (`@/lib/agency`), `listClients`/`listTasks`/`listAgencyMembers`/`listTasksByClient` (já existem), `AppFrame`/`SidebarContext` (Task 1).

- [ ] **Step 1: Criar `src/app/(authed)/home/dashboard/page.tsx`**

Mesmo conteúdo de `overview/page.tsx` de hoje, só com o `context` novo e sem as props `agencyId`/`clients` no `AppFrame`:

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listTasks, type TaskStatus } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default async function HomeDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [clients, tasks] = await Promise.all([
    listClients(supabase, agencyId),
    listTasks(supabase, agencyId),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));

  const countByStatus: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const task of tasks) {
    countByStatus[task.status] += 1;
  }

  const upcoming = tasks
    .filter((task): task is typeof task & { due_date: string } => task.due_date !== null)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
    .slice(0, 5);

  return (
    <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
      <div className="space-y-6">
        <h1 className="text-sm font-semibold text-foreground-strong">Dashboard</h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
            <p className="text-2xl font-semibold text-foreground-strong">{clients.length}</p>
          </div>
          {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((status) => (
            <div key={status} className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{STATUS_LABEL[status]}</p>
              <p className="text-2xl font-semibold text-foreground-strong">{countByStatus[status]}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximas entregas</h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
            {upcoming.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">Nenhuma tarefa com data de entrega.</p>
            )}
            {upcoming.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[minmax(0,1fr)_140px_90px] gap-3 border-t border-border px-3 py-2 text-sm first:border-t-0"
              >
                <span className="truncate text-foreground">{task.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {clientById.get(task.client_id)?.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
```

- [ ] **Step 2: Criar `src/app/(authed)/home/tasks/page.tsx`**

Mesmo conteúdo de `tasks/page.tsx` de hoje, só com o `context` novo e sem `agencyId`/`clients` no `AppFrame` (o `TasksTable` continua recebendo `clients` normalmente — essa prop nunca saiu de `TasksTable`, só saiu de `AppFrame`):

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasks } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function HomeTasksPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [tasks, clients, members] = await Promise.all([
    listTasks(supabase, agencyId),
    listClients(supabase, agencyId),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "home", active: "tasks" }} agencyName={agencyName}>
      <TasksTable agencyId={agencyId} initialTasks={tasks} clients={clients} members={members} />
    </AppFrame>
  );
}
```

- [ ] **Step 3: Deletar as pastas antigas**

```bash
rm -rf "src/app/(authed)/overview" "src/app/(authed)/tasks"
```

- [ ] **Step 4: Atualizar `src/app/(authed)/clientes/[id]/tarefas/page.tsx`**

Substituir o `context`/`AppFrame` do branch "não encontrado" e do branch normal, removendo `agencyId`/`clients` das chamadas de `AppFrame` e trocando o link de fallback de `/overview` pra `/home/dashboard`. Arquivo completo:

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasksByClient } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";
import Link from "next/link";

export default async function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  const [tasks, members] = await Promise.all([
    listTasksByClient(supabase, agencyId, client.id),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "tasks" }} agencyName={agencyName}>
      <TasksTable agencyId={agencyId} initialTasks={tasks} members={members} lockedClientId={client.id} />
    </AppFrame>
  );
}
```

- [ ] **Step 5: Atualizar `src/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/home/dashboard");
}
```

- [ ] **Step 6: Atualizar o redirect pós-login em `src/app/login/page.tsx`**

Trocar:

```ts
    router.push("/overview");
```

Por:

```ts
    router.push("/home/dashboard");
```

- [ ] **Step 7: Atualizar `src/app/auth/callback/route.ts`**

Trocar:

```ts
  return NextResponse.redirect(`${origin}/overview`);
```

Por:

```ts
  return NextResponse.redirect(`${origin}/home/dashboard`);
```

- [ ] **Step 8: Verificação manual**

```bash
npm run build
```

Vai falhar só em `src/app/(authed)/clientes/page.tsx` (ainda usa o `context` antigo `{ type: "agency", active: "clients" }` e passa `agencyId`/`clients` pro `AppFrame`) — **esperado**, a Task 3 corrige. Confirmar que não há mais nenhum outro erro (nem em `home/dashboard`, `home/tasks`, `clientes/[id]/tarefas`, `page.tsx`, `login/page.tsx`, `auth/callback/route.ts`).

- [ ] **Step 9: Commit**

```bash
git add "src/app/(authed)/home" "src/app/(authed)/clientes/[id]/tarefas/page.tsx" src/app/page.tsx src/app/login/page.tsx src/app/auth/callback/route.ts
git rm -r "src/app/(authed)/overview" "src/app/(authed)/tasks"
git commit -m "feat: move Dashboard/Tasks para /home, redirects apontam pra /home/dashboard"
```

---

### Task 3: Grade de blocos de Clientes (funde CRUD + navegação)

**Files:**
- Create: `src/components/clientes/ClientCard.tsx`
- Create: `src/components/clientes/ClientsGrid.tsx`
- Delete: `src/components/clientes/ClientRow.tsx`
- Delete: `src/components/clientes/ClientsTable.tsx`
- Modify: `src/app/(authed)/clientes/page.tsx`

**Interfaces:**
- Consumes: `Client`, `listClients` (`@/lib/clients`), `ClientFormModal` (inalterado, `@/components/clientes/ClientFormModal`), `AppFrame`/`SidebarContext` (Task 1).

- [ ] **Step 1: Criar `src/components/clientes/ClientCard.tsx`**

```tsx
import Link from "next/link";
import type { Client } from "@/lib/clients";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M9.5 1.5 12.5 4.5 4.5 12.5H1.5V9.5L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClientCard({ client, onEdit }: { client: Client; onEdit: () => void }) {
  return (
    <div className="group relative rounded-[var(--radius-card)] border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
      <Link href={`/clientes/${client.id}/tarefas`} className="block">
        <p className="truncate pr-6 text-sm font-medium text-foreground-strong">{client.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{client.archived ? "Arquivado" : "Ativo"}</p>
      </Link>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${client.name}`}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground-strong group-hover:opacity-100"
      >
        <EditIcon />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Criar `src/components/clientes/ClientsGrid.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Client } from "@/lib/clients";
import { ClientCard } from "@/components/clientes/ClientCard";
import { ClientFormModal } from "@/components/clientes/ClientFormModal";

export function ClientsGrid({ agencyId, initialClients }: { agencyId: string; initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const [editing, setEditing] = useState<Client | null | "new">(null);

  function upsert(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      return exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground-strong">Clientes</h1>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-md bg-button px-3 py-1.5 text-sm font-medium text-button-foreground"
        >
          + Novo cliente
        </button>
      </div>

      {clients.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} onEdit={() => setEditing(client)} />
          ))}
        </div>
      )}

      {editing !== null && (
        <ClientFormModal
          agencyId={agencyId}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Deletar os componentes antigos**

```bash
rm src/components/clientes/ClientRow.tsx src/components/clientes/ClientsTable.tsx
```

- [ ] **Step 4: Reescrever `src/app/(authed)/clientes/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsGrid } from "@/components/clientes/ClientsGrid";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const allClients = await listClients(supabase, agencyId, { includeArchived: true });

  return (
    <AppFrame context={{ type: "clients" }} agencyName={agencyName}>
      <ClientsGrid agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
```

- [ ] **Step 5: Verificação manual**

```bash
npm run build
```

Deve compilar sem erros agora (build totalmente verde). Depois:

```bash
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/clientes  # 307 -> /login (sem sessão)
```

Parar o servidor.

- [ ] **Step 6: Commit**

```bash
git add src/components/clientes "src/app/(authed)/clientes/page.tsx"
git commit -m "feat: grade de blocos de clientes (funde CRUD + navegação)"
```

---

### Task 4: Componente placeholder + rotas "em breve"

**Files:**
- Create: `src/components/shared/PlaceholderSection.tsx`
- Create: `src/app/(authed)/home/financeiro/page.tsx`
- Create: `src/app/(authed)/inbox/page.tsx`
- Create: `src/app/(authed)/chats/page.tsx`
- Create: `src/app/(authed)/nodes/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/dashboard/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/anuncios/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/organico/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/financeiro/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/conteudos/page.tsx`

**Interfaces:**
- Consumes: `requireAgencyMembership` (`@/lib/agency`), `listClients` (`@/lib/clients`), `AppFrame`/`SidebarContext` (Task 1).
- Produces: `PlaceholderSection({ title }: { title: string })`.

- [ ] **Step 1: Criar `src/components/shared/PlaceholderSection.tsx`**

```tsx
export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-sm font-semibold text-foreground-strong">{title}</h1>
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Em breve.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar `src/app/(authed)/home/financeiro/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function HomeFinanceiroPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "home", active: "financeiro" }} agencyName={agencyName}>
      <PlaceholderSection title="Financeiro" />
    </AppFrame>
  );
}
```

- [ ] **Step 3: Criar `src/app/(authed)/inbox/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function InboxPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "inbox" }} agencyName={agencyName}>
      <PlaceholderSection title="Inbox" />
    </AppFrame>
  );
}
```

- [ ] **Step 4: Criar `src/app/(authed)/chats/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function ChatsPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "chats" }} agencyName={agencyName}>
      <PlaceholderSection title="Chats" />
    </AppFrame>
  );
}
```

- [ ] **Step 5: Criar `src/app/(authed)/nodes/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function NodesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "nodes" }} agencyName={agencyName}>
      <PlaceholderSection title="Nodes" />
    </AppFrame>
  );
}
```

- [ ] **Step 6: Criar `src/app/(authed)/clientes/[id]/dashboard/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";
import Link from "next/link";

export default async function ClientDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "dashboard" }} agencyName={agencyName}>
      <PlaceholderSection title={`${client.name} — Dashboard`} />
    </AppFrame>
  );
}
```

- [ ] **Step 7: Criar `src/app/(authed)/clientes/[id]/anuncios/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";
import Link from "next/link";

export default async function ClientAnunciosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "anuncios" }} agencyName={agencyName}>
      <PlaceholderSection title={`${client.name} — Anúncios`} />
    </AppFrame>
  );
}
```

- [ ] **Step 8: Criar `src/app/(authed)/clientes/[id]/organico/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";
import Link from "next/link";

export default async function ClientOrganicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "organico" }} agencyName={agencyName}>
      <PlaceholderSection title={`${client.name} — Orgânico`} />
    </AppFrame>
  );
}
```

- [ ] **Step 9: Criar `src/app/(authed)/clientes/[id]/financeiro/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";
import Link from "next/link";

export default async function ClientFinanceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "financeiro" }} agencyName={agencyName}>
      <PlaceholderSection title={`${client.name} — Financeiro`} />
    </AppFrame>
  );
}
```

- [ ] **Step 10: Criar `src/app/(authed)/clientes/[id]/conteudos/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";
import Link from "next/link";

export default async function ClientConteudosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "conteudos" }} agencyName={agencyName}>
      <PlaceholderSection title={`${client.name} — Conteúdos`} />
    </AppFrame>
  );
}
```

- [ ] **Step 11: Verificação manual — todas as rotas novas**

```bash
npm run build
npm run dev
```

```bash
for path in /home/financeiro /inbox /chats /nodes \
  /clientes/00000000-0000-0000-0000-000000000000/dashboard \
  /clientes/00000000-0000-0000-0000-000000000000/anuncios \
  /clientes/00000000-0000-0000-0000-000000000000/organico \
  /clientes/00000000-0000-0000-0000-000000000000/financeiro \
  /clientes/00000000-0000-0000-0000-000000000000/conteudos; do
  echo "$path -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$path)"
done
```

Todas devem responder `307` (redirect pra `/login`, sem sessão). Parar o servidor.

Se houver credenciais reais de Supabase configuradas neste ambiente, testar manualmente no navegador: logar, clicar em cada um dos 5 ícones da rail, confirmar que a sidebar larga muda de conteúdo corretamente, entrar num cliente e navegar pelas 6 abas (Dashboard/Anúncios/Orgânico/Financeiro/Tarefas/Conteúdos — só Tarefas deve ter conteúdo real, as outras "Em breve"), criar um cliente novo pela grade e confirmar que aparece.

- [ ] **Step 12: Commit**

```bash
git add src/components/shared/PlaceholderSection.tsx \
  "src/app/(authed)/home/financeiro" \
  "src/app/(authed)/inbox" \
  "src/app/(authed)/chats" \
  "src/app/(authed)/nodes" \
  "src/app/(authed)/clientes/[id]/dashboard" \
  "src/app/(authed)/clientes/[id]/anuncios" \
  "src/app/(authed)/clientes/[id]/organico" \
  "src/app/(authed)/clientes/[id]/financeiro" \
  "src/app/(authed)/clientes/[id]/conteudos"
git commit -m "feat: rotas placeholder (Financeiro, Inbox, Chats, Nodes, abas de cliente)"
```

---

## Self-Review

**Cobertura da spec:**
- Rail com 5 ícones fixos (Home/Inbox/Clientes/Chats/Nodes) → Task 1.
- Home agrupa Dashboard/Financeiro/Tasks → Task 1 (`HomePanel`) + Task 2 (Dashboard/Tasks reais) + Task 4 (Financeiro placeholder).
- Clientes vira grade fundindo CRUD + navegação, com edição inline e "+ Novo cliente" → Task 3.
- Workspace de cliente com 6 abas (só Tasks funcional) → Task 1 (`ClientPanel`) + Task 2 (Tarefas) + Task 4 (as outras 5 placeholder).
- Inbox/Chats/Nodes como seções de topo próprias, sem sub-navegação, tela única "em breve" → Task 1 (rail) + Task 4 (páginas).
- Sem redirect de compatibilidade pra `/overview`/`/tasks` → Task 2 deleta essas pastas em vez de redirecionar.
- Rotas novas protegidas automaticamente pelo middleware allowlist (nenhuma mudança necessária nele, confirmado no design) → nenhuma task mexe em `middleware.ts`, coerente com a spec.

**Placeholders:** nenhum "TBD"/"implementar depois" — todo step tem código completo, inclusive os 5 arquivos de aba de cliente na Task 4 (cada um escrito por inteiro, não "igual ao anterior").

**Consistência de tipos:** `SidebarContext`, `HomeTab`, `ClientTab` definidos uma vez em `Sidebar.tsx` (Task 1) e importados com os mesmos nomes em `AppFrame.tsx` (Task 1) e usados com a mesma forma discriminada em todas as `page.tsx` que os consomem (Tasks 2, 3, 4). `AppFrame`/`Sidebar` perdem `agencyId`/`clients` de forma consistente — nenhuma task volta a passar essas props. `PlaceholderSection({ title })` tem a mesma assinatura em todos os 9 usos (Task 4).
