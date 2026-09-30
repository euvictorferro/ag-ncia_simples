import {
  NODE_DEFINITIONS,
  NODE_DEFINITION_MAP,
  automationNodeSummary,
  defaultConfigFor,
  handlesFor,
  type AutomationNodeKind,
} from "@/lib/mockAppAutomations";
import type { WorkflowDomain } from "@/lib/workflowDomain";
import { AUTOMATION_NODE_ICON } from "@/components/automacoes/appAutomationIcons";
import { AppAutomationConfigFields } from "@/components/automacoes/AppAutomationConfigFields";

export const appAutomationDomain: WorkflowDomain<AutomationNodeKind> = {
  definitions: NODE_DEFINITIONS,
  definitionMap: NODE_DEFINITION_MAP,
  icons: AUTOMATION_NODE_ICON,
  rootKind: "trigger",
  handlesFor,
  defaultConfigFor,
  summaryFor: automationNodeSummary,
  ConfigFields: AppAutomationConfigFields,
};
