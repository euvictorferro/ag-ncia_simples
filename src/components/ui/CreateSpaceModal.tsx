"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { IconPickerButton, type NodeIcon } from "@/components/ui/IconPicker";
import { Switch } from "@/components/ui/Switch";

export function CreateSpaceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; icon: NodeIcon; description: string; isPrivate: boolean }) => void;
}) {
  const [icon, setIcon] = useState<NodeIcon | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), icon: icon ?? { type: "icon", value: "folder" }, description: description.trim(), isPrivate });
    setIcon(null);
    setName("");
    setDescription("");
    setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-foreground-strong">Create a Space</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A Space represents teams, departments, or groups, each with its own pastas e tabelas.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-foreground-strong">Icon & name</p>
          <div className="flex items-center gap-3">
            <IconPickerButton icon={icon} onChange={setIcon} />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Marketing, Engenharia, RH"
              className="h-12 flex-1 rounded-lg border border-foreground-strong/30 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-foreground-strong">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground-strong">Make Private</p>
            <p className="text-xs text-muted-foreground">Only you and invited members have access</p>
          </div>
          <Switch checked={isPrivate} onChange={setIsPrivate} />
        </div>

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
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
