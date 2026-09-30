"use client";

import { useState } from "react";
import { CalendarClock, Check } from "lucide-react";

export type RenewalRow = {
  clientId: string;
  clientName: string;
  daysUntil: number;
  monthlyValue: number;
  contractMonths: number;
};

export function RenewalList({ items }: { items: RenewalRow[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum contrato vencendo nos próximos 30 dias. 🎉</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
      {items.map((item) => {
        const isSent = sent.has(item.clientId);
        const urgent = item.daysUntil <= 7;
        return (
          <div
            key={item.clientId}
            className="flex items-center gap-3 border-t border-border px-4 py-3 text-sm first:border-t-0"
          >
            <CalendarClock size={16} className={urgent ? "shrink-0 text-red-400" : "shrink-0 text-muted-foreground"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-foreground">{item.clientName}</p>
              <p className="text-xs text-muted-foreground">
                Vence em {item.daysUntil} {item.daysUntil === 1 ? "dia" : "dias"} · contrato de {item.contractMonths}{" "}
                {item.contractMonths === 1 ? "mês" : "meses"}
              </p>
            </div>
            <button
              onClick={() => setSent((prev) => new Set(prev).add(item.clientId))}
              disabled={isSent}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSent ? "cursor-default bg-muted text-muted-foreground" : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {isSent ? (
                <span className="flex items-center gap-1">
                  <Check size={12} /> Enviada
                </span>
              ) : (
                "Enviar renovação"
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
