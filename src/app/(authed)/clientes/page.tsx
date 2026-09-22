import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { ClientsTable } from "@/components/clientes/ClientsTable";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/login");

  const clients = await listClients(supabase, membership.agency_id, { includeArchived: true });
  const agencyName = (membership.agencies as unknown as { name: string })?.name ?? "Agência";

  return (
    <AppFrame active="clientes" pageLabel="Clientes" agencyName={agencyName}>
      <ClientsTable agencyId={membership.agency_id} initialClients={clients} />
    </AppFrame>
  );
}
