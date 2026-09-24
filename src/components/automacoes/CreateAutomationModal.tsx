"use client";

import { useState } from "react";

export function CreateAutomationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    onCreate(name.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">Nova automação</h2>

        <div className="space-y-1">
          <label htmlFor="automation-name" className="text-xs text-muted-foreground">
            Nome
          </label>
          <input
            id="automation-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
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
            Criar
          </button>
        </div>
      </form>
    </div>
  );
}
