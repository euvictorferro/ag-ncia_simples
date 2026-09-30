"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

type WidgetCtxValue = {
  hidden: string[];
  toggle: (id: string) => void;
  ready: boolean;
};

const WidgetCtx = createContext<WidgetCtxValue | null>(null);

export function WidgetBoardProvider({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHidden(JSON.parse(raw));
    } catch {
      // ponytail: preferência de layout é só conveniência local, ignora falha de leitura
    }
    setReady(true);
  }, [storageKey]);

  function toggle(id: string) {
    setHidden((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ponytail: idem — não bloqueia a UI se localStorage falhar
      }
      return next;
    });
  }

  return <WidgetCtx.Provider value={{ hidden, toggle, ready }}>{children}</WidgetCtx.Provider>;
}

function useWidgetCtx() {
  const ctx = useContext(WidgetCtx);
  if (!ctx) throw new Error("Widget/WidgetToggleButton precisam estar dentro de WidgetBoardProvider");
  return ctx;
}

export function Widget({ id, children }: { id: string; children: React.ReactNode }) {
  const { hidden, ready } = useWidgetCtx();
  if (ready && hidden.includes(id)) return null;
  return <>{children}</>;
}

export function WidgetToggleButton({ options }: { options: { id: string; label: string }[] }) {
  const { hidden, toggle } = useWidgetCtx();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={panelRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <SlidersHorizontal size={13} />
        Personalizar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-background-elevated p-1.5 shadow-lg">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Blocos visíveis no dashboard
          </p>
          {options.map((option) => {
            const isHidden = hidden.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggle(option.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isHidden ? "border-border" : "border-foreground bg-foreground text-background"
                  }`}
                >
                  {!isHidden && <Check size={11} />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
