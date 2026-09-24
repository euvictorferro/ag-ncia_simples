"use client";

import { useState } from "react";
import type { Client } from "@/lib/clients";

export type Ata = {
  id: string;
  title: string;
  date: string; // ISO date
  clientId?: string;
  clientName?: string;
};

export function CreateAtaModal({
  clients,
  ata,
  onClose,
  onSave,
}: {
  clients: Client[];
  ata: Ata | null;
  onClose: () => void;
  onSave: (ata: Ata) => void;
}) {
  const [title, setTitle] = useState(ata?.title ?? "");
  const [date, setDate] = useState(ata?.date.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [clientId, setClientId] = useState(ata?.clientId ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("Título e data são obrigatórios.");
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    onSave({
      id: ata?.id ?? crypto.randomUUID(),
      title: title.trim(),
      date: new Date(date).toISOString(),
      clientId: client?.id,
      clientName: client?.name,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">
          {ata ? "Editar ata" : "Nova ata"}
        </h2>

        <div className="space-y-1">
          <label htmlFor="ata-title" className="text-xs text-muted-foreground">
            Título
          </label>
          <input
            id="ata-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ata-date" className="text-xs text-muted-foreground">
            Data
          </label>
          <input
            id="ata-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ata-client" className="text-xs text-muted-foreground">
            Cliente (opcional)
          </label>
          <select
            id="ata-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="">Nenhum</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

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
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
