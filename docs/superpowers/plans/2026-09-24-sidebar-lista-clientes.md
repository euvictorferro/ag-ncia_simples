# Sidebar de Navegação entre Clientes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar, dentro da sidebar da página `/clientes`, uma lista de clientes (ativos + seção "Arquivados" colapsável) para navegar até um cliente específico, com ações de criar/renomear/arquivar/excluir.

**Architecture:** A lista de clientes já existe como dado real no Supabase (`src/lib/clients.ts`). A página `/clientes` já busca todos os clientes (`listClients(..., { includeArchived: true })`) para a `ClientsGrid` central; vamos passar essa mesma lista pro `SidebarContext` (`type: "clients"`) e renderizar dentro de `ClientsSidebarPanel` em `Sidebar.tsx`, reaproveitando os padrões visuais já existentes lá (`SectionCollapseHeader`, `useFlyout`/`FlyoutPanel`) e o `ClientFormModal` já existente (criar/editar/arquivar).

**Tech Stack:** Next.js App Router (server component busca dados, client component `"use client"` interage), Supabase (`@supabase/ssr`), Tailwind, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-24-sidebar-lista-clientes-design.md`

## Global Constraints

- Sem novo framework de teste — o projeto só tem `lint`/`build` (`package.json`); verificação é `npx tsc --noEmit`, `npm run lint` e checagem manual no browser (`npm run dev`), como já é o padrão do resto do projeto.
- Sem migration de banco (decisão do usuário): avatar é sempre inicial do nome, nenhuma coluna nova em `clients`.
- Ordenação sempre alfabética (nunca drag-and-drop) — vem de `listClients`, que já ordena por `name` ascendente.
- Nenhuma mudança em `ClientPanel` (abas internas do cliente) nem nas 6 páginas `clientes/[id]/*/page.tsx` (elas usam `context.type === "client"`, não `"clients"`).

## Review Focus

- Lista vazia (agência sem nenhum cliente ainda): a sidebar não pode quebrar — precisa mostrar algo sensato (nem que seja nada, mas sem erro de runtime tipo `.map` de undefined).
- Cliente sem nome renderiza inicial vazia: `getInitial("")` não pode lançar exceção nem mostrar `undefined`.
- Excluir cliente que está aberto no momento (usuário na página `/clientes/[id]/tarefas` e apaga o próprio cliente pela sidebar): a lista da sidebar atualiza local, mas a página de conteúdo não trava — como as páginas de cliente buscam o cliente direto do Supabase a cada load, isso já é seguro; só precisa confirmar que a UI da sidebar não deixa a lista em estado inconsistente (item removido do `useState` local imediatamente).
- Arquivar/renomear/excluir disparados em sequência rápida (duplo clique) não podem gerar duas chamadas Supabase pra mesma linha — desabilitar o botão/menu durante a operação em andamento.
- Nome de cliente com espaços/maiúsculas na busca de inicial (`" joão "` → deve extrair "J", não espaço ou string vazia).

---

## Task 1: `deleteClient` em `src/lib/clients.ts`

**Files:**
- Modify: `src/lib/clients.ts`

**Interfaces:**
- Produces: `deleteClient(supabase: SupabaseClient, id: string): Promise<void>`

- [ ] **Step 1: Implementar `deleteClient`**

Adicione ao final de `src/lib/clients.ts`:

```typescript
export async function deleteClient(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem novos erros relacionados a `src/lib/clients.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/clients.ts
git commit -m "feat(clients): adiciona deleteClient"
```

---

## Task 2: `SidebarContext` de "clients" carrega `agencyId` + lista de clientes

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:61-71` (tipo `SidebarContext`)
- Modify: `src/app/(authed)/clientes/page.tsx`

**Interfaces:**
- Consumes: `Client` de `@/lib/clients` (`{ id, agency_id, name, archived, created_at }`)
- Produces: `SidebarContext` com o novo shape de `{ type: "clients"; agencyId: string; initialClients: Client[] }`, consumido pela Task 3.

- [ ] **Step 1: Atualizar o tipo `SidebarContext`**

Em `src/components/layout/Sidebar.tsx`, adicione o import do tipo `Client` logo após os imports existentes (perto da linha 49-50):

```typescript
import type { Client } from "@/lib/clients";
```

Troque a linha do `SidebarContext`:

```typescript
  | { type: "clients" }
```

por:

```typescript
  | { type: "clients"; agencyId: string; initialClients: Client[] }
```

- [ ] **Step 2: Passar os dados reais em `clientes/page.tsx`**

Em `src/app/(authed)/clientes/page.tsx`, troque:

```typescript
    <AppFrame context={{ type: "clients" }} agencyName={agencyName}>
```

por:

```typescript
    <AppFrame context={{ type: "clients", agencyId, initialClients: allClients }} agencyName={agencyName}>
```

(`agencyId` e `allClients` já existem nesse arquivo — `allClients` é o retorno de `listClients(supabase, agencyId, { includeArchived: true })`.)

- [ ] **Step 3: Checar tipos**

Run: `npx tsc --noEmit`
Expected: erro esperado em `Sidebar.tsx` na função `SidebarPanel`/`ClientsSidebarPanel` (ainda não existe/não lê os novos campos) — isso é normal, será resolvido na Task 3. Confirme que `clientes/page.tsx` não tem erro.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx "src/app/(authed)/clientes/page.tsx"
git commit -m "feat(sidebar): SidebarContext de clients carrega agencyId e lista real de clientes"
```

---

## Task 3: `SidebarPanelHeader` ganha `onAdd`, e placeholder de `ClientsSidebarPanel` usa o título

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (`SidebarPanelHeader`, ~linha 971-1022)

**Interfaces:**
- Produces: `SidebarPanelHeader({ title, onSearchOpen, onAdd? }: { title: string; onSearchOpen: () => void; onAdd?: () => void })` — botão "+" chama `onAdd` quando definido.

- [ ] **Step 1: Adicionar prop `onAdd` opcional**

Em `SidebarPanelHeader`, troque a assinatura:

```typescript
function SidebarPanelHeader({
  title,
  onSearchOpen,
}: {
  title: string;
  onSearchOpen: () => void;
}) {
```

por:

```typescript
function SidebarPanelHeader({
  title,
  onSearchOpen,
  onAdd,
}: {
  title: string;
  onSearchOpen: () => void;
  onAdd?: () => void;
}) {
```

E troque o botão "+" (que hoje não tem `onClick`):

```typescript
        <button
          type="button"
          aria-label="Adicionar"
          className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-1 text-foreground-strong transition-colors hover:bg-border"
        >
          <Plus size={14} />
          <ChevronDown size={12} />
        </button>
```

por:

```typescript
        <button
          type="button"
          aria-label="Adicionar"
          onClick={onAdd}
          className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-1 text-foreground-strong transition-colors hover:bg-border"
        >
          <Plus size={14} />
          <ChevronDown size={12} />
        </button>
```

`HomeSidebarPanel` continua chamando `SidebarPanelHeader` sem passar `onAdd` — nenhuma mudança de comportamento lá (o `onClick={undefined}` equivale a não ter handler).

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): SidebarPanelHeader aceita onAdd opcional no botao +"
```

---

## Task 4: Lista de clientes ativos + linha com menu (arquivar/renomear/excluir)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `Client` (Task 2), `SectionCollapseHeader`/`useFlyout`/`FlyoutPanel`/`ROW_CLASS` (já existentes no arquivo), `ClientFormModal` de `@/components/clientes/ClientFormModal`, `updateClient`/`deleteClient` de `@/lib/clients` (Task 1), `createBrowserSupabaseClient` de `@/lib/supabase/client`.
- Produces: `ClientsSidebarPanel({ agencyId, initialClients }: { agencyId: string; initialClients: Client[] })`, exportado indiretamente via `SidebarPanel`. Estado de clientes fica local nesse componente (`useState<Client[]>`).

- [ ] **Step 1: Importar as novas dependências no topo de `Sidebar.tsx`**

Adicione junto aos imports existentes (perto da linha 48-50):

```typescript
import { ClientFormModal } from "@/components/clientes/ClientFormModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { updateClient, deleteClient, type Client } from "@/lib/clients";
```

(o `import type { Client } from "@/lib/clients"` da Task 2 vira redundante — remova-o e deixe só essa linha combinada acima.)

No bloco de import de `lucide-react` (linha ~18-42), adicione `ArchiveRestore` à lista (junto de `Archive`, que já está importado):

```typescript
  Archive,
  ArchiveRestore,
```

- [ ] **Step 2: Criar helper de inicial e o componente `ClientRow`**

Adicione logo antes de `function ClientsSidebarPanel` (vamos criar esse componente no Step 3 — pode colar este bloco imediatamente acima de onde `ClientsSidebarPanel` vai ficar, perto da função `ClientPanel` existente em `Sidebar.tsx`):

```typescript
function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

function ClientAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong">
      {getInitial(name)}
    </span>
  );
}

function ClientRow({
  client,
  busy,
  onToggleArchived,
  onRename,
  onDelete,
}: {
  client: Client;
  busy: boolean;
  onToggleArchived: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const menu = useFlyout();

  return (
    <div className="group/row relative flex items-center gap-1 rounded-md pr-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Link
        href={`/clientes/${client.id}/tarefas`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
        <ClientAvatar name={client.name} />
        <span className="truncate">{client.name}</span>
      </Link>
      <div className="hidden shrink-0 items-center group-hover/row:flex">
        <button
          type="button"
          aria-label={`Mais opções de ${client.name}`}
          onClick={menu.toggleAt}
          disabled={busy}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground disabled:opacity-50"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      {menu.position && (
        <FlyoutPanel position={menu.position} onClose={menu.close} width={200}>
          <button
            type="button"
            onClick={() => {
              onToggleArchived();
              menu.close();
            }}
            disabled={busy}
            className={ROW_CLASS}
          >
            {client.archived ? (
              <>
                <ArchiveRestore size={14} /> Desarquivar
              </>
            ) : (
              <>
                <Archive size={14} /> Arquivar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onRename();
              menu.close();
            }}
            disabled={busy}
            className={ROW_CLASS}
          >
            <Pencil size={14} /> Renomear
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              menu.close();
            }}
            disabled={busy}
            className={`${ROW_CLASS} text-red-400`}
          >
            <Trash2 size={14} /> Excluir
          </button>
        </FlyoutPanel>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Criar `ClientsSidebarPanel`**

Adicione logo abaixo do `ClientRow` (ou em qualquer ponto antes de `SidebarPanel`, que vamos editar na Task 5):

```typescript
function ClientsSidebarPanel({
  agencyId,
  initialClients,
}: {
  agencyId: string;
  initialClients: Client[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null | "new">(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);

  function upsert(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      return exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client].sort((a, b) => a.name.localeCompare(b.name));
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
    if (!window.confirm(`Excluir "${client.name}"? Essa ação não pode ser desfeita.`)) return;
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
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
      )}
    </div>
  );
}
```

`SectionCollapseHeader` tem `onRenameSection` obrigatório na assinatura atual — para "Arquivados" essa ação não faz sentido, por isso passamos um no-op (`() => {}`). O botão "Renomear seção" do menu desse header vai chamar esse no-op; não faz nada de errado (não há `onAdd`, então o botão `+` daquele header nem aparece).

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros novos em `Sidebar.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): lista de clientes ativos/arquivados com arquivar/renomear/excluir"
```

---

## Task 5: Ligar `ClientsSidebarPanel` no `SidebarPanel`

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (`SidebarPanel`, ~linha 1070-1086)

**Interfaces:**
- Consumes: `ClientsSidebarPanel` (Task 4).

- [ ] **Step 1: Adicionar o branch de `"clients"`**

Em `SidebarPanel`, troque:

```typescript
export function SidebarPanel({ context }: { context: SidebarContext }) {
  if (context.type === "home") {
    return <HomeSidebarPanel active={context.active} />;
  }
  if (context.type === "client") {
```

por:

```typescript
export function SidebarPanel({ context }: { context: SidebarContext }) {
  if (context.type === "home") {
    return <HomeSidebarPanel active={context.active} />;
  }
  if (context.type === "clients") {
    return (
      <ClientsSidebarPanel
        agencyId={context.agencyId}
        initialClients={context.initialClients}
      />
    );
  }
  if (context.type === "client") {
```

(Se a Task 1 do brainstorming anterior já tiver criado um `ClientsSidebarPanel` vazio nesse ponto — não é o caso aqui, pois esta é a primeira vez que o componente é criado, na Task 4 acima.)

- [ ] **Step 2: Checar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): conecta ClientsSidebarPanel em SidebarPanel"
```

---

## Task 6: Verificação manual end-to-end + lint

**Files:** nenhum arquivo novo — só validação.

- [ ] **Step 1: Rodar lint**

Run: `npm run lint`
Expected: sem erros nos arquivos tocados.

- [ ] **Step 2: Subir o dev server**

Run: `npm run dev`

- [ ] **Step 3: Testar o fluxo completo no browser**

Acesse `/clientes` e confirme, na sidebar (não no grid central):
1. Lista de clientes ativos aparece em ordem alfabética, cada linha com avatar (inicial) + nome.
2. Clicar em "+" no header da sidebar abre o `ClientFormModal` em modo criação; salvar um cliente novo faz ele aparecer na posição alfabética correta na lista ativa.
3. Passar o mouse numa linha mostra o botão `···`; abrir o menu mostra Arquivar/Renomear/Excluir.
4. "Arquivar" move o cliente para a seção "Arquivados" (colapsada por padrão — clicar no cabeçalho expande) e o botão vira "Desarquivar" nele.
5. "Renomear" abre o `ClientFormModal` em modo edição com o nome atual preenchido; salvar atualiza o nome na lista sem reload.
6. "Excluir" pede confirmação (`window.confirm`); confirmando, o cliente some da lista imediatamente e some do banco (dá pra confirmar recarregando a página).
7. Clicar no nome do cliente navega para `/clientes/[id]/tarefas` e a sidebar troca para o `ClientPanel` de abas (Dashboard/Anúncios/Orgânico/Financeiro/Tarefas/Conteúdos) — comportamento que já existia, não deve ter mudado.
8. Com zero clientes na agência (se der pra testar/limpar o banco de teste), a sidebar não quebra — só não mostra nenhuma linha.

- [ ] **Step 4: Corrigir quaisquer divergências encontradas no Step 3 antes de seguir**

Se algo do Review Focus (lista vazia, nome com espaços, duplo clique gerando chamada dupla) falhar, ajuste o código das Tasks 1-5 e re-teste antes de considerar a feature pronta.

- [ ] **Step 5: Commit final (se houve ajustes)**

```bash
git add -A
git commit -m "fix(sidebar): ajustes pós-verificacao manual da lista de clientes"
```

(Pule este passo se o Step 3 não exigiu nenhuma mudança.)
