# Agrupamento e Saúde de Clientes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 4 campos novos ao cliente (nicho, plano/serviço, responsável, saúde), um controle de agrupamento na sidebar de `/clientes` (Nenhum/Plano/Responsável/Nicho) e um indicador visual de saúde por linha.

**Architecture:** Migration de banco adiciona colunas em `clients`. `src/lib/clients.ts` e `ClientFormModal` passam a ler/escrever esses campos. `ClientsSidebarPanel` (em `Sidebar.tsx`) ganha um `<select>` de agrupamento que reparte a lista de clientes ativos em grupos dinâmicos (por `service_type`, `assigned_to` ou `niche`), cada grupo uma seção colapsável reaproveitando `SectionCollapseHeader`. "Arquivados" continua fixo, fora do agrupamento.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), Tailwind, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-24-clientes-agrupamento-saude-design.md`

## Global Constraints

- Sem framework de teste — verificação é `npx tsc --noEmit`, `npm run lint`, checagem manual.
- "Responsável" mostra só `user_id.slice(0, 8)` como label — não existe tabela de nomes de usuário, e não estamos criando uma agora (mesmo padrão já usado em `src/components/tasks/TaskRow.tsx:41` e `TaskDetailModal.tsx:164`).
- `service_type` é um enum fechado: `'trafego' | 'conteudo' | 'chamadas' | '360' | 'outro'`. `health` é `'green' | 'yellow' | 'red'`, nunca nulo (default `'green'`).
- "Arquivados" nunca participa do agrupamento — é sempre a última seção, fixa, como já é hoje.
- Esta sessão **não tem acesso ao projeto Supabase real** (sem `supabase/config.toml`, sem service role key no `.env.local` — só `NEXT_PUBLIC_SUPABASE_ANON_KEY`). A Task 1 cria o arquivo de migration, mas **o usuário precisa aplicá-la manualmente** (SQL editor do Supabase, ou `supabase db push` depois de linkar o projeto) antes de testar as tasks seguintes contra dados reais.

## Review Focus

- Cliente sem nenhum dos 4 campos novos definidos (todos os clientes existentes hoje, antes da migration rodar): agrupar por Plano/Responsável/Nicho não pode quebrar — precisa cair num grupo "Sem [critério]".
- Trocar de agrupamento rapidamente (Nenhum → Plano → Responsável → Nicho → Nenhum): estado de `open` de cada grupo não pode vazar de um agrupamento pra outro (grupos são remontados, não devem herdar estado stale).
- Cliente arquivado nunca deve aparecer duplicado num grupo de "ativos" enquanto o agrupamento estiver ativo.
- `assigned_to` apontando pra um membro que foi removido da agência (`agency_members` deletado, `on delete set null`): a UI não pode quebrar mostrando `null`/`undefined.slice`.
- `createClient` chamado sem nenhum dos campos novos (fluxo de criação simples, só nome): não pode falhar — todos são opcionais na criação, `health` cai no default do banco.

---

## Task 1: Migration — colunas novas em `clients`

**Files:**
- Create: `supabase/migrations/0002_clients_grouping.sql`

**Interfaces:**
- Produces: colunas `niche text`, `service_type text` (check), `assigned_to uuid references agency_members(id)`, `health text not null default 'green'` (check) na tabela `clients`.

- [ ] **Step 1: Criar a migration**

```sql
-- supabase/migrations/0002_clients_grouping.sql

alter table clients
  add column niche text,
  add column service_type text
    check (service_type in ('trafego', 'conteudo', 'chamadas', '360', 'outro')),
  add column assigned_to uuid references agency_members(id) on delete set null,
  add column health text not null default 'green'
    check (health in ('green', 'yellow', 'red'));
```

- [ ] **Step 2: Avisar que a migration precisa ser aplicada manualmente**

Esta sessão não tem credenciais pra rodar a migration contra o banco real
(sem service role key, sem projeto Supabase linkado). No relatório final,
deixe explícito: o usuário precisa colar esse SQL no SQL editor do
Supabase (ou rodar `supabase db push` se linkar o projeto localmente)
antes das colunas existirem de verdade. As tasks seguintes (código
TypeScript) compilam e passam no lint independente disso, mas só
funcionam contra dados reais depois que a migration rodar.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_clients_grouping.sql
git commit -m "feat(db): adiciona nicho, plano, responsável e saúde em clients"
```

---

## Task 2: `src/lib/clients.ts` — tipo e funções

**Files:**
- Modify: `src/lib/clients.ts` (arquivo inteiro, 62 linhas)

**Interfaces:**
- Consumes: nada de outra task.
- Produces: `Client` type com os 4 campos novos; `createClient(supabase, agencyId, name, extra?)`; `updateClient(supabase, id, patch)` aceitando os campos novos no patch. Task 3, 4 e 5 consomem esse `Client` type e essas funções.

- [ ] **Step 1: Reescrever o arquivo**

Substitua o conteúdo inteiro de `src/lib/clients.ts` por:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceType = "trafego" | "conteudo" | "chamadas" | "360" | "outro";
export type ClientHealth = "green" | "yellow" | "red";

export type Client = {
  id: string;
  agency_id: string;
  name: string;
  archived: boolean;
  created_at: string;
  niche: string | null;
  service_type: ServiceType | null;
  assigned_to: string | null;
  health: ClientHealth;
};

export async function listClients(
  supabase: SupabaseClient,
  agencyId: string,
  options?: { includeArchived?: boolean },
): Promise<Client[]> {
  let query = supabase.from("clients").select("*").eq("agency_id", agencyId);
  if (!options?.includeArchived) {
    query = query.eq("archived", false);
  }
  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw error;
  return data as Client[];
}

export async function createClient(
  supabase: SupabaseClient,
  agencyId: string,
  name: string,
  extra?: Partial<Pick<Client, "niche" | "service_type" | "assigned_to" | "health">>,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ agency_id: agencyId, name, ...extra })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Client, "name" | "archived" | "niche" | "service_type" | "assigned_to" | "health">>,
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

export async function deleteClient(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
```

`extra` em `createClient` é opcional — chamar `createClient(supabase, agencyId, name)` sem o quarto argumento continua funcionando (fluxo de criação simples), `health` cai no default do banco (`'green'`) quando omitido.

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: erros esperados em `ClientFormModal.tsx` (ainda não lê os campos novos) — normal, corrigido na Task 3. Confirme que não há erro em `src/lib/clients.ts` em si.

- [ ] **Step 3: Commit**

```bash
git add src/lib/clients.ts
git commit -m "feat(clients): tipo Client e createClient/updateClient com nicho/plano/responsável/saúde"
```

---

## Task 3: `ClientFormModal` — campos novos + prop `members`

**Files:**
- Modify: `src/components/clientes/ClientFormModal.tsx` (arquivo inteiro, 88 linhas)

**Interfaces:**
- Consumes: `Client`, `ServiceType`, `ClientHealth` de `@/lib/clients` (Task 2); `AgencyMember` de `@/lib/tasks` (já existe: `{ id: string; user_id: string }`).
- Produces: `ClientFormModal({ agencyId, members, client, onClose, onSaved })` — nova prop obrigatória `members: AgencyMember[]`. Task 4 (ClientsGrid) e Task 5 (Sidebar) passam essa prop.

- [ ] **Step 1: Reescrever o arquivo**

```typescript
"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  createClient as createClientRow,
  updateClient,
  type Client,
  type ServiceType,
  type ClientHealth,
} from "@/lib/clients";
import type { AgencyMember } from "@/lib/tasks";

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  trafego: "Tráfego",
  conteudo: "Conteúdo",
  chamadas: "Chamadas",
  "360": "360",
  outro: "Outro",
};

export function ClientFormModal({
  agencyId,
  members,
  client,
  onClose,
  onSaved,
}: {
  agencyId: string;
  members: AgencyMember[];
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [archived, setArchived] = useState(client?.archived ?? false);
  const [niche, setNiche] = useState(client?.niche ?? "");
  const [serviceType, setServiceType] = useState<ServiceType | "">(client?.service_type ?? "");
  const [assignedTo, setAssignedTo] = useState(client?.assigned_to ?? "");
  const [health, setHealth] = useState<ClientHealth>(client?.health ?? "green");
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

    const extra = {
      niche: niche.trim() || null,
      service_type: serviceType || null,
      assigned_to: assignedTo || null,
      health,
    };

    const supabase = createBrowserSupabaseClient();
    try {
      const saved = client
        ? await updateClient(supabase, client.id, { name, archived, ...extra })
        : await createClientRow(supabase, agencyId, name, extra);
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

        <div className="space-y-1">
          <label htmlFor="client-niche" className="text-xs text-muted-foreground">
            Nicho (opcional)
          </label>
          <input
            id="client-niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: Estética, Jurídico…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="client-service-type" className="text-xs text-muted-foreground">
            Plano ou serviço (opcional)
          </label>
          <select
            id="client-service-type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as ServiceType | "")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="">Nenhum</option>
            {Object.entries(SERVICE_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="client-assigned-to" className="text-xs text-muted-foreground">
            Responsável (opcional)
          </label>
          <select
            id="client-assigned-to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="">Nenhum</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="client-health" className="text-xs text-muted-foreground">
            Saúde
          </label>
          <select
            id="client-health"
            value={health}
            onChange={(e) => setHealth(e.target.value as ClientHealth)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="green">Verde</option>
            <option value="yellow">Amarelo</option>
            <option value="red">Vermelho</option>
          </select>
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

Note que `assignedTo` (string vazia `""` pro estado "Nenhum") converte pra `null` só no momento de montar `extra` (`assignedTo || null`) — o valor do `<select>` em si precisa ser sempre string, nunca `null`, por isso o estado local usa `""` como "nenhum selecionado".

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: erros esperados em `ClientsGrid.tsx` e `Sidebar.tsx` (ainda não passam `members`) — normal, corrigido nas Tasks 4 e 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/clientes/ClientFormModal.tsx
git commit -m "feat(clientes): ClientFormModal ganha nicho/plano/responsável/saúde"
```

---

## Task 4: Thread `members` — `ClientsGrid` e `clientes/page.tsx`

**Files:**
- Modify: `src/components/clientes/ClientsGrid.tsx`
- Modify: `src/app/(authed)/clientes/page.tsx`

**Interfaces:**
- Consumes: `ClientFormModal` com prop `members` obrigatória (Task 3); `listAgencyMembers`/`AgencyMember` de `@/lib/tasks` (já existe).
- Produces: `ClientsGrid({ agencyId, members, initialClients })` — nova prop `members`.

- [ ] **Step 1: `ClientsGrid.tsx` — aceitar e repassar `members`**

Em `src/components/clientes/ClientsGrid.tsx`, troque a assinatura:

```typescript
export function ClientsGrid({ agencyId, initialClients }: { agencyId: string; initialClients: Client[] }) {
```

por:

```typescript
import type { AgencyMember } from "@/lib/tasks";

export function ClientsGrid({
  agencyId,
  members,
  initialClients,
}: {
  agencyId: string;
  members: AgencyMember[];
  initialClients: Client[];
}) {
```

(adicione o import `AgencyMember` junto aos imports existentes, não precisa ser exatamente nessa posição — só precisa existir no topo do arquivo).

E troque o uso de `<ClientFormModal ... />` no fim do arquivo:

```typescript
        <ClientFormModal
          agencyId={agencyId}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
```

por:

```typescript
        <ClientFormModal
          agencyId={agencyId}
          members={members}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
```

- [ ] **Step 2: `clientes/page.tsx` — buscar membros e passar adiante**

Em `src/app/(authed)/clientes/page.tsx`, troque:

```typescript
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
    <AppFrame context={{ type: "clients", agencyId, initialClients: allClients }} agencyName={agencyName}>
      <ClientsGrid agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
```

por:

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsGrid } from "@/components/clientes/ClientsGrid";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [allClients, members] = await Promise.all([
    listClients(supabase, agencyId, { includeArchived: true }),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "clients", agencyId, members, initialClients: allClients }} agencyName={agencyName}>
      <ClientsGrid agencyId={agencyId} members={members} initialClients={allClients} />
    </AppFrame>
  );
}
```

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: erro esperado em `Sidebar.tsx` (`SidebarContext` "clients" ainda não tem campo `members`, e `ClientsSidebarPanel` ainda não passa `members` pro modal) — normal, corrigido na Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/components/clientes/ClientsGrid.tsx "src/app/(authed)/clientes/page.tsx"
git commit -m "feat(clientes): busca e repassa membros da agência pro form de cliente"
```

---

## Task 5: Sidebar — agrupamento + saúde

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (múltiplos pontos)

**Interfaces:**
- Consumes: `Client`, `ServiceType`, `ClientHealth` de `@/lib/clients` (Task 2); `AgencyMember` de `@/lib/tasks`; `ClientFormModal` com prop `members` (Task 3).
- Produces: `SidebarContext` "clients" variant com `members: AgencyMember[]`; `ClientsSidebarPanel` com agrupamento; `ClientRow` com indicador de saúde.

- [ ] **Step 1: Importar `AgencyMember` e os novos tipos de `@/lib/clients`**

No topo de `Sidebar.tsx`, ache a linha:

```typescript
import { updateClient, deleteClient, type Client } from "@/lib/clients";
```

Troque por:

```typescript
import {
  updateClient,
  deleteClient,
  type Client,
  type ServiceType,
  type ClientHealth,
} from "@/lib/clients";
import type { AgencyMember } from "@/lib/tasks";
```

- [ ] **Step 2: `SidebarContext` — `members` na variante "clients"**

Ache:

```typescript
  | { type: "clients"; agencyId: string; initialClients: Client[] }
```

Troque por:

```typescript
  | { type: "clients"; agencyId: string; members: AgencyMember[]; initialClients: Client[] }
```

- [ ] **Step 3: `SidebarPanel` — repassar `members` pro `ClientsSidebarPanel`**

Ache (dentro de `export function SidebarPanel`):

```typescript
  if (context.type === "clients") {
    return (
      <ClientsSidebarPanel
        agencyId={context.agencyId}
        initialClients={context.initialClients}
      />
    );
  }
```

Troque por:

```typescript
  if (context.type === "clients") {
    return (
      <ClientsSidebarPanel
        agencyId={context.agencyId}
        members={context.members}
        initialClients={context.initialClients}
      />
    );
  }
```

- [ ] **Step 4: `ClientRow` — indicador de saúde**

Ache a função `ClientRow` inteira (começa em `function ClientRow({`). Troque o corpo do `<Link>` (mantendo tudo em volta igual):

```typescript
      <Link
        href={`/clientes/${client.id}/tarefas`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
        <ClientAvatar name={client.name} />
        <span className="truncate">{client.name}</span>
      </Link>
```

por:

```typescript
      <Link
        href={`/clientes/${client.id}/tarefas`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${HEALTH_COLOR[client.health]}`}
          aria-hidden="true"
        />
        <ClientAvatar name={client.name} />
        <span className="truncate">{client.name}</span>
      </Link>
```

Logo antes de `function ClientRow({`, adicione:

```typescript
const HEALTH_COLOR: Record<ClientHealth, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
};
```

- [ ] **Step 5: `ClientsSidebarPanel` — agrupamento**

Substitua a função `ClientsSidebarPanel` inteira (de `function ClientsSidebarPanel({` até o `}` que fecha a função, logo antes de `export function SidebarPanel`) por:

```typescript
type GroupBy = "none" | "service_type" | "assigned_to" | "niche";

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  trafego: "Tráfego",
  conteudo: "Conteúdo",
  chamadas: "Chamadas",
  "360": "360",
  outro: "Outro",
};

function groupLabel(groupBy: GroupBy, key: string, members: AgencyMember[]): string {
  if (groupBy === "service_type") {
    return key === "" ? "Sem plano/serviço" : SERVICE_TYPE_LABEL[key as ServiceType];
  }
  if (groupBy === "assigned_to") {
    if (key === "") return "Sem responsável";
    const member = members.find((m) => m.id === key);
    return member ? member.user_id.slice(0, 8) : "Sem responsável";
  }
  if (groupBy === "niche") {
    return key === "" ? "Sem nicho" : key;
  }
  return "";
}

function groupClients(clients: Client[], groupBy: GroupBy): { key: string; clients: Client[] }[] {
  if (groupBy === "none") return [{ key: "", clients }];
  const map = new Map<string, Client[]>();
  for (const client of clients) {
    const key =
      groupBy === "service_type"
        ? (client.service_type ?? "")
        : groupBy === "assigned_to"
          ? (client.assigned_to ?? "")
          : (client.niche ?? "");
    const bucket = map.get(key) ?? [];
    bucket.push(client);
    map.set(key, bucket);
  }
  const entries = Array.from(map.entries()).map(([key, clients]) => ({ key, clients }));
  // grupo "sem valor" (key === "") sempre por último
  entries.sort((a, b) => {
    if (a.key === "" && b.key !== "") return 1;
    if (b.key === "" && a.key !== "") return -1;
    return a.key.localeCompare(b.key);
  });
  return entries;
}

function ClientGroupSection({
  title,
  clients,
  members,
  busyId,
  onToggleArchived,
  onRename,
  onDelete,
}: {
  title: string;
  clients: Client[];
  members: AgencyMember[];
  busyId: string | null;
  onToggleArchived: (client: Client) => void;
  onRename: (client: Client) => void;
  onDelete: (client: Client) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onRenameSection={() => {}}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              busy={busyId === client.id}
              onToggleArchived={() => onToggleArchived(client)}
              onRename={() => onRename(client)}
              onDelete={() => onDelete(client)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

function ClientsSidebarPanel({
  agencyId,
  members,
  initialClients,
}: {
  agencyId: string;
  members: AgencyMember[];
  initialClients: Client[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null | "new">(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);
  const groups = groupClients(active, groupBy);

  function upsert(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      const next = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async function toggleArchived(client: Client) {
    setBusyId(client.id);
    try {
      const supabase = createBrowserSupabaseClient();
      const saved = await updateClient(supabase, client.id, { archived: !client.archived });
      upsert(saved);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Excluir "${client.name}"? Todas as tarefas desse cliente também serão excluídas. Essa ação não pode ser desfeita.`)) return;
    setBusyId(client.id);
    try {
      const supabase = createBrowserSupabaseClient();
      await deleteClient(supabase, client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader
          title="Clientes"
          onSearchOpen={() => setSearchOpen(true)}
          onAdd={() => setEditing("new")}
        />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-2 px-1">
          <select
            aria-label="Agrupar por"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="none">Agrupar por: Nenhum</option>
            <option value="service_type">Agrupar por: Plano ou serviço</option>
            <option value="assigned_to">Agrupar por: Responsável</option>
            <option value="niche">Agrupar por: Nicho</option>
          </select>
        </div>
        {groupBy === "none" ? (
          <nav className="flex flex-col gap-0.5">
            {active.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                busy={busyId === client.id}
                onToggleArchived={() => toggleArchived(client)}
                onRename={() => setEditing(client)}
                onDelete={() => handleDelete(client)}
              />
            ))}
          </nav>
        ) : (
          groups.map((group) => (
            <ClientGroupSection
              key={group.key}
              title={groupLabel(groupBy, group.key, members)}
              clients={group.clients}
              members={members}
              busyId={busyId}
              onToggleArchived={toggleArchived}
              onRename={setEditing}
              onDelete={handleDelete}
            />
          ))
        )}
        {archived.length > 0 && (
          <div className="mt-4">
            <SectionCollapseHeader
              title="Arquivados"
              open={archivedOpen}
              onToggleOpen={() => setArchivedOpen((v) => !v)}
              onRenameSection={() => {}}
            />
            {archivedOpen && (
              <nav className="flex flex-col gap-0.5">
                {archived.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    busy={busyId === client.id}
                    onToggleArchived={() => toggleArchived(client)}
                    onRename={() => setEditing(client)}
                    onDelete={() => handleDelete(client)}
                  />
                ))}
              </nav>
            )}
          </div>
        )}
      </div>
      {editing !== null && (
        <ClientFormModal
          agencyId={agencyId}
          members={members}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
      )}
    </div>
  );
}
```

Note: `ClientGroupSection` usa `useState(true)` local pro `open` de cada
grupo — como o React remonta esses componentes (chave = `group.key`)
sempre que `groups` muda de identidade (o que acontece ao trocar
`groupBy`, já que `groupClients` retorna um array novo), cada grupo
começa aberto de novo ao trocar de agrupamento. Isso resolve o "Review
Focus" sobre estado de `open` não vazar entre agrupamentos.

- [ ] **Step 6: Checar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run lint`
Expected: sem erros novos (os 2 warnings pré-existentes de `<img>` em
`IconPicker.tsx`/`SidebarTree.tsx` continuam, não são desta task).

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(clientes): agrupamento (plano/responsável/nicho) e indicador de saúde na sidebar"
```

---

## Task 6: Verificação manual

**Files:** nenhum arquivo novo — só validação.

- [ ] **Step 1: Confirmar que a migration da Task 1 foi aplicada**

Antes de testar, confirme com o usuário que ele já rodou o SQL da Task 1
contra o banco real (esta sessão não tem como fazer isso sozinha). Sem
isso, `createClient`/`updateClient` com os campos novos vão falhar contra
o banco de verdade (colunas não existem).

- [ ] **Step 2: Rodar lint**

Run: `npm run lint`
Expected: sem erros nos arquivos tocados.

- [ ] **Step 3: Subir o dev server e testar o fluxo**

Run: `npm run dev`

No browser, em `/clientes`:
1. Abrir "+" e criar um cliente definindo nicho, plano/serviço,
   responsável e saúde — confirmar que salva sem erro.
2. Editar um cliente existente e mudar a saúde — confirmar que o
   pontinho colorido na linha muda de cor.
3. Trocar "Agrupar por" entre as 4 opções — confirmar que os grupos
   aparecem corretamente, que um cliente sem nicho/plano/responsável cai
   no grupo "Sem [critério]", e que "Arquivados" continua fixo no fim em
   qualquer agrupamento.
4. Criar um cliente só com nome (sem preencher os campos opcionais) —
   confirmar que salva sem erro e cai no grupo "Sem [critério]" quando
   agrupado.

- [ ] **Step 4: Corrigir divergências antes de finalizar**

Se algo do Review Focus (cliente sem campo definido, troca rápida de
agrupamento, membro removido, criação simples) falhar, ajuste o código
das Tasks 2-5 e re-teste.

- [ ] **Step 5: Commit final (se houve ajustes)**

```bash
git add -A
git commit -m "fix(clientes): ajustes pós-verificação manual do agrupamento/saúde"
```

(Pule este passo se o Step 3 não exigiu nenhuma mudança.)
