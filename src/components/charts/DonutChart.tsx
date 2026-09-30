const SIZE = 128;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  segments,
  formatValue = (v: number) => String(v),
}: {
  segments: { label: string; value: number; color: string }[];
  formatValue?: (value: number) => string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90 shrink-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        {total > 0 &&
          segments.map((s) => {
            if (s.value === 0) return null;
            const fraction = s.value / total;
            const dash = Math.max(fraction * CIRCUMFERENCE - 2, 0);
            const gap = CIRCUMFERENCE - dash;
            const offset = -cursor * CIRCUMFERENCE + 1;
            cursor += fraction;
            return (
              <circle
                key={s.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
      </svg>
      <div className="min-w-0 space-y-1.5">
        <p className="text-2xl font-semibold text-foreground-strong">{formatValue(total)}</p>
        <div className="space-y-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
              <span className="text-foreground">{formatValue(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
