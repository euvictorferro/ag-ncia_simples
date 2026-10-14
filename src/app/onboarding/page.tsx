import { redirect } from "next/navigation";
import { OnboardingWizard } from "./OnboardingWizard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await supabase
    .from("agency_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (membership) redirect("/home/dashboard");

  return <OnboardingWizard />;
}
