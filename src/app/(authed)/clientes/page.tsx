import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsTable } from "@/components/clientes/ClientsTable";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const allClients = await listClients(supabase, agencyId, { includeArchived: true });
  const activeClients = allClients.filter((c) => !c.archived);

  return (
    <AppFrame context={{ type: "agency", active: "clients" }} agencyName={agencyName} clients={activeClients}>
      <ClientsTable agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
