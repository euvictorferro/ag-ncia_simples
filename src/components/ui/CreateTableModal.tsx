"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { IconPickerButton, type NodeIcon } from "@/components/ui/IconPicker";
import type { SidebarTreeNodeView } from "@/components/ui/SidebarTree";

export type SidebarNodeCreateRequest = { kind: "folder" } | { kind: "table"; view: SidebarTreeNodeView };

const COPY: Record<string, { title: string; description: string; placeholder: string; defaultIcon: string }> = {
  folder: {
    title: "Create a Folder",
    description: "Group Lists, Docs & more dentro dessa pasta.",
    placeholder: "e.g. Conteúdo, Tráfego, Financeiro",
    defaultIcon: "folder",
  },
  list: {
    title: "Create a List",
    description: "Track tasks, projects, people & more em formato de lista.",
    placeholder: "e.g. Sprint atual, Onboarding de clientes",
    defaultIcon: "list-checks",
  },
  kanban: {
    title: "Create a Kanban board",
    description: "Board com colunas por status — arraste os cards entre etapas.",
    placeholder: "e.g. Pipeline de vendas, Produção de conteúdo",
    defaultIcon: "kanban",
  },
};

function copyKeyFor(request: SidebarNodeCreateRequest): keyof typeof COPY {
  return request.kind === "folder" ? "folder" : request.view;
}

export function CreateSidebarNodeModal({
  request,
  onClose,
  onCreate,
}: {
  request: SidebarNodeCreateRequest | null;
  onClose: () => void;
  onCreate: (data: { name: string; icon: NodeIcon }) => void;
}) {
  const [icon, setIcon] = useState<NodeIcon | null>(null);
  const [name, setName] = useState("");

  if (!request) return null;
  const copy = COPY[copyKeyFor(request)];

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), icon: icon ?? { type: "icon", value: copy.defaultIcon } });
    setIcon(null);
    setName("");
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

        <h2 className="text-lg font-semibold text-foreground-strong">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-foreground-strong">Icon & name</p>
          <div className="flex items-center gap-3">
            <IconPickerButton icon={icon} onChange={setIcon} />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={copy.placeholder}
              className="h-12 flex-1 rounded-lg border border-foreground-strong/30 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
