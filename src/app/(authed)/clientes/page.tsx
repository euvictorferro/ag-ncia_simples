import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsGrid } from "@/components/clientes/ClientsGrid";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const allClients = await listClients(supabase, agencyId, { includeArchived: true });
  const treeClients = allClients.filter((c) => !c.archived).map((c) => ({ id: c.id, name: c.name }));

  return (
    <AppFrame
      context={{ type: "clients", clients: treeClients }}
      agencyName={agencyName}
    >
      <ClientsGrid agencyId={agencyId} initialClients={allClients} />
    </AppFrame>
  );
}
