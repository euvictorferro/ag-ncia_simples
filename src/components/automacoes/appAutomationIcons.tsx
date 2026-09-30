import { Zap, FileBarChart, ListChecks, BellRing, GitBranch, Timer, Webhook, Square, type LucideIcon } from "lucide-react";
import type { AutomationNodeKind } from "@/lib/mockAppAutomations";

export const AUTOMATION_NODE_ICON: Record<AutomationNodeKind, LucideIcon> = {
  trigger: Zap,
  "send-report": FileBarChart,
  "create-task": ListChecks,
  "notify-internal": BellRing,
  condition: GitBranch,
  delay: Timer,
  webhook: Webhook,
  end: Square,
};
