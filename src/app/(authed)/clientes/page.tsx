import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listAgencyMembers } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsGrid } from "@/components/clientes/ClientsGrid";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [allClients, members] = await Promise.all([
    listClients(supabase, agencyId, { includeArchived: true }),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <AppFrame context={{ type: "clients", agencyId, members, initialClients: allClients }} agencyName={agencyName}>
      <ClientsGrid agencyId={agencyId} members={members} initialClients={allClients} />
    </AppFrame>
  );
}
