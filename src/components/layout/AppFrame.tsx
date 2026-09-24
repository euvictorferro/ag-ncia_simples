import { Sidebar, SidebarPanel, type SidebarContext } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const HAS_PANEL: Record<SidebarContext["type"], boolean> = {
  home: true,
  clients: true,
  client: true,
  inbox: true,
  chats: false,
  nodes: false,
  calendario: true,
  automacoes: false,
  atas: false,
  conexoes: false,
};

export function AppFrame({
  context,
  agencyName,
  children,
}: {
  context: SidebarContext;
  agencyName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header agencyName={agencyName} />
      <div className="flex min-h-0 flex-1 gap-1.5 p-1.5">
        <Sidebar context={context} agencyName={agencyName} />
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background">
          {HAS_PANEL[context.type] && (
            <aside data-sidebar-edge className="w-72 shrink-0 overflow-hidden border-r border-border bg-background-elevated">
              <SidebarPanel context={context} />
            </aside>
          )}
          <div className="min-w-0 flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
