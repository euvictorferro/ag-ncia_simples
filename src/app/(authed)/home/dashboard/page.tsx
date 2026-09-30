import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { DashboardOverview } from "@/components/home/DashboardOverview";
import { buildMockAgency } from "@/lib/mockAgency";

export default async function HomeDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  // ponytail: dados de exemplo até a agência popular clientes/tarefas reais —
  // trocar por listClients/listTasks/listAgencyMembers quando isso acontecer.
  const { clients, tasks, members } = buildMockAgency();

  return (
    <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
      <DashboardOverview clients={clients} tasks={tasks} members={members} />
    </AppFrame>
  );
}
