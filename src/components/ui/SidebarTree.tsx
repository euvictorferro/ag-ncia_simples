"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Star,
  Pencil,
  Link2,
  Droplet,
  Bot,
  SquarePen,
  Target,
  LogIn,
  Wand2,
  FolderOutput,
  Copy,
  Archive,
  Trash2,
  Table2,
  ListChecks,
  Folder,
  CircleDot,
  FileText,
  LayoutDashboard,
  PenTool,
  ClipboardCheck,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import type { NodeIcon } from "@/components/ui/IconPicker";
import { useFlyout, FlyoutPanel } from "@/components/ui/SidebarFlyout";

export type SidebarTreeNodeKind = "space" | "folder" | "table";

export type SidebarTreeNode = {
  id: string;
  label: string;
  kind: SidebarTreeNodeKind;
  icon?: NodeIcon | IconSvgElement;
  children?: SidebarTreeNode[];
};

const ROW_H = 30;
const INDENT = 20;
const TRUNK = 8;
const RADIUS = 7;
const LINE_W = 1.5;
const PAD = 4;
const LINE_COLOR = "var(--border)";
const ACCENT_COLOR = "#4ade80";

function isNodeIcon(icon: NodeIcon | IconSvgElement | undefined): icon is NodeIcon {
  return !!icon && !Array.isArray(icon);
}

function NodeIconView({ icon, kind }: { icon?: NodeIcon | IconSvgElement; kind: SidebarTreeNodeKind }) {
  if (isNodeIcon(icon)) {
    return icon.type === "image" ? (
      <img src={icon.value} alt="" className="h-3.5 w-3.5 shrink-0 rounded object-cover" />
    ) : (
      <span className="shrink-0 text-sm leading-none">{icon.value}</span>
    );
  }
  if (icon) {
    return <HugeiconsIcon icon={icon} size={14} className="shrink-0" />;
  }
  if (kind === "table") return <Table2 size={14} className="shrink-0" />;
  return <span className="shrink-0 text-sm leading-none">📁</span>;
}

function newId() {
  return crypto.randomUUID();
}

function mapTree(nodes: SidebarTreeNode[], fn: (node: SidebarTreeNode) => SidebarTreeNode): SidebarTreeNode[] {
  return nodes.map((node) => fn(node.children ? { ...node, children: mapTree(node.children, fn) } : node));
}

function addChild(nodes: SidebarTreeNode[], parentId: string, child: SidebarTreeNode): SidebarTreeNode[] {
  return mapTree(nodes, (node) => (node.id === parentId ? { ...node, children: [...(node.children ?? []), child] } : node));
}

function renameNode(nodes: SidebarTreeNode[], id: string, label: string): SidebarTreeNode[] {
  return mapTree(nodes, (node) => (node.id === id ? { ...node, label } : node));
}

function removeNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children ? { ...node, children: removeNode(node.children, id) } : node));
}

function cloneWithNewIds(node: SidebarTreeNode): SidebarTreeNode {
  return { ...node, id: newId(), children: node.children?.map(cloneWithNewIds) };
}

function duplicateNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode[] {
  const result: SidebarTreeNode[] = [];
  for (const node of nodes) {
    const next = node.children ? { ...node, children: duplicateNode(node.children, id) } : node;
    result.push(next);
    if (node.id === id) {
      result.push({ ...cloneWithNewIds(node), label: `${node.label} (cópia)` });
    }
  }
  return result;
}

function findPath(nodes: SidebarTreeNode[], id: string, trail: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [...trail, node.id];
    if (node.children) {
      const found = findPath(node.children, id, [...trail, node.id]);
      if (found) return found;
    }
  }
  return null;
}

function collectContainerIds(nodes: SidebarTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children?.length) {
      ids.push(node.id, ...collectContainerIds(node.children));
    }
  }
  return ids;
}

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted";

function MenuItem({
  icon: Icon,
  label,
  trailing,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  trailing?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`${MENU_ITEM_CLASS} ${danger ? "text-red-400" : ""}`}>
      <Icon size={15} />
      <span className="flex-1 truncate">{label}</span>
      {trailing && <ChevronRight size={13} className="text-muted-foreground" />}
    </button>
  );
}

function TreeNodeMenu({
  node,
  position,
  onClose,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
}: {
  node: SidebarTreeNode;
  position: { top: number; left: number };
  onClose: () => void;
  onAdd: (parentId: string, kind: "folder" | "table") => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  // ponytail: itens sem onClick são decorativos (replicam o menu do ClickUp visualmente) — plugar quando essas features existirem
  const noop = () => onClose();
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <FlyoutPanel position={position} onClose={onClose} width={240}>
      <MenuItem icon={Star} label="Favorite" trailing onClick={noop} />
      <MenuItem icon={Pencil} label="Renomear" onClick={act(() => onRename(node.id))} />
      <MenuItem
        icon={Link2}
        label="Copy link"
        onClick={act(() => navigator.clipboard?.writeText(`https://app.local/spaces/${node.id}`))}
      />
      <div className="my-1 border-t border-border" />
      <MenuItem
        icon={Plus}
        label="Create new"
        trailing
        onClick={node.kind === "table" ? noop : act(() => onAdd(node.id, "table"))}
      />
      <MenuItem icon={Droplet} label="Folder color" trailing onClick={noop} />
      <MenuItem icon={Bot} label="Automations" onClick={noop} />
      <MenuItem icon={SquarePen} label="Custom Fields" onClick={noop} />
      <MenuItem icon={Target} label="Task statuses" onClick={noop} />
      <MenuItem icon={MoreHorizontal} label="More" trailing onClick={noop} />
      <div className="my-1 border-t border-border" />
      <MenuItem icon={LogIn} label="Imports" trailing onClick={noop} />
      <MenuItem icon={Wand2} label="Templates" trailing onClick={noop} />
      <div className="my-1 border-t border-border" />
      <MenuItem icon={FolderOutput} label="Move" trailing onClick={noop} />
      <MenuItem icon={Copy} label="Duplicate" onClick={act(() => onDuplicate(node.id))} />
      <MenuItem icon={Archive} label="Archive" onClick={noop} />
      <MenuItem icon={Trash2} label="Delete" danger onClick={act(() => onDelete(node.id))} />
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-button py-2 text-center text-sm font-medium text-button-foreground"
      >
        Sharing & Permissions
      </button>
    </FlyoutPanel>
  );
}

type CreateOption = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  desc: string;
  badge?: string;
  create: "folder" | "table" | null;
};

const CREATE_PRIMARY: Record<SidebarTreeNodeKind, CreateOption[]> = {
  space: [
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: "table" },
    { icon: Folder, label: "Folder", desc: "Group Lists, Docs & more", create: "folder" },
  ],
  folder: [
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: "table" },
    { icon: Folder, label: "Subfolder", badge: "New", desc: "Group Lists, Docs & more", create: "folder" },
  ],
  // ponytail: Task/List aqui ainda não têm modelo próprio (precisa de tasks reais) — por enquanto só fecham o menu
  table: [
    { icon: CircleDot, label: "Task", desc: "Create individual tasks to manage your work", create: null },
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: null },
  ],
};

const CREATE_SECONDARY: { icon: React.ComponentType<{ size?: number }>; label: string; bg: string }[] = [
  { icon: FileText, label: "Doc", bg: "bg-blue-500" },
  { icon: LayoutDashboard, label: "Dashboard", bg: "bg-fuchsia-500" },
  { icon: PenTool, label: "Whiteboard", bg: "bg-amber-500" },
  { icon: ClipboardCheck, label: "Form", bg: "bg-violet-500" },
];

function CreateMenu({
  kind,
  position,
  onClose,
  onCreate,
}: {
  kind: SidebarTreeNodeKind;
  position: { top: number; left: number };
  onClose: () => void;
  onCreate: (kind: "folder" | "table") => void;
}) {
  const options = CREATE_PRIMARY[kind];

  return (
    <FlyoutPanel position={position} onClose={onClose} width={280}>
      <p className="mb-1 px-2 pt-1 text-xs font-medium text-muted-foreground">Create</p>
      {options.map((opt, i) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => {
            if (opt.create) onCreate(opt.create);
            onClose();
          }}
          className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted ${
            i === 0 ? "bg-muted" : ""
          }`}
        >
          <opt.icon size={17} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground-strong">{opt.label}</span>
              {opt.badge && (
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                  {opt.badge}
                </span>
              )}
            </span>
            <span className="block text-xs text-muted-foreground">{opt.desc}</span>
          </span>
        </button>
      ))}
      <div className="my-1 border-t border-border" />
      {CREATE_SECONDARY.map((item) => (
        <button key={item.label} type="button" onClick={onClose} className={MENU_ITEM_CLASS}>
          <span className={`flex h-5 w-5 items-center justify-center rounded ${item.bg} text-white`}>
            <item.icon size={12} />
          </span>
          {item.label}
        </button>
      ))}
      <div className="my-1 border-t border-border" />
      <MenuItem icon={LogIn} label="Imports" trailing onClick={onClose} />
      <MenuItem icon={Wand2} label="Templates" onClick={onClose} />
    </FlyoutPanel>
  );
}

function TreeRow({
  node,
  open,
  selected,
  pathIds,
  showCurve,
  containerRef,
  onToggle,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
}: {
  node: SidebarTreeNode;
  open: Set<string>;
  selected: string | null;
  pathIds: Set<string>;
  showCurve: boolean;
  containerRef?: (el: HTMLDivElement | null) => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (parentId: string, kind: "folder" | "table") => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const menu = useFlyout();
  const addMenu = useFlyout();
  const hasChildren = !!node.children?.length;
  const isOpen = open.has(node.id);
  const isSelected = selected === node.id;
  const onPath = pathIds.has(node.id);

  return (
    <div ref={containerRef}>
      <div className="relative">
        {showCurve && (
          <svg className="pointer-events-none absolute left-0 top-0" width={INDENT} height={ROW_H} aria-hidden="true">
            <path
              d={`M ${TRUNK} ${ROW_H / 2 - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${TRUNK + RADIUS} ${ROW_H / 2} H ${INDENT - 6}`}
              fill="none"
              stroke={onPath ? ACCENT_COLOR : LINE_COLOR}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              style={{ transition: "stroke 150ms ease" }}
            />
          </svg>
        )}
        <div
          className={`group/node relative flex items-center gap-1 rounded-md pr-1 text-sm transition-colors hover:bg-muted ${
            isSelected ? "text-foreground-strong" : "text-muted-foreground hover:text-foreground"
          }`}
          style={{ height: ROW_H, paddingLeft: showCurve ? INDENT : 0 }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(node.id);
              if (hasChildren) onToggle(node.id);
            }}
            className="flex h-full min-w-0 flex-1 items-center gap-1"
          >
            {hasChildren ? (
              <ChevronRight size={11} className={`shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            ) : (
              <span className="inline-block w-[11px] shrink-0" />
            )}
            <NodeIconView icon={node.icon} kind={node.kind} />
            <span className="truncate">{node.label}</span>
          </button>
          <div className="hidden shrink-0 items-center gap-0.5 group-hover/node:flex">
            <button
              type="button"
              aria-label={`Adicionar em ${node.label}`}
              onClick={addMenu.toggleAt}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              aria-label={`Mais opções de ${node.label}`}
              onClick={menu.toggleAt}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
            >
              <MoreHorizontal size={12} />
            </button>
          </div>
          {addMenu.position && (
            <CreateMenu
              kind={node.kind}
              position={addMenu.position}
              onClose={addMenu.close}
              onCreate={(kind) => onAdd(node.id, kind)}
            />
          )}
          {menu.position && (
            <TreeNodeMenu
              node={node}
              position={menu.position}
              onClose={menu.close}
              onAdd={onAdd}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
      {hasChildren && isOpen && (
        <TreeGroup
          nodes={node.children!}
          open={open}
          selected={selected}
          pathIds={pathIds}
          onToggle={onToggle}
          onSelect={onSelect}
          onAdd={onAdd}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function TreeGroup({
  nodes,
  open,
  selected,
  pathIds,
  onToggle,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
}: {
  nodes: SidebarTreeNode[];
  open: Set<string>;
  selected: string | null;
  pathIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (parentId: string, kind: "folder" | "table") => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const activeChildId = nodes.find((n) => pathIds.has(n.id))?.id ?? null;
  const rowEls = useRef<Record<string, HTMLDivElement | null>>({});
  const [accentHeight, setAccentHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!activeChildId) return;
    const measure = () => {
      const el = rowEls.current[activeChildId];
      if (!el) return;
      setAccentHeight(el.offsetTop + el.offsetHeight / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const el = rowEls.current[activeChildId];
    if (el?.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [activeChildId, open]);

  const renderedAccentHeight = activeChildId ? accentHeight : null;

  return (
    <div className="relative" style={{ marginLeft: INDENT - 4 }}>
      {/* trunk: top/bottom (not a fixed height) so it always stretches to the real, possibly-expanded content */}
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
        {nodes.map((node) => (
          <TreeRow
            key={node.id}
            node={node}
            open={open}
            selected={selected}
            pathIds={pathIds}
            showCurve
            containerRef={(el) => {
              rowEls.current[node.id] = el;
            }}
            onToggle={onToggle}
            onSelect={onSelect}
            onAdd={onAdd}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export type SidebarTreeHandle = {
  addSpace: (node: SidebarTreeNode) => void;
  expandAll: () => void;
  collapseAll: () => void;
};

export const SidebarTree = forwardRef<SidebarTreeHandle, { data: SidebarTreeNode[]; defaultOpen?: string[]; emptyState?: ReactNode }>(
  function SidebarTree({ data, defaultOpen, emptyState }, ref) {
    const [nodes, setNodes] = useState(data);
    const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ?? []));
    const [selected, setSelected] = useState<string | null>(null);
    const pathIds = useMemo(() => new Set(selected ? (findPath(nodes, selected) ?? []) : []), [nodes, selected]);

    useImperativeHandle(ref, () => ({
      addSpace: (node) => {
        setNodes((prev) => [...prev, node]);
        setOpen((prev) => new Set(prev).add(node.id));
      },
      expandAll: () => setOpen(new Set(collectContainerIds(nodes))),
      collapseAll: () => setOpen(new Set()),
    }));

    const toggle = (id: string) => {
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    // ponytail: mock local — sem persistência; prompt() nativo cobre criar/renomear até existir modal + backend
    const handleAdd = (parentId: string, kind: "folder" | "table") => {
      const label = window.prompt(kind === "folder" ? "Nome da nova pasta" : "Nome da nova tabela");
      if (!label) return;
      setNodes((prev) => addChild(prev, parentId, { id: newId(), label, kind }));
      setOpen((prev) => new Set(prev).add(parentId));
    };
    const handleRename = (id: string) => {
      const label = window.prompt("Novo nome");
      if (!label) return;
      setNodes((prev) => renameNode(prev, id, label));
    };
    const handleDuplicate = (id: string) => {
      setNodes((prev) => duplicateNode(prev, id));
    };
    const handleDelete = (id: string) => {
      setNodes((prev) => removeNode(prev, id));
    };

    if (nodes.length === 0) return <>{emptyState}</>;

    return (
      <div className="flex flex-col gap-0.5 pl-1">
        {nodes.map((node) => (
          <TreeRow
            key={node.id}
            node={node}
            open={open}
            selected={selected}
            pathIds={pathIds}
            showCurve={false}
            onToggle={toggle}
            onSelect={setSelected}
            onAdd={handleAdd}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  },
);
