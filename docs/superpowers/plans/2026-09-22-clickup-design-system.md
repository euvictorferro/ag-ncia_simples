# Design system estilo ClickUp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o acento de cor roxo do ClickUp, transformar a sidebar de Clientes numa árvore expansível (Agência > Cliente > abas), agrupar a tabela de Tarefas por status (e por cliente na visão Home), e redesenhar as telas placeholder como empty-states.

**Architecture:** Tokens de cor novos em `globals.css` substituem os botões brancos atuais por um acento roxo. `Sidebar.tsx` ganha um `ClientTreeItem[]` nos variants `clients`/`client` do `SidebarContext` e um componente `ClientsTree` client-side com estado de expansão; `ClientPanel` é removido (a árvore cobre o caso do cliente ativo). `TasksTable` é reescrita para agrupar `Task[]` em grupos por cliente/status antes de renderizar, usando um novo `TaskGroupHeader`. `PlaceholderSection` vira um empty-state centralizado.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + Supabase (mesmo projeto já em produção).

**Spec:** `docs/superpowers/specs/2026-09-22-clickup-design-system.md`

## Global Constraints

- Sem suite automatizada nesta fase — cada task termina com `npm run build` + verificação manual via `npm run dev`, não testes automatizados (mesma convenção do plano anterior deste projeto).
- Sem entidades novas no banco (nada de tabelas `spaces`/`folders`/`lists`).
- Sem toggle claro/escuro, sem busca/filtro na árvore de clientes, sem drag-and-drop.
- Tokens de cor existentes (`--background`, `--foreground`, `--border`, `--muted`, `--radius-card` etc.) continuam valendo — só adiciona `--accent`/`--accent-strong`/`--accent-foreground`, não remove os outros.
- `--button`/`--button-foreground` são removidos de uso (mas os tokens em si podem ficar declarados em `globals.css` sem problema — só os componentes migram pra `accent`).

---

## File Structure

```
src/
├── app/
│   └── globals.css                                   # modificado (Task 1)
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx                                # reescrito (Task 2)
│   ├── shared/
│   │   └── PlaceholderSection.tsx                     # reescrito (Task 5)
│   └── tasks/
│       ├── TaskGroupHeader.tsx                        # novo (Task 4)
│       ├── TaskRow.tsx                                # modificado (Task 4)
│       └── TasksTable.tsx                             # reescrito (Task 4)
└── app/(authed)/clientes/
    ├── page.tsx                                        # modificado (Task 3)
    └── [id]/
        ├── tarefas/page.tsx                            # modificado (Task 3)
        ├── dashboard/page.tsx                          # modificado (Task 3)
        ├── anuncios/page.tsx                           # modificado (Task 3)
        ├── organico/page.tsx                           # modificado (Task 3)
        ├── financeiro/page.tsx                         # modificado (Task 3)
        └── conteudos/page.tsx                          # modificado (Task 3)
```

---

### Task 1: Tokens de acento roxo

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/login/page.tsx:74`
- Modify: `src/components/clientes/ClientFormModal.tsx:88`
- Modify: `src/components/tasks/TaskDetailModal.tsx:237`
- Modify: `src/components/tasks/TasksTable.tsx:83` (esse arquivo é reescrito de novo na Task 4 — aqui só troca a cor do botão existente pra não deixar branco entre as duas tasks)
- Modify: `src/components/clientes/ClientsGrid.tsx:28`

**Interfaces:**
- Consumes: nada novo.
- Produces: classes utilitárias `bg-accent`, `text-accent-foreground`, `text-accent-strong`, `bg-accent/15` (via `@theme inline`), disponíveis pra Tasks 2-5.

- [ ] **Step 1: Adicionar os tokens em `src/app/globals.css`**

Adicionar, dentro de `:root` (depois de `--radius-card: 0.75rem;`):

```css
  --accent: #5f48ea;
  --accent-strong: #7b68ee;
  --accent-foreground: #ffffff;
```

E dentro de `@theme inline` (depois de `--color-button-foreground: var(--button-foreground);`):

```css
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-accent-foreground: var(--accent-foreground);
```

- [ ] **Step 2: Trocar os 5 botões primários de `bg-button`/`text-button-foreground` pra `bg-accent`/`text-accent-foreground`**

Em cada um dos 5 arquivos listados em **Files** (exceto `globals.css`), trocar a ocorrência de:

```
bg-button ... text-button-foreground
```

por:

```
bg-accent ... text-accent-foreground
```

mantendo o resto da className igual (padding, radius, font-size já existentes). Exemplo (`src/components/clientes/ClientsGrid.tsx:28`):

```tsx
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
```

- [ ] **Step 3: Verificação manual**

```bash
npm run build
```

Deve compilar sem erros (nenhuma mudança de tipo, só classNames). Rodar `grep -rn "bg-button\|text-button-foreground" src` e confirmar que não retorna mais nada.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/login/page.tsx src/components/clientes/ClientFormModal.tsx src/components/tasks/TaskDetailModal.tsx src/components/tasks/TasksTable.tsx src/components/clientes/ClientsGrid.tsx
git commit -m "feat: tokens de acento roxo (estilo ClickUp) nos botões primários"
```

---

### Task 2: Árvore de clientes na Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: nada novo (mesmo `next/link`; `useState` de `react`).
- Produces: `export type ClientTreeItem = { id: string; name: string }`, `SidebarContext` com `clients: ClientTreeItem[]` nos variants `clients` e `client`. Consumido pela Task 3 (todo `page.tsx` de Clientes precisa passar `clients` no `context`).

- [ ] **Step 1: Reescrever `src/components/layout/Sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export type HomeTab = "dashboard" | "financeiro" | "tasks";
export type ClientTab = "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos";
export type ClientTreeItem = { id: string; name: string };

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients"; clients: ClientTreeItem[] }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab; clients: ClientTreeItem[] }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" };

function navClass(isActive: boolean): string {
  return `truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-accent/15 text-accent-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
    >
      <path d="M3 1.5 7 5l-4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClientsTree({
  clients,
  activeClientId,
  activeTab,
}: {
  clients: ClientTreeItem[];
  activeClientId?: string;
  activeTab?: ClientTab;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => (activeClientId ? new Set([activeClientId]) : new Set()));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <nav className="flex flex-col gap-1">
      <p className="mb-2 truncate px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clientes</p>
      {clients.map((client) => {
        const isExpanded = expanded.has(client.id);
        return (
          <div key={client.id}>
            <div className="flex items-center gap-1 rounded-md px-1 hover:bg-muted">
              <button
                type="button"
                onClick={() => toggle(client.id)}
                aria-label={isExpanded ? `Recolher ${client.name}` : `Expandir ${client.name}`}
                className="flex h-7 w-5 shrink-0 items-center justify-center text-muted-foreground"
              >
                <ChevronIcon expanded={isExpanded} />
              </button>
              <Link
                href={`/clientes/${client.id}/tarefas`}
                className={`min-w-0 flex-1 truncate py-1.5 text-sm ${
                  client.id === activeClientId ? "text-accent-strong" : "text-foreground"
                }`}
              >
                {client.name}
              </Link>
            </div>
            {isExpanded && (
              <div className="ml-6 flex flex-col gap-1 border-l border-border pl-2">
                {CLIENT_TABS.map((tab) => (
                  <Link
                    key={tab.key}
                    href={`/clientes/${client.id}/${tab.path}`}
                    className={navClass(client.id === activeClientId && tab.key === activeTab)}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
        active ? "bg-muted text-accent-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        {context.type === "clients" && <ClientsTree clients={context.clients} />}
        {context.type === "client" && (
          <ClientsTree clients={context.clients} activeClientId={context.clientId} activeTab={context.active} />
        )}
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Verificação manual**

```bash
npm run build
```

Vai falhar em todas as 7 rotas de Clientes (`clientes/page.tsx` e as 6 sob `clientes/[id]/`) porque elas ainda passam `context={{ type: "clients" }}` / `context={{ type: "client", ... }}` sem o campo `clients` novo, que agora é obrigatório no tipo. **Isso é esperado** — a Task 3 corrige as 7 rotas. Confirmar que o erro de build é exatamente sobre falta da propriedade `clients` nesses 7 arquivos, não outro erro.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: árvore de clientes expansível na sidebar (estilo ClickUp)"
```

---

### Task 3: Passar `clients` pras 7 rotas de Clientes

**Files:**
- Modify: `src/app/(authed)/clientes/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/tarefas/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/dashboard/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/anuncios/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/organico/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/financeiro/page.tsx`
- Modify: `src/app/(authed)/clientes/[id]/conteudos/page.tsx`

**Interfaces:**
- Consumes: `ClientTreeItem`, `SidebarContext` (Task 2); `Client` (`@/lib/clients`, já usado nesses arquivos).

Todas as 7 rotas já chamam `listClients(supabase, agencyId, ...)` e têm a variável `clients` (ou `allClients`) em escopo — só falta mapear pra `ClientTreeItem[]` e passar no `context`.

- [ ] **Step 1: Atualizar `src/app/(authed)/clientes/page.tsx`**

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
    <AppFrame
      context={{ type: "clients", clients: allClients.map((c) => ({ id: c.id, name: c.name })) }}
      agencyName={agencyName}
    >
      <ClientsGrid agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
```

- [ ] **Step 2: Atualizar `src/app/(authed)/clientes/[id]/tarefas/page.tsx`**

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "tasks", clients: clientTree }}
      agencyName={agencyName}
    >
      <TasksTable agencyId={agencyId} initialTasks={tasks} members={members} lockedClientId={client.id} />
    </AppFrame>
  );
}
```

- [ ] **Step 3: Atualizar `src/app/(authed)/clientes/[id]/dashboard/page.tsx`**

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "dashboard", clients: clientTree }}
      agencyName={agencyName}
    >
      <PlaceholderSection title={`${client.name} — Dashboard`} />
    </AppFrame>
  );
}
```

- [ ] **Step 4: Atualizar `src/app/(authed)/clientes/[id]/anuncios/page.tsx`**

Mesmo padrão do Step 3, trocando `active: "dashboard"` por `active: "anuncios"` e o título por `` `${client.name} — Anúncios` ``:

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "anuncios", clients: clientTree }}
      agencyName={agencyName}
    >
      <PlaceholderSection title={`${client.name} — Anúncios`} />
    </AppFrame>
  );
}
```

- [ ] **Step 5: Atualizar `src/app/(authed)/clientes/[id]/organico/page.tsx`**

Mesmo padrão, `active: "organico"`, título `` `${client.name} — Orgânico` ``:

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "organico", clients: clientTree }}
      agencyName={agencyName}
    >
      <PlaceholderSection title={`${client.name} — Orgânico`} />
    </AppFrame>
  );
}
```

- [ ] **Step 6: Atualizar `src/app/(authed)/clientes/[id]/financeiro/page.tsx`**

Mesmo padrão, `active: "financeiro"`, título `` `${client.name} — Financeiro` ``:

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "financeiro", clients: clientTree }}
      agencyName={agencyName}
    >
      <PlaceholderSection title={`${client.name} — Financeiro`} />
    </AppFrame>
  );
}
```

- [ ] **Step 7: Atualizar `src/app/(authed)/clientes/[id]/conteudos/page.tsx`**

Mesmo padrão, `active: "conteudos"`, título `` `${client.name} — Conteúdos` ``:

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
  const clientTree = clients.map((c) => ({ id: c.id, name: c.name }));

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
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "conteudos", clients: clientTree }}
      agencyName={agencyName}
    >
      <PlaceholderSection title={`${client.name} — Conteúdos`} />
    </AppFrame>
  );
}
```

- [ ] **Step 8: Verificação manual**

```bash
npm run build
npm run dev
```

Build deve compilar 100% limpo agora. Depois, com o servidor rodando (e se houver credenciais reais de Supabase configuradas): logar, abrir `/clientes`, conferir que a árvore aparece na sidebar (todos os clientes colapsados); clicar num cliente e conferir que ele expande mostrando as 6 abas; entrar em `/clientes/{id}/tarefas` diretamente e conferir que esse cliente já vem expandido na árvore com "Tarefas" destacado. Parar o servidor.

- [ ] **Step 9: Commit**

```bash
git add "src/app/(authed)/clientes"
git commit -m "feat: passa lista de clientes pra árvore da sidebar nas 7 rotas de Clientes"
```

---

### Task 4: Tabela de Tarefas agrupada por status/cliente

**Files:**
- Create: `src/components/tasks/TaskGroupHeader.tsx`
- Modify: `src/components/tasks/TaskRow.tsx`
- Modify: `src/components/tasks/TasksTable.tsx`

**Interfaces:**
- Consumes: `Task`, `TaskStatus`, `AgencyMember` (`@/lib/tasks`), `Client` (`@/lib/clients`), `STATUS_LABEL` (`@/components/tasks/StatusIcon`, já exportado), `PriorityFlag` (inalterado).
- Produces: `TaskGroupHeader({ label, count, collapsed, onToggle }: { label: string; count: number; collapsed: boolean; onToggle: () => void })`. `TaskRow` perde as props `client`/`showClient` (não recebe mais cliente, não renderiza mais `StatusIcon`).

- [ ] **Step 1: Criar `src/components/tasks/TaskGroupHeader.tsx`**

```tsx
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
    >
      <path d="M3 1.5 7 5l-4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskGroupHeader({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 bg-muted/40 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      <ChevronIcon expanded={!collapsed} />
      <span>{label}</span>
      <span className="text-muted-foreground/70">{count}</span>
    </button>
  );
}
```

- [ ] **Step 2: Reescrever `src/components/tasks/TaskRow.tsx`**

```tsx
import type { AgencyMember, Task } from "@/lib/tasks";
import { PriorityFlag } from "@/components/tasks/PriorityFlag";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function TaskRow({
  task,
  members,
  onClick,
}: {
  task: Task;
  members: AgencyMember[];
  onClick: () => void;
}) {
  const assignee = task.assignee_id ? members.find((m) => m.id === task.assignee_id) : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_120px_100px_90px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate text-foreground">{task.title}</span>
      <span className="truncate text-xs text-muted-foreground">{assignee ? assignee.user_id.slice(0, 8) : "—"}</span>
      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
      <span>
        <PriorityFlag priority={task.priority} />
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Reescrever `src/components/tasks/TasksTable.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Task, TaskStatus, AgencyMember } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskGroupHeader } from "@/components/tasks/TaskGroupHeader";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { STATUS_LABEL } from "@/components/tasks/StatusIcon";

const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "done"];

type StatusGroup = { status: TaskStatus; tasks: Task[] };
type ClientGroup = { clientId: string; clientLabel: string; statusGroups: StatusGroup[] };

function groupByStatus(tasks: Task[]): StatusGroup[] {
  return STATUS_ORDER.map((status) => ({ status, tasks: tasks.filter((t) => t.status === status) })).filter(
    (group) => group.tasks.length > 0,
  );
}

function groupByClientThenStatus(tasks: Task[], clientById: Map<string, Client>): ClientGroup[] {
  const byClient = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = byClient.get(task.client_id) ?? [];
    list.push(task);
    byClient.set(task.client_id, list);
  }

  return Array.from(byClient.entries())
    .map(([clientId, clientTasks]) => ({
      clientId,
      clientLabel: clientById.get(clientId)?.name ?? "Sem cliente",
      statusGroups: groupByStatus(clientTasks),
    }))
    .sort((a, b) => a.clientLabel.localeCompare(b.clientLabel));
}

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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const showClient = !lockedClientId;
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredTasks = tasks.filter((t) => {
    if (showClient && clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const clientGroups = useMemo(
    () => (showClient ? groupByClientThenStatus(filteredTasks, clientById) : []),
    [showClient, filteredTasks, clientById],
  );
  const statusGroups = useMemo(() => (!showClient ? groupByStatus(filteredTasks) : []), [showClient, filteredTasks]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function upsert(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function renderStatusGroup(group: StatusGroup, groupKey: string) {
    const collapsed = collapsedGroups.has(groupKey);
    return (
      <div key={groupKey}>
        <TaskGroupHeader
          label={STATUS_LABEL[group.status]}
          count={group.tasks.length}
          collapsed={collapsed}
          onToggle={() => toggleGroup(groupKey)}
        />
        {!collapsed &&
          group.tasks.map((task) => <TaskRow key={task.id} task={task} members={members} onClick={() => setEditing(task)} />)}
      </div>
    );
  }

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
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Nova tarefa
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
        {showClient
          ? clientGroups.map((clientGroup) => (
              <div key={clientGroup.clientId}>
                <p className="truncate border-t border-border px-3 py-2 text-sm font-medium text-foreground-strong first:border-t-0">
                  {clientGroup.clientLabel}
                </p>
                {clientGroup.statusGroups.map((group) => renderStatusGroup(group, `${clientGroup.clientId}:${group.status}`))}
              </div>
            ))
          : statusGroups.map((group) => renderStatusGroup(group, group.status))}
        {filteredTasks.length === 0 && (
          <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground first:border-t-0">
            Nenhuma tarefa encontrada.
          </p>
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

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

Deve compilar limpo — `TaskDetailModal` continua recebendo as mesmas props de antes (`agencyId`, `task`, `clients`, `members`, `lockedClientId`, `onClose`, `onSaved`, `onDeleted`), nenhuma mudança nele. Depois `npm run dev`: abrir `/home/tasks` e conferir que aparece um bloco por cliente, com sub-grupos "A fazer"/"Em andamento"/"Concluída" (só os que têm tarefa) e contador; clicar no header de um grupo de status pra colapsar/expandir; abrir `/clientes/{id}/tarefas` e conferir que aparece só os grupos de status, sem o bloco de cliente. Parar o servidor.

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskGroupHeader.tsx src/components/tasks/TaskRow.tsx src/components/tasks/TasksTable.tsx
git commit -m "feat: agrupa tabela de tarefas por status (e por cliente na visão Home)"
```

---

### Task 5: Empty-state nas telas placeholder

**Files:**
- Modify: `src/components/shared/PlaceholderSection.tsx`

**Interfaces:**
- Consumes: nada novo.
- Produces: mesma assinatura `PlaceholderSection({ title }: { title: string })` — nenhuma das 9 páginas que o usam precisa mudar.

- [ ] **Step 1: Reescrever `src/components/shared/PlaceholderSection.tsx`**

```tsx
function ClockGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8v6l4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ClockGlyph />
      </div>
      <h1 className="text-sm font-semibold text-foreground-strong">{title}</h1>
      <p className="text-sm text-muted-foreground">Em breve.</p>
    </div>
  );
}
```

- [ ] **Step 2: Verificação manual**

```bash
npm run build
npm run dev
```

Abrir `/inbox` (ou qualquer outra rota placeholder) e conferir o ícone centralizado com título e "Em breve." abaixo. Parar o servidor.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/PlaceholderSection.tsx
git commit -m "feat: empty-state nas telas placeholder (estilo ClickUp)"
```

---

## Self-Review

**Cobertura da spec:**
- Tokens de acento roxo → Task 1.
- Árvore de clientes expansível na sidebar, cliente ativo já expandido → Task 2 (componente) + Task 3 (dados).
- `ClientPanel` removido, substituído pela árvore → Task 2.
- Tabela de Tarefas agrupada por cliente→status (Home) ou só status (workspace do cliente) → Task 4.
- `TaskRow` sem coluna Cliente e sem badge de status inline → Task 4.
- Placeholders como empty-state → Task 5.
- Nenhuma entidade nova no banco, nenhum toggle de tema, nenhuma busca na árvore → nenhuma task introduz isso.

**Placeholders:** nenhum "TBD"/"implementar depois" — toda task tem código completo, inclusive as 7 rotas de Clientes escritas por inteiro na Task 3 (nenhuma abreviada como "igual à anterior" nos arquivos reais — as instruções indicam o padrão comum e depois dão o código completo de cada uma).

**Consistência de tipos:** `ClientTreeItem` definido na Task 2 (`Sidebar.tsx`) e usado com o mesmo formato `{ id, name }` nas 7 rotas da Task 3. `TaskRow` perde `client`/`showClient` na Task 4 e nenhuma chamada remanescente passa essas props (a única chamada de `TaskRow` fica dentro de `TasksTable.tsx`, reescrita na mesma task). `STATUS_LABEL` já era exportado de `StatusIcon.tsx` antes deste plano — Task 4 só importa, não duplica o mapeamento.
