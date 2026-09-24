"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarDate1Icon, WorkflowIcon } from "@hugeicons/core-free-icons";
import {
  Search,
  ChevronDown,
  MessageCircle,
  ListChecks,
  Settings,
  Users,
  Puzzle,
  LayoutTemplate,
  SlidersHorizontal,
  Tag,
  Plus,
  Code2,
  Mail,
  Box,
  FolderKanban,
  Sparkles,
  Bell,
  Paintbrush,
  Command,
  Download,
  HelpCircle,
  Briefcase,
  Timer,
  ClipboardList,
  Video,
  Mic,
  AlarmClock,
  UserPlus2,
  BarChart3,
  MessageSquarePlus,
  Trash2,
  LogOut,
  SmilePlus,
  VolumeX,
  ChevronRight,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";

function AutomationsIcon({ size }: { size?: number }) {
  return <HugeiconsIcon icon={WorkflowIcon} size={size} />;
}

const MANAGE_ITEMS = [
  { label: "Apps", icon: Puzzle },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Custom Fields", icon: SlidersHorizontal },
  { label: "Automations", icon: AutomationsIcon },
  { label: "Tag Manager", icon: Tag, badge: "New" },
];

const PERSONAL_TOOLS = [
  { label: "Create task", icon: ClipboardList },
  { label: "My Work", icon: Briefcase },
  { label: "Track Time", icon: Timer },
  { label: "Notepad", icon: FileText },
  { label: "Record a Clip", icon: Video },
  { label: "Talk to Text", icon: Mic },
  { label: "Create Reminder", icon: AlarmClock },
  { label: "Create Doc", icon: FileText },
  { label: "View People", icon: UserPlus2 },
  { label: "Create Dashboard", icon: BarChart3 },
  { label: "AI Notetaker", icon: MessageSquarePlus },
];

const SEARCH_PROVIDERS = [
  { label: "ClickUp", icon: Sparkles },
  { label: "Google Drive", icon: Box },
  { label: "GitHub", icon: Code2 },
  { label: "Gmail", icon: Mail },
  { label: "Dropbox", icon: Box },
  { label: "SharePoint", icon: FolderKanban },
  { label: "Notion", icon: FileText },
];

const SEARCH_RESULTS = [
  { label: "Bela", meta: "in Clientes · 7mo ago" },
  { label: "Sam", meta: "in Clientes · 7mo ago" },
  { label: "Nelson", meta: "in Clientes · 7mo ago" },
  { label: "Laís", meta: "in Clientes · 1mo ago" },
];

function WorkspaceGlyph({ initial }: { initial: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-emerald-800 text-xs font-semibold text-white">
      {initial}
    </span>
  );
}

function WorkspaceMenu({ agencyName }: { agencyName: string }) {
  const [open, setOpen] = useState(false);
  const initial = agencyName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground-strong transition-colors hover:bg-muted"
      >
        <WorkspaceGlyph initial={initial} />
        <span className="truncate">{agencyName}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-border bg-background-elevated p-3 shadow-xl">
            <div className="flex items-center gap-3 px-1 pb-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-800 text-base font-semibold text-white">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground-strong">{agencyName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Free Forever · <span className="cursor-pointer underline">Upgrade</span>
                </p>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-foreground hover:bg-muted"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-foreground hover:bg-muted"
              >
                <Users size={16} /> People
              </button>
            </div>

            <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Manage</p>
            <nav className="mb-3 flex flex-col gap-0.5">
              {MANAGE_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <item.icon size={16} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="border-t border-border pt-3">
              <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Switch Workspaces</p>
              <button
                type="button"
                className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-600 text-xs font-semibold text-white">
                  A
                </span>
                Advocacia Ferro
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus size={14} /> Create Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NextEventBadge() {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeiconsIcon icon={CalendarDate1Icon} size={14} className="text-indigo-400" />
      {/* ponytail: mock — plugar próximo evento real quando integração de calendário existir */}
      <span className="truncate">
        Reunião Tráfego <span className="text-foreground-strong">in 13m</span>
      </span>
    </button>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24">
      <button type="button" aria-label="Fechar busca" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-background-elevated p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search, run a command, or ask a question…"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-4 overflow-x-auto border-b border-border pb-2 text-sm text-muted-foreground">
          <span className="shrink-0 border-b-2 border-foreground-strong pb-2 -mb-2 font-medium text-foreground-strong">
            All
          </span>
          {SEARCH_PROVIDERS.map((provider) => (
            <span key={provider.label} className="flex shrink-0 items-center gap-1.5">
              <provider.icon size={14} /> {provider.label}
            </span>
          ))}
        </div>

        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Calendar Schedule</p>
        <div className="mb-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <HugeiconsIcon icon={CalendarDate1Icon} size={16} className="text-indigo-400" />
            Reunião Tráfego
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
              in 9 min
            </span>
          </span>
          <span className="text-muted-foreground">04:00 PM - 05:00 PM</span>
        </div>

        <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Results</p>
        <div className="flex flex-col">
          {SEARCH_RESULTS.map((result) => (
            <button
              key={result.label}
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <ListChecks size={16} className="text-muted-foreground" />
              <span className="font-medium">{result.label}</span>
              <span className="text-muted-foreground">{result.meta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ponytail: notificações mockadas — trocar por dados reais quando existir tabela/feed de notificações
const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Nova tarefa atribuída a você", meta: "Materiais dos Conteúdos · 2min atrás", unread: true },
  { id: "2", title: "Nova mensagem no chat", meta: "Vicenzo Valentino · 1h atrás", unread: true },
  { id: "3", title: "Reunião Tráfego começa em breve", meta: "Hoje às 16:00", unread: false },
];

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-background bg-emerald-400" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-border bg-background-elevated p-3 shadow-xl">
            <p className="mb-2 px-1 text-sm font-semibold text-foreground-strong">Notificações</p>
            <div className="flex flex-col gap-0.5">
              {MOCK_NOTIFICATIONS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.unread ? "bg-emerald-400" : "bg-transparent"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileMenu({ userLabel, onLogout }: { userLabel: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initial = userLabel.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Perfil"
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong transition-colors hover:bg-border"
      >
        {initial}
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background-elevated bg-emerald-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-2 max-h-[80vh] w-72 overflow-y-auto rounded-xl border border-border bg-background-elevated p-3 shadow-xl">
            <div className="mb-3 flex items-center gap-3 px-1">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground-strong">
                {initial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background-elevated bg-emerald-400" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground-strong">{userLabel}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            <button
              type="button"
              className="mb-1 flex w-full items-center gap-2 rounded-md border border-border px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              <SmilePlus size={16} /> Set status
            </button>
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <VolumeX size={16} /> Mute notifications
              </span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>

            <div className="mb-2 flex flex-col gap-0.5 border-t border-border pt-2">
              {[
                { label: "Settings", icon: Settings },
                { label: "Notifications", icon: Bell },
                { label: "Themes", icon: Paintbrush },
                { label: "Keyboard shortcuts", icon: Command },
                { label: "Download ClickUp", icon: Download, external: true },
                { label: "Help", icon: HelpCircle, trailing: Bell },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  <item.icon size={16} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.external && <ExternalLink size={14} className="text-muted-foreground" />}
                </button>
              ))}
            </div>

            <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Personal Tools</p>
            <div className="mb-2 flex flex-col gap-0.5">
              {PERSONAL_TOOLS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  <item.icon size={16} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-0.5 border-t border-border pt-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                <Trash2 size={16} /> Trash
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Header({ agencyName }: { agencyName: string }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 bg-background px-4">
        <div className="flex min-w-0 items-center gap-2">
          <WorkspaceMenu agencyName={agencyName} />
          <NextEventBadge />
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex w-full max-w-md items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-border"
        >
          <span className="flex items-center gap-2">
            <Search size={15} /> Search
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/chats"
            aria-label="Chats"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle size={17} />
          </Link>
          <Link
            href="/home/tasks"
            aria-label="Tasks"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ListChecks size={17} />
          </Link>
          <NotificationsMenu />
          {/* ponytail: nome real do usuário ainda não é passado pro Header; trocar quando existir */}
          <ProfileMenu userLabel="Você" onLogout={handleLogout} />
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
