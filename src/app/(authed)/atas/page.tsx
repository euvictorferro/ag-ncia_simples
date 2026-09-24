import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function AtasPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);
  const clients = await listClients(supabase, agencyId);

  return (
    <AppFrame context={{ type: "atas", clients }} agencyName={agencyName}>
      <PlaceholderSection title="Atas e documentos" />
    </AppFrame>
  );
}
