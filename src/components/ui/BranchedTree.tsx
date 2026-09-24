"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// mesmo efeito visual (tronco + curva por linha + destaque verde até o item
// ativo) do SidebarTree.tsx (árvore de Spaces da Home), mas genérico —
// sem acoplamento com o domínio de Spaces (sem kind, sem modal de criar
// space, sem menu de 16 itens). Conteúdo de cada nó é fornecido pelo
// chamador (um Link já estilizado, um RowWithMenu, etc.).

export type BranchedTreeNode = {
  id: string;
  content: ReactNode;
  active?: boolean;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children?: BranchedTreeNode[];
};

const ROW_H = 36;
const INDENT = 20;
const TRUNK = 8;
const RADIUS = 7;
const LINE_W = 1.5;
const PAD = 4;
const LINE_COLOR = "var(--border)";
const ACCENT_COLOR = "#4ade80";

function hasActiveDescendant(node: BranchedTreeNode): boolean {
  if (node.active) return true;
  return node.children?.some(hasActiveDescendant) ?? false;
}

function BranchedRow({ node }: { node: BranchedTreeNode }) {
  const hasChildren = !!node.children?.length;
  const [open, setOpen] = useState(node.defaultOpen ?? false);
  const onPath = hasActiveDescendant(node);

  return (
    <div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={INDENT}
          height={ROW_H}
          aria-hidden="true"
        >
          <path
            d={`M ${TRUNK} ${ROW_H / 2 - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${TRUNK + RADIUS} ${ROW_H / 2} H ${INDENT - 6}`}
            fill="none"
            stroke={onPath ? ACCENT_COLOR : LINE_COLOR}
            strokeWidth={LINE_W}
            strokeLinecap="round"
            style={{ transition: "stroke 150ms ease" }}
          />
        </svg>
        <div
          className="group/branch-row relative flex items-center gap-1"
          style={{ paddingLeft: INDENT, minHeight: ROW_H }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md py-2 pr-1 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                {node.content}
              </span>
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <div className="min-w-0 flex-1">{node.content}</div>
          )}
          {node.actions && (
            <div className="hidden shrink-0 items-center gap-0.5 group-hover/branch-row:flex">
              {node.actions}
            </div>
          )}
        </div>
      </div>
      {hasChildren && open && <BranchedTree nodes={node.children!} />}
    </div>
  );
}

export function BranchedTree({ nodes }: { nodes: BranchedTreeNode[] }) {
  const activeIndex = nodes.findIndex(hasActiveDescendant);
  const rowEls = useRef<Record<number, HTMLDivElement | null>>({});
  const [accentHeight, setAccentHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (activeIndex < 0) return;
    const measure = () => {
      const el = rowEls.current[activeIndex];
      if (!el) return;
      setAccentHeight(el.offsetTop + el.offsetHeight / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const el = rowEls.current[activeIndex];
    if (el?.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [activeIndex, nodes]);

  const renderedAccentHeight = activeIndex >= 0 ? accentHeight : null;

  return (
    <div className="relative" style={{ marginLeft: INDENT - 4 }}>
      {/* tronco: top/bottom (não altura fixa) pra sempre esticar até o conteúdo real */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: TRUNK - LINE_W / 2, top: PAD, bottom: PAD + ROW_H / 2, width: LINE_W, background: LINE_COLOR }}
      />
      {renderedAccentHeight !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: TRUNK - LINE_W / 2,
            top: 0,
            height: renderedAccentHeight,
            width: LINE_W,
            background: ACCENT_COLOR,
            transition: "height 200ms ease",
          }}
        />
      )}
      <div className="flex flex-col" style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {nodes.map((node, i) => (
          <div
            key={node.id}
            ref={(el) => {
              rowEls.current[i] = el;
            }}
          >
            <BranchedRow node={node} />
          </div>
        ))}
      </div>
    </div>
  );
}
