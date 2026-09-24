import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { PlaceholderSection } from "@/components/shared/PlaceholderSection";

export default async function InboxAllConversationsPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "inbox" }} agencyName={agencyName}>
      <PlaceholderSection title="Todas as Conversas" />
    </AppFrame>
  );
}
