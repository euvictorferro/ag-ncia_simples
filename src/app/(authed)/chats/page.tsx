import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { AllChannelsPage } from "@/components/chats/AllChannelsPage";

export default async function ChatsPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  return (
    <AppFrame context={{ type: "chats" }} agencyName={agencyName}>
      <AllChannelsPage />
    </AppFrame>
  );
}
