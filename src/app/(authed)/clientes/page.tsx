import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsGrid } from "@/components/clientes/ClientsGrid";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const allClients = await listClients(supabase, agencyId, { includeArchived: true });

  return (
    <AppFrame context={{ type: "clients" }} agencyName={agencyName}>
      <ClientsGrid agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
