"use client";

import { useState } from "react";
import { X } from "lucide-react";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export type DrilldownRow = { id: string; date: string; description: string; tag: string; amount: number };

export function DrilldownStatCard({
  icon,
  label,
  value,
  tone,
  title,
  rows,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "warning" | "positive";
  title: string;
  rows: DrilldownRow[];
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background-elevated p-4 text-left transition-colors hover:border-foreground/30"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            tone === "warning"
              ? "bg-red-400/10 text-red-400"
              : tone === "positive"
                ? "bg-green-400/10 text-green-400"
                : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className={`text-2xl font-semibold ${
              tone === "warning" ? "text-red-400" : tone === "positive" ? "text-green-400" : "text-foreground-strong"
            }`}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground-strong">{title}</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto">
              {sorted.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Nada por aqui ainda.</p>}
              {sorted.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[64px_minmax(0,1fr)_110px_90px] items-center gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0"
                >
                  <span className="text-xs text-muted-foreground">{formatDate(row.date)}</span>
                  <span className="truncate text-foreground">{row.description}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.tag}</span>
                  <span className="text-right text-xs text-foreground">{formatCurrency(row.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
