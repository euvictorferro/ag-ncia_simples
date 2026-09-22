# Navegação em duas camadas (Agência x Cliente) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a navegação do app numa rail fina (ícone da agência) + sidebar larga contextual (Agência x Cliente), criar a página `/overview`, e transformar cada cliente num workspace próprio (`/clientes/[id]/tarefas`) reaproveitando a tabela/modal de tarefas existentes em modo "cliente travado".

**Architecture:** `Sidebar` passa a receber um `context` discriminado (`agency` | `client`) que decide o que renderizar; `AppFrame` deriva o rótulo do header a partir desse mesmo `context`. `TasksTable`/`TaskRow`/`TaskDetailModal` ganham uma prop opcional `lockedClientId` em vez de existirem duas implementações. Uma nova rota dinâmica `/clientes/[id]/tarefas` reaproveita esses componentes já filtrando no servidor. O `middleware.ts` passa de lista-de-rotas-protegidas para allowlist-de-rotas-públicas, e um helper novo (`lib/agency.ts`) centraliza a busca de `agency_id`/nome da agência que hoje está duplicada em cada `page.tsx`.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + Supabase (já em produção no projeto).

**Spec:** `docs/superpowers/specs/2026-09-22-navegacao-agencia-vs-cliente-design.md`

## Global Constraints

- Paleta e tokens de design já fixos (`bg-background-elevated`, `border-border`, `text-muted-foreground`, `text-foreground-strong`, `bg-muted`, `bg-button`, `text-button-foreground`, `--radius-card`) — todo componente novo usa esses tokens, nunca cores ad-hoc.
- Sem suite automatizada nesta fase (decisão já estabelecida no projeto) — cada task termina com `npm run build` + verificação manual via `npm run dev`/curl, não testes automatizados.
- Rail fina de ícones mostra **só** o ícone da agência (nunca um ícone por cliente — não escala).
- A lista de clientes usada para navegação na sidebar **nunca inclui arquivados** (usa `listClients` sem `includeArchived`), mesmo quando a página em si (ex.: `/clientes`) busca todos para o CRUD.
- `TasksTable`/`TaskDetailModal` não duplicam: ganham uma prop `lockedClientId` opcional em vez de virarem dois componentes.
- O middleware protege tudo por padrão, com uma allowlist pequena de rotas públicas (`/login`, `/auth`) — nunca uma lista de rotas protegidas que precisa ser lembrada a cada rota nova.

---

## File Structure

```
src/
├── middleware.ts                                    # modificado (Task 1)
├── lib/
│   ├── agency.ts                                     # novo (Task 2)
│   ├── tasks.ts                                       # modificado (Task 3)
│   └── supabase/middleware.ts                        # modificado (Task 1)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                                # reescrito (Task 5)
│   │   └── AppFrame.tsx                               # modificado (Task 5)
│   └── tasks/
│       ├── TaskRow.tsx                                # modificado (Task 4)
│       ├── TasksTable.tsx                             # modificado (Task 4)
│       └── TaskDetailModal.tsx                        # modificado (Task 4)
└── app/
    ├── page.tsx                                        # modificado (Task 9)
    ├── login/page.tsx                                  # modificado (Task 9)
    ├── auth/callback/route.ts                          # modificado (Task 9)
    └── (authed)/
        ├── overview/page.tsx                           # novo (Task 7)
        ├── tasks/page.tsx                               # modificado (Task 6)
        └── clientes/
            ├── page.tsx                                 # modificado (Task 6)
            └── [id]/
                ├── page.tsx                              # novo (Task 8)
                └── tarefas/page.tsx                      # novo (Task 8)
```

---

### Task 1: Middleware — allowlist em vez de lista protegida

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces: nenhuma interface nova exportada — comportamento interno de `updateSession` muda.

- [ ] **Step 1: Substituir a checagem de rota protegida por uma allowlist pública**

Arquivo atual (`src/lib/supabase/middleware.ts`) tem, perto do fim:

```ts
  const isAuthedRoute = request.nextUrl.pathname.startsWith("/tasks") ||
    request.nextUrl.pathname.startsWith("/clientes");

  if (!user && isAuthedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
```

Substituir esse trecho por:

```ts
  const PUBLIC_PATHS = ["/login", "/auth"];
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
```

O arquivo completo deve ficar assim:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const PUBLIC_PATHS = ["/login", "/auth"];
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
```

- [ ] **Step 2: Verificação manual**

```bash
npm run build
npm run dev
```

Em outro terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks      # espera 307 (redirect pra /login)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/clientes   # espera 307
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login      # espera 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/qualquer-rota-nova  # espera 307 (nova: agora protegida por padrão)
```

Parar o servidor depois.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat: middleware protege por padrão (allowlist em vez de lista protegida)"
```

---

### Task 2: Helper compartilhado de membership (`lib/agency.ts`)

**Files:**
- Create: `src/lib/agency.ts`

**Interfaces:**
- Consumes: `SupabaseClient` (de `@supabase/supabase-js`), `redirect` (de `next/navigation`).
- Produces: `type AgencyMembership = { agencyId: string; agencyName: string }`, `requireAgencyMembership(supabase: SupabaseClient): Promise<AgencyMembership>` — usado pelas Tasks 6, 7 e 8 em vez de cada `page.tsx` repetir a query de `agency_members`.

- [ ] **Step 1: Criar `src/lib/agency.ts`**

```ts
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyMembership = {
  agencyId: string;
  agencyName: string;
};

export async function requireAgencyMembership(supabase: SupabaseClient): Promise<AgencyMembership> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/login");
  }

  return {
    agencyId: membership.agency_id,
    agencyName: (membership.agencies as unknown as { name: string })?.name ?? "Agência",
  };
}
```

- [ ] **Step 2: Verificação manual**

```bash
npm run build
```

Deve compilar sem erros (o arquivo ainda não é usado por nenhuma página — isso é esperado, as Tasks 6/7/8 vão consumi-lo).

- [ ] **Step 3: Commit**

```bash
git add src/lib/agency.ts
git commit -m "feat: helper requireAgencyMembership compartilhado"
```

---

### Task 3: `lib/tasks.ts` — buscar tarefas de um único cliente

**Files:**
- Modify: `src/lib/tasks.ts`

**Interfaces:**
- Produces: `listTasksByClient(supabase: SupabaseClient, agencyId: string, clientId: string): Promise<Task[]>` — usado pela Task 8 (`/clientes/[id]/tarefas/page.tsx`).

- [ ] **Step 1: Adicionar `listTasksByClient` logo depois de `listTasks` em `src/lib/tasks.ts`**

```ts
export async function listTasksByClient(
  supabase: SupabaseClient,
  agencyId: string,
  clientId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Task[];
}
```

- [ ] **Step 2: Verificação manual**

```bash
npm run build
```

Deve compilar sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tasks.ts
git commit -m "feat: listTasksByClient para o workspace de cliente"
```

---

### Task 4: Modo "cliente travado" em TasksTable/TaskRow/TaskDetailModal

**Files:**
- Modify: `src/components/tasks/TaskRow.tsx`
- Modify: `src/components/tasks/TasksTable.tsx`
- Modify: `src/components/tasks/TaskDetailModal.tsx`

**Interfaces:**
- Consumes: `Task`, `AgencyMember`, `TaskInput`, `TaskStatus`, `TaskPriority` (de `@/lib/tasks`), `Client` (de `@/lib/clients`).
- Produces: `TasksTable` e `TaskDetailModal` ganham prop opcional `lockedClientId?: string`; `clients` vira opcional (`clients?: Client[]`, default `[]`) em ambos. `TaskRow` ganha prop obrigatória `showClient: boolean`. Consumido pela Task 8 (workspace de cliente) passando `lockedClientId`; `/tasks` (Task 6) continua chamando sem essa prop, comportamento idêntico ao atual.

- [ ] **Step 1: Reescrever `src/components/tasks/TaskRow.tsx` com suporte a `showClient`**

```tsx
import type { AgencyMember, Task } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { StatusIcon } from "@/components/tasks/StatusIcon";
import { PriorityFlag } from "@/components/tasks/PriorityFlag";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function TaskRow({
  task,
  client,
  members,
  showClient,
  onClick,
}: {
  task: Task;
  client: Client | undefined;
  members: AgencyMember[];
  showClient: boolean;
  onClick: () => void;
}) {
  const assignee = task.assignee_id ? members.find((m) => m.id === task.assignee_id) : undefined;
  const gridCols = showClient
    ? "grid-cols-[minmax(0,1fr)_140px_120px_100px_110px_90px]"
    : "grid-cols-[minmax(0,1fr)_120px_100px_110px_90px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full ${gridCols} items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted`}
    >
      <span className="truncate text-foreground">{task.title}</span>
      {showClient && <span className="truncate text-xs text-muted-foreground">{client?.name ?? "—"}</span>}
      <span>
        <StatusIcon status={task.status} />
      </span>
      <span className="text-xs text-muted-foreground">{assignee ? assignee.user_id.slice(0, 8) : "—"}</span>
      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
      <span>
        <PriorityFlag priority={task.priority} />
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Reescrever `src/components/tasks/TasksTable.tsx` com suporte a `lockedClientId`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Task, TaskStatus, AgencyMember } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

export function TasksTable({
  agencyId,
  initialTasks,
  clients = [],
  members,
  lockedClientId,
}: {
  agencyId: string;
  initialTasks: Task[];
  clients?: Client[];
  members: AgencyMember[];
  lockedClientId?: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editing, setEditing] = useState<Task | null | "new">(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  const showClient = !lockedClientId;
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredTasks = tasks.filter((t) => {
    if (showClient && clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  function upsert(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const gridCols = showClient
    ? "grid-cols-[minmax(0,1fr)_140px_120px_100px_110px_90px]"
    : "grid-cols-[minmax(0,1fr)_120px_100px_110px_90px]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-sm font-semibold text-foreground-strong">Tarefas</h1>
        <div className="flex flex-wrap items-center gap-2">
          {showClient && (
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              <option value="all">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="all">Todos os status</option>
            <option value="todo">A fazer</option>
            <option value="doing">Em andamento</option>
            <option value="done">Concluída</option>
          </select>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-md bg-button px-3 py-1.5 text-sm font-medium text-button-foreground"
          >
            Nova tarefa
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
        <div className={`grid ${gridCols} gap-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`}>
          <span>Título</span>
          {showClient && <span>Cliente</span>}
          <span>Status</span>
          <span>Responsável</span>
          <span>Entrega</span>
          <span>Prioridade</span>
        </div>
        {filteredTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            client={clientById.get(task.client_id)}
            members={members}
            showClient={showClient}
            onClick={() => setEditing(task)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
        )}
      </div>

      {editing !== null && (
        <TaskDetailModal
          agencyId={agencyId}
          task={editing === "new" ? null : editing}
          clients={clients}
          members={members}
          lockedClientId={lockedClientId}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onDeleted={remove}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Reescrever `src/components/tasks/TaskDetailModal.tsx` com suporte a `lockedClientId`**

```tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  createTask,
  deleteTask,
  updateTask,
  type AgencyMember,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import type { Client } from "@/lib/clients";

export function TaskDetailModal({
  agencyId,
  task,
  clients = [],
  members,
  lockedClientId,
  onClose,
  onSaved,
  onDeleted,
}: {
  agencyId: string;
  task: Task | null;
  clients?: Client[];
  members: AgencyMember[];
  lockedClientId?: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientId, setClientId] = useState(lockedClientId ?? task?.client_id ?? clients[0]?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) {
      setError("Título e cliente são obrigatórios.");
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createBrowserSupabaseClient();
    const input: TaskInput = {
      client_id: clientId,
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    };

    try {
      const saved = task ? await updateTask(supabase, task.id, input) : await createTask(supabase, agencyId, input);
      onSaved(saved);
      onClose();
    } catch {
      setError("Não foi possível salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Excluir esta tarefa?")) return;

    const supabase = createBrowserSupabaseClient();
    try {
      await deleteTask(supabase, task.id);
      onDeleted(task.id);
      onClose();
    } catch {
      setError("Não foi possível excluir a tarefa.");
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">{task ? "Editar tarefa" : "Nova tarefa"}</h2>

        <div className="space-y-1">
          <label htmlFor="task-title" className="text-xs text-muted-foreground">
            Título
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="task-description" className="text-xs text-muted-foreground">
            Descrição (markdown)
          </label>
          <textarea
            id="task-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
          {description && (
            <div className="rounded-md border border-border bg-background px-3 py-2">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!lockedClientId && (
            <div className="space-y-1">
              <label htmlFor="task-client" className="text-xs text-muted-foreground">
                Cliente
              </label>
              <select
                id="task-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={`space-y-1 ${lockedClientId ? "col-span-2" : ""}`}>
            <label htmlFor="task-assignee" className="text-xs text-muted-foreground">
              Responsável
            </label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user_id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-status" className="text-xs text-muted-foreground">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="done">Concluída</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-priority" className="text-xs text-muted-foreground">
              Prioridade
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="col-span-2 space-y-1">
            <label htmlFor="task-due-date" className="text-xs text-muted-foreground">
              Data de entrega
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between">
          <div>
            {task && (
              <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:underline">
                Excluir tarefa
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

`/tasks` ainda não foi atualizado (Task 6) então a build deve passar mas a página `/tasks` atual (`src/app/(authed)/tasks/page.tsx`) ainda chama `<TasksTable agencyId={...} initialTasks={tasks} clients={clients} members={members} />` sem `lockedClientId` — isso continua válido porque a prop é opcional. Confirmar que não há erro de tipo.

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskRow.tsx src/components/tasks/TasksTable.tsx src/components/tasks/TaskDetailModal.tsx
git commit -m "feat: modo cliente travado em TasksTable/TaskRow/TaskDetailModal"
```

---

### Task 5: Sidebar em duas camadas + AppFrame contextual

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppFrame.tsx`

**Interfaces:**
- Consumes: `Client` (de `@/lib/clients`), `Logo` (de `@/components/layout/Logo`).
- Produces: `type SidebarContext = { type: "agency"; active: "overview" | "tasks" | "clients" } | { type: "client"; clientId: string; clientName: string; active: "tasks" }` exportado de `Sidebar.tsx`; `Sidebar({ context, clients, agencyName })`; `AppFrame({ context, agencyName, clients, children })`. Consumido pelas Tasks 6, 7 e 8 — todo `page.tsx` que hoje chama `<AppFrame active="tasks" pageLabel="..." agencyName={...}>` precisa migrar para o novo formato (feito nessas tasks, não nesta).

- [ ] **Step 1: Reescrever `src/components/layout/Sidebar.tsx`**

```tsx
import Link from "next/link";
import type { Client } from "@/lib/clients";

export type SidebarContext =
  | { type: "agency"; active: "overview" | "tasks" | "clients" }
  | { type: "client"; clientId: string; clientName: string; active: "tasks" };

function navClass(isActive: boolean): string {
  return `truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

function AgencyPanel({ active, clients }: { active: "overview" | "tasks" | "clients"; clients: Client[] }) {
  return (
    <nav className="flex flex-col gap-1">
      <Link href="/overview" className={navClass(active === "overview")}>
        Visão geral
      </Link>
      <Link href="/tasks" className={navClass(active === "tasks")}>
        Todas as tarefas
      </Link>

      <p className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Clientes</p>
      {clients.map((client) => (
        <Link key={client.id} href={`/clientes/${client.id}/tarefas`} className={navClass(false)}>
          {client.name}
        </Link>
      ))}

      <Link href="/clientes" className={navClass(active === "clients")}>
        Gerenciar clientes
      </Link>
    </nav>
  );
}

function ClientPanel({
  clientId,
  clientName,
  active,
}: {
  clientId: string;
  clientName: string;
  active: "tasks";
}) {
  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/overview"
        className="mb-3 flex items-center gap-1 truncate px-3 text-sm text-muted-foreground hover:text-foreground-strong"
      >
        <span aria-hidden="true">←</span>
        <span className="truncate">{clientName}</span>
      </Link>
      <Link href={`/clientes/${clientId}/tarefas`} className={navClass(active === "tasks")}>
        Tarefas
      </Link>
    </nav>
  );
}

export function Sidebar({
  context,
  clients,
  agencyName,
}: {
  context: SidebarContext;
  clients: Client[];
  agencyName: string;
}) {
  const agencyInitial = agencyName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="flex h-screen shrink-0">
      <aside className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-background-elevated py-5">
        <Link
          href="/overview"
          aria-label="Agência"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground-strong"
        >
          {agencyInitial}
        </Link>
      </aside>
      <aside className="flex w-56 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-background-elevated px-4 py-5">
        {context.type === "agency" ? (
          <AgencyPanel active={context.active} clients={clients} />
        ) : (
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
import type { Client } from "@/lib/clients";

function pageLabelFor(context: SidebarContext): string {
  if (context.type === "client") {
    return `${context.clientName} / Tarefas`;
  }
  if (context.active === "overview") return "Visão geral";
  if (context.active === "tasks") return "Todas as tarefas";
  return "Clientes";
}

export function AppFrame({
  context,
  agencyName,
  clients,
  children,
}: {
  context: SidebarContext;
  agencyName: string;
  clients: Client[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar context={context} clients={clients} agencyName={agencyName} />
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

Vai falhar porque `src/app/(authed)/tasks/page.tsx` e `src/app/(authed)/clientes/page.tsx` ainda chamam `<AppFrame active="tasks" pageLabel="..." agencyName={...}>` (formato antigo). **Isso é esperado neste ponto** — a Task 6 atualiza essas páginas. Confirmar que o erro de build é exatamente sobre essas duas chamadas (prop `active`/`pageLabel` não existem mais em `AppFrame`), não outro erro inesperado.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/AppFrame.tsx
git commit -m "feat: Sidebar/AppFrame contextuais (agência x cliente)"
```

---

### Task 6: Atualizar `/tasks` e `/clientes` para o novo AppFrame + helper

**Files:**
- Modify: `src/app/(authed)/tasks/page.tsx`
- Modify: `src/app/(authed)/clientes/page.tsx`

**Interfaces:**
- Consumes: `requireAgencyMembership` (Task 2), `AppFrame`/`SidebarContext` (Task 5), `listClients` (já existe), `listTasks`/`listAgencyMembers` (já existem).

- [ ] **Step 1: Reescrever `src/app/(authed)/tasks/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasks } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [tasks, clients, members] = await Promise.all([
    listTasks(supabase, agencyId),
    listClients(supabase, agencyId),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "agency", active: "tasks" }} agencyName={agencyName} clients={clients}>
      <TasksTable agencyId={agencyId} initialTasks={tasks} clients={clients} members={members} />
    </AppFrame>
  );
}
```

- [ ] **Step 2: Reescrever `src/app/(authed)/clientes/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsTable } from "@/components/clientes/ClientsTable";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const allClients = await listClients(supabase, agencyId, { includeArchived: true });
  const activeClients = allClients.filter((c) => !c.archived);

  return (
    <AppFrame context={{ type: "agency", active: "clients" }} agencyName={agencyName} clients={activeClients}>
      <ClientsTable agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
```

Nota: a sidebar (via `clients={activeClients}`) só lista clientes ativos para navegação, mas a `ClientsTable` (o CRUD em si) continua recebendo `allClients` (incluindo arquivados), como já era antes.

- [ ] **Step 3: Verificação manual**

```bash
npm run build
```

Deve compilar sem erros agora. Depois:

```bash
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks     # 307 -> /login (sem sessão)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/clientes  # 307 -> /login
```

Parar o servidor.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(authed)/tasks/page.tsx" "src/app/(authed)/clientes/page.tsx"
git commit -m "feat: /tasks e /clientes usam AppFrame contextual + helper de membership"
```

---

### Task 7: Página `/overview`

**Files:**
- Create: `src/app/(authed)/overview/page.tsx`

**Interfaces:**
- Consumes: `requireAgencyMembership` (Task 2), `AppFrame` (Task 5), `listClients` (já existe), `listTasks` (já existe), `TaskStatus` (de `@/lib/tasks`).

- [ ] **Step 1: Criar `src/app/(authed)/overview/page.tsx`**

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

export default async function OverviewPage() {
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
    <AppFrame context={{ type: "agency", active: "overview" }} agencyName={agencyName} clients={clients}>
      <div className="space-y-6">
        <h1 className="text-sm font-semibold text-foreground-strong">Visão geral</h1>

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

- [ ] **Step 2: Verificação manual**

```bash
npm run build
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/overview  # 307 -> /login (sem sessão)
```

Parar o servidor.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/overview/page.tsx"
git commit -m "feat: página Visão geral da agência"
```

---

### Task 8: Workspace de cliente (`/clientes/[id]` e `/clientes/[id]/tarefas`)

**Files:**
- Create: `src/app/(authed)/clientes/[id]/page.tsx`
- Create: `src/app/(authed)/clientes/[id]/tarefas/page.tsx`

**Interfaces:**
- Consumes: `requireAgencyMembership` (Task 2), `AppFrame`/`SidebarContext` (Task 5), `listClients` (já existe), `listAgencyMembers`/`listTasksByClient` (Task 3), `TasksTable` com `lockedClientId` (Task 4).

- [ ] **Step 1: Criar `src/app/(authed)/clientes/[id]/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default async function ClientWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/clientes/${id}/tarefas`);
}
```

- [ ] **Step 2: Criar `src/app/(authed)/clientes/[id]/tarefas/page.tsx`**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasksByClient } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "agency", active: "overview" }} agencyName={agencyName} clients={clients}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <a href="/overview" className="underline">
            Voltar para a visão geral
          </a>
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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "tasks" }}
      agencyName={agencyName}
      clients={clients}
    >
      <TasksTable agencyId={agencyId} initialTasks={tasks} members={members} lockedClientId={client.id} />
    </AppFrame>
  );
}
```

- [ ] **Step 3: Verificação manual**

```bash
npm run build
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/clientes/00000000-0000-0000-0000-000000000000  # 307 -> /login (sem sessão)
```

Parar o servidor.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(authed)/clientes/[id]"
git commit -m "feat: workspace de cliente (/clientes/[id]/tarefas)"
```

---

### Task 9: Redirecionamentos pós-login apontam para `/overview`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: nada novo.

- [ ] **Step 1: Reescrever `src/app/page.tsx` para redirecionar pra `/overview`**

```tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/overview");
}
```

- [ ] **Step 2: Atualizar o redirect pós-login em `src/app/login/page.tsx`**

Trocar a linha:

```ts
    router.push("/tasks");
```

Por:

```ts
    router.push("/overview");
```

- [ ] **Step 3: Atualizar o redirect em `src/app/auth/callback/route.ts`**

Trocar:

```ts
  return NextResponse.redirect(`${origin}/tasks`);
```

Por:

```ts
  return NextResponse.redirect(`${origin}/overview`);
```

- [ ] **Step 4: Verificação manual — fluxo completo**

```bash
npm run build
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 307 -> /login (sem sessão, via redirect + middleware)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login     # 200
```

Se houver credenciais reais de Supabase configuradas neste ambiente, testar manualmente no navegador: logar em `/login`, confirmar redirect pra `/overview`, navegar pela sidebar (Visão geral → Todas as tarefas → clicar num cliente → volta pra Agência via "←"), criar uma tarefa dentro do workspace de um cliente e confirmar que ela aparece filtrada só ali e também aparece em "Todas as tarefas" com a coluna Cliente preenchida.

Parar o servidor.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/login/page.tsx src/app/auth/callback/route.ts
git commit -m "feat: pós-login e raiz redirecionam para /overview"
```

---

## Self-Review

**Cobertura da spec:**
- Rail fina só com ícone da agência → Task 5 (`Sidebar`, aside de `w-14` com só o link do ícone da agência).
- Sidebar larga contextual (Agência x Cliente) → Task 5 (`SidebarContext`, `AgencyPanel`/`ClientPanel`).
- `/overview` com resumo (clientes ativos, tarefas por status, próximas 5 entregas) → Task 7.
- `/tasks` inalterado no comportamento, só migrado pro novo `AppFrame` → Task 6.
- `/clientes` (CRUD) inalterado no comportamento, só migrado → Task 6.
- `/clientes/[id]` redireciona pra `/clientes/[id]/tarefas` → Task 8 Step 1.
- `/clientes/[id]/tarefas` com tabela sem coluna Cliente, sem filtro de cliente, modal com cliente travado, tratamento de "cliente não encontrado" → Task 8 Step 2.
- Reuso via `lockedClientId` em vez de duplicar `TasksTable`/`TaskDetailModal` → Task 4.
- Middleware allowlist (protege por padrão) → Task 1.
- `/` exige sessão e leva pra `/overview` → Task 9 Step 1 (redirect) + Task 1 (middleware já protege `/` por padrão, já que não está na allowlist).
- Lista de clientes na sidebar nunca inclui arquivados → Task 6 Step 2 (`activeClients` separado de `allClients`), Task 7 e Task 8 usam `listClients` sem `includeArchived` (exclui por padrão).

**Placeholders:** nenhum "TBD"/"implementar depois" — todo step tem código completo, inclusive os três arquivos reescritos por inteiro na Task 4 e na Task 5 (evita edições parciais ambíguas).

**Consistência de tipos:** `SidebarContext` definido uma vez em `Sidebar.tsx` (Task 5) e importado com o mesmo nome em `AppFrame.tsx` (Task 5) e usado com a mesma forma discriminada (`type: "agency" | "client"`) em todas as `page.tsx` que o consomem (Tasks 6, 7, 8). `lockedClientId?: string` tem o mesmo nome e tipo em `TasksTable` e `TaskDetailModal` (Task 4). `listTasksByClient` (Task 3) tem a mesma assinatura usada na Task 8. `requireAgencyMembership` (Task 2) retorna `{ agencyId, agencyName }` e todo consumidor (Tasks 6, 7, 8) desestrutura exatamente esses dois campos.
