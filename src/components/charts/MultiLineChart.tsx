"use client";

import { useEffect, useRef, useState } from "react";

const HEIGHT = 220;
const PAD_X = 12;
const PAD_TOP = 24;
const PAD_BOTTOM = 28;

export type LineSeries = {
  id: string;
  label: string;
  color: string;
  points: { label: string; value: number }[];
};

export function MultiLineChart({
  series,
  formatValue = formatCurrency,
}: {
  series: LineSeries[];
  formatValue?: (value: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setWidth(measured);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pointCount = series[0]?.points.length ?? 0;
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const max = Math.max(...allValues, 1) * 1.15;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = (width - PAD_X * 2) / Math.max(pointCount - 1, 1);

  const seriesCoords = series.map((s) => ({
    ...s,
    coords: s.points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: PAD_TOP + (1 - p.value / max) * plotHeight,
      ...p,
    })),
  }));

  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const labelEvery = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div>
      <div ref={containerRef} className="w-full">
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="overflow-visible">
          <line
            x1={PAD_X}
            y1={HEIGHT - PAD_BOTTOM}
            x2={width - PAD_X}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--border)"
            strokeWidth={1}
          />
          {labels.map(
            (label, i) =>
              i % labelEvery === 0 && (
                <text
                  key={label + i}
                  x={PAD_X + i * stepX}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  {label}
                </text>
              ),
          )}
          {seriesCoords.map((s) => {
            const path = s.coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
            const last = s.coords[s.coords.length - 1];
            return (
              <g key={s.id}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {s.coords.map((c) => (
                  <circle key={c.label} cx={c.x} cy={c.y} r={8} fill="transparent">
                    <title>{`${s.label} · ${c.label}: ${formatValue(c.value)}`}</title>
                  </circle>
                ))}
                {last && (
                  <>
                    <circle cx={last.x} cy={last.y} r={4} fill={s.color} stroke="var(--background-elevated)" strokeWidth={2} />
                    <text x={last.x} y={last.y - 10} textAnchor="end" fontSize={11} fill="var(--foreground)">
                      {formatValue(last.value)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${Math.round(value)}`;
}
