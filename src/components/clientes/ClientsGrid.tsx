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
