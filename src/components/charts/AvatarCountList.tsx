const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarCountList({
  items,
  emptyLabel,
}: {
  items: { label: string; value: number }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((i) => i.value), 1);

  return (
    <div className="flex flex-wrap gap-4">
      {sorted.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: CATEGORICAL[index % CATEGORICAL.length] }}
          >
            {initials(item.label)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-foreground">{item.label}</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: CATEGORICAL[index % CATEGORICAL.length],
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
