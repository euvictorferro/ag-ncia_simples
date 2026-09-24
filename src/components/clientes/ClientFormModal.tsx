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
