# Agência Simples — Fundação + Módulo de Tarefas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar o esqueleto do Agência Simples (Next.js + Supabase Auth + RLS multi-tenant) com o primeiro módulo funcional ponta a ponta: CRUD de clientes e CRUD de tarefas vinculadas a clientes.

**Architecture:** Next.js App Router com grupo de rotas `(authed)` protegido por `middleware.ts`, sessão via `@supabase/ssr`. Todas as tabelas carregam `agency_id` e são protegidas por RLS usando uma função `is_agency_member(agency_id)`. UI reaproveita conceitos do `dashboard_cliqueboost` (Logo, markdown parser, estrutura de tabela de tarefas com status/prioridade) mas reimplementados do zero e simplificados — o app antigo tem tudo acoplado a um modelo B2C de cliente único por cookie (CLIENTS fixo, CmdK, onboarding tour, widget de IA) que não se aplica aqui.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres + Supabase Auth + `@supabase/ssr`) + Vercel.

**Spec:** `docs/superpowers/specs/2026-09-22-agencia-simples-fundacao.md`

## Global Constraints

- Paleta fixa preto/branco: fundo `#111111`/`#151515`, texto `#c3c2b7`/`#ffffff`, botões `#ffffff`/`#313130`. Sem toggle de tema, sem whitelabel.
- Multi-tenant desde o início: toda tabela de domínio carrega `agency_id`; toda policy RLS passa por `is_agency_member(agency_id)`. RLS real, nunca bypassed por service role no código da aplicação.
- Auth: Supabase Auth via `@supabase/ssr`, cookies geridos pelo Supabase. Sem cadastro público — criação de usuário é manual via Supabase Studio.
- Tarefas sempre vinculadas a um cliente (`client_id` obrigatório).
- Sem suite automatizada nesta fase — verificação é manual, rodando `npm run dev` e conferindo no navegador a cada tarefa concluída. Cada task abaixo termina com um passo de verificação manual no lugar de testes automatizados.
- Reaproveitamento do `dashboard_cliqueboost` (`~/Projetos/Projetos Clique Boost/dashboard_cliqueboost`): portar literalmente apenas o que é genérico e desacoplado (`Logo`, parser de markdown). `AppFrame`/`Sidebar`/`Header`/`TasksTable`/`TaskRow`/`TaskDetailModal` são reescritos do zero, inspirados na estrutura visual, mas sem as dependências B2C (CLIENTS fixo, CmdK, onboarding, widget de IA, comentários/tempo do ClickUp).

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs
.env.local.example
src/
├── middleware.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   └── (authed)/
│       ├── layout.tsx
│       ├── tasks/page.tsx
│       └── clientes/page.tsx
├── components/
│   ├── ui/
│   │   ├── icons.tsx
│   │   └── markdown.tsx
│   ├── layout/
│   │   ├── Logo.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppFrame.tsx
│   ├── tasks/
│   │   ├── StatusIcon.tsx
│   │   ├── PriorityFlag.tsx
│   │   ├── TaskRow.tsx
│   │   ├── TasksTable.tsx
│   │   └── TaskDetailModal.tsx
│   └── clientes/
│       ├── ClientRow.tsx
│       ├── ClientsTable.tsx
│       └── ClientFormModal.tsx
└── lib/
    ├── supabase/
    │   ├── client.ts
    │   ├── server.ts
    │   └── middleware.ts
    ├── clients.ts
    └── tasks.ts
supabase/migrations/
    0001_foundation.sql
```

---

### Task 1: Bootstrap do projeto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `.env.local.example`

**Interfaces:**
- Produces: projeto Next.js rodando em `npm run dev`, com Tailwind v4 configurado e os design tokens fixos (`--color-background`, `--color-foreground`, `--color-card`, `--color-border`, `--color-muted`, `--color-muted-foreground`, `--color-button`, `--color-button-foreground`) disponíveis em `globals.css` para todos os componentes das tasks seguintes.

- [ ] **Step 1: Criar o projeto Next.js com TypeScript + Tailwind**

```bash
cd "/Users/victorferro/Projetos/Projetos Victor/Agência Simples"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

Quando perguntar se pode escrever em diretório não vazio (já existe `docs/` e `.git`), confirmar que sim.

- [ ] **Step 2: Instalar dependências adicionais**

```bash
npm install @supabase/ssr @supabase/supabase-js clsx tailwind-merge react-markdown
```

- [ ] **Step 3: Definir os design tokens fixos em `src/app/globals.css`**

Substituir o conteúdo gerado pelo `create-next-app` por:

```css
@import "tailwindcss";

:root {
  --background: #111111;
  --background-elevated: #151515;
  --foreground: #c3c2b7;
  --foreground-strong: #ffffff;
  --border: #313130;
  --muted: #1c1c1b;
  --muted-foreground: #8a897f;
  --button: #ffffff;
  --button-foreground: #151515;
  --radius-card: 0.75rem;
}

@theme inline {
  --color-background: var(--background);
  --color-background-elevated: var(--background-elevated);
  --color-foreground: var(--foreground);
  --color-foreground-strong: var(--foreground-strong);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-button: var(--button);
  --color-button-foreground: var(--button-foreground);
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 4: Simplificar `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agência Simples",
  description: "CRM, tarefas e calendário de conteúdo para agências de marketing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Apagar `src/app/page.tsx` gerado e criar um placeholder**

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Agência Simples</p>
    </main>
  );
}
```

- [ ] **Step 6: Criar `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 7: Verificação manual**

```bash
npm run dev
```

Abrir `http://localhost:3000` e confirmar fundo `#111111` e texto claro. Parar o servidor (Ctrl+C).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js + Tailwind v4 com paleta fixa"
```

---

### Task 2: Migrations do banco — schema + RLS

**Files:**
- Create: `supabase/migrations/0001_foundation.sql`

**Interfaces:**
- Produces: tabelas `agencies`, `agency_members`, `clients`, `tasks`; função `is_agency_member(check_agency_id uuid) returns boolean`; policies de select/insert/update/delete em `clients` e `tasks` usando essa função.

- [ ] **Step 1: Escrever a migration completa**

```sql
-- supabase/migrations/0001_foundation.sql

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (agency_id, user_id)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_id uuid references agency_members(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função central de checagem de pertencimento, usada por todas as policies.
create function is_agency_member(check_agency_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from agency_members
    where agency_id = check_agency_id
      and user_id = auth.uid()
  );
$$;

alter table agencies enable row level security;
alter table agency_members enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;

create policy "members can read own agency" on agencies
  for select using (is_agency_member(id));

create policy "members can read own membership rows" on agency_members
  for select using (is_agency_member(agency_id));

create policy "members can read clients" on clients
  for select using (is_agency_member(agency_id));
create policy "members can insert clients" on clients
  for insert with check (is_agency_member(agency_id));
create policy "members can update clients" on clients
  for update using (is_agency_member(agency_id)) with check (is_agency_member(agency_id));
create policy "members can delete clients" on clients
  for delete using (is_agency_member(agency_id));

create policy "members can read tasks" on tasks
  for select using (is_agency_member(agency_id));
create policy "members can insert tasks" on tasks
  for insert with check (is_agency_member(agency_id));
create policy "members can update tasks" on tasks
  for update using (is_agency_member(agency_id)) with check (is_agency_member(agency_id));
create policy "members can delete tasks" on tasks
  for delete using (is_agency_member(agency_id));

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();
```

- [ ] **Step 2: Aplicar a migration no Supabase do projeto**

Via Supabase Studio (SQL Editor) do projeto já criado: colar o conteúdo de `0001_foundation.sql` e rodar. Confirmar que as 4 tabelas aparecem em Table Editor e que RLS está "Enabled" em cada uma.

Alternativa, se o CLI do Supabase estiver linkado ao projeto:

```bash
supabase db push
```

- [ ] **Step 3: Criar a agência e o primeiro usuário manualmente**

No Supabase Studio:
1. Authentication → Users → Add user (email/senha do usuário, ex.: `contato.cliqueboost@gmail.com`).
2. Table Editor → `agencies` → inserir uma linha (`name = 'Clique Boost'`).
3. Table Editor → `agency_members` → inserir uma linha ligando o `user_id` criado ao `agency_id` da agência, `role = 'owner'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_foundation.sql
git commit -m "feat: schema multi-tenant + RLS (agencies, agency_members, clients, tasks)"
```

---

### Task 3: Clientes Supabase (`@supabase/ssr`) e helpers de auth

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

**Interfaces:**
- Produces: `createBrowserSupabaseClient(): SupabaseClient` (uso em Client Components), `createServerSupabaseClient(): Promise<SupabaseClient>` (uso em Server Components/Route Handlers, lê/escreve cookies via `next/headers`), `updateSession(request: NextRequest): Promise<NextResponse>` (usado pelo `middleware.ts` pra refresh de sessão e redirect).
- Consumes: variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Criar `.env.local` local (não commitado) com as credenciais reais**

```bash
cp .env.local.example .env.local
```

Preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do projeto Supabase (Project Settings → API no Supabase Studio). Se não tiver esses valores, pedir ao usuário.

- [ ] **Step 2: Criar `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Criar `src/lib/supabase/server.ts`**

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // ponytail: setAll chamado de um Server Component sem permissão de escrita —
            // ok ignorar, o middleware já cuida do refresh de sessão nesse caso.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Criar `src/lib/supabase/middleware.ts`**

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

  const isAuthedRoute = request.nextUrl.pathname.startsWith("/tasks") ||
    request.nextUrl.pathname.startsWith("/clientes");

  if (!user && isAuthedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
```

- [ ] **Step 5: Criar `src/middleware.ts`**

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 6: Verificação manual**

```bash
npm run dev
```

Acessar `http://localhost:3000/tasks` sem estar logado — deve redirecionar para `/login` (a página `/login` ainda não existe, então vai dar 404 nessa rota até a Task 4; confirmar apenas que o redirect acontece, ou seja, a URL muda para `/login`). Parar o servidor.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase src/middleware.ts .gitignore
git commit -m "feat: helpers Supabase SSR + middleware de proteção de rotas"
```

---

### Task 4: Login e callback de auth

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient` (Task 3, client.ts), `createServerSupabaseClient` (Task 3, server.ts).
- Produces: rota `/login` (formulário email/senha) e rota `/auth/callback` (troca de código por sessão, usada se no futuro entrar magic link — v1 usa senha direta via `signInWithPassword`).

- [ ] **Step 1: Criar `src/app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push("/tasks");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h1 className="text-lg font-semibold text-foreground-strong">Agência Simples</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs text-muted-foreground">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-xs text-muted-foreground">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Criar `src/app/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/tasks`);
}
```

- [ ] **Step 3: Verificação manual**

```bash
npm run dev
```

Acessar `/login`, logar com o usuário criado na Task 2 (Step 3). Confirmar redirect para `/tasks` (vai dar 404 até a Task 6 existir a página — confirmar que a URL muda pra `/tasks` e que não volta pro `/login`, ou seja, a sessão persistiu). Recarregar a página em `/tasks` (mesmo que 404) e confirmar que o middleware não te manda de volta pro login — sessão está sendo lida corretamente.

- [ ] **Step 4: Commit**

```bash
git add src/app/login src/app/auth
git commit -m "feat: página de login e callback de auth via Supabase"
```

---

### Task 5: Layout autenticado (AppFrame, Sidebar, Header, Logo)

**Files:**
- Create: `src/components/layout/Logo.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/AppFrame.tsx`
- Create: `src/app/(authed)/layout.tsx`
- Create: `public/logo.svg`

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 3).
- Produces: `AppFrame({ active, pageLabel, agencyName, children }): JSX.Element` — casca visual usada por `/tasks` e `/clientes` (Task 6 e 7); `type ActiveKey = "tasks" | "clientes"`.

- [ ] **Step 1: Criar um logo placeholder simples**

```bash
mkdir -p public
cat > public/logo.svg <<'EOF'
<svg width="140" height="32" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="22" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#ffffff">Agência Simples</text>
</svg>
EOF
```

- [ ] **Step 2: Criar `src/components/layout/Logo.tsx`**

```tsx
import Image from "next/image";

export function Logo({ width = 140, height = 32 }: { width?: number; height?: number }) {
  return <Image src="/logo.svg" alt="Agência Simples" width={width} height={height} priority />;
}
```

- [ ] **Step 3: Criar `src/components/layout/Sidebar.tsx`**

```tsx
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export type ActiveKey = "tasks" | "clientes";

const NAV_ITEMS: { key: ActiveKey; href: string; label: string }[] = [
  { key: "tasks", href: "/tasks", label: "Tarefas" },
  { key: "clientes", href: "/clientes", label: "Clientes" },
];

export function Sidebar({ active }: { active: ActiveKey }) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col gap-6 border-r border-border bg-background-elevated px-4 py-5">
      <Logo width={120} height={28} />
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active === item.key
                ? "bg-muted text-foreground-strong"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Criar `src/components/layout/Header.tsx`**

```tsx
export function Header({ agencyName, pageLabel }: { agencyName: string; pageLabel: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center border-b border-border bg-background-elevated px-4">
      <p className="text-sm text-muted-foreground">
        {agencyName} / <span className="font-medium text-foreground-strong">{pageLabel}</span>
      </p>
    </header>
  );
}
```

- [ ] **Step 5: Criar `src/components/layout/AppFrame.tsx`**

```tsx
import { Sidebar, type ActiveKey } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppFrame({
  active,
  pageLabel,
  agencyName,
  children,
}: {
  active: ActiveKey;
  pageLabel: string;
  agencyName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header agencyName={agencyName} pageLabel={pageLabel} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Criar `src/app/(authed)/layout.tsx`**

Esse layout resolve a agência do usuário logado (via `agency_members`) e a disponibiliza; se não houver sessão, o `middleware.ts` já redirecionou antes de chegar aqui, mas tratamos o caso de "sem membership" com uma mensagem simples.

```tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
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
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Seu usuário ainda não está vinculado a nenhuma agência. Peça pra alguém do time te adicionar em `agency_members`.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
```

Nota: como cada página (`/tasks`, `/clientes`) também precisa do `agency_id` e do nome da agência para montar o `AppFrame`, esse layout só valida — cada `page.tsx` das Tasks 6/7 refaz a query de membership (padrão simples, sem contexto React compartilhado, aceitável nesse tamanho de app).

- [ ] **Step 7: Verificação manual**

```bash
npm run dev
```

Acessar `/clientes` (ainda 404 — a página só existe na Task 6) logado: confirmar que passa pelo layout sem erro de import. Se der erro de import, corrigir antes de prosseguir.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout "src/app/(authed)/layout.tsx" public/logo.svg
git commit -m "feat: casca do app autenticado (AppFrame, Sidebar, Header)"
```

---

### Task 6: Módulo de Clientes (CRUD mínimo)

**Files:**
- Create: `src/lib/clients.ts`
- Create: `src/components/clientes/ClientRow.tsx`
- Create: `src/components/clientes/ClientsTable.tsx`
- Create: `src/components/clientes/ClientFormModal.tsx`
- Create: `src/app/(authed)/clientes/page.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient`/`createBrowserSupabaseClient` (Task 3), `AppFrame` (Task 5).
- Produces: `type Client = { id: string; agency_id: string; name: string; archived: boolean; created_at: string }`; `listClients(supabase, agencyId): Promise<Client[]>`; `createClient(supabase, agencyId, name): Promise<Client>`; `updateClient(supabase, id, patch: { name?: string; archived?: boolean }): Promise<Client>`. Esses tipos/funções são consumidos pelo módulo de Tarefas (Task 7) para o select de cliente na tarefa.

- [ ] **Step 1: Criar `src/lib/clients.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type Client = {
  id: string;
  agency_id: string;
  name: string;
  archived: boolean;
  created_at: string;
};

export async function listClients(supabase: SupabaseClient, agencyId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("agency_id", agencyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Client[];
}

export async function createClient(
  supabase: SupabaseClient,
  agencyId: string,
  name: string,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ agency_id: agencyId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Client, "name" | "archived">>,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}
```

- [ ] **Step 2: Criar `src/components/clientes/ClientFormModal.tsx`**

Modal de criação/edição, usado tanto pelo botão "Novo cliente" quanto pelo clique numa linha.

```tsx
"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createClient as createClientRow, updateClient, type Client } from "@/lib/clients";

export function ClientFormModal({
  agencyId,
  client,
  onClose,
  onSaved,
}: {
  agencyId: string;
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [archived, setArchived] = useState(client?.archived ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createBrowserSupabaseClient();
    try {
      const saved = client
        ? await updateClient(supabase, client.id, { name, archived })
        : await createClientRow(supabase, agencyId, name);
      onSaved(saved);
      onClose();
    } catch {
      setError("Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">
          {client ? "Editar cliente" : "Novo cliente"}
        </h2>

        <div className="space-y-1">
          <label htmlFor="client-name" className="text-xs text-muted-foreground">
            Nome
          </label>
          <input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        {client && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            Arquivado
          </label>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
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
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Criar `src/components/clientes/ClientRow.tsx`**

```tsx
import type { Client } from "@/lib/clients";

export function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_100px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate text-foreground">{client.name}</span>
      <span className="text-xs text-muted-foreground">{client.archived ? "Arquivado" : "Ativo"}</span>
    </button>
  );
}
```

- [ ] **Step 4: Criar `src/components/clientes/ClientsTable.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Client } from "@/lib/clients";
import { ClientRow } from "@/components/clientes/ClientRow";
import { ClientFormModal } from "@/components/clientes/ClientFormModal";

export function ClientsTable({ agencyId, initialClients }: { agencyId: string; initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const [editing, setEditing] = useState<Client | null | "new">(null);

  function upsert(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      return exists ? prev.map((c) => (c.id === client.id ? client : c)) : [...prev, client].sort((a, b) => a.name.localeCompare(b.name));
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
          Novo cliente
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
        <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Nome</span>
          <span>Status</span>
        </div>
        {clients.map((client) => (
          <ClientRow key={client.id} client={client} onClick={() => setEditing(client)} />
        ))}
        {clients.length === 0 && (
          <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground">Nenhum cliente ainda.</p>
        )}
      </div>

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

- [ ] **Step 5: Criar `src/app/(authed)/clientes/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsTable } from "@/components/clientes/ClientsTable";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const clients = await listClients(supabase, membership.agency_id);
  const agencyName = (membership.agencies as unknown as { name: string })?.name ?? "Agência";

  return (
    <AppFrame active="clientes" pageLabel="Clientes" agencyName={agencyName}>
      <ClientsTable agencyId={membership.agency_id} initialClients={clients} />
    </AppFrame>
  );
}
```

- [ ] **Step 6: Verificação manual**

```bash
npm run dev
```

Logar em `/login`, ir para `/clientes`. Criar um cliente novo, confirmar que aparece na lista. Clicar nele, editar o nome, marcar "Arquivado", salvar, confirmar que o status muda pra "Arquivado" na lista.

- [ ] **Step 7: Commit**

```bash
git add src/lib/clients.ts src/components/clientes "src/app/(authed)/clientes"
git commit -m "feat: CRUD de clientes"
```

---

### Task 7: Módulo de Tarefas (CRUD completo)

**Files:**
- Create: `src/lib/tasks.ts`
- Create: `src/components/tasks/StatusIcon.tsx`
- Create: `src/components/tasks/PriorityFlag.tsx`
- Create: `src/components/tasks/TaskRow.tsx`
- Create: `src/components/tasks/TasksTable.tsx`
- Create: `src/components/tasks/TaskDetailModal.tsx`
- Create: `src/app/(authed)/tasks/page.tsx`

**Interfaces:**
- Consumes: `Client`, `listClients` (Task 6, `src/lib/clients.ts`); `AppFrame` (Task 5); `createServerSupabaseClient`/`createBrowserSupabaseClient` (Task 3).
- Produces: `type Task`, `type TaskStatus = "todo" | "doing" | "done"`, `type TaskPriority = "low" | "medium" | "high"`, `type AgencyMember = { id: string; user_id: string }`.

- [ ] **Step 1: Criar `src/lib/tasks.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  agency_id: string;
  client_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyMember = {
  id: string;
  user_id: string;
};

export async function listTasks(supabase: SupabaseClient, agencyId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function listAgencyMembers(supabase: SupabaseClient, agencyId: string): Promise<AgencyMember[]> {
  const { data, error } = await supabase
    .from("agency_members")
    .select("id, user_id")
    .eq("agency_id", agencyId);

  if (error) throw error;
  return data as AgencyMember[];
}

export type TaskInput = {
  client_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
};

export async function createTask(
  supabase: SupabaseClient,
  agencyId: string,
  input: TaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ agency_id: agencyId, ...input })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<TaskInput>,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: Criar `src/components/tasks/StatusIcon.tsx`**

```tsx
import type { TaskStatus } from "@/lib/tasks";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "#8a897f",
  doing: "#e0a63a",
  done: "#3cb371",
};

export function StatusIcon({ status }: { status: TaskStatus }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-black"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL };
```

- [ ] **Step 3: Criar `src/components/tasks/PriorityFlag.tsx`**

```tsx
import type { TaskPriority } from "@/lib/tasks";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#8a897f",
  medium: "#e0a63a",
  high: "#e05a3a",
};

export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: PRIORITY_COLOR[priority] }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <path d="M1 0v10M1 1h7l-2 2 2 2H1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export { PRIORITY_LABEL };
```

- [ ] **Step 4: Criar `src/components/tasks/TaskRow.tsx`**

```tsx
import type { Task } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { StatusIcon } from "@/components/tasks/StatusIcon";
import { PriorityFlag } from "@/components/tasks/PriorityFlag";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function TaskRow({
  task,
  client,
  onClick,
}: {
  task: Task;
  client: Client | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_140px_120px_110px_90px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate text-foreground">{task.title}</span>
      <span className="truncate text-xs text-muted-foreground">{client?.name ?? "—"}</span>
      <span>
        <StatusIcon status={task.status} />
      </span>
      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
      <span>
        <PriorityFlag priority={task.priority} />
      </span>
    </button>
  );
}
```

- [ ] **Step 5: Criar `src/components/tasks/TaskDetailModal.tsx`**

Modal único usado tanto pra criar quanto pra editar (segue o padrão da Task 6). Descrição usa `react-markdown` só na pré-visualização; o campo de edição é um `textarea` puro (mantém simples — sem editor WYSIWYG).

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
  clients,
  members,
  onClose,
  onSaved,
  onDeleted,
}: {
  agencyId: string;
  task: Task | null;
  clients: Client[];
  members: AgencyMember[];
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientId, setClientId] = useState(task?.client_id ?? clients[0]?.id ?? "");
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
            <div className="prose prose-invert prose-sm max-w-none rounded-md border border-border bg-background px-3 py-2">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-1">
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

- [ ] **Step 6: Criar `src/components/tasks/TasksTable.tsx`**

Tabela com filtros por cliente e status, botão "Nova tarefa", e o modal de edição.

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
  clients,
  members,
}: {
  agencyId: string;
  initialTasks: Task[];
  clients: Client[];
  members: AgencyMember[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editing, setEditing] = useState<Task | null | "new">(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredTasks = tasks.filter((t) => {
    if (clientFilter !== "all" && t.client_id !== clientFilter) return false;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-sm font-semibold text-foreground-strong">Tarefas</h1>
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="grid grid-cols-[minmax(0,1fr)_140px_120px_110px_90px] gap-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Título</span>
          <span>Cliente</span>
          <span>Status</span>
          <span>Entrega</span>
          <span>Prioridade</span>
        </div>
        {filteredTasks.map((task) => (
          <TaskRow key={task.id} task={task} client={clientById.get(task.client_id)} onClick={() => setEditing(task)} />
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
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onDeleted={remove}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: Criar `src/app/(authed)/tasks/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasks } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const [tasks, clients, members] = await Promise.all([
    listTasks(supabase, membership.agency_id),
    listClients(supabase, membership.agency_id),
    listAgencyMembers(supabase, membership.agency_id),
  ]);

  const agencyName = (membership.agencies as unknown as { name: string })?.name ?? "Agência";

  return (
    <AppFrame active="tasks" pageLabel="Tarefas" agencyName={agencyName}>
      <TasksTable agencyId={membership.agency_id} initialTasks={tasks} clients={clients} members={members} />
    </AppFrame>
  );
}
```

- [ ] **Step 8: Verificação manual — fluxo completo**

```bash
npm run dev
```

1. Logar em `/login`.
2. Ir em `/clientes`, confirmar que o cliente criado na Task 6 aparece.
3. Ir em `/tasks`, clicar "Nova tarefa": preencher título, escolher o cliente, salvar. Confirmar que a tarefa aparece na tabela com o nome do cliente certo.
4. Clicar na tarefa criada, mudar status pra "Em andamento" e prioridade pra "Alta", salvar. Confirmar que a tabela reflete a mudança.
5. Testar os filtros por cliente e por status.
6. Abrir a tarefa de novo e excluir — confirmar que some da lista.
7. Deslogar (limpar cookies ou usar aba anônima), acessar `/tasks` direto pela URL — confirmar redirect pra `/login`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/tasks.ts src/components/tasks "src/app/(authed)/tasks"
git commit -m "feat: CRUD de tarefas vinculadas a clientes"
```

---

## Self-Review

**Cobertura da spec:**
- Reaproveitamento do dashboard_cliqueboost → Task 5 (Logo/estrutura de layout) e Tasks 6/7 (padrão de tabela) reconstroem os conceitos, justificado no topo do plano por que não são ports literais.
- Stack Next.js/TS/Tailwind v4/Supabase/Vercel → Task 1.
- Multi-tenant + RLS real com `is_agency_member` → Task 2.
- Supabase Auth via `@supabase/ssr`, middleware redirecionando pra `/login` → Tasks 3 e 4.
- Paleta fixa preto/branco → Task 1 (Step 3, tokens) aplicada em todos os componentes das tasks seguintes.
- Modelo de dados completo (`agencies`, `agency_members`, `clients`, `tasks`) → Task 2.
- `/tasks`: tabela, filtros por cliente/status, modal de criação/edição → Task 7.
- Modal de tarefa: título, descrição markdown, cliente, status, prioridade, responsável, data de entrega → Task 7 Step 5.
- `/clientes`: CRUD mínimo (nome, criar/editar/arquivar) → Task 6.
- Validação de formulário no client + mensagem genérica de erro → presente em todos os formulários (Tasks 4, 6, 7).
- Sem suite automatizada, verificação manual → todas as tasks terminam com passo de verificação manual em vez de testes automatizados, conforme Global Constraints.
- Criação de usuário manual via Supabase Studio → Task 2 Step 3.
- Itens fora de escopo (CRM, calendário, whitelabel, cadastro público, área do cliente final) → não têm task; corretamente ausentes.

**Placeholders:** nenhum "TBD"/"implementar depois" — todo step tem código completo.

**Consistência de tipos:** `Client`, `Task`, `TaskStatus`, `TaskPriority`, `AgencyMember` definidos uma vez em `lib/clients.ts`/`lib/tasks.ts` e reimportados com os mesmos nomes em todos os componentes que os consomem (`ClientRow`, `ClientsTable`, `ClientFormModal`, `TaskRow`, `TasksTable`, `TaskDetailModal`, as duas `page.tsx`). `AppFrame`/`Sidebar` usam o mesmo `ActiveKey` em Task 5 e nas páginas das Tasks 6/7.
