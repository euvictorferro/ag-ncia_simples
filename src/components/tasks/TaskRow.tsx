import type { Task } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { StatusIcon } from "@/components/tasks/StatusIcon";
import { PriorityFlag } from "@/components/tasks/PriorityFlag";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function TaskRow({
  task,
  client,
  onClick,
}: {
  task: Task;
  client: Client | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_140px_120px_110px_90px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate text-foreground">{task.title}</span>
      <span className="truncate text-xs text-muted-foreground">{client?.name ?? "—"}</span>
      <span>
        <StatusIcon status={task.status} />
      </span>
      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
      <span>
        <PriorityFlag priority={task.priority} />
      </span>
    </button>
  );
}
