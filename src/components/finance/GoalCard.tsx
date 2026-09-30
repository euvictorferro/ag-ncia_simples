"use client";

import { useEffect, useState } from "react";
import { Pencil, Target } from "lucide-react";

const STORAGE_KEY = "finance-goal-lucro";
const DEFAULT_GOAL = 50000;

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function GoalCard({ currentProfit, ticketMedio }: { currentProfit: number; ticketMedio: number }) {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(DEFAULT_GOAL));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setGoal(Number(raw));
        setDraft(raw);
      }
    } catch {
      // ponytail: preferência local, ignora falha de leitura
    }
  }, []);

  function save() {
    const value = Math.max(0, Math.round(Number(draft) || 0));
    setGoal(value);
    setEditing(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ponytail: idem
    }
  }

  const gap = Math.max(0, goal - currentProfit);
  const progress = goal === 0 ? 0 : Math.min(100, Math.round((currentProfit / goal) * 100));
  const contractsNeeded = ticketMedio > 0 ? Math.ceil(gap / ticketMedio) : null;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background-elevated p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Target size={13} />
          Meta de lucro do mês
        </h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground" aria-label="Editar meta">
            <Pencil size={13} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-32 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-foreground"
            autoFocus
          />
          <button onClick={save} className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90">
            Salvar
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold text-foreground-strong">{formatCurrency(goal)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${currentProfit >= goal ? "bg-green-400" : "bg-foreground/40"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {currentProfit >= goal
              ? "Meta batida esse mês! 🎉"
              : contractsNeeded === null
                ? `Faltam ${formatCurrency(gap)} para bater a meta.`
                : `Faltam ${formatCurrency(gap)} — cerca de ${contractsNeeded} contrato${contractsNeeded === 1 ? "" : "s"} novo${contractsNeeded === 1 ? "" : "s"} no ticket médio atual.`}
          </p>
        </>
      )}
    </div>
  );
}
