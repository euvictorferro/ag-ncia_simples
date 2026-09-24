import type { ReactNode } from "react";

// mesmo visual (linha curva + tronco) do SidebarTree.tsx (árvore de Spaces da Home),
// mas para uma lista simples de uma linha só, sem recursão/expand-collapse.
const ROW_H = 36;
const INDENT = 20;
const TRUNK = 8;
const RADIUS = 7;
const LINE_W = 1.5;
const PAD = 4;
const LINE_COLOR = "var(--border)";

export function BranchedRows({ children }: { children: ReactNode[] }) {
  return (
    <div className="relative" style={{ marginLeft: INDENT - 4 }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: TRUNK - LINE_W / 2, top: PAD, bottom: PAD + ROW_H / 2, width: LINE_W, background: LINE_COLOR }}
      />
      <div className="flex flex-col" style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {children.map((child, i) => (
          <div key={i} className="relative">
            <svg className="pointer-events-none absolute left-0 top-0" width={INDENT} height={ROW_H} aria-hidden="true">
              <path
                d={`M ${TRUNK} ${ROW_H / 2 - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${TRUNK + RADIUS} ${ROW_H / 2} H ${INDENT - 6}`}
                fill="none"
                stroke={LINE_COLOR}
                strokeWidth={LINE_W}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ paddingLeft: INDENT }}>{child}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
