import type { TaskStatus } from "@/lib/tasks";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "#8a897f",
  doing: "#e0a63a",
  done: "#3cb371",
};

export function StatusIcon({ status }: { status: TaskStatus }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-black"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export { STATUS_LABEL };
