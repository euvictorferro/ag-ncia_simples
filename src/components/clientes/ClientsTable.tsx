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
