"use client";

import {
  forwardRef,
  useEffect,
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
  Kanban,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { NodeIconGlyph, type NodeIcon } from "@/components/ui/IconPicker";
import { useFlyout, FlyoutPanel } from "@/components/ui/SidebarFlyout";
import { CreateSidebarNodeModal } from "@/components/ui/CreateTableModal";

export type SidebarTreeNodeKind = "space" | "folder" | "table";
export type SidebarTreeNodeView = "list" | "kanban";

export type SidebarTreeNode = {
  id: string;
  label: string;
  kind: SidebarTreeNodeKind;
  view?: SidebarTreeNodeView;
  icon?: NodeIcon | IconSvgElement;
  children?: SidebarTreeNode[];
  favorite?: boolean;
  archived?: boolean;
  /** Cor de destaque do ícone da pasta/space — hex, ex. "#f59e0b". */
  color?: string;
};

export const FOLDER_COLOR_SWATCHES = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#818cf8", "#e879f9", "#94a3b8"];

type TreeDnd = {
  draggedId: string | null;
  dragOverId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverNode: (id: string) => void;
  onDropOnNode: (id: string) => void;
  onDropAtRoot: () => void;
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

function NodeIconView({ icon, kind, color }: { icon?: NodeIcon | IconSvgElement; kind: SidebarTreeNodeKind; color?: string }) {
  const style = color ? { color } : undefined;
  if (isNodeIcon(icon)) {
    return <span style={style}><NodeIconGlyph icon={icon} size={14} /></span>;
  }
  if (icon) {
    return <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={style} />;
  }
  if (kind === "table") return <Table2 size={14} className="shrink-0" style={style} />;
  return <Folder size={14} className="shrink-0" style={style} />;
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

function toggleFavoriteNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode[] {
  return mapTree(nodes, (node) => (node.id === id ? { ...node, favorite: !node.favorite } : node));
}

function toggleArchivedNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode[] {
  return mapTree(nodes, (node) => (node.id === id ? { ...node, archived: !node.archived } : node));
}

function setNodeColor(nodes: SidebarTreeNode[], id: string, color: string): SidebarTreeNode[] {
  return mapTree(nodes, (node) => (node.id === id ? { ...node, color } : node));
}

function removeNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children ? { ...node, children: removeNode(node.children, id) } : node));
}

/** Tira um nó de onde estiver (com os filhos dele intactos) e devolve a árvore sem ele + o nó removido. */
function extractNode(nodes: SidebarTreeNode[], id: string): [SidebarTreeNode[], SidebarTreeNode | null] {
  let removed: SidebarTreeNode | null = null;
  function rec(list: SidebarTreeNode[]): SidebarTreeNode[] {
    const next: SidebarTreeNode[] = [];
    for (const node of list) {
      if (node.id === id) {
        removed = node;
        continue;
      }
      next.push(node.children ? { ...node, children: rec(node.children) } : node);
    }
    return next;
  }
  return [rec(nodes), removed];
}

function insertAsChild(nodes: SidebarTreeNode[], parentId: string, child: SidebarTreeNode): SidebarTreeNode[] {
  return addChild(nodes, parentId, child);
}

function insertAtRoot(nodes: SidebarTreeNode[], child: SidebarTreeNode): SidebarTreeNode[] {
  return [...nodes, child];
}

/** Insere `child` logo depois do nó `siblingId`, no mesmo nível (pai) em que ele estiver. */
function insertAfterSibling(nodes: SidebarTreeNode[], siblingId: string, child: SidebarTreeNode): SidebarTreeNode[] {
  const idx = nodes.findIndex((n) => n.id === siblingId);
  if (idx !== -1) {
    const next = [...nodes];
    next.splice(idx + 1, 0, child);
    return next;
  }
  return nodes.map((n) => (n.children ? { ...n, children: insertAfterSibling(n.children, siblingId, child) } : n));
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

function findNode(nodes: SidebarTreeNode[], id: string): SidebarTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
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
  onToggleFavorite,
  onToggleArchived,
  onSetColor,
}: {
  node: SidebarTreeNode;
  position: { top: number; left: number };
  onClose: () => void;
  onAdd: (parentId: string, kind: "folder" | "table", view?: SidebarTreeNodeView) => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchived: (id: string) => void;
  onSetColor: (id: string, color: string) => void;
}) {
  // ponytail: itens sem onClick são decorativos (replicam o menu do ClickUp visualmente) — plugar quando essas features existirem
  const noop = () => onClose();
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  return (
    <FlyoutPanel position={position} onClose={onClose} width={240}>
      <MenuItem
        icon={Star}
        label={node.favorite ? "Remover dos favoritos" : "Favorite"}
        onClick={act(() => onToggleFavorite(node.id))}
      />
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
      <MenuItem icon={Droplet} label="Folder color" trailing onClick={() => setColorPickerOpen((v) => !v)} />
      {colorPickerOpen && (
        <div className="mb-1 flex flex-wrap gap-1.5 px-2 py-1.5">
          {FOLDER_COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Cor ${color}`}
              onClick={act(() => onSetColor(node.id, color))}
              className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10 hover:scale-110"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
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
      <MenuItem icon={Archive} label={node.archived ? "Unarchive" : "Archive"} onClick={act(() => onToggleArchived(node.id))} />
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
  view?: SidebarTreeNodeView;
};

const CREATE_PRIMARY: Record<SidebarTreeNodeKind, CreateOption[]> = {
  space: [
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: "table", view: "list" },
    { icon: Folder, label: "Folder", desc: "Group Lists, Docs & more", create: "folder" },
    { icon: Kanban, label: "Kanban", desc: "Drag-and-drop board organizado por status", create: "table", view: "kanban" },
  ],
  folder: [
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: "table", view: "list" },
    { icon: Folder, label: "Subfolder", badge: "New", desc: "Group Lists, Docs & more", create: "folder" },
    { icon: Kanban, label: "Kanban", desc: "Drag-and-drop board organizado por status", create: "table", view: "kanban" },
  ],
  // ponytail: Task/List aqui ainda não têm modelo próprio (precisa de tasks reais) — por enquanto só fecham o menu
  table: [
    { icon: CircleDot, label: "Task", desc: "Create individual tasks to manage your work", create: null },
    { icon: ListChecks, label: "List", desc: "Track tasks, projects, people & more", create: "table", view: "list" },
    { icon: Kanban, label: "Kanban", desc: "Drag-and-drop board organizado por status", create: "table", view: "kanban" },
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
  onCreate: (kind: "folder" | "table", view?: SidebarTreeNodeView) => void;
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
            if (opt.create) onCreate(opt.create, opt.view);
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
  onToggleFavorite,
  onToggleArchived,
  onSetColor,
  dnd,
}: {
  node: SidebarTreeNode;
  open: Set<string>;
  selected: string | null;
  pathIds: Set<string>;
  showCurve: boolean;
  containerRef?: (el: HTMLDivElement | null) => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (parentId: string, kind: "folder" | "table", view?: SidebarTreeNodeView) => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchived: (id: string) => void;
  onSetColor: (id: string, color: string) => void;
  dnd: TreeDnd;
}) {
  const menu = useFlyout();
  const addMenu = useFlyout();
  const hasChildren = !!node.children?.length;
  const isOpen = open.has(node.id);
  const isSelected = selected === node.id;
  const onPath = pathIds.has(node.id);
  const isDragging = dnd.draggedId === node.id;
  const isDropTarget = dnd.dragOverId === node.id;

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
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = "move";
            dnd.onDragStart(node.id);
          }}
          onDragEnd={dnd.onDragEnd}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDragOverNode(node.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDropOnNode(node.id);
          }}
          className={`group/node relative flex items-center gap-1 rounded-md pr-1 text-sm transition-colors hover:bg-muted ${
            isSelected ? "text-foreground-strong" : "text-muted-foreground hover:text-foreground"
          } ${node.archived ? "opacity-50" : ""} ${isDragging ? "opacity-40" : ""} ${
            isDropTarget ? "bg-muted ring-1 ring-inset ring-[var(--button)]" : ""
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
            <NodeIconView icon={node.icon} kind={node.kind} color={node.color} />
            <span className="truncate">{node.label}</span>
            {node.favorite && <Star size={10} className="shrink-0 fill-current text-amber-400" />}
            {node.archived && <span className="shrink-0 text-[10px] text-muted-foreground">(Archived)</span>}
            {hasChildren && (
              <ChevronRight
                size={11}
                className={`hidden shrink-0 text-muted-foreground transition-transform group-hover/node:inline-block ${isOpen ? "rotate-90" : ""}`}
              />
            )}
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
              onCreate={(kind, view) => onAdd(node.id, kind, view)}
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
              onToggleFavorite={onToggleFavorite}
              onToggleArchived={onToggleArchived}
              onSetColor={onSetColor}
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
          onToggleFavorite={onToggleFavorite}
          onToggleArchived={onToggleArchived}
          onSetColor={onSetColor}
          dnd={dnd}
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
  onToggleFavorite,
  onToggleArchived,
  onSetColor,
  dnd,
}: {
  nodes: SidebarTreeNode[];
  open: Set<string>;
  selected: string | null;
  pathIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (parentId: string, kind: "folder" | "table", view?: SidebarTreeNodeView) => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchived: (id: string) => void;
  onSetColor: (id: string, color: string) => void;
  dnd: TreeDnd;
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
            onToggleFavorite={onToggleFavorite}
            onToggleArchived={onToggleArchived}
            onSetColor={onSetColor}
            dnd={dnd}
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
  toggleFavorite: (id: string) => void;
  openNode: (id: string) => void;
};

export const SidebarTree = forwardRef<
  SidebarTreeHandle,
  {
    data: SidebarTreeNode[];
    defaultOpen?: string[];
    emptyState?: ReactNode;
    onOpenBoard?: (node: SidebarTreeNode) => void;
    onNodesChange?: (nodes: SidebarTreeNode[]) => void;
  }
>(function SidebarTree({ data, defaultOpen, emptyState, onOpenBoard, onNodesChange }, ref) {
    const [nodes, setNodes] = useState(data);
    const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ?? []));
    const [selected, setSelected] = useState<string | null>(null);
    const pathIds = useMemo(() => new Set(selected ? (findPath(nodes, selected) ?? []) : []), [nodes, selected]);

    useEffect(() => {
      onNodesChange?.(nodes);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes]);

    const handleSelect = (id: string) => {
      setSelected(id);
      const node = findNode(nodes, id);
      if (node?.kind === "table") onOpenBoard?.(node);
    };

    useImperativeHandle(ref, () => ({
      addSpace: (node) => {
        setNodes((prev) => [...prev, node]);
        setOpen((prev) => new Set(prev).add(node.id));
      },
      expandAll: () => setOpen(new Set(collectContainerIds(nodes))),
      collapseAll: () => setOpen(new Set()),
      toggleFavorite: (id) => setNodes((prev) => toggleFavoriteNode(prev, id)),
      openNode: (id) => {
        const node = findNode(nodes, id);
        if (node?.kind === "table") onOpenBoard?.(node);
      },
    }));

    const toggle = (id: string) => {
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    // ponytail: drag-and-drop simples via HTML5 DnD nativo (mesmo padrão do reorder das sections
    // da Home) — solta em cima de um space/folder = vira filho; solta em cima de uma table = vira
    // irmã dela; solta na faixa do fim da lista = volta pro nível raiz.
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    function isDropInsideItself(draggedNodeId: string, targetId: string): boolean {
      const dragged = findNode(nodes, draggedNodeId);
      if (!dragged) return false;
      if (dragged.id === targetId) return true;
      return !!(dragged.children && findNode(dragged.children, targetId));
    }

    const dnd = {
      draggedId,
      dragOverId,
      onDragStart: (id: string) => setDraggedId(id),
      onDragEnd: () => {
        setDraggedId(null);
        setDragOverId(null);
      },
      onDragOverNode: (id: string) => {
        if (draggedId && draggedId !== id) setDragOverId(id);
      },
      onDropOnNode: (targetId: string) => {
        if (!draggedId || draggedId === targetId || isDropInsideItself(draggedId, targetId)) {
          setDraggedId(null);
          setDragOverId(null);
          return;
        }
        setNodes((prev) => {
          const [without, removed] = extractNode(prev, draggedId);
          if (!removed) return prev;
          const target = findNode(without, targetId);
          if (target && target.kind !== "table") return insertAsChild(without, targetId, removed);
          return insertAfterSibling(without, targetId, removed);
        });
        setDraggedId(null);
        setDragOverId(null);
      },
      onDropAtRoot: () => {
        if (!draggedId) return;
        setNodes((prev) => {
          const [without, removed] = extractNode(prev, draggedId);
          if (!removed) return prev;
          return insertAtRoot(without, removed);
        });
        setDraggedId(null);
        setDragOverId(null);
      },
    };

    const [createRequest, setCreateRequest] = useState<{ parentId: string; kind: "folder" | "table"; view?: SidebarTreeNodeView } | null>(
      null,
    );

    const handleAdd = (parentId: string, kind: "folder" | "table", view?: SidebarTreeNodeView) => {
      setCreateRequest({ parentId, kind, view });
    };

    const handleCreateNode = ({ name, icon }: { name: string; icon: NodeIcon }) => {
      if (!createRequest) return;
      setNodes((prev) =>
        addChild(prev, createRequest.parentId, {
          id: newId(),
          label: name,
          icon,
          kind: createRequest.kind,
          view: createRequest.kind === "table" ? (createRequest.view ?? "list") : undefined,
        }),
      );
      setOpen((prev) => new Set(prev).add(createRequest.parentId));
      setCreateRequest(null);
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
    const handleToggleFavorite = (id: string) => {
      setNodes((prev) => toggleFavoriteNode(prev, id));
    };
    const handleToggleArchived = (id: string) => {
      setNodes((prev) => toggleArchivedNode(prev, id));
    };
    const handleSetColor = (id: string, color: string) => {
      setNodes((prev) => setNodeColor(prev, id, color));
    };

    return (
      <>
        {nodes.length === 0 ? (
          emptyState
        ) : (
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
                onSelect={handleSelect}
                onAdd={handleAdd}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchived={handleToggleArchived}
                onSetColor={handleSetColor}
                dnd={dnd}
              />
            ))}
            {draggedId && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  dnd.onDragOverNode("__root__");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dnd.onDropAtRoot();
                }}
                className={`mt-1 rounded-md border-2 border-dashed py-2 text-center text-[11px] transition-colors ${
                  dragOverId === "__root__" ? "border-[var(--button)] bg-muted text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                Soltar aqui pra mover pro nível raiz
              </div>
            )}
          </div>
        )}
        <CreateSidebarNodeModal
          request={createRequest ? (createRequest.kind === "folder" ? { kind: "folder" } : { kind: "table", view: createRequest.view ?? "list" }) : null}
          onClose={() => setCreateRequest(null)}
          onCreate={handleCreateNode}
        />
      </>
    );
  },
);
