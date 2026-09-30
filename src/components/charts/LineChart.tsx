"use client";

import { useEffect, useRef, useState } from "react";

const HEIGHT = 180;
const PAD_X = 12;
const PAD_TOP = 24;
const PAD_BOTTOM = 24;

export function LineChart({
  points,
  color = "#3987e5",
}: {
  points: { label: string; value: number }[];
  color?: string;
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

  const max = Math.max(...points.map((p) => p.value), 1) * 1.2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = (width - PAD_X * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + (1 - p.value / max) * plotHeight,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${coords[0].x} ${HEIGHT - PAD_BOTTOM} Z`;
  const last = coords[coords.length - 1];
  const labelEvery = Math.ceil(coords.length / 7);

  return (
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
        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <g key={c.label}>
            {i % labelEvery === 0 && (
              <text x={c.x} y={HEIGHT - 6} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
                {c.label}
              </text>
            )}
            <circle cx={c.x} cy={c.y} r={8} fill="transparent">
              <title>{`${c.label}: ${c.value}`}</title>
            </circle>
          </g>
        ))}
        <circle cx={last.x} cy={last.y} r={4} fill={color} stroke="var(--background-elevated)" strokeWidth={2} />
        <text x={last.x} y={last.y - 12} textAnchor="end" fontSize={12} fill="var(--foreground)">
          {last.value}
        </text>
      </svg>
    </div>
  );
}
