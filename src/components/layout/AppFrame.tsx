import { Sidebar, type SidebarContext } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const HOME_LABEL: Record<"dashboard" | "financeiro" | "tasks", string> = {
  dashboard: "Dashboard",
  financeiro: "Financeiro",
  tasks: "Tasks",
};

const CLIENT_TAB_LABEL: Record<
  "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos",
  string
> = {
  dashboard: "Dashboard",
  anuncios: "Anúncios",
  organico: "Orgânico",
  financeiro: "Financeiro",
  tasks: "Tarefas",
  conteudos: "Conteúdos",
};

function pageLabelFor(context: SidebarContext): string {
  switch (context.type) {
    case "home":
      return `Home / ${HOME_LABEL[context.active]}`;
    case "clients":
      return "Clientes";
    case "client":
      return `${context.clientName} / ${CLIENT_TAB_LABEL[context.active]}`;
    case "inbox":
      return "Inbox";
    case "chats":
      return "Chats";
    case "nodes":
      return "Nodes";
  }
}

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
    <div className="flex min-h-screen">
      <Sidebar context={context} agencyName={agencyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header agencyName={agencyName} pageLabel={pageLabelFor(context)} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
