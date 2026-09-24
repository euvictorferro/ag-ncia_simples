"use client";

import { useState } from "react";

export type DocumentStatus = "assinado" | "pendente";

export type DocRecord = {
  id: string;
  title: string;
  status: DocumentStatus;
};

export function CreateDocumentModal({
  document,
  onClose,
  onSave,
}: {
  document: DocRecord | null;
  onClose: () => void;
  onSave: (document: DocRecord) => void;
}) {
  const [title, setTitle] = useState(document?.title ?? "");
  const [status, setStatus] = useState<DocumentStatus>(document?.status ?? "pendente");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    onSave({ id: document?.id ?? crypto.randomUUID(), title: title.trim(), status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">
          {document ? "Editar documento" : "Novo documento"}
        </h2>

        <div className="space-y-1">
          <label htmlFor="document-title" className="text-xs text-muted-foreground">
            Nome
          </label>
          <input
            id="document-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="document-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="document-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as DocumentStatus)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="pendente">Pendente</option>
            <option value="assinado">Assinado</option>
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
