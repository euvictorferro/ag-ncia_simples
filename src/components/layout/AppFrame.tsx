import { Sidebar, SidebarPanel, type SidebarContext } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SpaceBoardProvider } from "@/components/spaces/SpaceBoardContext";
import { SpaceBoardOutlet } from "@/components/spaces/SpaceBoardOutlet";
import { ChatThreadProvider } from "@/components/chats/ChatThreadContext";
import { ChatThreadOutlet } from "@/components/chats/ChatThreadOutlet";

const HAS_PANEL: Record<SidebarContext["type"], boolean> = {
  home: true,
  clients: true,
  client: true,
  inbox: true,
  chats: true,
  nodes: false,
  calendario: true,
  automacoes: true,
  atas: true,
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
    <SpaceBoardProvider>
      <ChatThreadProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <Header agencyName={agencyName} />
          <div className="flex min-h-0 flex-1 gap-1.5 p-1.5">
            <Sidebar context={context} agencyName={agencyName} />
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background">
              {HAS_PANEL[context.type] && (
                <aside data-sidebar-edge className="w-72 shrink-0 overflow-hidden border-r border-border bg-background-elevated">
                  <SidebarPanel context={context} />
                </aside>
              )}
              <div className="min-w-0 flex-1 overflow-y-auto p-6">
                <SpaceBoardOutlet>
                  <ChatThreadOutlet>{children}</ChatThreadOutlet>
                </SpaceBoardOutlet>
              </div>
            </div>
          </div>
        </div>
      </ChatThreadProvider>
    </SpaceBoardProvider>
  );
}
