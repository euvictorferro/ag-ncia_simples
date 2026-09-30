"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/Switch";

export function CreateNamedModal({
  open,
  title,
  description,
  placeholder,
  submitLabel = "Create",
  privateToggleLabel,
  onClose,
  onCreate,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  /** Quando definido, mostra um toggle "privado" e o resultado vem com isPrivate preenchido. */
  privateToggleLabel?: string;
  onClose: () => void;
  onCreate: (data: { name: string; isPrivate: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), isPrivate });
    setName("");
    setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-foreground-strong">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}

        <div className="mt-5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={placeholder}
            className="h-12 w-full rounded-lg border border-foreground-strong/30 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {privateToggleLabel && (
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground-strong">{privateToggleLabel}</p>
            <Switch checked={isPrivate} onChange={setIsPrivate} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-lg bg-button px-4 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
