"use client";

import { useState } from "react";
import { Mail, Search, Settings, X } from "lucide-react";
import { useSidebarPreviewData } from "@/components/layout/SidebarPreviewData";
import { INITIAL_DMS } from "@/lib/mockChats";

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong">
      {initial}
    </span>
  );
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function NewDirectMessageModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const previewData = useSidebarPreviewData();
  const [query, setQuery] = useState("");

  if (!open) return null;

  // ponytail: diretório mockado (DMs existentes + membros da agência) — plugar busca real de
  // usuários/convites quando existir um endpoint de directory.
  const names = new Set<string>();
  const contacts: string[] = [];
  for (const dm of INITIAL_DMS) {
    if (!names.has(dm.name)) {
      names.add(dm.name);
      contacts.push(dm.name);
    }
  }
  for (const member of previewData?.members ?? []) {
    if (member.name && !names.has(member.name)) {
      names.add(member.name);
      contacts.push(member.name);
    }
  }

  const filtered = contacts.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  const emailToInvite = isEmailLike(query) ? query.trim() : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground-strong">New Direct Message</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or enter an email to invite them"
            className="h-11 w-full rounded-lg border border-border bg-transparent pl-9 pr-3 text-sm text-foreground outline-none focus:border-foreground-strong placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
          {emailToInvite && (
            <>
              <button
                type="button"
                onClick={() => onSelect(emailToInvite)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <Mail size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground">{emailToInvite}</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-muted-foreground hover:bg-muted"
              >
                <Settings size={15} className="shrink-0" />
                <span className="text-sm">Manage Addresses…</span>
              </button>
              <div className="my-1 border-t border-border" />
            </>
          )}
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
            >
              <Avatar name={name} />
              <span className="truncate text-sm text-foreground">{name}</span>
            </button>
          ))}
          {filtered.length === 0 && !emailToInvite && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhum contato encontrado. Digite um e-mail completo pra convidar alguém.
            </p>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Mail size={12} />
          Keep typing a full email to invite
        </p>
      </div>
    </div>
  );
}
