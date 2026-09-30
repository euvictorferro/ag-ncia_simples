import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type WorkflowNodeConfig = Record<string, string>;

export type HandleTone = "default" | "green" | "orange" | "red";
export type NodeHandle = { id: string; label?: string; tone: HandleTone };

export type WorkflowNode<K extends string = string> = {
  id: string;
  kind: K;
  config: WorkflowNodeConfig;
  /** posição no canvas — x é o centro horizontal do card, y é a borda superior */
  x: number;
  y: number;
};

export type WorkflowEdge = { id: string; from: string; fromHandle: string; to: string };

export type NodeDefinition<K extends string = string> = { kind: K; label: string; description: string };

/** Forma mínima que o WorkflowEditor genérico precisa — domínios concretos (Workflow, Automation, …) estendem isso. */
export type WorkflowLike<K extends string = string> = {
  id: string;
  name: string;
  subtitle: string;
  nodes: WorkflowNode<K>[];
  edges: WorkflowEdge[];
};

export type ConditionRule = { variable: string; operator: string; value: string };

export function parseRules(raw: string | undefined): ConditionRule[] {
  if (!raw) return [{ variable: "", operator: "contains", value: "" }];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ variable: "", operator: "contains", value: "" }];
  } catch {
    return [{ variable: "", operator: "contains", value: "" }];
  }
}

export function stringifyRules(rules: ConditionRule[]): string {
  return JSON.stringify(rules);
}

/** Bundle plugável que o WorkflowEditor/NodeConfigPanel genéricos usam pra desenhar um catálogo de nós específico. */
export type WorkflowDomain<K extends string> = {
  definitions: NodeDefinition<K>[];
  definitionMap: Record<K, NodeDefinition<K>>;
  icons: Record<K, LucideIcon>;
  /** kind do nó raiz (equivalente ao Trigger) — único, sempre primeiro, não pode ser deletado. */
  rootKind: K;
  handlesFor(kind: K, config: WorkflowNodeConfig): NodeHandle[];
  defaultConfigFor(kind: K): WorkflowNodeConfig;
  summaryFor(node: WorkflowNode<K>): string;
  ConfigFields: ComponentType<{ node: WorkflowNode<K>; config: WorkflowNodeConfig; onChange: (patch: WorkflowNodeConfig) => void }>;
};
