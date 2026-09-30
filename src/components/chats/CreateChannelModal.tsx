"use client";

import { useState } from "react";
import { LogIn, X } from "lucide-react";
import { Switch } from "@/components/ui/Switch";

export function CreateChannelModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; isPrivate: boolean; withList: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [withList, setWithList] = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), isPrivate, withList });
    setName("");
    setIsPrivate(false);
    setWithList(false);
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

        <h2 className="text-lg font-semibold text-foreground-strong">Create Channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chat Channels are where conversations happen. Use a name that is easy to find and understand.</p>

        <div className="mt-5 space-y-1">
          <label className="text-sm text-foreground-strong">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Ideas"
            className="h-11 w-full rounded-lg border border-foreground-strong/30 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground-strong">Make Private</p>
            <p className="text-xs text-muted-foreground">Only you and invited members have access</p>
          </div>
          <Switch checked={isPrivate} onChange={setIsPrivate} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground-strong">Add a List</p>
            <p className="text-xs text-muted-foreground">Attach a List to manage tasks and work</p>
          </div>
          <Switch checked={withList} onChange={setWithList} />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogIn size={14} />
            Import
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-lg bg-button px-4 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
