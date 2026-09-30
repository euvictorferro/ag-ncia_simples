import { AlertTriangle, DollarSign, PiggyBank, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import type { Client, ClientHealth } from "@/lib/clients";
import type { ClientContract, Expense, Payment } from "@/lib/mockFinance";
import { EXPENSE_CATEGORIES } from "@/lib/mockFinance";
import { DonutChart } from "@/components/charts/DonutChart";
import { ConnectBanner } from "@/components/finance/ConnectBanner";
import { GoalCard } from "@/components/finance/GoalCard";
import { PeriodRevenueChart } from "@/components/finance/PeriodRevenueChart";
import { RenewalList, type RenewalRow } from "@/components/finance/RenewalList";
import { DrilldownStatCard } from "@/components/finance/TransactionDrilldown";
import { TYPE_LABEL } from "@/components/finance/labels";
import { WidgetBoardProvider, WidgetToggleButton, Widget } from "@/components/home/WidgetBoard";
import { CATEGORICAL, ChartCard, RankedList, StatCard, countBy, normalizeHealth } from "@/components/home/shared";

const WIDGET_OPTIONS = [
  { id: "goal", label: "Meta de lucro do mês" },
  { id: "revenue-chart", label: "Receita x despesas (período)" },
  { id: "renewals", label: "Contratos a vencer" },
  { id: "expense-breakdown", label: "Despesas por categoria" },
  { id: "tenure", label: "Tempo de casa dos clientes" },
  { id: "risk", label: "Clientes por risco de churn" },
];

const RETENTION_BY_HEALTH: Record<ClientHealth, number> = { green: 0.95, yellow: 0.75, red: 0.45 };

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function FinanceOverview({
  clients,
  contracts,
  payments,
  expenses,
}: {
  clients: Client[];
  contracts: ClientContract[];
  payments: Payment[];
  expenses: Expense[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const contractByClient = new Map(contracts.map((c) => [c.clientId, c]));
  const paymentsCountByClient = countBy(payments, (p) => p.clientId);

  const activeContracts = contracts.filter((c) => c.active);
  const mrr = activeContracts.reduce((sum, c) => sum + c.monthlyValue, 0);
  const ticketMedio = activeContracts.length === 0 ? 0 : mrr / activeContracts.length;

  const ltvPerClient = contracts.map((c) => c.monthlyValue * (paymentsCountByClient.get(c.clientId) ?? 1));
  const ltvMedio = ltvPerClient.length === 0 ? 0 : ltvPerClient.reduce((s, v) => s + v, 0) / ltvPerClient.length;

  const previstoProximoMes = activeContracts.reduce((sum, c) => {
    const client = clientById.get(c.clientId);
    const retention = client ? RETENTION_BY_HEALTH[normalizeHealth(client.health)] : 0.8;
    return sum + c.monthlyValue * retention;
  }, 0);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const receita30 = payments.filter((p) => new Date(p.date) >= last30Days).reduce((s, p) => s + p.amount, 0);
  const despesas30 = expenses.filter((e) => new Date(e.date) >= last30Days).reduce((s, e) => s + e.amount, 0);
  const lucro30 = receita30 - despesas30;

  const renewals: RenewalRow[] = contracts
    .filter((c) => c.active && new Date(c.nextRenewalDate) <= in30Days && new Date(c.nextRenewalDate) >= now)
    .map((c) => {
      const daysUntil = Math.max(0, Math.round((new Date(c.nextRenewalDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      return {
        clientId: c.clientId,
        clientName: clientById.get(c.clientId)?.name ?? "—",
        daysUntil,
        monthlyValue: c.monthlyValue,
        contractMonths: c.contractMonths,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const expenseByCategory30d = new Map<string, number>();
  for (const expense of expenses) {
    if (new Date(expense.date) < last30Days) continue;
    expenseByCategory30d.set(expense.category, (expenseByCategory30d.get(expense.category) ?? 0) + expense.amount);
  }

  const tenureBuckets = { "1 mês": 0, "2 meses": 0, "3-4 meses": 0, "5-6 meses": 0, "7+ meses": 0 };
  for (const client of clients) {
    const months = paymentsCountByClient.get(client.id) ?? 0;
    if (months <= 1) tenureBuckets["1 mês"] += 1;
    else if (months === 2) tenureBuckets["2 meses"] += 1;
    else if (months <= 4) tenureBuckets["3-4 meses"] += 1;
    else if (months <= 6) tenureBuckets["5-6 meses"] += 1;
    else tenureBuckets["7+ meses"] += 1;
  }
  const tenureItems = Object.entries(tenureBuckets).map(([label, value]) => ({ label, value }));

  const riskItems = clients
    .map((client) => ({ client, contract: contractByClient.get(client.id) }))
    .filter((c) => c.contract?.active && normalizeHealth(c.client.health) !== "green")
    .sort((a, b) => (normalizeHealth(a.client.health) === "red" ? -1 : normalizeHealth(b.client.health) === "red" ? 1 : 0));

  const receitaRows = payments
    .filter((p) => new Date(p.date) >= last30Days)
    .map((p) => ({ id: p.id, date: p.date, description: p.description, tag: "Recebimento", amount: p.amount }));

  const despesaRows = expenses
    .filter((e) => new Date(e.date) >= last30Days)
    .map((e) => ({ id: e.id, date: e.date, description: e.description, tag: `${TYPE_LABEL[e.type]} · ${e.category}`, amount: e.amount }));

  return (
    <WidgetBoardProvider storageKey="dash-widgets-financeiro">
      <div className="space-y-6">
        <ConnectBanner />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold text-foreground-strong">Financeiro</h1>
            <p className="text-xs text-muted-foreground">Receita, previsibilidade e contratos da agência</p>
          </div>
          <WidgetToggleButton options={WIDGET_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Wallet} label="MRR atual" value={formatCurrency(mrr)} />
          <DrilldownStatCard
            icon={<TrendingUp size={16} />}
            label="Receita (30 dias)"
            value={formatCurrency(receita30)}
            title="Receita — últimos 30 dias"
            rows={receitaRows}
          />
          <DrilldownStatCard
            icon={<TrendingDown size={16} />}
            label="Despesas (30 dias)"
            value={formatCurrency(despesas30)}
            title="Despesas — últimos 30 dias"
            rows={despesaRows}
          />
          <StatCard
            icon={PiggyBank}
            label="Lucro líquido (30 dias)"
            value={formatCurrency(lucro30)}
            tone={lucro30 >= 0 ? "positive" : "warning"}
          />
          <StatCard icon={DollarSign} label="LTV médio" value={formatCurrency(ltvMedio)} />
          <StatCard icon={TrendingUp} label="Previsto próximo mês" value={formatCurrency(previstoProximoMes)} />
          <StatCard icon={Users} label="Ticket médio" value={formatCurrency(ticketMedio)} />
          <StatCard
            icon={AlertTriangle}
            label="Contratos a vencer (30 dias)"
            value={String(renewals.length)}
            tone={renewals.length > 0 ? "warning" : undefined}
          />
        </div>

        <Widget id="goal">
          <GoalCard currentProfit={lucro30} ticketMedio={ticketMedio} />
        </Widget>

        <Widget id="revenue-chart">
          <ChartCard title="Receita x despesas">
            <PeriodRevenueChart payments={payments} expenses={expenses} />
          </ChartCard>
        </Widget>

        <Widget id="renewals">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contratos a vencer (próximos 30 dias)
            </h2>
            <RenewalList items={renewals} />
          </div>
        </Widget>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Widget id="expense-breakdown">
            <ChartCard title="Despesas por categoria (30 dias)">
              <DonutChart
                segments={EXPENSE_CATEGORIES.map((category, i) => ({
                  label: category,
                  value: expenseByCategory30d.get(category) ?? 0,
                  color: CATEGORICAL[i % CATEGORICAL.length],
                }))}
                formatValue={formatCurrency}
              />
            </ChartCard>
          </Widget>
          <Widget id="tenure">
            <RankedList title="Tempo de casa dos clientes" items={tenureItems} emptyLabel="Sem clientes cadastrados." />
          </Widget>
        </div>

        <Widget id="risk">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Clientes ativos com risco de não renovar
            </h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
              {riskItems.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum cliente ativo em atenção ou risco. 🎉</p>
              )}
              {riskItems.map(({ client, contract }) => (
                <div
                  key={client.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_100px] items-center gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0"
                >
                  <span className="truncate text-foreground">{client.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {normalizeHealth(client.health) === "red" ? "Risco alto" : "Atenção"}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(contract?.monthlyValue ?? 0)}/mês</span>
                </div>
              ))}
            </div>
          </div>
        </Widget>
      </div>
    </WidgetBoardProvider>
  );
}
