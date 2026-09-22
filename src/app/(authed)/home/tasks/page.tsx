import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasks } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function HomeTasksPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [tasks, clients, members] = await Promise.all([
    listTasks(supabase, agencyId),
    listClients(supabase, agencyId),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "home", active: "tasks" }} agencyName={agencyName}>
      <TasksTable agencyId={agencyId} initialTasks={tasks} clients={clients} members={members} />
    </AppFrame>
  );
}
