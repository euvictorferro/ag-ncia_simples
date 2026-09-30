import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { AppFrame } from "@/components/layout/AppFrame";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { buildMockAgency } from "@/lib/mockAgency";
import { buildMockFinance } from "@/lib/mockFinance";

export default async function HomeFinanceiroPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyName } = await requireAgencyMembership(supabase);

  // ponytail: dados de exemplo até a agência conectar Stripe/AbacatePay/Hotmart
  // de verdade no Hub de conexões — trocar por dados reais quando isso existir.
  const { clients } = buildMockAgency();
  const { contracts, payments, expenses } = buildMockFinance(clients);

  return (
    <AppFrame context={{ type: "home", active: "financeiro" }} agencyName={agencyName}>
      <FinanceOverview clients={clients} contracts={contracts} payments={payments} expenses={expenses} />
    </AppFrame>
  );
}
