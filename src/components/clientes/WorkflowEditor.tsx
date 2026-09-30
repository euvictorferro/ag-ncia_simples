"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, ChevronDown, Trash2, Pencil, History, Play, ZoomIn, ZoomOut, X, type LucideIcon } from "lucide-react";
import type { WorkflowDomain, WorkflowEdge, WorkflowLike, WorkflowNode, WorkflowNodeConfig, HandleTone } from "@/lib/workflowDomain";
import { NodeConfigPanel } from "@/components/clientes/NodeConfigPanel";

const NODE_WIDTH = 288;
const DEFAULT_CARD_HEIGHT = 78;
const HANDLE_GAP = 22;
const CHAIN_SPACING_Y = 150;
const SVG_ORIGIN = 3000;
const SVG_SIZE = 6000;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const MINIMAP_W = 176;
const MINIMAP_H = 112;
const MINIMAP_SCALE = 0.16;

const TONE_COLOR: Record<HandleTone, string> = {
  default: "var(--muted-foreground)",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
};

function AddNodeMenu<K extends string>({
  domain,
  hasNodes,
  onAdd,
}: {
  domain: WorkflowDomain<K>;
  hasNodes: boolean;
  onAdd: (kind: K) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
      >
        <Plus size={14} />
        Add node
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-96 w-72 overflow-y-auto rounded-md border border-border bg-background-elevated p-1 shadow-xl">
            {domain.definitions.map((def) => {
              const disabled = def.kind === domain.rootKind ? hasNodes : !hasNodes;
              const Icon = domain.icons[def.kind] as LucideIcon;
              return (
                <button
                  key={def.kind}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onAdd(def.kind);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm text-foreground">{def.label}</span>
                    <span className="block text-xs text-muted-foreground">{def.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function NodeCard<K extends string>({
  domain,
  node,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  domain: WorkflowDomain<K>;
  node: WorkflowNode<K>;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = domain.icons[node.kind] as LucideIcon;
  const summary = domain.summaryFor(node);

  return (
    <div
      data-node-card={node.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      className={`group relative flex w-72 cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border bg-background-elevated p-3 transition-colors ${
        selected ? "border-[var(--button)] ring-1 ring-[var(--button)]" : "border-border"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground-strong">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground-strong">
          {node.config._name || domain.definitionMap[node.kind].label}
        </p>
        <p className="truncate text-xs text-muted-foreground">{summary}</p>
      </div>
      <div className="hidden shrink-0 gap-1 group-hover:flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Editar nó"
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil size={14} />
        </button>
        {node.kind !== domain.rootKind && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Remover nó"
            className="text-muted-foreground hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function HandleDot({
  tone,
  label,
  onMouseDown,
}: {
  tone: HandleTone;
  label?: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onMouseDown={onMouseDown}
        aria-label={label ? `Conectar a partir de ${label}` : "Conectar"}
        className="h-2.5 w-2.5 cursor-grab rounded-full border border-background-elevated transition-transform hover:scale-125 active:cursor-grabbing"
        style={{ backgroundColor: TONE_COLOR[tone] }}
      />
      {label && (
        <span className="font-mono text-[10px]" style={{ color: TONE_COLOR[tone] }}>
          {label}
        </span>
      )}
    </div>
  );
}

type PendingConnection = { sourceId: string; handleId: string; canvasX: number; canvasY: number; screenX: number; screenY: number };
type ConnectingLine = { sourceId: string; handleId: string; fromX: number; fromY: number; toX: number; toY: number };
type RunLogEntry = {
  id: string;
  startedAt: string;
  status: "success" | "error";
  steps: { nodeId: string; label: string }[];
};

function usePannableCanvas() {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, textarea, select, [data-node-card]")) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const originX = pan.x;
    const originY = pan.y;
    setIsPanning(true);

    function handleMouseMove(ev: MouseEvent) {
      setPan({ x: originX + (ev.clientX - startX), y: originY + (ev.clientY - startY) });
    }
    function handleMouseUp() {
      setIsPanning(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return { pan, setPan, isPanning, handleMouseDown };
}

function EdgePath({ x1, y1, x2, y2, tone, dashed }: { x1: number; y1: number; x2: number; y2: number; tone: HandleTone; dashed?: boolean }) {
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={TONE_COLOR[tone]}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "4 4" : undefined}
      opacity={dashed ? 0.7 : 1}
    />
  );
}

function Minimap<K extends string>({
  nodes,
  heights,
  pan,
  zoom,
  viewportSize,
  onPanChange,
}: {
  nodes: WorkflowNode<K>[];
  heights: Record<string, number>;
  pan: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onPanChange: (pan: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (nodes.length === 0 || viewportSize.width === 0) return null;

  // ponytail: o minimapa é um espelho centrado na view atual (não um "caber tudo") —
  // por isso a escala acompanha o zoom de verdade: os blocos crescem/encolhem junto com o canvas.
  const scale = zoom * MINIMAP_SCALE;
  const centerWorldX = -pan.x / zoom;
  const centerWorldY = (viewportSize.height / 2 - pan.y) / zoom;

  const toMini = (x: number, y: number) => ({ x: (x - centerWorldX) * scale + MINIMAP_W / 2, y: (y - centerWorldY) * scale + MINIMAP_H / 2 });
  const fromMini = (x: number, y: number) => ({ x: (x - MINIMAP_W / 2) / scale + centerWorldX, y: (y - MINIMAP_H / 2) / scale + centerWorldY });

  function panForWorldCenter(worldX: number, worldY: number) {
    return { x: -worldX * zoom, y: viewportSize.height / 2 - worldY * zoom };
  }

  function jumpTo(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const world = fromMini(clientX - rect.left, clientY - rect.top);
    onPanChange(panForWorldCenter(world.x, world.y));
  }

  function handleBackgroundMouseDown(e: React.MouseEvent) {
    jumpTo(e.clientX, e.clientY);
    function handleMouseMove(ev: MouseEvent) {
      jumpTo(ev.clientX, ev.clientY);
    }
    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBackgroundMouseDown}
      className="absolute bottom-3 right-3 cursor-grab overflow-hidden rounded-md border border-border bg-background/90 active:cursor-grabbing"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    >
      {nodes.map((node) => {
        const topLeft = toMini(node.x - NODE_WIDTH / 2, node.y);
        const bottomRight = toMini(node.x + NODE_WIDTH / 2, node.y + (heights[node.id] ?? DEFAULT_CARD_HEIGHT));
        return (
          <div
            key={node.id}
            className="pointer-events-none absolute rounded-[2px] bg-muted-foreground/60"
            style={{
              left: topLeft.x,
              top: topLeft.y,
              width: Math.max(bottomRight.x - topLeft.x, 2),
              height: Math.max(bottomRight.y - topLeft.y, 2),
            }}
          />
        );
      })}
    </div>
  );
}

function HistoryPanel({ runs, onClose }: { runs: RunLogEntry[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-border bg-background-elevated">
        <div className="flex items-center justify-between border-b border-border p-4">
          <p className="text-sm font-semibold text-foreground-strong">History</p>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução ainda. Clique em Run pra testar o workflow.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs ${
                      run.status === "success" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {run.status === "success" ? "success" : "error"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(run.startedAt).toLocaleString("pt-BR")}</span>
                </div>
                <ol className="space-y-1">
                  {run.steps.map((step, i) => (
                    <li key={i} className="text-xs text-foreground">
                      {i + 1}. {step.label}
                    </li>
                  ))}
                </ol>
                {run.status === "error" && (
                  <p className="mt-2 text-xs text-red-400">O fluxo não chegou a um nó End — verifique as conexões.</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowEditor<K extends string>({
  workflow,
  domain,
  onCancel,
  onSave,
}: {
  workflow: WorkflowLike<K>;
  domain: WorkflowDomain<K>;
  onCancel: () => void;
  onSave: (nodes: WorkflowNode<K>[], edges: WorkflowEdge[], status: "draft" | "active") => void;
}) {
  const [nodes, setNodes] = useState<WorkflowNode<K>[]>(workflow.nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(workflow.edges);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<ConnectingLine | null>(null);
  const [pending, setPending] = useState<PendingConnection | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [runs, setRuns] = useState<RunLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const { pan, setPan, isPanning, handleMouseDown } = usePannableCanvas();
  const viewportRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  // ponytail: mede a altura real dos cards (e o tamanho do viewport, pro minimapa) depois do commit —
  // caso de uso legítimo de useLayoutEffect; roda em todo render de propósito, guardado por comparação.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const map: Record<string, number> = {};
    stackRef.current?.querySelectorAll<HTMLElement>("[data-node-card]").forEach((el) => {
      const id = el.getAttribute("data-node-card");
      if (id) map[id] = el.offsetHeight;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeights((prev) => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(map)]);
      for (const k of keys) if (prev[k] !== map[k]) {
        return map;
      }
      return prev;
    });
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect && (rect.width !== viewportSize.width || rect.height !== viewportSize.height)) {
      setViewportSize({ width: rect.width, height: rect.height });
    }
  });

  // zoom com a roda do mouse — precisa de listener nativo (não passivo) pra poder bloquear o scroll da página
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((z) => clamp(z + (e.deltaY > 0 ? 0.1 : -0.1), MIN_ZOOM, MAX_ZOOM));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Delete/Backspace remove os nós selecionados (exceto o nó raiz), desde que o foco não esteja num campo de texto
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (selectedIds.size === 0) return;
      deleteNodes(selectedIds);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  function cardHeight(id: string) {
    return heights[id] ?? DEFAULT_CARD_HEIGHT;
  }

  function insertNode(kind: K, x: number, y: number): WorkflowNode<K> {
    const node: WorkflowNode<K> = { id: createNodeId(), kind, config: domain.defaultConfigFor(kind), x, y };
    setNodes((prev) => [...prev, node]);
    return node;
  }

  function addNodeAtEnd(kind: K) {
    const last = nodes[nodes.length - 1];
    const x = last ? last.x : 0;
    const y = last ? last.y + CHAIN_SPACING_Y : 40;
    const node = insertNode(kind, x, y);
    if (last) {
      const handle = domain.handlesFor(last.kind, last.config)[0]?.id ?? "out";
      setEdges((prev) => [...prev, { id: `edge-${node.id}`, from: last.id, fromHandle: handle, to: node.id }]);
    }
    setEditingId(node.id);
  }

  function addNodeFromPending(kind: K) {
    if (!pending) return;
    const node = insertNode(kind, pending.canvasX, pending.canvasY);
    setEdges((prev) => [...prev, { id: `edge-${node.id}`, from: pending.sourceId, fromHandle: pending.handleId, to: node.id }]);
    setPending(null);
    setEditingId(node.id);
  }

  function updateNode(id: string, config: WorkflowNodeConfig) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, config } : n)));
    setEditingId(null);
  }

  function deleteNode(id: string) {
    deleteNodes(new Set([id]));
  }

  function deleteNodes(ids: Set<string>) {
    const removable = new Set([...ids].filter((id) => nodes.find((n) => n.id === id)?.kind !== domain.rootKind));
    if (removable.size === 0) return;
    setNodes((prev) => prev.filter((n) => !removable.has(n.id)));
    setEdges((prev) => prev.filter((e) => !removable.has(e.from) && !removable.has(e.to)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      removable.forEach((id) => next.delete(id));
      return next;
    });
    setEditingId((prev) => (prev && removable.has(prev) ? null : prev));
  }

  function selectNode(id: string, e: React.MouseEvent) {
    setSelectedIds((prev) => {
      if (e.metaKey || e.ctrlKey) {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      return new Set([id]);
    });
  }

  function canvasPointFromEvent(clientX: number, clientY: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - rect.width / 2 - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }

  function startConnection(sourceId: string, handleId: string, fromX: number, fromY: number) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      const startPoint = { fromX, fromY };
      const initial = canvasPointFromEvent(e.clientX, e.clientY);
      setConnecting({ sourceId, handleId, ...startPoint, toX: initial.x, toY: initial.y });

      function handleMouseMove(ev: MouseEvent) {
        const p = canvasPointFromEvent(ev.clientX, ev.clientY);
        setConnecting((prev) => (prev ? { ...prev, toX: p.x, toY: p.y } : prev));
      }
      function handleMouseUp(ev: MouseEvent) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        const p = canvasPointFromEvent(ev.clientX, ev.clientY);
        setConnecting(null);
        setPending({ sourceId, handleId, canvasX: p.x, canvasY: p.y, screenX: ev.clientX, screenY: ev.clientY });
      }
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };
  }

  function runWorkflow() {
    const trigger = nodes.find((n) => n.kind === domain.rootKind);
    if (!trigger) return;
    const steps: RunLogEntry["steps"] = [];
    const visited = new Set<string>();
    let current: WorkflowNode<K> | undefined = trigger;
    let reachedTerminal = false;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      steps.push({ nodeId: current.id, label: current.config._name || domain.definitionMap[current.kind].label });
      const handles = domain.handlesFor(current.kind, current.config);
      if (handles.length === 0) {
        reachedTerminal = true;
        break;
      }
      const currentId: string = current.id;
      const primaryHandle = handles[0]?.id;
      const edge: WorkflowEdge | undefined = edges.find((e) => e.from === currentId && e.fromHandle === primaryHandle);
      current = edge ? nodes.find((n) => n.id === edge.to) : undefined;
    }
    const status: RunLogEntry["status"] = reachedTerminal ? "success" : "error";
    setRuns((prev) => [{ id: `run-${Date.now()}`, startedAt: new Date().toISOString(), status, steps }, ...prev]);
    setShowHistory(true);
  }

  const editingNode = nodes.find((n) => n.id === editingId) ?? null;
  const deletableSelectedCount = [...selectedIds].filter((id) => nodes.find((n) => n.id === id)?.kind !== domain.rootKind).length;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground-strong">{workflow.name}</h1>
          {workflow.subtitle && <p className="text-xs text-muted-foreground">{workflow.subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(nodes, edges, "draft")}
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
          >
            Save as draft
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-3">
        <AddNodeMenu domain={domain} hasNodes={nodes.length > 0} onAdd={addNodeAtEnd} />
        <button type="button" disabled className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground opacity-60">
          Auto-arrange
        </button>
        <button
          type="button"
          onClick={runWorkflow}
          disabled={!nodes.some((n) => n.kind === domain.rootKind)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-40"
        >
          <Play size={14} />
          Run
        </button>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground"
        >
          <History size={14} />
          History
          {runs.length > 0 && <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{runs.length}</span>}
        </button>
        {deletableSelectedCount > 0 && (
          <button
            type="button"
            onClick={() => deleteNodes(selectedIds)}
            className="flex items-center gap-1.5 rounded-md border border-red-400/40 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10"
          >
            <Trash2 size={14} />
            Delete ({deletableSelectedCount})
          </button>
        )}
      </div>

      <div
        ref={viewportRef}
        onMouseDown={(e) => {
          handleMouseDown(e);
          if (!(e.target as HTMLElement).closest("[data-node-card]")) setSelectedIds(new Set());
        }}
        className={`relative flex-1 select-none overflow-hidden rounded-[var(--radius-card)] border border-border ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground-strong">Click Add node above to begin</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Comece com um Trigger, depois adicione mais passos. Arraste o canvas pra navegar, ou puxe uma linha do
              ponto embaixo de um nó pra conectar o próximo passo.
            </p>
          </div>
        ) : (
          <div
            ref={stackRef}
            className="absolute left-1/2 top-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            <svg
              className="pointer-events-none absolute"
              style={{ left: -SVG_ORIGIN, top: 0, width: SVG_SIZE, height: SVG_SIZE, overflow: "visible" }}
            >
              {edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;
                const sourceHandles = domain.handlesFor(source.kind, source.config);
                const idx = sourceHandles.findIndex((h) => h.id === edge.fromHandle);
                const tone = sourceHandles[idx]?.tone ?? "default";
                const offset = handleOffsetX(sourceHandles.length, Math.max(idx, 0));
                return (
                  <EdgePath
                    key={edge.id}
                    x1={source.x + offset + SVG_ORIGIN}
                    y1={source.y + cardHeight(source.id) + HANDLE_GAP}
                    x2={target.x + SVG_ORIGIN}
                    y2={target.y}
                    tone={tone}
                  />
                );
              })}
              {connecting && (
                <EdgePath
                  x1={connecting.fromX + SVG_ORIGIN}
                  y1={connecting.fromY}
                  x2={connecting.toX + SVG_ORIGIN}
                  y2={connecting.toY}
                  tone="default"
                  dashed
                />
              )}
            </svg>

            {nodes.map((node) => {
              const handles = domain.handlesFor(node.kind, node.config);
              return (
                <div key={node.id} className="absolute" style={{ left: node.x - NODE_WIDTH / 2, top: node.y }}>
                  <NodeCard
                    domain={domain}
                    node={node}
                    selected={selectedIds.has(node.id)}
                    onSelect={(e) => selectNode(node.id, e)}
                    onEdit={() => setEditingId(node.id)}
                    onDelete={() => deleteNode(node.id)}
                  />
                  {handles.length > 0 && (
                    <div className="mt-1.5 flex justify-center gap-6">
                      {handles.map((h, i) => (
                        <HandleDot
                          key={h.id}
                          tone={h.tone}
                          label={h.label}
                          onMouseDown={startConnection(
                            node.id,
                            h.id,
                            node.x + handleOffsetX(handles.length, i),
                            node.y + cardHeight(node.id) + HANDLE_GAP,
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded-md border border-border bg-background-elevated">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => clamp(z + 0.1, MIN_ZOOM, MAX_ZOOM))}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ZoomIn size={14} />
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => clamp(z - 0.1, MIN_ZOOM, MAX_ZOOM))}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ZoomOut size={14} />
          </button>
        </div>

        {nodes.length > 0 && (
          <Minimap nodes={nodes} heights={heights} pan={pan} zoom={zoom} viewportSize={viewportSize} onPanChange={setPan} />
        )}
      </div>

      {pending && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPending(null)} />
          <div
            className="fixed z-40 max-h-96 w-72 overflow-y-auto rounded-md border border-border bg-background-elevated p-1 shadow-2xl"
            style={{ left: pending.screenX, top: pending.screenY }}
          >
            <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add node</p>
            {domain.definitions.filter((def) => def.kind !== domain.rootKind).map((def) => {
              const Icon = domain.icons[def.kind] as LucideIcon;
              return (
                <button
                  key={def.kind}
                  type="button"
                  onClick={() => addNodeFromPending(def.kind)}
                  className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm text-foreground">{def.label}</span>
                    <span className="block text-xs text-muted-foreground">{def.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {editingNode && (
        <NodeConfigPanel
          node={editingNode}
          domain={domain}
          onClose={() => setEditingId(null)}
          onSave={(config) => updateNode(editingNode.id, config)}
          onDelete={() => deleteNode(editingNode.id)}
        />
      )}

      {showHistory && <HistoryPanel runs={runs} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function handleOffsetX(count: number, index: number): number {
  if (count <= 1) return 0;
  const spacing = 64;
  const start = -(spacing * (count - 1)) / 2;
  return start + index * spacing;
}
