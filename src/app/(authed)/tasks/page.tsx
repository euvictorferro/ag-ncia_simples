import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients";
import { listAgencyMembers, listTasks } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { TasksTable } from "@/components/tasks/TasksTable";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const [tasks, clients, members] = await Promise.all([
    listTasks(supabase, membership.agency_id),
    listClients(supabase, membership.agency_id),
    listAgencyMembers(supabase, membership.agency_id),
  ]);

  const agencyName = (membership.agencies as unknown as { name: string })?.name ?? "Agência";

  return (
    <AppFrame active="tasks" pageLabel="Tarefas" agencyName={agencyName}>
      <TasksTable agencyId={membership.agency_id} initialTasks={tasks} clients={clients} members={members} />
    </AppFrame>
  );
}
