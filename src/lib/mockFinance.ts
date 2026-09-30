import type { Client } from "@/lib/clients";

// ponytail: RNG determinística própria (independente da usada em mockAgency.ts)
// só pra essa massa de dados financeiros de demonstração ficar estável entre reloads.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260925);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const uuid = (prefix: string, i: number) => `00000000-0000-4000-9000-${prefix}${String(i).padStart(8, "0")}`;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export type ClientContract = {
  clientId: string;
  monthlyValue: number;
  contractMonths: number;
  startDate: string;
  nextRenewalDate: string;
  active: boolean;
};

export type Payment = { id: string; clientId: string; date: string; amount: number; description: string };

export type ExpenseType = "equipe" | "ferramenta" | "investimento" | "operacional";
export type Expense = {
  id: string;
  category: string;
  type: ExpenseType;
  description: string;
  date: string;
  amount: number;
};

export const EXPENSE_CATEGORIES = [
  "Folha de pagamento",
  "Ferramentas e software",
  "Mídia paga (interna)",
  "Escritório",
  "Marketing próprio",
  "Outros",
] as const;

const CATEGORY_BASE: Record<(typeof EXPENSE_CATEGORIES)[number], number> = {
  "Folha de pagamento": 12000,
  "Ferramentas e software": 1600,
  "Mídia paga (interna)": 1200,
  Escritório: 2200,
  "Marketing próprio": 900,
  Outros: 500,
};

const CATEGORY_TYPE: Record<(typeof EXPENSE_CATEGORIES)[number], ExpenseType> = {
  "Folha de pagamento": "equipe",
  "Ferramentas e software": "ferramenta",
  "Mídia paga (interna)": "investimento",
  Escritório: "operacional",
  "Marketing próprio": "investimento",
  Outros: "operacional",
};

const CATEGORY_DESCRIPTIONS: Record<(typeof EXPENSE_CATEGORIES)[number], readonly string[]> = {
  "Folha de pagamento": ["Salário - equipe de mídia", "Salário - equipe de conteúdo", "Pró-labore sócios", "Freelancer de design"],
  "Ferramentas e software": ["Meta Business Suite", "Notion", "Figma", "ClickUp", "Google Workspace", "HubSpot"],
  "Mídia paga (interna)": ["Anúncios Instagram/Facebook (agência)", "Anúncios Google (agência)", "Impulsionamento LinkedIn"],
  Escritório: ["Aluguel", "Internet e telefonia", "Material de escritório", "Limpeza"],
  "Marketing próprio": ["Produção de conteúdo institucional", "Parceria com influenciador", "Evento / networking"],
  Outros: ["Contabilidade", "Taxas bancárias", "Despesas diversas"],
};

const CONTRACT_LENGTHS = [1, 3, 3, 3, 6, 12] as const;

export function buildMockFinance(clients: Client[]): {
  contracts: ClientContract[];
  payments: Payment[];
  expenses: Expense[];
} {
  const today = new Date();
  const contracts: ClientContract[] = [];
  const payments: Payment[] = [];
  let paymentIndex = 0;

  clients.forEach((client) => {
    const monthlyValue = 800 + Math.floor(rand() * 24) * 100;
    const contractMonths = pick(CONTRACT_LENGTHS);
    const startDate = new Date(client.created_at.slice(0, 10));
    const churnedEarly = client.health === "red" && rand() < 0.45;

    let cursor = new Date(startDate);
    let monthsPaid = 0;
    const monthsElapsed = Math.floor((today.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
    const monthsToStopEarly = churnedEarly ? Math.max(1, monthsElapsed - 1 - Math.floor(rand() * 2)) : Infinity;

    while (cursor <= today && monthsPaid < monthsToStopEarly) {
      payments.push({
        id: uuid("p", paymentIndex++),
        clientId: client.id,
        date: toDateStr(cursor),
        amount: monthlyValue,
        description: `Mensalidade - ${client.name}`,
      });
      // ~1 em cada 6 clientes ganha um upsell pontual num mês aleatório, pra dar mais vida ao gráfico
      if (rand() < 0.16) {
        const bonusDay = new Date(cursor);
        bonusDay.setDate(Math.min(daysInMonth(cursor), bonusDay.getDate() + 8 + Math.floor(rand() * 10)));
        if (bonusDay <= today) {
          payments.push({
            id: uuid("p", paymentIndex++),
            clientId: client.id,
            date: toDateStr(bonusDay),
            amount: Math.round(monthlyValue * (0.3 + rand() * 0.5)),
            description: `Serviço avulso - ${client.name}`,
          });
        }
      }
      cursor = addMonths(cursor, 1);
      monthsPaid++;
    }

    let renewal = new Date(startDate);
    while (renewal <= today) renewal = addMonths(renewal, contractMonths);

    contracts.push({
      clientId: client.id,
      monthlyValue,
      contractMonths,
      startDate: toDateStr(startDate),
      nextRenewalDate: toDateStr(renewal),
      active: !churnedEarly,
    });
  });

  const expenses: Expense[] = [];
  let expenseIndex = 0;
  let cursor = addMonths(today, -11);
  while (cursor <= today) {
    for (const category of EXPENSE_CATEGORIES) {
      const base = CATEGORY_BASE[category];
      const type = CATEGORY_TYPE[category];
      const descriptions = CATEGORY_DESCRIPTIONS[category];
      const installments = 2 + Math.floor(rand() * 3);
      const weights = Array.from({ length: installments }, () => 0.6 + rand());
      const weightSum = weights.reduce((s, w) => s + w, 0);

      weights.forEach((weight, i) => {
        const day = Math.min(daysInMonth(cursor), 1 + Math.floor(rand() * daysInMonth(cursor)));
        const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
        if (date > today) return;
        expenses.push({
          id: uuid("e", expenseIndex++),
          category,
          type,
          description: descriptions[i % descriptions.length],
          date: toDateStr(date),
          amount: Math.round((base / weightSum) * weight),
        });
      });
    }
    cursor = addMonths(cursor, 1);
  }

  return { contracts, payments, expenses };
}
