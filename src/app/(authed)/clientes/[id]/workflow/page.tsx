import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { AppFrame } from "@/components/layout/AppFrame";
import { WorkflowsPage } from "@/components/clientes/WorkflowsPage";
import Link from "next/link";

export default async function ClientWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const clients = await listClients(supabase, agencyId);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <AppFrame context={{ type: "home", active: "dashboard" }} agencyName={agencyName}>
        <p className="text-sm text-muted-foreground">
          Cliente não encontrado.{" "}
          <Link href="/home/dashboard" className="underline">
            Voltar para o dashboard
          </Link>
          .
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame context={{ type: "client", clientId: client.id, clientName: client.name, active: "workflow" }} agencyName={agencyName}>
      <WorkflowsPage clientId={client.id} />
    </AppFrame>
  );
}
