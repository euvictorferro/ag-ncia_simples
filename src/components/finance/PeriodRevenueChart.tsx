"use client";

import { useMemo, useState } from "react";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import type { Expense, Payment } from "@/lib/mockFinance";

const PERIODS = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "14d", label: "14 dias", days: 14 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "12m", label: "12 meses", days: 365 },
] as const;

function formatCurrencyFull(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function PeriodRevenueChart({ payments, expenses }: { payments: Payment[]; expenses: Expense[] }) {
  const [periodId, setPeriodId] = useState<(typeof PERIODS)[number]["id"]>("30d");
  const period = PERIODS.find((p) => p.id === periodId)!;

  const { revenuePoints, expensePoints, totalRevenue, totalExpenses } = useMemo(() => {
    const now = new Date();
    const isMonthly = period.id === "12m";
    const bucketCount = isMonthly ? 12 : period.days;

    const bucketKey = (d: Date) => (isMonthly ? `${d.getFullYear()}-${d.getMonth()}` : d.toISOString().slice(0, 10));
    const bucketLabel = (d: Date) =>
      isMonthly
        ? d.toLocaleDateString("pt-BR", { month: "short" })
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

    const buckets: { key: string; label: string }[] = [];
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = isMonthly
        ? new Date(now.getFullYear(), now.getMonth() - i, 1)
        : new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      buckets.push({ key: bucketKey(d), label: bucketLabel(d) });
    }

    const revenueByBucket = new Map<string, number>();
    const expenseByBucket = new Map<string, number>();
    const cutoff = new Date(now.getTime() - (isMonthly ? 365 : period.days) * 24 * 60 * 60 * 1000);

    for (const payment of payments) {
      const d = new Date(payment.date);
      if (d < cutoff) continue;
      const key = bucketKey(d);
      revenueByBucket.set(key, (revenueByBucket.get(key) ?? 0) + payment.amount);
    }
    for (const expense of expenses) {
      const d = new Date(expense.date);
      if (d < cutoff) continue;
      const key = bucketKey(d);
      expenseByBucket.set(key, (expenseByBucket.get(key) ?? 0) + expense.amount);
    }

    const revenuePoints = buckets.map((b) => ({ label: b.label, value: revenueByBucket.get(b.key) ?? 0 }));
    const expensePoints = buckets.map((b) => ({ label: b.label, value: expenseByBucket.get(b.key) ?? 0 }));

    return {
      revenuePoints,
      expensePoints,
      totalRevenue: revenuePoints.reduce((sum, p) => sum + p.value, 0),
      totalExpenses: expensePoints.reduce((sum, p) => sum + p.value, 0),
    };
  }, [payments, expenses, period]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            Receita: <span className="font-semibold text-foreground">{formatCurrencyFull(totalRevenue)}</span>
          </span>
          <span className="text-muted-foreground">
            Despesas: <span className="font-semibold text-foreground">{formatCurrencyFull(totalExpenses)}</span>
          </span>
          <span className="text-muted-foreground">
            Líquido:{" "}
            <span className={`font-semibold ${totalRevenue - totalExpenses >= 0 ? "text-foreground" : "text-red-400"}`}>
              {formatCurrencyFull(totalRevenue - totalExpenses)}
            </span>
          </span>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodId(p.id)}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                p.id === periodId ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <MultiLineChart
        series={[
          { id: "revenue", label: "Receita", color: "#3987e5", points: revenuePoints },
          { id: "expenses", label: "Despesas", color: "#d03b3b", points: expensePoints },
        ]}
      />
    </div>
  );
}
