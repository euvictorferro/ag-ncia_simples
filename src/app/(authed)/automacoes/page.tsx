import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { AutomationsPage } from "@/components/automacoes/AutomationsPage";

export default async function AutomacoesPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "automacoes" }} agencyName={agencyName}>
      <AutomationsPage />
    </AppFrame>
  );
}
