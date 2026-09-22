"use client";

import Link from "next/link";

export type HomeTab = "dashboard" | "financeiro" | "tasks";
export type ClientTab = "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos";

export type SidebarContext =
  | { type: "home"; active: HomeTab }
  | { type: "clients" }
  | { type: "client"; clientId: string; clientName: string; active: ClientTab }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" };

function navClass(isActive: boolean): string {
  return `truncate rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

function HomePanel({ active }: { active: HomeTab }) {
  return (
    <nav className="flex flex-col gap-1">
      <Link href="/home/dashboard" className={navClass(active === "dashboard")}>
        Dashboard
      </Link>
      <Link href="/home/financeiro" className={navClass(active === "financeiro")}>
        Financeiro
      </Link>
      <Link href="/home/tasks" className={navClass(active === "tasks")}>
        Tasks
      </Link>
    </nav>
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
        <Link key={tab.key} href={`/clientes/${clientId}/${tab.path}`} className={navClass(active === tab.key)}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function InboxGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 3h12l2 7v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-5l2-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M1 10h4.5l1 2h5l1-2H17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ClientsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 11.5c2 0 3.5 1.3 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14v8H7l-3 3v-3H2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function NodesGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.7 5.3 8 12M12.3 5.3 10 12M6 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RailIcon({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ context, agencyName }: { context: SidebarContext; agencyName: string }) {
  const agencyInitial = agencyName.trim().charAt(0).toUpperCase() || "A";
  const isClientsSection = context.type === "clients" || context.type === "client";

  return (
    <div className="flex h-screen shrink-0">
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-background-elevated py-5">
        <RailIcon href="/home/dashboard" label="Home" active={context.type === "home"}>
          <span className="text-sm font-semibold">{agencyInitial}</span>
        </RailIcon>
        <RailIcon href="/inbox" label="Inbox" active={context.type === "inbox"}>
          <InboxGlyph />
        </RailIcon>
        <RailIcon href="/clientes" label="Clientes" active={isClientsSection}>
          <ClientsGlyph />
        </RailIcon>
        <RailIcon href="/chats" label="Chats" active={context.type === "chats"}>
          <ChatsGlyph />
        </RailIcon>
        <RailIcon href="/nodes" label="Nodes" active={context.type === "nodes"}>
          <NodesGlyph />
        </RailIcon>
      </aside>
      <aside className="flex w-56 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-background-elevated px-4 py-5">
        {context.type === "home" && <HomePanel active={context.active} />}
        {context.type === "client" && (
          <ClientPanel clientId={context.clientId} clientName={context.clientName} active={context.active} />
        )}
      </aside>
    </div>
  );
}
