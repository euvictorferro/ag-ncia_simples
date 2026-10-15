import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients";
import { listAgencyMembers } from "@/lib/tasks";
import { SidebarPreviewDataProvider } from "@/components/layout/SidebarPreviewData";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!membership) redirect("/onboarding");

  const agencyId: string = membership.agency_id;
  const [clients, members] = await Promise.all([
    listClients(supabase, agencyId, { includeArchived: true }),
    listAgencyMembers(supabase, agencyId),
  ]);

  return (
    <SidebarPreviewDataProvider value={{ agencyId, members, clients }}>{children}</SidebarPreviewDataProvider>
  );
}
