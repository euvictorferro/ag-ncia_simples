import type { ClientHealth } from "@/lib/clients";

export const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
export const STATUS_GOOD = "#0ca30c";
export const STATUS_WARNING = "#fab219";
export const STATUS_CRITICAL = "#d03b3b";

export function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function normalizeHealth(health: ClientHealth): ClientHealth {
  return health === "yellow" || health === "red" ? health : "green";
}

export function healthColor(health: ClientHealth): string {
  const map: Record<ClientHealth, string> = { green: STATUS_GOOD, yellow: STATUS_WARNING, red: STATUS_CRITICAL };
  return map[normalizeHealth(health)];
}

const STAT_TONE_ICON: Record<"warning" | "positive", string> = {
  warning: "bg-red-400/10 text-red-400",
  positive: "bg-green-400/10 text-green-400",
};

const STAT_TONE_VALUE: Record<"warning" | "positive", string> = {
  warning: "text-red-400",
  positive: "text-green-400",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "warning" | "positive";
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background-elevated p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          tone ? STAT_TONE_ICON[tone] : "bg-muted text-foreground"
        }`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-semibold ${tone ? STAT_TONE_VALUE[tone] : "text-foreground-strong"}`}>{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background-elevated p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function RankedList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: { label: string; value: number }[];
  emptyLabel: string;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value).filter((i) => i.value > 0);
  const max = sorted[0]?.value ?? 0;

  return (
    <ChartCard title={title}>
      <div className="space-y-2.5">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
        {sorted.map(({ label, value }, index) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground">{label}</span>
              <span className="text-muted-foreground">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${max === 0 ? 0 : (value / max) * 100}%`,
                  backgroundColor: CATEGORICAL[index % CATEGORICAL.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
