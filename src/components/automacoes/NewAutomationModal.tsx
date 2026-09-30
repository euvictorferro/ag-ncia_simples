"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function NewAutomationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; subtitle: string }) => void;
}) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground-strong">Nova automação</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Dê um nome e um subtítulo curto pra achar depois. Você monta os passos na próxima tela.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Relatório semanal de performance"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subtítulo (opcional)</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            placeholder="Manda o relatório de performance toda segunda pra equipe."
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => onCreate({ name: name.trim(), subtitle: subtitle.trim() })}
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
