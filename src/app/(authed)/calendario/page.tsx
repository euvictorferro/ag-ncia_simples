import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function CalendarioPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);
  const clients = await listClients(supabase, agencyId);

  return (
    <AppFrame context={{ type: "calendario", clients }} agencyName={agencyName}>
      <PlaceholderSection title="Calendário" />
    </AppFrame>
  );
}
