import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function AutomationClienteNovoPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "automacoes" }} agencyName={agencyName}>
      <PlaceholderSection title="Automação — Cliente novo" />
    </AppFrame>
  );
}
