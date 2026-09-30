const CHART_HEIGHT = 120;

export type StackedColumnItem = {
  label: string;
  todo: number;
  doing: number;
  done: number;
  overdue: number;
};

const SEGMENTS: { key: keyof Omit<StackedColumnItem, "label">; color: string; label: string }[] = [
  { key: "overdue", color: "#d03b3b", label: "Atrasada" },
  { key: "todo", color: "#3987e5", label: "A fazer" },
  { key: "doing", color: "#c98500", label: "Em andamento" },
  { key: "done", color: "#008300", label: "Concluída" },
];

export function StackedColumnChart({ items }: { items: StackedColumnItem[] }) {
  const totals = items.map((i) => i.todo + i.doing + i.done + i.overdue);
  const max = Math.max(...totals, 1);
  const sorted = [...items].sort(
    (a, b) => b.todo + b.doing + b.done + b.overdue - (a.todo + a.doing + a.done + a.overdue),
  );

  return (
    <div>
      <div className="flex items-end gap-4 overflow-x-auto pb-1">
        {sorted.map((item) => {
          const total = item.todo + item.doing + item.done + item.overdue;
          const visible = SEGMENTS.filter((s) => item[s.key] > 0);
          return (
            <div key={item.label} className="flex w-12 shrink-0 flex-col items-center gap-1.5">
              <span className="text-xs text-foreground">{total}</span>
              <div className="flex w-full flex-col justify-end" style={{ height: CHART_HEIGHT }}>
                {visible.map((segment, index) => (
                  <div
                    key={segment.key}
                    className={index === 0 ? "w-full rounded-t-[4px]" : "w-full"}
                    style={{
                      height: Math.max((item[segment.key] / max) * CHART_HEIGHT, 3),
                      backgroundColor: segment.color,
                      marginBottom: index === visible.length - 1 ? 0 : 2,
                    }}
                  />
                ))}
              </div>
              <span className="max-w-12 truncate text-[10px] text-muted-foreground" title={item.label}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENTS.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </div>
        ))}
      </div>
    </div>
  );
}
