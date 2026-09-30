import { NODE_DEFINITIONS, NODE_DEFINITION_MAP, clientNodeSummary, defaultConfigFor, handlesFor, type NodeKind } from "@/lib/mockWorkflows";
import type { WorkflowDomain } from "@/lib/workflowDomain";
import { NODE_ICON } from "@/components/clientes/workflowIcons";
import { ClientNodeConfigFields } from "@/components/clientes/ClientNodeConfigFields";

export const clientWorkflowDomain: WorkflowDomain<NodeKind> = {
  definitions: NODE_DEFINITIONS,
  definitionMap: NODE_DEFINITION_MAP,
  icons: NODE_ICON,
  rootKind: "trigger",
  handlesFor,
  defaultConfigFor,
  summaryFor: clientNodeSummary,
  ConfigFields: ClientNodeConfigFields,
};
