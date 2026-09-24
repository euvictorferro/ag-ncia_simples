"use client";

import { cloneElement, isValidElement, useRef, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import {
  SidebarTree,
  type SidebarTreeNode,
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
import { ClientFormModal } from "@/components/clientes/ClientFormModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { updateClient, deleteClient, type Client } from "@/lib/clients";

export type HomeTab = "dashboard" | "financeiro" | "tasks" | "pessoal";
export type ClientTab =
  "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos";

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients"; agencyId: string; initialClients: Client[] }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" }
  | { type: "calendario" }
  | { type: "automacoes" }
  | { type: "atas" }
  | { type: "conexoes" };

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
    icon: { type: "emoji", value: "📣" },
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
  open,
  onToggleOpen,
  onAdd,
  onRenameSection,
  subsection,
}: {
  title: string;
  open: boolean;
  onToggleOpen: () => void;
  onAdd?: () => void;
  onRenameSection: (title: string) => void;
  subsection?: boolean;
}) {
  const menu = useFlyout();

  return (
    <div className="group/section-header relative mb-1 flex items-center gap-1 px-3">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={open ? `Colapsar ${title}` : `Expandir ${title}`}
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
      >
        <span
          className={`truncate font-semibold uppercase tracking-wide text-muted-foreground ${
            subsection ? "text-[10px]" : "text-xs"
          }`}
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
  onRename,
  onDelete,
}: {
  content: React.ReactNode;
  label: string;
  extra?: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
}) {
  const menu = useFlyout();

  return (
    <div className="group/row relative flex items-center gap-1 rounded-md pr-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <button
        type="button"
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

type Channel = { id: string; name: string; private?: boolean };

// ponytail: canais/mensagens/AI chats mockados — trocar por dados reais quando existir backend de chat
const INITIAL_CHANNELS: Channel[] = [
  { id: "ch-1", name: "[Equipe] - Clique Boost", private: true },
];

function ChannelsSection() {
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Channels");

  const addChannel = () => {
    const name = window.prompt("Nome do canal");
    if (name)
      setChannels((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onAdd={addChannel}
        onRenameSection={setTitle}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          <Link href="/chats" className={navClass(false)}>
            <Layers size={14} className="shrink-0" />
            All Channels
          </Link>
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
          <GhostAddRow label="Add Channel" onClick={addChannel} />
        </nav>
      )}
    </div>
  );
}

type DirectMessage = {
  id: string;
  name: string;
  you?: boolean;
  online?: boolean;
};
type AiChat = { id: string; title: string };

const INITIAL_DMS: DirectMessage[] = [
  { id: "dm-1", name: "Vicenzo Valentino" },
  { id: "dm-2", name: "Leonardo Gualbino", online: true },
  { id: "dm-3", name: "Clique Boost" },
  { id: "dm-4", name: "Victor Ferro", you: true, online: true },
];

const INITIAL_AI_CHATS: AiChat[] = [
  { id: "ai-1", title: "Create Brand Voice Skill" },
  { id: "ai-2", title: "Untitled" },
];

function ChatsSection() {
  const [dms, setDms] = useState(INITIAL_DMS);
  const [aiChats, setAiChats] = useState(INITIAL_AI_CHATS);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [chatsTitle, setChatsTitle] = useState("Chats");
  const [dmsTitle, setDmsTitle] = useState("Direct Messages");
  const [aiTitle, setAiTitle] = useState("AI Chats");

  const addDm = () => {
    const name = window.prompt("Nome do contato");
    if (name) setDms((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };
  const addAiChat = () => {
    const title = window.prompt("Título do novo chat");
    if (title)
      setAiChats((prev) => [...prev, { id: crypto.randomUUID(), title }]);
  };

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
            onAdd={addDm}
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
              <GhostAddRow label="New message" onClick={addDm} />
            </nav>
          )}
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

type ProspectChannel = "whatsapp" | "instagram" | "email" | "apple";

const CHANNEL_ICON: Record<ProspectChannel, IconSvgElement> = {
  whatsapp: WhatsappIcon,
  instagram: InstagramIcon,
  email: Mail01Icon,
  apple: AppleIcon,
};

function ChannelIcon({ channel }: { channel: ProspectChannel }) {
  return (
    <HugeiconsIcon
      icon={CHANNEL_ICON[channel]}
      size={14}
      className="shrink-0 text-muted-foreground"
    />
  );
}

type TeamChat = { id: string; name: string; online?: boolean };
type Prospect = { id: string; name: string; channel: ProspectChannel };

// ponytail: chats/prospecção mockados — trocar por dados reais quando existir CRM/integrações de canal
const INITIAL_TEAM_CHATS: TeamChat[] = [
  { id: "team-1", name: "Financeiro", online: true },
  { id: "team-2", name: "Victor Ferro", online: true },
];

const INITIAL_PROSPECTS: Prospect[] = [
  { id: "prospect-1", name: "Ana Souza", channel: "whatsapp" },
  { id: "prospect-2", name: "Bruno Lima", channel: "instagram" },
  { id: "prospect-3", name: "Clínica Vitalis", channel: "email" },
  { id: "prospect-4", name: "Diego Martins", channel: "apple" },
];

function TeamChatsSection() {
  const [chats, setChats] = useState(INITIAL_TEAM_CHATS);
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Chats da equipe");

  const addChat = () => {
    const name = window.prompt("Nome do contato");
    if (name) setChats((prev) => [...prev, { id: crypto.randomUUID(), name }]);
  };

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onAdd={addChat}
        onRenameSection={setTitle}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          {chats.map((chat) => (
            <RowWithMenu
              key={chat.id}
              label={chat.name}
              content={
                <>
                  <Avatar name={chat.name} online={chat.online} />
                  <span className="truncate">{chat.name}</span>
                </>
              }
              onRename={() => {
                const name = window.prompt("Novo nome", chat.name);
                if (name)
                  setChats((prev) =>
                    prev.map((c) => (c.id === chat.id ? { ...c, name } : c)),
                  );
              }}
              onDelete={() =>
                setChats((prev) => prev.filter((c) => c.id !== chat.id))
              }
            />
          ))}
          <GhostAddRow label="New message" onClick={addChat} />
        </nav>
      )}
    </div>
  );
}

function ProspeccaoSection() {
  const [prospects, setProspects] = useState(INITIAL_PROSPECTS);
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("Prospecção");

  const addProspect = () => {
    const name = window.prompt("Nome do contato");
    if (name)
      setProspects((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name, channel: "whatsapp" },
      ]);
  };

  return (
    <div className="mb-4">
      <SectionCollapseHeader
        title={title}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onAdd={addProspect}
        onRenameSection={setTitle}
      />
      {open && (
        <nav className="flex flex-col gap-0.5">
          {prospects.map((prospect) => (
            <RowWithMenu
              key={prospect.id}
              label={prospect.name}
              content={
                <>
                  <ChannelIcon channel={prospect.channel} />
                  <span className="truncate">{prospect.name}</span>
                </>
              }
              onRename={() => {
                const name = window.prompt("Novo nome", prospect.name);
                if (name)
                  setProspects((prev) =>
                    prev.map((p) => (p.id === prospect.id ? { ...p, name } : p)),
                  );
              }}
              onDelete={() =>
                setProspects((prev) => prev.filter((p) => p.id !== prospect.id))
              }
            />
          ))}
          <GhostAddRow label="New contact" onClick={addProspect} />
        </nav>
      )}
    </div>
  );
}

function ChatsPagePanel() {
  return (
    <>
      <div className="mb-4">
        <SectionLabel>Geral</SectionLabel>
        <nav className="flex flex-col gap-0.5">
          <Link href="/chats" className={navClass(true)}>
            <MessageSquare size={16} className="shrink-0" />
            Dashboard CRM
          </Link>
        </nav>
      </div>
      <div className="mx-3 mb-4 border-t border-border" />
      <TeamChatsSection />
      <ProspeccaoSection />
    </>
  );
}

function ChatsPageSidebarPanel() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader title="Chats" onSearchOpen={() => setSearchOpen(true)} />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <ChatsPagePanel />
      </div>
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
        <SidebarTree ref={treeRef} data={SPACES_TREE} defaultOpen={["mkt"]} />
      </div>
      <CreateSpaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateSpace}
      />
    </div>
  );
}

type HomeSectionId = "spaces" | "channels" | "chats";

const HOME_SECTION_RENDERERS: Record<HomeSectionId, () => React.ReactNode> = {
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
  const [order, setOrder] = useState<HomeSectionId[]>(["spaces", "channels", "chats"]);

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

const CLIENT_TABS: { key: ClientTab; label: string; path: string }[] = [
  { key: "dashboard", label: "Dashboard", path: "dashboard" },
  { key: "anuncios", label: "Anúncios", path: "anuncios" },
  { key: "organico", label: "Orgânico", path: "organico" },
  { key: "financeiro", label: "Financeiro", path: "financeiro" },
  { key: "tasks", label: "Tarefas", path: "tarefas" },
  { key: "conteudos", label: "Conteúdos", path: "conteudos" },
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
  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/clientes"
        className="mb-3 flex items-center gap-1 truncate px-3 text-sm text-muted-foreground hover:text-foreground-strong"
      >
        <span aria-hidden="true">←</span>
        <span className="truncate">{clientName}</span>
      </Link>
      {CLIENT_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/clientes/${clientId}/${tab.path}`}
          className={navClass(active === tab.key)}
        >
          {tab.label}
        </Link>
      ))}
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
  label,
  active,
  preview,
  tooltip,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  preview?: React.ReactNode;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/rail relative flex h-9 w-9 items-center justify-center">
      <Link
        href={href}
        aria-label={label}
        className="group relative flex h-9 w-9 items-center justify-center"
      >
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
      </Link>
      {preview && !active && (
        <div className="pointer-events-none absolute left-full top-0 z-20 ml-3 w-56 origin-left scale-95 rounded-xl border border-border bg-background-elevated p-3 opacity-0 shadow-xl transition-all duration-150 group-hover/rail:pointer-events-auto group-hover/rail:scale-100 group-hover/rail:opacity-100">
          <span
            aria-hidden="true"
            className="absolute -left-1.5 top-4 h-3 w-3 rotate-45 border-b border-l border-border bg-background-elevated"
          />
          <p className="mb-2 truncate px-1 text-sm font-semibold text-foreground-strong">
            {label}
          </p>
          {preview}
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

function SidebarPanelHeader({
  title,
  onSearchOpen,
  onAdd,
}: {
  title: string;
  onSearchOpen: () => void;
  onAdd?: () => void;
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

function HomeSidebarPanel({ active }: { active: HomeTab }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="group/sidebar-panel flex h-full flex-col">
      {searchOpen ? (
        <SidebarSearchBar onClose={() => setSearchOpen(false)} />
      ) : (
        <SidebarPanelHeader title="Home" onSearchOpen={() => setSearchOpen(true)} />
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <HomePanel active={active} />
      </div>
    </div>
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
        href={`/clientes/${client.id}/tarefas`}
        className="flex h-full min-w-0 flex-1 items-center gap-2 truncate px-3 py-2 text-left"
      >
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

function ClientsSidebarPanel({
  agencyId,
  initialClients,
}: {
  agencyId: string;
  initialClients: Client[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null | "new">(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);

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
  if (context.type === "chats") {
    return <ChatsPageSidebarPanel />;
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

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 self-stretch rounded-xl border border-border bg-background-elevated py-5">
      <RailIcon
        href="/home/dashboard"
        label="Home"
        active={context.type === "home"}
        preview={
          <PreviewList
            items={[
              { label: "Dashboard", href: "/home/dashboard" },
              { label: "Financeiro", href: "/home/financeiro" },
              { label: "Tasks", href: "/home/tasks" },
            ]}
          />
        }
      >
        <HugeiconsIcon icon={Home02Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/clientes"
        label="Clientes"
        active={isClientsSection}
        preview={
          <PreviewList
            items={[{ label: "Todos os clientes", href: "/clientes" }]}
          />
        }
      >
        <HugeiconsIcon icon={UserGroup03Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/inbox"
        label="Inbox"
        active={context.type === "inbox"}
        preview={
          <p className="px-1 text-sm text-muted-foreground">
            Mensagens de WhatsApp, e-mail e direct em breve.
          </p>
        }
      >
        <MessagesSquare size={18} />
      </RailIcon>
      <RailIcon
        href="/calendario"
        label="Calendário"
        active={context.type === "calendario"}
        preview={
          <p className="px-1 text-sm text-muted-foreground">Em breve.</p>
        }
      >
        <HugeiconsIcon icon={CalendarDate1Icon} size={18} />
      </RailIcon>
      <RailIcon
        href="/automacoes"
        label="Automações"
        active={context.type === "automacoes"}
        preview={
          <p className="px-1 text-sm text-muted-foreground">Em breve.</p>
        }
      >
        <HugeiconsIcon icon={WorkflowIcon} size={18} />
      </RailIcon>
      <RailIcon
        href="/atas"
        label="Atas e documentos"
        active={context.type === "atas"}
        preview={
          <p className="px-1 text-sm text-muted-foreground">Em breve.</p>
        }
      >
        <FileText size={18} />
      </RailIcon>
      <RailIcon
        href="/conexoes"
        label="Hub de conexões"
        active={context.type === "conexoes"}
        tooltip="Conecte seus outros apps"
      >
        <HugeiconsIcon icon={GripIcon} size={18} />
      </RailIcon>
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
