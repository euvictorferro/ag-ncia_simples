import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyMembership = {
  agencyId: string;
  agencyName: string;
};

export async function requireAgencyMembership(supabase: SupabaseClient): Promise<AgencyMembership> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/login");
  }

  return {
    agencyId: membership.agency_id,
    agencyName: (membership.agencies as unknown as { name: string })?.name ?? "Agência",
  };
}
