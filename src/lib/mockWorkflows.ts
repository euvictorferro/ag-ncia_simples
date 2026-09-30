// ponytail: workflows ficam em memória (estado local do componente), sem persistência —
// mesmo padrão do resto de Spaces/Posts/Ads enquanto não plugamos backend de verdade.

import {
  parseRules,
  stringifyRules,
  type ConditionRule,
  type HandleTone,
  type NodeDefinition,
  type NodeHandle,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeConfig,
} from "@/lib/workflowDomain";

export type { ConditionRule, HandleTone, NodeHandle, WorkflowEdge, WorkflowNode, WorkflowNodeConfig };
export { parseRules, stringifyRules };

export type NodeKind =
  | "trigger"
  | "send-message"
  | "wait-for-reply"
  | "delay"
  | "condition"
  | "set-variable"
  | "webhook"
  | "ai-whatsapp-call"
  | "ab-split"
  | "set-contact-field"
  | "enroll-sequence"
  | "add-tag"
  | "remove-tag"
  | "handoff"
  | "end";

export const NODE_DEFINITIONS: NodeDefinition<NodeKind>[] = [
  { kind: "trigger", label: "Trigger", description: "Inicia o workflow (comentário, DM, etc.)" },
  { kind: "send-message", label: "Send message", description: "Envia uma mensagem de texto" },
  { kind: "wait-for-reply", label: "Wait for reply", description: "Pausa até o contato responder" },
  { kind: "delay", label: "Delay", description: "Espera um período antes de continuar" },
  { kind: "condition", label: "Condition", description: "Ramifica o fluxo por uma condição" },
  { kind: "set-variable", label: "Set variable", description: "Define uma variável do workflow" },
  { kind: "webhook", label: "Webhook", description: "Chama uma URL externa" },
  { kind: "ai-whatsapp-call", label: "AI WhatsApp call", description: "Liga por voz via IA no WhatsApp" },
  { kind: "ab-split", label: "A/B split", description: "Ramifica aleatoriamente para testar variantes" },
  { kind: "set-contact-field", label: "Set contact field", description: "Persiste uma propriedade no contato" },
  { kind: "enroll-sequence", label: "Enroll in sequence", description: "Adiciona o contato a uma Sequence" },
  { kind: "add-tag", label: "Add tag", description: "Marca o contato com uma tag" },
  { kind: "remove-tag", label: "Remove tag", description: "Remove uma tag do contato" },
  { kind: "handoff", label: "Handoff", description: "Roteia a conversa para um humano" },
  { kind: "end", label: "End", description: "Termina o workflow" },
];

export const NODE_DEFINITION_MAP: Record<NodeKind, NodeDefinition<NodeKind>> = Object.fromEntries(
  NODE_DEFINITIONS.map((n) => [n.kind, n]),
) as Record<NodeKind, NodeDefinition<NodeKind>>;

export type WorkflowStatus = "draft" | "active" | "paused";
export type WorkflowPlatform = "instagram" | "whatsapp";

export type Workflow = {
  id: string;
  name: string;
  subtitle: string;
  platform: WorkflowPlatform;
  accountLabel: string;
  status: WorkflowStatus;
  nodes: WorkflowNode<NodeKind>[];
  edges: WorkflowEdge[];
  runsStarted: number;
  runsDone: number;
  createdAt: string;
};

/** Handles de saída de cada tipo de nó. Condition é dinâmico (uma por regra + else). */
export function handlesFor(kind: NodeKind, config: WorkflowNodeConfig): NodeHandle[] {
  switch (kind) {
    case "wait-for-reply":
      return [
        { id: "reply", label: "reply", tone: "green" },
        { id: "timeout", label: "timeout", tone: "orange" },
      ];
    case "condition": {
      const rules = parseRules(config.rules);
      return [
        ...rules.map((_, i) => ({ id: `r${i + 1}`, label: `r${i + 1}`, tone: "green" as const })),
        { id: "else", label: "else", tone: "orange" as const },
      ];
    }
    case "webhook":
    case "ai-whatsapp-call":
    case "enroll-sequence":
      return [
        { id: "success", label: "success", tone: "green" },
        { id: "error", label: "error", tone: "red" },
      ];
    case "ab-split":
      return [
        { id: "a", label: "A", tone: "green" },
        { id: "b", label: "B", tone: "green" },
      ];
    case "end":
      return [];
    default:
      return [{ id: "out", tone: "default" }];
  }
}

export function defaultConfigFor(kind: NodeKind): WorkflowNodeConfig {
  switch (kind) {
    case "trigger":
      return { triggerKind: "inbound", keywords: "", match: "any", firstMessageOnly: "false" };
    case "send-message":
      return { message: "" };
    case "wait-for-reply":
      return { saveAs: "answer", timeout: "10" };
    case "delay":
      return { waitFor: "5" };
    case "condition":
      return { rules: stringifyRules([{ variable: "", operator: "contains", value: "" }]) };
    case "set-variable":
      return { name: "", value: "" };
    case "webhook":
      return { method: "POST", url: "", body: "", saveAs: "" };
    case "ai-whatsapp-call":
      return {
        provider: "anthropic",
        model: "claude-sonnet",
        systemPrompt: "",
        userPrompt: "",
        saveAs: "aiResponse",
        outputType: "text",
        maxTokens: "1500",
        includeHistory: "false",
      };
    case "ab-split":
      return { percentageA: "50" };
    case "set-contact-field":
      return { field: "", value: "" };
    case "enroll-sequence":
      return { sequence: "", saveAs: "enrollment" };
    case "add-tag":
      return { tag: "" };
    case "remove-tag":
      return { tag: "" };
    case "handoff":
      return { assignTo: "", note: "" };
    case "end":
      return {};
  }
}

export function clientNodeSummary(node: WorkflowNode<NodeKind>): string {
  const c = node.config;
  switch (node.kind) {
    case "trigger": {
      const kindLabel = { inbound: "Any inbound message", comment: "Comentário com palavra-chave", follower: "Novo seguidor" }[
        c.triggerKind ?? "inbound"
      ];
      return c.keywords ? `${kindLabel} · "${c.keywords}"` : kindLabel ?? "Any inbound message";
    }
    case "send-message":
      return c.message || "Sem mensagem definida";
    case "wait-for-reply":
      return `Save as ${c.saveAs || "—"}, timeout ${c.timeout || "10"} min`;
    case "delay":
      return `${c.waitFor || "5"} min`;
    case "condition": {
      const rules = parseRules(c.rules);
      return `${rules.length} regra${rules.length > 1 ? "s" : ""}`;
    }
    case "set-variable":
      return `${c.name || "?"} = ${c.value || "?"}`;
    case "webhook":
      return `${c.method || "POST"} ${c.url || "?"}`;
    case "ai-whatsapp-call":
      return `${c.provider || "anthropic"}/${c.model || "modelo"}`;
    case "ab-split":
      return `${c.percentageA || "50"}% A / ${100 - Number(c.percentageA || "50")}% B`;
    case "set-contact-field":
      return c.field ? `${c.field} = ${c.value || "?"}` : "No field yet";
    case "enroll-sequence":
      return c.sequence || "Pick a sequence";
    case "add-tag":
    case "remove-tag":
      return c.tag || "No tag yet";
    case "handoff":
      return c.assignTo ? `Assign to ${c.assignTo}` : "Hand off to human";
    case "end":
      return "Workflow ends";
    default:
      return "";
  }
}
