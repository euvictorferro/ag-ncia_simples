import type { TaskPriority } from "@/lib/tasks";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#8a897f",
  medium: "#e0a63a",
  high: "#e05a3a",
};

export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: PRIORITY_COLOR[priority] }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <path d="M1 0v10M1 1h7l-2 2 2 2H1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export { PRIORITY_LABEL };
