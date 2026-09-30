"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { WorkflowPlatform } from "@/lib/mockWorkflows";

const MOCK_ACCOUNTS: { value: string; label: string; platform: WorkflowPlatform; accountLabel: string }[] = [
  { value: "ig-victor", label: "Instagram · Victor Ferro", platform: "instagram", accountLabel: "Victor Ferro" },
  { value: "wa-atendimento", label: "WhatsApp · Atendimento", platform: "whatsapp", accountLabel: "Atendimento" },
];

export function NewWorkflowModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; subtitle: string; platform: WorkflowPlatform; accountLabel: string }) => void;
}) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [account, setAccount] = useState("");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground-strong">New workflow</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Dê um nome e um subtítulo curto pra achar depois. Você monta os passos na próxima tela.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer support triage"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subtitle (optional)</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            placeholder="Routes inbound DMs by intent and replies with the right canned answer."
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
          <p className="text-[11px] text-muted-foreground">Aparece na lista de workflows pra ajudar a identificar.</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Account</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="">Select an account</option>
            {MOCK_ACCOUNTS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            O workflow roda nessa conta conectada. Não dá pra trocar depois sem criar um novo.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || !account}
            onClick={() => {
              const selected = MOCK_ACCOUNTS.find((a) => a.value === account);
              if (!selected) return;
              onCreate({
                name: name.trim(),
                subtitle: subtitle.trim(),
                platform: selected.platform,
                accountLabel: selected.accountLabel,
              });
            }}
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
