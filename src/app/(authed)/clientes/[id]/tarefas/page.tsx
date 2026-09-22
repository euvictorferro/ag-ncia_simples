import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasksByClient } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "agency", active: "overview" }} agencyName={agencyName} clients={clients}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <a href="/overview" className="underline">
            Voltar para a visão geral
          </a>
          .
        </p>
      </AppFrame>
    );
  }

  const [tasks, members] = await Promise.all([
    listTasksByClient(supabase, agencyId, client.id),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame
      context={{ type: "client", clientId: client.id, clientName: client.name, active: "tasks" }}
      agencyName={agencyName}
      clients={clients}
    >
      <TasksTable agencyId={agencyId} initialTasks={tasks} members={members} lockedClientId={client.id} />
    </AppFrame>
  );
}
