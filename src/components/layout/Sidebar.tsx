"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/clients";
import { ClientFormModal } from "@/components/clientes/ClientFormModal";

export type SidebarContext =
  | { type: "agency"; active: "overview" | "tasks" | "clients" }
  | { type: "client"; clientId: string; clientName: string; active: "tasks" };

function navClass(isActive: boolean): string {
  return `truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

function AgencyPanel({
  active,
  clients,
  agencyId,
}: {
  active: "overview" | "tasks" | "clients";
  clients: Client[];
  agencyId: string;
}) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

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

      <button type="button" onClick={() => setShowCreateModal(true)} className={`${navClass(false)} text-left`}>
        + Novo cliente
      </button>

      <Link href="/clientes" className={navClass(active === "clients")}>
        Gerenciar clientes
      </Link>

      {showCreateModal && (
        <ClientFormModal
          agencyId={agencyId}
          client={null}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            router.refresh();
          }}
        />
      )}
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
  agencyId,
}: {
  context: SidebarContext;
  clients: Client[];
  agencyName: string;
  agencyId: string;
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
          <AgencyPanel active={context.active} clients={clients} agencyId={agencyId} />
        ) : (
          <ClientPanel clientId={context.clientId} clientName={context.clientName} active={context.active} />
        )}
      </aside>
    </div>
  );
}
