"use client";

import { cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Home02Icon,
  UserGroup03Icon,
  CalendarDate1Icon,
  WorkflowIcon,
  GripIcon,
  UserRoundPlusIcon,
  Coins01Icon,
  DashboardSquare01Icon,
  UserIcon,
  WhatsappIcon,
  InstagramIcon,
  AppleIcon,
  Mail01Icon,
  LinkedinIcon,
  TiktokIcon,
  SlackIcon,
  TrelloIcon,
  NotionIcon,
  ChatGptIcon,
  ClaudeIcon,
} from "@hugeicons/core-free-icons";
import {
  MessagesSquare,
  FileText,
  CircleFadingArrowUp,
  Search,
  ListFilter,
  ChevronsLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  LayoutGrid,
  Eye,
  Archive,
  ArchiveRestore,
  Shuffle,
  Hash,
  Lock,
  Layers,
  MessageSquare,
  Pencil,
  Link2,
  Trash2,
  GripVertical,
  X,
  Inbox,
  AtSign,
  UserCheck,
  Clock,
  Folder,
  Phone,
  BarChart2,
  Megaphone,
  Tag,
  Bot,
  Contact,
  Columns2,
  Calendar as CalendarIcon,
  Zap,
  KanbanSquare,
  CircleDot,
  ListChecks,
  Star,
} from "lucide-react";
import {
  SidebarTree,
  type SidebarTreeNode,
  type SidebarTreeNodeKind,
  type SidebarTreeHandle,
} from "@/components/ui/SidebarTree";
import { CreateSpaceModal } from "@/components/ui/CreateSpaceModal";
import type { NodeIcon } from "@/components/ui/IconPicker";
import { Switch } from "@/components/ui/Switch";
import {
  useFlyout,
  FlyoutPanel,
  type FlyoutPosition,
} from "@/components/ui/SidebarFlyout";
import { BranchedTree, type BranchedTreeNode } from "@/components/ui/BranchedTree";
import { ClientFormModal } from "@/components/clientes/ClientFormModal";
import { CreateEventModal, type CalendarEvent } from "@/components/calendario/CreateEventModal";
import { CreateAutomationModal } from "@/components/automacoes/CreateAutomationModal";
import { CreateAtaModal, type Ata } from "@/components/atas/CreateAtaModal";
import {
  CreateDocumentModal,
  type DocRecord,
  type DocumentStatus,
} from "@/components/atas/CreateDocumentModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSpaceBoard } from "@/components/spaces/SpaceBoardContext";
import {
  updateClient,
  deleteClient,
  type Client,
  type ServiceType,
  type ClientHealth,
} from "@/lib/clients";
import type { AgencyMember } from "@/lib/tasks";
import { useSidebarPreviewData } from "@/components/layout/SidebarPreviewData";
import { INITIAL_CHANNELS, INITIAL_DMS, INITIAL_AI_CHATS } from "@/lib/mockChats";
import { useChatThread, type ChatThreadRef } from "@/components/chats/ChatThreadContext";
import { CreateNamedModal } from "@/components/ui/CreateNamedModal";
import { CreateChannelModal } from "@/components/chats/CreateChannelModal";
import { NewDirectMessageModal } from "@/components/chats/NewDirectMessageModal";

// ponytail: pub-sub minúsculo só pro botão "+" do topo da Home disparar a criação certa em
// SpacesBlock/ChannelsSection/ChatsSection sem precisar subir o estado delas — cada seção escuta
// o alvo pendente, abre seu próprio modal e limpa. Sem fila: um alvo por vez é o bastante aqui.
type HomeNewTarget = "space" | "channel" | "dm" | "ai";
const HomeNewActionContext = createContext<{
  pending: HomeNewTarget | null;
  request: (target: HomeNewTarget) => void;
  clear: () => void;
} | null>(null);

function useHomeNewAction(target: HomeNewTarget, onTrigger: () => void) {
  const ctx = useContext(HomeNewActionContext);
  useEffect(() => {
    if (ctx?.pending === target) {
      onTrigger();
      ctx.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.pending]);
}

// ponytail: ponte mínima entre o SidebarTree (dono dos nós/favoritos de Spaces) e a seção
// "Favorites" (renderizada em outro lugar da árvore de componentes) — guarda só a lista achatada
// de nós favoritados + uma função pra desfavoritar delegada de volta pro SidebarTree via ref.
const TreeFavoritesContext = createContext<{
  entries: SidebarTreeNode[];
  setEntries: (nodes: SidebarTreeNode[]) => void;
  unfavorite: (id: string) => void;
  setUnfavorite: (fn: (id: string) => void) => void;
  openNode: (id: string) => void;
  setOpenNode: (fn: (id: string) => void) => void;
} | null>(null);

function flattenFavorites(nodes: SidebarTreeNode[]): SidebarTreeNode[] {
  const result: SidebarTreeNode[] = [];
  for (const node of nodes) {
    if (node.favorite) result.push(node);
    if (node.children) result.push(...flattenFavorites(node.children));
  }
  return result;
}

export type HomeTab = "dashboard" | "financeiro" | "tasks" | "pessoal";
export type ClientTab =
  | "analytics"
  | "posts-overview"
  | "posts-queues"
  | "ads"
  | "tasks"
  | "workflow";

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients"; agencyId: string; members: AgencyMember[]; initialClients: Client[] }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" }
  | { type: "calendario"; clients: Client[] }
  | { type: "automacoes" }
  | { type: "atas"; clients: Client[] };

function navClass(isActive: boolean): string {
  return `flex items-center gap-2 truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-muted text-foreground-strong"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

const DASHBOARD_ITEMS: {
  key: HomeTab;
  label: string;
  href: string;
  icon: IconSvgElement;
}[] = [
  {
    key: "dashboard",
    label: "Geral",
    href: "/home/dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    key: "financeiro",
    label: "Financeiro",
    href: "/home/financeiro",
    icon: Coins01Icon,
  },
  { key: "pessoal", label: "Pessoal", href: "/home/pessoal", icon: UserIcon },
];

// ponytail: estrutura de exemplo — o cliente cria/renomeia/exclui espaços, pastas e tabelas livremente (árvore local, sem backend ainda)
const SPACES_TREE: SidebarTreeNode[] = [
  {
    id: "mkt",
    label: "Marketing",
    kind: "space",
    icon: { type: "icon", value: "megaphone" },
    children: [
      {
        id: "mkt-conteudo",
        label: "Conteúdo",
        kind: "folder",
        children: [
          { id: "mkt-conteudo-posts", label: "Posts", kind: "table" },
          { id: "mkt-conteudo-stories", label: "Stories", kind: "table" },
          { id: "mkt-conteudo-estaticos", label: "Estáticos", kind: "table" },
        ],
      },
      {
        id: "mkt-campanhas",
        label: "Campanhas",
        kind: "folder",
        children: [
          {
            id: "mkt-campanhas-metaads",
            label: "Meta ADS",
            kind: "table",
            icon: Coins01Icon,
          },
        ],
      },
    ],
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 truncate px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

const ROW_CLASS =
  "flex w-full items-center gap-2 truncate rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function GhostAddRow({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={ROW_CLASS}>
      <Plus size={14} className="shrink-0" />
      {label}
    </button>
  );
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground-strong">
      {initial}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background-elevated bg-emerald-400" />
      )}
    </span>
  );
}

function SectionCollapseHeader({
  title,
  icon,
  open,
  onToggleOpen,
  onAdd,
  onRenameSection,
  subsection,
  plain,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggleOpen: () => void;
  onAdd?: () => void;
  onRenameSection: (title: string) => void;
  subsection?: boolean;
  plain?: boolean;
}) {
  const menu = useFlyout();

  return (
    <div className="group/section-header relative mb-1 flex items-center gap-1 px-3">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={open ? `Colapsar ${title}` : `Expandir ${title}`}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
      >
        {icon}
        <span
          className={
            plain
              ? "truncate text-sm text-muted-foreground"
              : `truncate font-semibold uppercase tracking-wide text-muted-foreground ${
                  subsection ? "text-[10px]" : "text-xs"
                }`
          }
        >
          {title}
        </span>
        <ChevronDown
          size={12}
          className={`hidden shrink-0 text-muted-foreground transition-transform group-hover/section-header:inline-block ${open ? "" : "-rotate-90"}`}
        />
      </button>
      <div className="hidden shrink-0 items-center gap-0.5 group-hover/section-header:flex">
        {onAdd && (
          <button
            type="button"
            aria-label={`Adicionar em ${title}`}
            onClick={onAdd}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
          >
            <Plus size={12} />
          </button>
        )}
        <button
          type="button"
          aria-label={`Mais opções de ${title}`}
          onClick={menu.toggleAt}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      {menu.position && (
        <FlyoutPanel position={menu.position} onClose={menu.close} width={200}>
          <button
            type="button"
            onClick={() => {
              onToggleOpen();
              menu.close();
            }}
            className={ROW_CLASS}
          >
            <ChevronDown size={14} className={open ? "" : "-rotate-90"} />
            {open ? "Colapsar" : "Expandir"}
          </button>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Novo nome da seção", title);
              if (name) onRenameSection(name);
              menu.close();
            }}
            className={ROW_CLASS}
          >
            <Pencil size={14} /> Renomear seção
          </button>
        </FlyoutPanel>
      )}
    </div>
  );
}

function RowWithMenu({
  content,
  label,
  extra,
  active,
  onClick,
  onRename,
  onDelete,
}: {
  content: React.ReactNode;
  label: string;
  extra?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const menu = useFlyout();

  return (
    <div
      className={`group/row relative flex items-center gap-1 rounded-md pr-1 text-sm transition-colors hover:bg-muted hover:text-foreground ${
        active ? "bg-muted text-foreground-strong" : "text-muted-foreground"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
        {content}
      </button>
      {extra}
      <div className="hidden shrink-0 items-center group-hover/row:flex">
        <button
          type="button"
          aria-label={`Mais opções de ${label}`}
          onClick={menu.toggleAt}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      {menu.position && (
        <FlyoutPanel position={menu.position} onClose={menu.close} width={200}>
          <button
            type="button"
            onClick={() => {
              onRename();
              menu.close();
            }}
            className={ROW_CLASS}
          >
            <Pencil size={14} /> Renomear
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(
                `https://app.local/${encodeURIComponent(label)}`,
              );
              menu.close();
            }}
            className={ROW_CLASS}
          >
            <Link2 size={14} /> Copy link
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              menu.close();
            }}
            className={`${ROW_CLASS} text-red-400`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </FlyoutPanel>
      )}
    </div>
  );
}

function ChannelsSection() {
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Channels");
  const [creating, setCreating] = useState(false);
  const { openThread, allChannelsOpen, open: openChatThread, openAllChannels } = useChatThread();
  useHomeNewAction("channel", () => setCreating(true));

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onAdd={() => setCreating(true)}
        onRenameSection={setTitle}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          <button type="button" onClick={openAllChannels} className={`${navClass(allChannelsOpen)} w-full text-left`}>
            <Layers size={14} className="shrink-0" />
            All Channels
          </button>
          {channels.map((channel) => (
            <RowWithMenu
              key={channel.id}
              label={channel.name}
              content={
                <>
                  <Hash size={14} className="shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </>
              }
              extra={
                channel.private ? (
                  <Lock
                    size={12}
                    className="mr-1 shrink-0 text-muted-foreground"
                  />
                ) : undefined
              }
              active={openThread?.type === "channel" && openThread.id === channel.id}
              onClick={() => openChatThread({ type: "channel", id: channel.id, name: channel.name })}
              onRename={() => {
                const name = window.prompt("Novo nome do canal", channel.name);
                if (name)
                  setChannels((prev) =>
                    prev.map((c) => (c.id === channel.id ? { ...c, name } : c)),
                  );
              }}
              onDelete={() =>
                setChannels((prev) => prev.filter((c) => c.id !== channel.id))
              }
            />
          ))}
          <GhostAddRow label="Add Channel" onClick={() => setCreating(true)} />
        </nav>
      )}
      <CreateChannelModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={({ name, isPrivate }) => {
          setChannels((prev) => [...prev, { id: crypto.randomUUID(), name, private: isPrivate }]);
          setCreating(false);
        }}
      />
    </div>
  );
}

function ChatsSection() {
  const [dms, setDms] = useState(INITIAL_DMS);
  const [aiChats, setAiChats] = useState(INITIAL_AI_CHATS);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [chatsTitle, setChatsTitle] = useState("Chats");
  const [dmsTitle, setDmsTitle] = useState("Direct Messages");
  const [aiTitle, setAiTitle] = useState("AI Chats");
  const [creatingDm, setCreatingDm] = useState(false);
  const { openThread, open: openChatThread } = useChatThread();

  // ponytail: "New AI chat" abre direto (sem modal de nome) — o título nasce vazio e o
  // usuário renomeia pelo próprio header do chat, igual ao resto dos AI sheets.
  const addAiChat = () => {
    const chat = { id: crypto.randomUUID(), title: "Untitled" };
    setAiChats((prev) => [...prev, chat]);
    openChatThread({ type: "ai", id: chat.id, name: chat.title });
  };
  useHomeNewAction("dm", () => setCreatingDm(true));
  useHomeNewAction("ai", addAiChat);

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={chatsTitle}
        open={chatsOpen}
        onToggleOpen={() => setChatsOpen((v) => !v)}
        onRenameSection={setChatsTitle}
      />
      <div className={chatsOpen ? undefined : "hidden"}>
        <div className="mb-3">
          <SectionCollapseHeader
            title={dmsTitle}
            open={dmsOpen}
            onToggleOpen={() => setDmsOpen((v) => !v)}
            onAdd={() => setCreatingDm(true)}
            onRenameSection={setDmsTitle}
            subsection
          />
          {dmsOpen && (
            <nav className="flex flex-col gap-0.5">
              {dms.map((dm) => (
                <RowWithMenu
                  key={dm.id}
                  label={dm.name}
                  content={
                    <>
                      <Avatar name={dm.name} online={dm.online} />
                      <span className="truncate">
                        {dm.name}
                        {dm.you && (
                          <span className="text-muted-foreground"> — You</span>
                        )}
                      </span>
                    </>
                  }
                  active={openThread?.type === "dm" && openThread.id === dm.id}
                  onClick={() => openChatThread({ type: "dm", id: dm.id, name: dm.name })}
                  onRename={() => {
                    const name = window.prompt("Novo nome", dm.name);
                    if (name)
                      setDms((prev) =>
                        prev.map((d) => (d.id === dm.id ? { ...d, name } : d)),
                      );
                  }}
                  onDelete={() =>
                    setDms((prev) => prev.filter((d) => d.id !== dm.id))
                  }
                />
              ))}
              <GhostAddRow label="New message" onClick={() => setCreatingDm(true)} />
            </nav>
          )}
          <NewDirectMessageModal
            open={creatingDm}
            onClose={() => setCreatingDm(false)}
            onSelect={(name) => {
              const existing = dms.find((d) => d.name === name);
              const dm = existing ?? { id: crypto.randomUUID(), name };
              if (!existing) setDms((prev) => [...prev, dm]);
              setCreatingDm(false);
              openChatThread({ type: "dm", id: dm.id, name: dm.name });
            }}
          />
        </div>

        <div>
          <SectionCollapseHeader
            title={aiTitle}
            open={aiOpen}
            onToggleOpen={() => setAiOpen((v) => !v)}
            onRenameSection={setAiTitle}
            subsection
          />
          {aiOpen && (
            <nav className="flex flex-col gap-0.5">
              {aiChats.map((chat) => (
                <RowWithMenu
                  key={chat.id}
                  label={chat.title}
                  content={
                    <>
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </>
                  }
                  active={openThread?.type === "ai" && openThread.id === chat.id}
                  onClick={() => openChatThread({ type: "ai", id: chat.id, name: chat.title })}
                  onRename={() => {
                    const title = window.prompt("Novo título", chat.title);
                    if (title)
                      setAiChats((prev) =>
                        prev.map((c) =>
                          c.id === chat.id ? { ...c, title } : c,
                        ),
                      );
                  }}
                  onDelete={() =>
                    setAiChats((prev) => prev.filter((c) => c.id !== chat.id))
                  }
                />
              ))}
              <GhostAddRow label="Ask, Build, Create" onClick={addAiChat} />
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

type InboxChannel = "whatsapp" | "instagram" | "email" | "apple";

const CHANNEL_ICON: Record<InboxChannel, IconSvgElement> = {
  whatsapp: WhatsappIcon,
  instagram: InstagramIcon,
  email: Mail01Icon,
  apple: AppleIcon,
};

function ChannelIcon({ channel }: { channel: InboxChannel }) {
  return (
    <HugeiconsIcon
      icon={CHANNEL_ICON[channel]}
      size={14}
      className="shrink-0 text-muted-foreground"
    />
  );
}

const CHANNEL_TYPE_LABEL: Record<InboxChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "E-mail",
  apple: "Apple Messages",
};

function CreateInboxChannelModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; channel: InboxChannel }) => void;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<InboxChannel>("whatsapp");

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), channel });
    setName("");
    setChannel("whatsapp");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-foreground-strong">Novo canal</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conecta um canal de atendimento pra receber conversas aqui.</p>

        <div className="mt-5 space-y-1">
          <label className="text-xs text-muted-foreground">Nome</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. WhatsApp Vendas"
            className="h-12 w-full rounded-lg border border-foreground-strong/30 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-4 space-y-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CHANNEL_TYPE_LABEL) as InboxChannel[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setChannel(key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  channel === key ? "border-foreground-strong text-foreground-strong" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <ChannelIcon channel={key} />
                {CHANNEL_TYPE_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-lg bg-button px-4 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function InboxNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link href={href} className={navClass(pathname === href)}>
      {children}
    </Link>
  );
}

const CONVERSATION_VIEWS: {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "all",
    label: "Todas as Conversas",
    href: "/inbox/conversas",
    icon: <Inbox size={14} className="shrink-0" />,
  },
  {
    key: "mentions",
    label: "Menções",
    href: "/inbox/mencoes",
    icon: <AtSign size={14} className="shrink-0" />,
  },
  {
    key: "participating",
    label: "Participando",
    href: "/inbox/participando",
    icon: <UserCheck size={14} className="shrink-0" />,
  },
  {
    key: "unattended",
    label: "Não atendidas",
    href: "/inbox/nao-atendidas",
    icon: <Clock size={14} className="shrink-0" />,
  },
];

type NamedRow = { id: string; name: string };

// ponytail: pastas/canais/etiquetas mockados — trocar por dados reais quando existir CRM de verdade
const INITIAL_FOLDERS: NamedRow[] = [
  { id: "folder-1", name: "Leads quentes" },
  { id: "folder-2", name: "Aguardando resposta" },
];

const INITIAL_CHANNELS_MOCK: { id: string; name: string; channel: InboxChannel }[] = [
  { id: "ch-whatsapp", name: "WhatsApp", channel: "whatsapp" },
  { id: "ch-instagram", name: "Instagram", channel: "instagram" },
  { id: "ch-email", name: "E-mail", channel: "email" },
  { id: "ch-apple", name: "Apple Messages", channel: "apple" },
];

const INITIAL_LABELS: NamedRow[] = [
  { id: "label-1", name: "Urgente" },
  { id: "label-2", name: "Aguardando resposta" },
  { id: "label-3", name: "Resolvido" },
];

function GroupAddAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
    >
      <Plus size={12} />
    </button>
  );
}

function useFoldersNode(): { node: BranchedTreeNode; modal: React.ReactNode } {
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [creating, setCreating] = useState(false);

  const node: BranchedTreeNode = {
    id: "folders",
    content: (
      <>
        <Folder size={14} className="shrink-0" />
        <span className="min-w-0 truncate text-sm text-muted-foreground">Folders</span>
      </>
    ),
    actions: <GroupAddAction label="Adicionar pasta" onClick={() => setCreating(true)} />,
    children: [
      ...folders.map((folder) => ({
        id: folder.id,
        content: (
          <RowWithMenu
            label={folder.name}
            content={
              <>
                <Folder size={14} className="shrink-0" />
                <span className="truncate">{folder.name}</span>
              </>
            }
            onRename={() => {
              const name = window.prompt("Novo nome", folder.name);
              if (name)
                setFolders((prev) =>
                  prev.map((f) => (f.id === folder.id ? { ...f, name } : f)),
                );
            }}
            onDelete={() =>
              setFolders((prev) => prev.filter((f) => f.id !== folder.id))
            }
          />
        ),
      })),
      {
        id: "folders-add",
        content: <GhostAddRow label="New folder" onClick={() => setCreating(true)} />,
      },
    ],
  };

  const modal = (
    <CreateNamedModal
      open={creating}
      title="Nova pasta"
      description="Agrupa conversas relacionadas dentro do Inbox."
      placeholder="e.g. Leads quentes"
      onClose={() => setCreating(false)}
      onCreate={({ name }) => {
        setFolders((prev) => [...prev, { id: crypto.randomUUID(), name }]);
        setCreating(false);
      }}
    />
  );

  return { node, modal };
}

function useChannelsNode(): { node: BranchedTreeNode; modal: React.ReactNode } {
  const [channels, setChannels] = useState(INITIAL_CHANNELS_MOCK);
  const [creating, setCreating] = useState(false);

  const node: BranchedTreeNode = {
    id: "channels",
    content: (
      <>
        <Columns2 size={14} className="shrink-0" />
        <span className="min-w-0 truncate text-sm text-muted-foreground">Channels</span>
      </>
    ),
    actions: <GroupAddAction label="Adicionar canal" onClick={() => setCreating(true)} />,
    children: [
      ...channels.map((channel) => ({
        id: channel.id,
        content: (
          <RowWithMenu
            label={channel.name}
            content={
              <>
                <ChannelIcon channel={channel.channel} />
                <span className="truncate">{channel.name}</span>
              </>
            }
            onRename={() => {
              const name = window.prompt("Novo nome", channel.name);
              if (name)
                setChannels((prev) =>
                  prev.map((c) => (c.id === channel.id ? { ...c, name } : c)),
                );
            }}
            onDelete={() =>
              setChannels((prev) => prev.filter((c) => c.id !== channel.id))
            }
          />
        ),
      })),
      {
        id: "channels-add",
        content: <GhostAddRow label="New channel" onClick={() => setCreating(true)} />,
      },
    ],
  };

  const modal = (
    <CreateInboxChannelModal
      open={creating}
      onClose={() => setCreating(false)}
      onCreate={({ name, channel }) => {
        setChannels((prev) => [...prev, { id: crypto.randomUUID(), name, channel }]);
        setCreating(false);
      }}
    />
  );

  return { node, modal };
}

function useLabelsNode(): { node: BranchedTreeNode; modal: React.ReactNode } {
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [creating, setCreating] = useState(false);

  const node: BranchedTreeNode = {
    id: "labels",
    content: (
      <>
        <Tag size={14} className="shrink-0" />
        <span className="min-w-0 truncate text-sm text-muted-foreground">Labels</span>
      </>
    ),
    actions: <GroupAddAction label="Adicionar etiqueta" onClick={() => setCreating(true)} />,
    children: [
      ...labels.map((label) => ({
        id: label.id,
        content: (
          <RowWithMenu
            label={label.name}
            content={
              <>
                <Tag size={14} className="shrink-0" />
                <span className="truncate">{label.name}</span>
              </>
            }
            onRename={() => {
              const name = window.prompt("Novo nome", label.name);
              if (name)
                setLabels((prev) =>
                  prev.map((l) => (l.id === label.id ? { ...l, name } : l)),
                );
            }}
            onDelete={() =>
              setLabels((prev) => prev.filter((l) => l.id !== label.id))
            }
          />
        ),
      })),
      {
        id: "labels-add",
        content: <GhostAddRow label="New label" onClick={() => setCreating(true)} />,
      },
    ],
  };

  const modal = (
    <CreateNamedModal
      open={creating}
      title="Nova etiqueta"
      description="Marca conversas pra filtrar e priorizar depois."
      placeholder="e.g. Urgente"
      onClose={() => setCreating(false)}
      onCreate={({ name }) => {
        setLabels((prev) => [...prev, { id: crypto.randomUUID(), name }]);
        setCreating(false);
      }}
    />
  );

  return { node, modal };
}

type PipelineStage = { id: string; name: string };

// ponytail: etapas mockadas — trocar por pipeline configurável de verdade quando o kanban existir
const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { id: "stage-1", name: "Lead novo" },
  { id: "stage-2", name: "Em atendimento/Follow-up" },
  { id: "stage-3", name: "Qualificado" },
  { id: "stage-4", name: "Reunião marcada" },
  { id: "stage-5", name: "Ganho" },
  { id: "stage-6", name: "Perdido" },
];

function usePipelinesNode(): { node: BranchedTreeNode; modal: React.ReactNode } {
  const [stages, setStages] = useState(INITIAL_PIPELINE_STAGES);
  const [creating, setCreating] = useState(false);

  const node: BranchedTreeNode = {
    id: "pipelines",
    content: (
      <>
        <KanbanSquare size={14} className="shrink-0" />
        <span className="min-w-0 truncate text-sm text-muted-foreground">Pipelines</span>
      </>
    ),
    actions: <GroupAddAction label="Adicionar etapa" onClick={() => setCreating(true)} />,
    children: [
      ...stages.map((stage) => ({
        id: stage.id,
        content: (
          <RowWithMenu
            label={stage.name}
            content={
              <>
                <CircleDot size={14} className="shrink-0" />
                <span className="truncate">{stage.name}</span>
              </>
            }
            onRename={() => {
              const name = window.prompt("Novo nome", stage.name);
              if (name)
                setStages((prev) =>
                  prev.map((s) => (s.id === stage.id ? { ...s, name } : s)),
                );
            }}
            onDelete={() =>
              setStages((prev) => prev.filter((s) => s.id !== stage.id))
            }
          />
        ),
      })),
      {
        id: "pipelines-add",
        content: <GhostAddRow label="New stage" onClick={() => setCreating(true)} />,
      },
    ],
  };

  const modal = (
    <CreateNamedModal
      open={creating}
      title="Nova etapa"
      description="Etapas organizam o funil de negócios do Pipeline."
      placeholder="e.g. Reunião marcada"
      onClose={() => setCreating(false)}
      onCreate={({ name }) => {
        setStages((prev) => [...prev, { id: crypto.randomUUID(), name }]);
        setCreating(false);
      }}
    />
  );

  return { node, modal };
}

function ConversationsSection() {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Conversations");
  const pathname = usePathname();

  const pipelines = usePipelinesNode();
  const folders = useFoldersNode();
  const channels = useChannelsNode();
  const labels = useLabelsNode();

  const nodes: BranchedTreeNode[] = [
    ...CONVERSATION_VIEWS.map((view) => ({
      id: view.key,
      active: pathname === view.href,
      content: (
        <InboxNavLink href={view.href}>
          {view.icon}
          {view.label}
        </InboxNavLink>
      ),
    })),
    pipelines.node,
    folders.node,
    channels.node,
    labels.node,
  ];

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={title}
        icon={<MessageSquare size={13} className="shrink-0 text-muted-foreground" />}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onRenameSection={setTitle}
        plain
      />
      {open && <BranchedTree nodes={nodes} />}
      {pipelines.modal}
      {folders.modal}
      {channels.modal}
      {labels.modal}
    </div>
  );
}

const INBOX_FIXED_ITEMS: {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "captain",
    label: "Captain",
    href: "/inbox/captain",
    icon: <Bot size={16} className="shrink-0" />,
  },
  {
    key: "calls",
    label: "Ligações",
    href: "/inbox/ligacoes",
    icon: <Phone size={16} className="shrink-0" />,
  },
  {
    key: "contacts",
    label: "Contatos",
    href: "/inbox/contatos",
    icon: <Contact size={16} className="shrink-0" />,
  },
  {
    key: "reports",
    label: "Relatórios",
    href: "/inbox/relatorios",
    icon: <BarChart2 size={16} className="shrink-0" />,
  },
  {
    key: "campaigns",
    label: "Campanhas",
    href: "/inbox/campanhas",
    icon: <Megaphone size={16} className="shrink-0" />,
  },
];

function InboxPanel() {
  return (
    <>
      <div className="mb-4">
        <nav className="flex flex-col gap-0.5">
          <InboxNavLink href="/inbox">
            <Inbox size={16} className="shrink-0" />
            My Inbox
          </InboxNavLink>
        </nav>
      </div>
      <ConversationsSection />
      <div className="mx-3 mb-4 border-t border-border" />
      <nav className="flex flex-col gap-0.5">
        {INBOX_FIXED_ITEMS.map((item) => (
          <InboxNavLink key={item.key} href={item.href}>
            {item.icon}
            {item.label}
          </InboxNavLink>
        ))}
      </nav>
    </>
  );
}

function InboxSidebarPanel() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader title="Inbox" onSearchOpen={() => setSearchOpen(true)} />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <InboxPanel />
      </div>
    </div>
  );
}

function currentTimestamp(): number {
  return Date.now();
}

function daysFromNow(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ponytail: eventos mockados — trocar por dados reais quando existir integração com Google Calendar/Outlook
const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "ev-1", title: "Reunião de alinhamento", date: daysFromNow(1, 14) },
  { id: "ev-2", title: "Call de onboarding", date: daysFromNow(3, 10) },
  { id: "ev-3", title: "Follow-up de proposta", date: daysFromNow(-2, 15) },
  { id: "ev-4", title: "Reunião mensal", date: daysFromNow(-5, 9) },
];

function CalendarEventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatted = new Date(event.date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <RowWithMenu
      label={event.title}
      content={
        <>
          <CalendarIcon size={14} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{event.title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {formatted}
              {event.clientName ? ` · ${event.clientName}` : ""}
            </span>
          </span>
        </>
      }
      onRename={onEdit}
      onDelete={onDelete}
    />
  );
}

function CalendarioSidebarPanel({ clients }: { clients: Client[] }) {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null | "new">(null);

  const now = useMemo(() => currentTimestamp(), []);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => {
      const t = new Date(e.date).getTime();
      return t < now && t >= weekAgo;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function upsert(event: CalendarEvent) {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      return exists ? prev.map((e) => (e.id === event.id ? event : e)) : [...prev, event];
    });
  }

  function remove(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader
          title="Calendário"
          onSearchOpen={() => setSearchOpen(true)}
          onAdd={() => setEditing("new")}
        />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-4">
          <SectionLabel>Próximos eventos</SectionLabel>
          <nav className="flex flex-col gap-0.5">
            {upcoming.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum evento agendado.</p>
            ) : (
              upcoming.map((event) => (
                <CalendarEventRow
                  key={event.id}
                  event={event}
                  onEdit={() => setEditing(event)}
                  onDelete={() => remove(event.id)}
                />
              ))
            )}
          </nav>
        </div>
        {past.length > 0 && (
          <div>
            <SectionCollapseHeader
              title="Eventos passados"
              open={pastOpen}
              onToggleOpen={() => setPastOpen((v) => !v)}
              onRenameSection={() => {}}
            />
            {pastOpen && (
              <nav className="flex flex-col gap-0.5">
                {past.map((event) => (
                  <CalendarEventRow
                    key={event.id}
                    event={event}
                    onEdit={() => setEditing(event)}
                    onDelete={() => remove(event.id)}
                  />
                ))}
              </nav>
            )}
          </div>
        )}
      </div>
      {editing !== null && (
        <CreateEventModal
          clients={clients}
          event={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={upsert}
        />
      )}
    </div>
  );
}

type AutomationTemplate = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
};

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "cliente-novo",
    label: "Cliente novo",
    href: "/automacoes/cliente-novo",
    icon: <Bot size={14} className="shrink-0" />,
    active: true,
  },
  {
    id: "calendario-conteudo",
    label: "Calendário de conteúdo",
    href: "/automacoes/calendario-conteudo",
    icon: <CalendarIcon size={14} className="shrink-0" />,
    active: true,
  },
  {
    id: "relatorio",
    label: "Relatório automático",
    href: "/automacoes/relatorio",
    icon: <BarChart2 size={14} className="shrink-0" />,
    active: false,
  },
];

function AutomationStatusBadge({ active }: { active: boolean }) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
        aria-hidden="true"
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

type AutomationRow = { id: string; name: string };

// ponytail: automações mockadas — trocar por dados reais quando existir o construtor de workflow
const INITIAL_AUTOMATIONS: AutomationRow[] = [
  { id: "auto-1", name: "Envio de relatório semanal" },
];

function ChatsSidebarPanel() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader title="Chats" onSearchOpen={() => setSearchOpen(true)} />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <ChannelsSection />
        <ChatsSection />
      </div>
    </div>
  );
}

function AutomacoesSidebarPanel() {
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [myAutomationsOpen, setMyAutomationsOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  const addAutomation = (name: string) => {
    setAutomations((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader
          title="Automações"
          onSearchOpen={() => setSearchOpen(true)}
          onAdd={() => setCreating(true)}
        />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-4">
          <SectionLabel>Templates</SectionLabel>
          <nav className="flex flex-col gap-0.5">
            {AUTOMATION_TEMPLATES.map((template) => (
              <Link key={template.id} href={template.href} className={navClass(false)}>
                {template.icon}
                <span className="truncate">{template.label}</span>
                <AutomationStatusBadge active={template.active} />
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <SectionCollapseHeader
            title="Minhas Automações"
            open={myAutomationsOpen}
            onToggleOpen={() => setMyAutomationsOpen((v) => !v)}
            onAdd={() => setCreating(true)}
            onRenameSection={() => {}}
          />
          {myAutomationsOpen && (
            <nav className="flex flex-col gap-0.5">
              {automations.map((automation) => (
                <RowWithMenu
                  key={automation.id}
                  label={automation.name}
                  content={
                    <>
                      <Zap size={14} className="shrink-0" />
                      <span className="truncate">{automation.name}</span>
                    </>
                  }
                  onRename={() => {
                    const name = window.prompt("Novo nome", automation.name);
                    if (name)
                      setAutomations((prev) =>
                        prev.map((a) => (a.id === automation.id ? { ...a, name } : a)),
                      );
                  }}
                  onDelete={() =>
                    setAutomations((prev) => prev.filter((a) => a.id !== automation.id))
                  }
                />
              ))}
              <GhostAddRow label="New automation" onClick={() => setCreating(true)} />
            </nav>
          )}
        </div>
      </div>
      {creating && (
        <CreateAutomationModal onClose={() => setCreating(false)} onCreate={addAutomation} />
      )}
    </div>
  );
}

// ponytail: atas/documentos mockados — trocar por dados reais quando existir gravação/transcrição e integração com Autentique/DocuSign
const INITIAL_ATAS: Ata[] = [
  { id: "ata-1", title: "Reunião de kickoff", date: daysFromNow(-3, 10) },
];

const INITIAL_DOCUMENTS: DocRecord[] = [
  { id: "doc-1", title: "Contrato de prestação de serviço", status: "assinado" },
  { id: "doc-2", title: "Termo de aditivo", status: "pendente" },
];

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "assinado" ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
        aria-hidden="true"
      />
      {status === "assinado" ? "Assinado" : "Pendente"}
    </span>
  );
}

function AtasDocumentosSidebarPanel({ clients }: { clients: Client[] }) {
  const [atas, setAtas] = useState(INITIAL_ATAS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [atasOpen, setAtasOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [editingAta, setEditingAta] = useState<Ata | null | "new">(null);
  const [editingDocument, setEditingDocument] = useState<DocRecord | null | "new">(null);

  function upsertAta(ata: Ata) {
    setAtas((prev) => {
      const exists = prev.some((a) => a.id === ata.id);
      return exists ? prev.map((a) => (a.id === ata.id ? ata : a)) : [...prev, ata];
    });
  }

  function upsertDocument(document: DocRecord) {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === document.id);
      return exists ? prev.map((d) => (d.id === document.id ? document : d)) : [...prev, document];
    });
  }

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader title="Atas e Documentos" onSearchOpen={() => setSearchOpen(true)} />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-4">
          <SectionCollapseHeader
            title="Atas"
            open={atasOpen}
            onToggleOpen={() => setAtasOpen((v) => !v)}
            onAdd={() => setEditingAta("new")}
            onRenameSection={() => {}}
          />
          {atasOpen && (
            <nav className="flex flex-col gap-0.5">
              {atas.map((ata) => (
                <RowWithMenu
                  key={ata.id}
                  label={ata.title}
                  content={
                    <>
                      <FileText size={14} className="mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{ata.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {new Date(ata.date).toLocaleDateString("pt-BR")}
                          {ata.clientName ? ` · ${ata.clientName}` : ""}
                        </span>
                      </span>
                    </>
                  }
                  onRename={() => setEditingAta(ata)}
                  onDelete={() => setAtas((prev) => prev.filter((a) => a.id !== ata.id))}
                />
              ))}
              <GhostAddRow label="New ata" onClick={() => setEditingAta("new")} />
            </nav>
          )}
        </div>
        <div>
          <SectionCollapseHeader
            title="Documentos"
            open={documentsOpen}
            onToggleOpen={() => setDocumentsOpen((v) => !v)}
            onAdd={() => setEditingDocument("new")}
            onRenameSection={() => {}}
          />
          {documentsOpen && (
            <nav className="flex flex-col gap-0.5">
              {documents.map((document) => (
                <RowWithMenu
                  key={document.id}
                  label={document.title}
                  content={
                    <>
                      <FileText size={14} className="shrink-0" />
                      <span className="truncate">{document.title}</span>
                      <DocumentStatusBadge status={document.status} />
                    </>
                  }
                  onRename={() => setEditingDocument(document)}
                  onDelete={() =>
                    setDocuments((prev) => prev.filter((d) => d.id !== document.id))
                  }
                />
              ))}
              <GhostAddRow label="New document" onClick={() => setEditingDocument("new")} />
            </nav>
          )}
        </div>
      </div>
      {editingAta !== null && (
        <CreateAtaModal
          clients={clients}
          ata={editingAta === "new" ? null : editingAta}
          onClose={() => setEditingAta(null)}
          onSave={upsertAta}
        />
      )}
      {editingDocument !== null && (
        <CreateDocumentModal
          document={editingDocument === "new" ? null : editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={upsertDocument}
        />
      )}
    </div>
  );
}

function SpacesMenu({
  position,
  onClose,
  onCreateSpace,
  onExpandAll,
  onCollapseAll,
}: {
  position: FlyoutPosition;
  onClose: () => void;
  onCreateSpace: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const [showAllSpaces, setShowAllSpaces] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted";
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <FlyoutPanel position={position} onClose={onClose} width={240}>
      <button type="button" onClick={act(onCreateSpace)} className={itemClass}>
        <Plus size={15} /> Create Space
      </button>
      <button type="button" onClick={onClose} className={itemClass}>
        <LayoutGrid size={15} /> Manage Spaces
      </button>
      <div className="my-1 border-t border-border" />
      <button type="button" onClick={act(onExpandAll)} className={itemClass}>
        <ChevronDown size={15} /> Expand all Folders
      </button>
      <button type="button" onClick={act(onCollapseAll)} className={itemClass}>
        <ChevronUp size={15} /> Close all Folders
      </button>
      <div className="my-1 border-t border-border" />
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground">
        <Eye size={15} />
        <span className="flex-1">Show all Spaces</span>
        <Switch checked={showAllSpaces} onChange={setShowAllSpaces} />
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground">
        <Archive size={15} />
        <span className="flex-1">Show archived</span>
        <Switch checked={showArchived} onChange={setShowArchived} />
      </div>
      <button type="button" onClick={onClose} className={itemClass}>
        <Shuffle size={15} /> Reorder sections
      </button>
    </FlyoutPanel>
  );
}

function SpacesSectionHeader({
  open,
  onToggleOpen,
  onCreateSpace,
  onExpandAll,
  onCollapseAll,
}: {
  open: boolean;
  onToggleOpen: () => void;
  onCreateSpace: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const menu = useFlyout();

  return (
    <div className="group/spaces mb-1 flex items-center justify-between px-3">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={open ? "Colapsar Spaces" : "Expandir Spaces"}
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
      >
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Spaces
        </span>
        <ChevronDown
          size={12}
          className={`hidden shrink-0 text-muted-foreground transition-transform group-hover/spaces:inline-block ${open ? "" : "-rotate-90"}`}
        />
      </button>
      <div className="hidden shrink-0 items-center gap-0.5 group-hover/spaces:flex">
        <button
          type="button"
          aria-label="Criar space"
          onClick={onCreateSpace}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          aria-label="Mais opções de Spaces"
          onClick={menu.toggleAt}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      {menu.position && (
        <SpacesMenu
          position={menu.position}
          onClose={menu.close}
          onCreateSpace={onCreateSpace}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
        />
      )}
    </div>
  );
}

function SpacesBlock() {
  const treeRef = useRef<SidebarTreeHandle>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(true);
  const { open: openBoard } = useSpaceBoard();
  const favCtx = useContext(TreeFavoritesContext);
  useHomeNewAction("space", () => setModalOpen(true));

  useEffect(() => {
    favCtx?.setUnfavorite((id) => treeRef.current?.toggleFavorite(id));
    favCtx?.setOpenNode((id) => treeRef.current?.openNode(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSpace = (data: {
    name: string;
    icon: NodeIcon;
    description: string;
    isPrivate: boolean;
  }) => {
    treeRef.current?.addSpace({
      id: crypto.randomUUID(),
      label: data.name,
      kind: "space",
      icon: data.icon,
    });
    setModalOpen(false);
  };

  return (
    <div className="mb-4">
      <SpacesSectionHeader
        open={spacesOpen}
        onToggleOpen={() => setSpacesOpen((v) => !v)}
        onCreateSpace={() => setModalOpen(true)}
        onExpandAll={() => treeRef.current?.expandAll()}
        onCollapseAll={() => treeRef.current?.collapseAll()}
      />
      {/* mantém montado (display:none) pra não perder o estado de expand/collapse interno da árvore */}
      <div className={spacesOpen ? undefined : "hidden"}>
        <SidebarTree
          ref={treeRef}
          data={SPACES_TREE}
          defaultOpen={["mkt"]}
          onOpenBoard={openBoard}
          onNodesChange={(nodes) => favCtx?.setEntries(flattenFavorites(nodes))}
        />
      </div>
      <CreateSpaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateSpace}
      />
    </div>
  );
}

const FAVORITE_NODE_ICON: Record<SidebarTreeNodeKind, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  space: Layers,
  folder: Folder,
  table: ListChecks,
};

const FAVORITE_THREAD_ICON: Record<ChatThreadRef["type"], React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  channel: Hash,
  dm: MessagesSquare,
  ai: Bot,
};

function FavoriteRow({
  icon: Icon,
  label,
  color,
  onOpen,
  onUnfavorite,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  color?: string;
  onOpen: () => void;
  onUnfavorite: () => void;
}) {
  return (
    <div className="group/row flex items-center gap-1 rounded-md pr-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
      <button type="button" onClick={onOpen} className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left">
        <Icon size={14} className="shrink-0" style={color ? { color } : undefined} />
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        onClick={onUnfavorite}
        aria-label={`Remover ${label} dos favoritos`}
        className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-amber-400 hover:bg-border group-hover/row:flex"
      >
        <Star size={12} className="fill-current" />
      </button>
    </div>
  );
}

function FavoritesSection() {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Favorites");
  const favCtx = useContext(TreeFavoritesContext);
  const { favorites: chatFavorites, open: openChatThread, toggleFavorite: toggleChatFavorite } = useChatThread();

  const entries = favCtx?.entries ?? [];
  const total = entries.length + chatFavorites.length;
  if (total === 0) return null;

  return (
    <div className="mb-4">
      <SectionCollapseHeader title={title} open={open} onToggleOpen={() => setOpen((v) => !v)} onRenameSection={setTitle} />
      {open && (
        <nav className="flex flex-col gap-0.5">
          {entries.map((node) => (
            <FavoriteRow
              key={node.id}
              icon={FAVORITE_NODE_ICON[node.kind]}
              label={node.label}
              color={node.color}
              onOpen={() => favCtx?.openNode(node.id)}
              onUnfavorite={() => favCtx?.unfavorite(node.id)}
            />
          ))}
          {chatFavorites.map((thread) => (
            <FavoriteRow
              key={`${thread.type}-${thread.id}`}
              icon={FAVORITE_THREAD_ICON[thread.type]}
              label={thread.name}
              onOpen={() => openChatThread(thread)}
              onUnfavorite={() => toggleChatFavorite(thread)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

type HomeSectionId = "favorites" | "spaces" | "channels" | "chats";

const HOME_SECTION_RENDERERS: Record<HomeSectionId, () => React.ReactNode> = {
  favorites: () => <FavoritesSection />,
  spaces: () => <SpacesBlock />,
  channels: () => <ChannelsSection />,
  chats: () => <ChatsSection />,
};

// ponytail: ordem arrastável fica só em memória — sem persistência ainda
function DraggableSection({
  id,
  order,
  setOrder,
  children,
}: {
  id: HomeSectionId;
  order: HomeSectionId[];
  setOrder: (next: HomeSectionId[]) => void;
  children: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const draggedId = e.dataTransfer.getData("text/plain") as HomeSectionId;
        if (!draggedId || draggedId === id) return;
        const next = [...order];
        const from = next.indexOf(draggedId);
        const to = next.indexOf(id);
        if (from === -1 || to === -1) return;
        next.splice(from, 1);
        next.splice(to, 0, draggedId);
        setOrder(next);
      }}
      className={`relative cursor-grab rounded-md transition-colors active:cursor-grabbing ${
        dragOver ? "bg-muted/60" : ""
      } ${dragging ? "opacity-50" : ""}`}
    >
      {dragging && (
        <GripVertical
          size={12}
          className="pointer-events-none absolute -left-3.5 top-1.5 text-muted-foreground"
        />
      )}
      {children}
    </div>
  );
}

function HomePanel({ active }: { active: HomeTab }) {
  const [order, setOrder] = useState<HomeSectionId[]>(["favorites", "spaces", "channels", "chats"]);

  return (
    <>
      <div className="mb-4">
        <SectionLabel>Dashboard</SectionLabel>
        <nav className="flex flex-col gap-0.5">
          {DASHBOARD_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={navClass(active === item.key)}
            >
              <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-3 mb-4 border-t border-border" />
      {order.map((id) => (
        <DraggableSection key={id} id={id} order={order} setOrder={setOrder}>
          {HOME_SECTION_RENDERERS[id]()}
        </DraggableSection>
      ))}
    </>
  );
}

const POSTS_SUB_TABS: { key: ClientTab; label: string; path: string; icon: React.ReactNode }[] = [
  { key: "posts-overview", label: "Overview", path: "overview", icon: <Eye size={14} /> },
  { key: "posts-queues", label: "Queues", path: "queues", icon: <Clock size={14} /> },
];

function ClientPanel({
  clientId,
  clientName,
  active,
}: {
  clientId: string;
  clientName: string;
  active: ClientTab;
}) {
  const [postsOpen, setPostsOpen] = useState(true);
  const postsActive = active.startsWith("posts-");

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/clientes"
        className="mb-3 flex items-center gap-1 truncate px-3 text-sm text-muted-foreground hover:text-foreground-strong"
      >
        <span aria-hidden="true">←</span>
        <span className="truncate">{clientName}</span>
      </Link>

      <Link href={`/clientes/${clientId}/analytics`} className={navClass(active === "analytics")}>
        <BarChart2 size={14} className="shrink-0" />
        Analytics
      </Link>

      <div>
        <button
          type="button"
          onClick={() => setPostsOpen((v) => !v)}
          className={navClass(postsActive) + " w-full justify-between"}
        >
          <span className="flex items-center gap-2">
            <FileText size={14} className="shrink-0" />
            Posts
          </span>
          <ChevronDown size={12} className={`shrink-0 transition-transform ${postsOpen ? "" : "-rotate-90"}`} />
        </button>
        {postsOpen && (
          <div className="ml-4 flex flex-col gap-1 border-l border-border pl-2">
            {POSTS_SUB_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/clientes/${clientId}/posts/${tab.path}`}
                className={navClass(active === tab.key)}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href={`/clientes/${clientId}/ads`} className={navClass(active === "ads")}>
        <Megaphone size={14} className="shrink-0" />
        Ads
      </Link>

      <Link href={`/clientes/${clientId}/tasks`} className={navClass(active === "tasks")}>
        <CircleDot size={14} className="shrink-0" />
        Tasks
      </Link>

      <Link href={`/clientes/${clientId}/workflow`} className={navClass(active === "workflow")}>
        <HugeiconsIcon icon={WorkflowIcon} size={14} className="shrink-0" />
        Workflow
      </Link>
    </nav>
  );
}

const ACTIVE_GLOW =
  "radial-gradient(circle at 50% 45%, #86efac 0%, #15803d 55%, transparent 78%)";
const HOVER_GLOW =
  "radial-gradient(circle at 50% 45%, #9ca3af 0%, #4b5563 55%, transparent 78%)";

function PreviewList({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="truncate rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function RailIcon({
  href,
  onClick,
  label,
  active,
  preview,
  previewIsFullPanel,
  tooltip,
  children,
}: {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  active: boolean;
  preview?: React.ReactNode;
  /** Quando o preview é uma cópia do painel real da sidebar (já vem com header e tudo) — não duplica título nem limita largura ao tamanho do tooltip. */
  previewIsFullPanel?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const glow = (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 scale-[0.85] rounded-full blur-md transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ backgroundImage: active ? ACTIVE_GLOW : HOVER_GLOW }}
      />
      <span
        className={`relative z-10 flex items-center justify-center transition-colors ${
          active
            ? "text-white"
            : "text-muted-foreground group-hover:text-foreground-strong"
        }`}
      >
        {active && isValidElement<{ strokeWidth?: number }>(children)
          ? cloneElement(children, { strokeWidth: 2.5 })
          : children}
      </span>
    </>
  );

  return (
    <div className="group/rail relative flex h-9 w-9 items-center justify-center">
      {href ? (
        <Link
          href={href}
          aria-label={label}
          className="group relative flex h-9 w-9 items-center justify-center"
        >
          {glow}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="group relative flex h-9 w-9 items-center justify-center"
        >
          {glow}
        </button>
      )}
      {preview && !active && (
        // ponytail: a "ponte" (pl-3, sem margin) precisa ficar dentro da própria caixa que reage a
        // group-hover — um gap vazio (margin) entre o ícone e o card quebra o hover no meio do caminho
        // e o pointer-events-none junto trava o popup fechando antes do mouse chegar nos links.
        <div
          className="pointer-events-none absolute left-full top-0 z-20 origin-left pl-3 opacity-0 transition-all duration-150 group-hover/rail:pointer-events-auto group-hover/rail:opacity-100"
        >
          <div
            className={`relative scale-95 rounded-xl border border-border bg-background-elevated shadow-xl transition-transform duration-150 group-hover/rail:scale-100 ${
              previewIsFullPanel ? "h-[80vh] w-72 overflow-y-auto p-2" : "w-56 p-3"
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-4 h-3 w-3 rotate-45 border-b border-l border-border bg-background-elevated"
            />
            {!previewIsFullPanel && (
              <p className="mb-2 truncate px-1 text-sm font-semibold text-foreground-strong">
                {label}
              </p>
            )}
            {preview}
          </div>
        </div>
      )}
      {tooltip && !active && (
        <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 w-max max-w-48 origin-left -translate-y-1/2 scale-95 rounded-lg border border-border bg-background-elevated px-3 py-2 opacity-0 shadow-xl transition-all duration-150 group-hover/rail:scale-100 group-hover/rail:opacity-100">
          <span
            aria-hidden="true"
            className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-border bg-background-elevated"
          />
          <p className="text-sm text-muted-foreground">{tooltip}</p>
        </div>
      )}
    </div>
  );
}

function RailAction({
  href,
  label,
  onClick,
  children,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 scale-[0.85] rounded-full opacity-0 blur-md transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundImage: HOVER_GLOW }}
      />
      <span className="relative z-10 flex items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground-strong">
        {children}
      </span>
    </>
  );

  if (!href) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="group relative flex h-9 w-9 items-center justify-center"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative flex h-9 w-9 items-center justify-center"
    >
      {content}
    </Link>
  );
}

type ConnectionApp = { id: string; label: string; icon: IconSvgElement | typeof LayoutGrid };

const CONNECTION_CATEGORIES: { title: string; apps: ConnectionApp[] }[] = [
  {
    title: "Mensagens",
    apps: [
      { id: "whatsapp", label: "WhatsApp", icon: WhatsappIcon },
      { id: "instagram", label: "Instagram", icon: InstagramIcon },
      { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon },
      { id: "tiktok", label: "TikTok", icon: TiktokIcon },
    ],
  },
  {
    title: "Plataformas de trabalho",
    apps: [
      { id: "slack", label: "Slack", icon: SlackIcon },
      { id: "clickup", label: "ClickUp", icon: LayoutGrid },
      { id: "trello", label: "Trello", icon: TrelloIcon },
      { id: "monday", label: "Monday", icon: LayoutGrid },
      { id: "notion", label: "Notion", icon: NotionIcon },
    ],
  },
  {
    title: "IA",
    apps: [
      { id: "chatgpt", label: "ChatGPT", icon: ChatGptIcon },
      { id: "claude", label: "Claude", icon: ClaudeIcon },
    ],
  },
];

function isIconSvgElement(icon: IconSvgElement | typeof LayoutGrid): icon is IconSvgElement {
  return Array.isArray(icon);
}

function ConnectionAppIcon({ icon }: { icon: ConnectionApp["icon"] }) {
  return isIconSvgElement(icon) ? (
    <HugeiconsIcon icon={icon} size={20} />
  ) : (
    <LayoutGrid size={20} />
  );
}

function ConnectionsGrid({ onSelect }: { onSelect: (app: ConnectionApp) => void }) {
  return (
    <div className="max-h-[70vh] overflow-y-auto p-2">
      {CONNECTION_CATEGORIES.map((category) => (
        <div key={category.title} className="mb-3 last:mb-0">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category.title}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {category.apps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => onSelect(app)}
                className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-muted"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground-strong">
                  <ConnectionAppIcon icon={app.icon} />
                </span>
                <span className="truncate text-xs text-muted-foreground">{app.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectAppModal({ app, onClose }: { app: ConnectionApp; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground-strong">
            <ConnectionAppIcon icon={app.icon} />
          </span>
          <h2 className="text-sm font-semibold text-foreground-strong">Conectar {app.label}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          A integração com {app.label} chega em breve.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarPanelHeader({
  title,
  onSearchOpen,
  onAdd,
}: {
  title: string;
  onSearchOpen: () => void;
  onAdd?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-1 px-3">
      <p className="truncate text-base font-bold text-foreground-strong">
        {title}
      </p>
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex items-center gap-0.5 pointer-events-none opacity-0 transition-opacity duration-200 group-hover/sidebar-panel:pointer-events-auto group-hover/sidebar-panel:opacity-100">
          <button
            type="button"
            onClick={onSearchOpen}
            aria-label="Buscar na sidebar"
            style={{ transitionDelay: "120ms" }}
            className="flex h-7 w-7 translate-x-[10px] items-center justify-center rounded-md text-muted-foreground transition-all duration-200 ease-out hover:bg-muted hover:text-foreground group-hover/sidebar-panel:translate-x-0"
          >
            <Search size={14} />
          </button>
          <button
            type="button"
            aria-label="Filtrar"
            style={{ transitionDelay: "60ms" }}
            className="flex h-7 w-7 translate-x-[10px] items-center justify-center rounded-md text-muted-foreground transition-all duration-200 ease-out hover:bg-muted hover:text-foreground group-hover/sidebar-panel:translate-x-0"
          >
            <ListFilter size={14} />
          </button>
          <button
            type="button"
            aria-label="Colapsar sidebar"
            style={{ transitionDelay: "0ms" }}
            className="flex h-7 w-7 translate-x-[10px] items-center justify-center rounded-md text-muted-foreground transition-all duration-200 ease-out hover:bg-muted hover:text-foreground group-hover/sidebar-panel:translate-x-0"
          >
            <ChevronsLeft size={14} />
          </button>
        </div>
        <button
          type="button"
          aria-label="Adicionar"
          onClick={onAdd}
          className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-1 text-foreground-strong transition-colors hover:bg-border"
        >
          <Plus size={14} />
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}

function SidebarSearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  return (
    <div className="flex h-11 shrink-0 items-center px-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-foreground-strong/30 bg-muted px-2 py-1.5">
        <Search size={14} className="text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sidebar…"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          aria-label="Fechar busca"
          onClick={() => {
            setQuery("");
            onClose();
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted-foreground/40 text-background transition-colors hover:bg-muted-foreground/70"
        >
          <X size={10} />
        </button>
      </div>
    </div>
  );
}

const HOME_NEW_OPTIONS: { target: HomeNewTarget; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { target: "space", label: "Space", icon: Layers },
  { target: "channel", label: "Channel", icon: Hash },
  { target: "dm", label: "Direct message", icon: MessagesSquare },
  { target: "ai", label: "AI chat", icon: Bot },
];

function HomeSidebarPanel({ active }: { active: HomeTab }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [pending, setPending] = useState<HomeNewTarget | null>(null);
  const menu = useFlyout();

  const [favEntries, setFavEntries] = useState<SidebarTreeNode[]>([]);
  const unfavoriteRef = useRef<(id: string) => void>(() => {});
  const openNodeRef = useRef<(id: string) => void>(() => {});
  const favCtxValue = useMemo(
    () => ({
      entries: favEntries,
      setEntries: setFavEntries,
      unfavorite: (id: string) => unfavoriteRef.current(id),
      setUnfavorite: (fn: (id: string) => void) => {
        unfavoriteRef.current = fn;
      },
      openNode: (id: string) => openNodeRef.current(id),
      setOpenNode: (fn: (id: string) => void) => {
        openNodeRef.current = fn;
      },
    }),
    [favEntries],
  );

  return (
    <HomeNewActionContext.Provider value={{ pending, request: setPending, clear: () => setPending(null) }}>
      <TreeFavoritesContext.Provider value={favCtxValue}>
        <div className="group/sidebar-panel flex h-full flex-col">
          {searchOpen ? (
            <SidebarSearchBar onClose={() => setSearchOpen(false)} />
          ) : (
            <SidebarPanelHeader title="Home" onSearchOpen={() => setSearchOpen(true)} onAdd={menu.toggleAt} />
          )}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <HomePanel active={active} />
          </div>
        </div>
        {menu.position && (
          <FlyoutPanel position={menu.position} onClose={menu.close} width={200}>
            {HOME_NEW_OPTIONS.map((opt) => (
              <button
                key={opt.target}
                type="button"
                onClick={() => {
                  setPending(opt.target);
                  menu.close();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
              >
                <opt.icon size={15} />
                {opt.label}
              </button>
            ))}
          </FlyoutPanel>
        )}
      </TreeFavoritesContext.Provider>
    </HomeNewActionContext.Provider>
  );
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

function ClientAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong">
      {getInitial(name)}
    </span>
  );
}

const HEALTH_COLOR: Record<ClientHealth, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
};

function ClientRow({
  client,
  busy,
  onToggleArchived,
  onRename,
  onDelete,
}: {
  client: Client;
  busy: boolean;
  onToggleArchived: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const menu = useFlyout();

  return (
    <div className="group/row relative flex items-center gap-1 rounded-md pr-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Link
        href={`/clientes/${client.id}/analytics`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${HEALTH_COLOR[client.health]}`}
          aria-hidden="true"
        />
        <ClientAvatar name={client.name} />
        <span className="truncate">{client.name}</span>
      </Link>
      <div className="hidden shrink-0 items-center group-hover/row:flex">
        <button
          type="button"
          aria-label={`Mais opções de ${client.name}`}
          onClick={menu.toggleAt}
          disabled={busy}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground disabled:opacity-50"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      {menu.position && (
        <FlyoutPanel position={menu.position} onClose={menu.close} width={200}>
          <button
            type="button"
            onClick={() => {
              onToggleArchived();
              menu.close();
            }}
            disabled={busy}
            className={ROW_CLASS}
          >
            {client.archived ? (
              <>
                <ArchiveRestore size={14} /> Desarquivar
              </>
            ) : (
              <>
                <Archive size={14} /> Arquivar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onRename();
              menu.close();
            }}
            disabled={busy}
            className={ROW_CLASS}
          >
            <Pencil size={14} /> Renomear
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              onDelete();
              menu.close();
            }}
            disabled={busy}
            className={`${ROW_CLASS} text-red-400`}
          >
            <Trash2 size={14} /> Excluir
          </button>
        </FlyoutPanel>
      )}
    </div>
  );
}

type GroupBy = "none" | "service_type" | "assigned_to" | "niche";

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  trafego: "Tráfego",
  conteudo: "Conteúdo",
  chamadas: "Chamadas",
  "360": "360",
  outro: "Outro",
};

function groupLabel(groupBy: GroupBy, key: string, members: AgencyMember[]): string {
  if (groupBy === "service_type") {
    return key === "" ? "Sem plano/serviço" : SERVICE_TYPE_LABEL[key as ServiceType];
  }
  if (groupBy === "assigned_to") {
    if (key === "") return "Sem responsável";
    const member = members.find((m) => m.id === key);
    return member ? member.user_id.slice(0, 8) : "Responsável removido";
  }
  if (groupBy === "niche") {
    return key === "" ? "Sem nicho" : key;
  }
  return "";
}

function groupClients(clients: Client[], groupBy: GroupBy): { key: string; clients: Client[] }[] {
  if (groupBy === "none") return [{ key: "", clients }];
  const map = new Map<string, Client[]>();
  for (const client of clients) {
    const key =
      groupBy === "service_type"
        ? (client.service_type ?? "")
        : groupBy === "assigned_to"
          ? (client.assigned_to ?? "")
          : (client.niche ?? "");
    const bucket = map.get(key) ?? [];
    bucket.push(client);
    map.set(key, bucket);
  }
  const entries = Array.from(map.entries()).map(([key, clients]) => ({ key, clients }));
  // grupo "sem valor" (key === "") sempre por último
  entries.sort((a, b) => {
    if (a.key === "" && b.key !== "") return 1;
    if (b.key === "" && a.key !== "") return -1;
    return a.key.localeCompare(b.key);
  });
  return entries;
}

function ClientGroupSection({
  title,
  clients,
  busyId,
  onToggleArchived,
  onRename,
  onDelete,
}: {
  title: string;
  clients: Client[];
  busyId: string | null;
  onToggleArchived: (client: Client) => void;
  onRename: (client: Client) => void;
  onDelete: (client: Client) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onRenameSection={() => {}}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              busy={busyId === client.id}
              onToggleArchived={() => onToggleArchived(client)}
              onRename={() => onRename(client)}
              onDelete={() => onDelete(client)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

function ClientsSidebarPanel({
  agencyId,
  members,
  initialClients,
}: {
  agencyId: string;
  members: AgencyMember[];
  initialClients: Client[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null | "new">(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);
  const groups = groupClients(active, groupBy);

  function upsert(client: Client) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      const next = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async function toggleArchived(client: Client) {
    setBusyId(client.id);
    try {
      const supabase = createBrowserSupabaseClient();
      const saved = await updateClient(supabase, client.id, { archived: !client.archived });
      upsert(saved);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Excluir "${client.name}"? Todas as tarefas desse cliente também serão excluídas. Essa ação não pode ser desfeita.`)) return;
    setBusyId(client.id);
    try {
      const supabase = createBrowserSupabaseClient();
      await deleteClient(supabase, client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader
          title="Clientes"
          onSearchOpen={() => setSearchOpen(true)}
          onAdd={() => setEditing("new")}
        />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-2 px-1">
          <select
            aria-label="Agrupar por"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="none">Agrupar por: Nenhum</option>
            <option value="service_type">Agrupar por: Plano ou serviço</option>
            <option value="assigned_to">Agrupar por: Responsável</option>
            <option value="niche">Agrupar por: Nicho</option>
          </select>
        </div>
        {groupBy === "none" ? (
          <nav className="flex flex-col gap-0.5">
            {active.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                busy={busyId === client.id}
                onToggleArchived={() => toggleArchived(client)}
                onRename={() => setEditing(client)}
                onDelete={() => handleDelete(client)}
              />
            ))}
          </nav>
        ) : (
          groups.map((group) => (
            <ClientGroupSection
              key={group.key}
              title={groupLabel(groupBy, group.key, members)}
              clients={group.clients}
              busyId={busyId}
              onToggleArchived={toggleArchived}
              onRename={setEditing}
              onDelete={handleDelete}
            />
          ))
        )}
        {archived.length > 0 && (
          <div className="mt-4">
            <SectionCollapseHeader
              title="Arquivados"
              open={archivedOpen}
              onToggleOpen={() => setArchivedOpen((v) => !v)}
              onRenameSection={() => {}}
            />
            {archivedOpen && (
              <nav className="flex flex-col gap-0.5">
                {archived.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    busy={busyId === client.id}
                    onToggleArchived={() => toggleArchived(client)}
                    onRename={() => setEditing(client)}
                    onDelete={() => handleDelete(client)}
                  />
                ))}
              </nav>
            )}
          </div>
        )}
      </div>
      {editing !== null && (
        <ClientFormModal
          agencyId={agencyId}
          members={members}
          client={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
      )}
    </div>
  );
}

export function SidebarPanel({ context }: { context: SidebarContext }) {
  if (context.type === "home") {
    return <HomeSidebarPanel active={context.active} />;
  }
  if (context.type === "clients") {
    return (
      <ClientsSidebarPanel
        agencyId={context.agencyId}
        members={context.members}
        initialClients={context.initialClients}
      />
    );
  }
  if (context.type === "client") {
    return (
      <div className="h-full overflow-y-auto px-4 py-5">
        <ClientPanel
          clientId={context.clientId}
          clientName={context.clientName}
          active={context.active}
        />
      </div>
    );
  }
  if (context.type === "inbox") {
    return <InboxSidebarPanel />;
  }
  if (context.type === "chats") {
    return <ChatsSidebarPanel />;
  }
  if (context.type === "calendario") {
    return <CalendarioSidebarPanel clients={context.clients} />;
  }
  if (context.type === "automacoes") {
    return <AutomacoesSidebarPanel />;
  }
  if (context.type === "atas") {
    return <AtasDocumentosSidebarPanel clients={context.clients} />;
  }
  return null;
}

export function Sidebar({
  context,
}: {
  context: SidebarContext;
  agencyName: string;
}) {
  const isClientsSection =
    context.type === "clients" || context.type === "client";
  const connectionsMenu = useFlyout();
  const [connectingApp, setConnectingApp] = useState<ConnectionApp | null>(null);
  const previewData = useSidebarPreviewData();

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 self-stretch rounded-xl border border-border bg-background-elevated py-5">
      <RailIcon
        href="/home/dashboard"
        label="Home"
        active={context.type === "home"}
        preview={<HomeSidebarPanel active="dashboard" />}
        previewIsFullPanel
      >
        <HugeiconsIcon icon={Home02Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/clientes"
        label="Clientes"
        active={isClientsSection}
        preview={
          previewData ? (
            <ClientsSidebarPanel
              agencyId={previewData.agencyId}
              members={previewData.members}
              initialClients={previewData.clients}
            />
          ) : (
            <PreviewList items={[{ label: "Todos os clientes", href: "/clientes" }]} />
          )
        }
        previewIsFullPanel
      >
        <HugeiconsIcon icon={UserGroup03Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/inbox"
        label="Inbox"
        active={context.type === "inbox"}
        preview={<InboxSidebarPanel />}
        previewIsFullPanel
      >
        <MessagesSquare size={18} />
      </RailIcon>
      <RailIcon
        href="/calendario"
        label="Calendário"
        active={context.type === "calendario"}
        preview={<CalendarioSidebarPanel clients={previewData?.clients ?? []} />}
        previewIsFullPanel
      >
        <HugeiconsIcon icon={CalendarDate1Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/automacoes"
        label="Automações"
        active={context.type === "automacoes"}
        preview={<AutomacoesSidebarPanel />}
        previewIsFullPanel
      >
        <HugeiconsIcon icon={WorkflowIcon} size={18} />
      </RailIcon>
      <RailIcon
        href="/atas"
        label="Atas e documentos"
        active={context.type === "atas"}
        preview={<AtasDocumentosSidebarPanel clients={previewData?.clients ?? []} />}
        previewIsFullPanel
      >
        <FileText size={18} />
      </RailIcon>
      <RailIcon
        label="Hub de conexões"
        active={!!connectionsMenu.position}
        onClick={connectionsMenu.toggleAt}
        tooltip="Conecte seus outros apps"
      >
        <HugeiconsIcon icon={GripIcon} size={18} />
      </RailIcon>
      {connectionsMenu.position && (
        <FlyoutPanel position={connectionsMenu.position} onClose={connectionsMenu.close} width={280}>
          <ConnectionsGrid
            onSelect={(app) => {
              setConnectingApp(app);
              connectionsMenu.close();
            }}
          />
        </FlyoutPanel>
      )}
      {connectingApp && (
        <ConnectAppModal app={connectingApp} onClose={() => setConnectingApp(null)} />
      )}
      <div className="mt-auto flex flex-col items-center gap-2">
        {/* ponytail: sem ação ainda, adicionar modal/rota quando essas features existirem */}
        <RailAction label="Convidar colaboradores">
          <HugeiconsIcon icon={UserRoundPlusIcon} size={18} />
        </RailAction>
        <RailAction label="Upgrade">
          <CircleFadingArrowUp size={18} />
        </RailAction>
      </div>
    </aside>
  );
}
