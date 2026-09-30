// ponytail: mesmo padrão de src/lib/mockWorkflows.ts (estado em memória, sem persistência) —
// só que o catálogo de nós aqui é automação interna do app, não fluxo de tráfego/conteúdo.

import {
  type NodeDefinition,
  type NodeHandle,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeConfig,
  parseRules,
  stringifyRules,
} from "@/lib/workflowDomain";

export type AutomationNodeKind =
  | "trigger"
  | "send-report"
  | "create-task"
  | "notify-internal"
  | "condition"
  | "delay"
  | "webhook"
  | "end";

export const NODE_DEFINITIONS: NodeDefinition<AutomationNodeKind>[] = [
  { kind: "trigger", label: "Trigger", description: "Inicia a automação (agenda, status de cliente, manual)" },
  { kind: "send-report", label: "Send report", description: "Envia um relatório por e-mail/WhatsApp" },
  { kind: "create-task", label: "Create task", description: "Cria uma task pra um responsável" },
  { kind: "notify-internal", label: "Internal notification", description: "Notifica a equipe internamente" },
  { kind: "condition", label: "Condition", description: "Ramifica o fluxo por uma condição" },
  { kind: "delay", label: "Delay", description: "Espera um período antes de continuar" },
  { kind: "webhook", label: "Webhook", description: "Chama uma URL externa" },
  { kind: "end", label: "End", description: "Termina a automação" },
];

export const NODE_DEFINITION_MAP: Record<AutomationNodeKind, NodeDefinition<AutomationNodeKind>> = Object.fromEntries(
  NODE_DEFINITIONS.map((n) => [n.kind, n]),
) as Record<AutomationNodeKind, NodeDefinition<AutomationNodeKind>>;

export type AutomationStatus = "draft" | "active" | "paused";

export type Automation = {
  id: string;
  name: string;
  subtitle: string;
  status: AutomationStatus;
  nodes: WorkflowNode<AutomationNodeKind>[];
  edges: WorkflowEdge[];
  runsStarted: number;
  runsDone: number;
  createdAt: string;
};

export function handlesFor(kind: AutomationNodeKind, config: WorkflowNodeConfig): NodeHandle[] {
  switch (kind) {
    case "condition": {
      const rules = parseRules(config.rules);
      return [
        ...rules.map((_, i) => ({ id: `r${i + 1}`, label: `r${i + 1}`, tone: "green" as const })),
        { id: "else", label: "else", tone: "orange" as const },
      ];
    }
    case "webhook":
      return [
        { id: "success", label: "success", tone: "green" },
        { id: "error", label: "error", tone: "red" },
      ];
    case "end":
      return [];
    default:
      return [{ id: "out", tone: "default" }];
  }
}

export function defaultConfigFor(kind: AutomationNodeKind): WorkflowNodeConfig {
  switch (kind) {
    case "trigger":
      return { triggerKind: "schedule", schedule: "weekly", weekday: "monday", time: "09:00", statusFilter: "" };
    case "send-report":
      return { reportType: "performance", recipients: "", period: "last_7_days", format: "pdf" };
    case "create-task":
      return { title: "", assignTo: "", targetClients: "all", dueInDays: "3" };
    case "notify-internal":
      return { channel: "app", message: "", recipients: "" };
    case "condition":
      return { rules: stringifyRules([{ variable: "", operator: "contains", value: "" }]) };
    case "delay":
      return { waitFor: "60" };
    case "webhook":
      return { method: "POST", url: "", body: "", saveAs: "" };
    case "end":
      return {};
  }
}

/** Templates prontos que já aparecem na lista com os nós montados — servem de exemplo/ponto de partida. */
export function seedTemplateAutomations(): Automation[] {
  const createdAt = new Date().toISOString();
  return [
    {
      id: "tpl-cliente-novo",
      name: "Cliente novo",
      subtitle: "Cria o onboarding e avisa a equipe quando um cliente novo é cadastrado.",
      status: "active",
      runsStarted: 0,
      runsDone: 0,
      createdAt,
      nodes: [
        { id: "tpl-cliente-novo-1", kind: "trigger", x: 0, y: 40, config: { triggerKind: "new-client" } },
        {
          id: "tpl-cliente-novo-2",
          kind: "create-task",
          x: 0,
          y: 190,
          config: { title: "Preparar onboarding do cliente {{cliente}}", assignTo: "Gerente de contas", targetClients: "triggered", dueInDays: "2" },
        },
        {
          id: "tpl-cliente-novo-3",
          kind: "notify-internal",
          x: 0,
          y: 340,
          config: { channel: "app", recipients: "equipe", message: "Novo cliente {{cliente}} entrou — onboarding criado." },
        },
        { id: "tpl-cliente-novo-4", kind: "end", x: 0, y: 490, config: {} },
      ],
      edges: [
        { id: "tpl-cliente-novo-e1", from: "tpl-cliente-novo-1", fromHandle: "out", to: "tpl-cliente-novo-2" },
        { id: "tpl-cliente-novo-e2", from: "tpl-cliente-novo-2", fromHandle: "out", to: "tpl-cliente-novo-3" },
        { id: "tpl-cliente-novo-e3", from: "tpl-cliente-novo-3", fromHandle: "out", to: "tpl-cliente-novo-4" },
      ],
    },
    {
      id: "tpl-calendario-conteudo",
      name: "Calendário de conteúdo",
      subtitle: "Toda segunda de manhã, cria a task de preencher o calendário da semana.",
      status: "active",
      runsStarted: 0,
      runsDone: 0,
      createdAt,
      nodes: [
        {
          id: "tpl-calendario-1",
          kind: "trigger",
          x: 0,
          y: 40,
          config: { triggerKind: "schedule", schedule: "weekly", weekday: "monday", time: "08:00" },
        },
        {
          id: "tpl-calendario-2",
          kind: "create-task",
          x: 0,
          y: 190,
          config: { title: "Preencher calendário de conteúdo da semana", assignTo: "Social media", targetClients: "all", dueInDays: "1" },
        },
        {
          id: "tpl-calendario-3",
          kind: "notify-internal",
          x: 0,
          y: 340,
          config: { channel: "app", recipients: "equipe de conteúdo", message: "Calendário da semana pronto pra preencher." },
        },
        { id: "tpl-calendario-4", kind: "end", x: 0, y: 490, config: {} },
      ],
      edges: [
        { id: "tpl-calendario-e1", from: "tpl-calendario-1", fromHandle: "out", to: "tpl-calendario-2" },
        { id: "tpl-calendario-e2", from: "tpl-calendario-2", fromHandle: "out", to: "tpl-calendario-3" },
        { id: "tpl-calendario-e3", from: "tpl-calendario-3", fromHandle: "out", to: "tpl-calendario-4" },
      ],
    },
  ];
}

export function automationNodeSummary(node: WorkflowNode<AutomationNodeKind>): string {
  const c = node.config;
  switch (node.kind) {
    case "trigger": {
      if (c.triggerKind === "client-status") return `Cliente muda pra status "${c.statusFilter || "?"}"`;
      if (c.triggerKind === "new-client") return "Novo cliente cadastrado";
      if (c.triggerKind === "manual") return "Disparo manual";
      return `${c.schedule === "weekly" ? "Toda semana" : c.schedule === "daily" ? "Todo dia" : "Todo mês"} · ${c.time || "09:00"}`;
    }
    case "send-report":
      return `${c.reportType || "performance"} · ${c.period || "last_7_days"} · ${c.recipients || "sem destinatário"}`;
    case "create-task":
      return c.title ? `"${c.title}" → ${c.assignTo || "sem responsável"}` : "Sem título ainda";
    case "notify-internal":
      return c.message || "Sem mensagem definida";
    case "condition": {
      const rules = parseRules(c.rules);
      return `${rules.length} regra${rules.length > 1 ? "s" : ""}`;
    }
    case "delay":
      return `${c.waitFor || "60"} min`;
    case "webhook":
      return `${c.method || "POST"} ${c.url || "?"}`;
    case "end":
      return "Automação termina";
    default:
      return "";
  }
}
