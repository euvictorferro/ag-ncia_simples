import { Sidebar, type SidebarContext } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { Client } from "@/lib/clients";

function pageLabelFor(context: SidebarContext): string {
  if (context.type === "client") {
    return `${context.clientName} / Tarefas`;
  }
  if (context.active === "overview") return "Visão geral";
  if (context.active === "tasks") return "Todas as tarefas";
  return "Clientes";
}

export function AppFrame({
  context,
  agencyName,
  clients,
  children,
}: {
  context: SidebarContext;
  agencyName: string;
  clients: Client[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar context={context} clients={clients} agencyName={agencyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header agencyName={agencyName} pageLabel={pageLabelFor(context)} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
