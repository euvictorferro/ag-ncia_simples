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
