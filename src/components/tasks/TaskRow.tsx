import type { AgencyMember, Task } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { StatusIcon } from "@/components/tasks/StatusIcon";
import { PriorityFlag } from "@/components/tasks/PriorityFlag";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function TaskRow({
  task,
  client,
  members,
  showClient,
  onClick,
}: {
  task: Task;
  client: Client | undefined;
  members: AgencyMember[];
  showClient: boolean;
  onClick: () => void;
}) {
  const assignee = task.assignee_id ? members.find((m) => m.id === task.assignee_id) : undefined;
  const gridCols = showClient
    ? "grid-cols-[minmax(0,1fr)_140px_120px_100px_110px_90px]"
    : "grid-cols-[minmax(0,1fr)_120px_100px_110px_90px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full ${gridCols} items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted`}
    >
      <span className="truncate text-foreground">{task.title}</span>
      {showClient && <span className="truncate text-xs text-muted-foreground">{client?.name ?? "—"}</span>}
      <span>
        <StatusIcon status={task.status} />
      </span>
      <span className="text-xs text-muted-foreground">{assignee ? assignee.user_id.slice(0, 8) : "—"}</span>
      <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
      <span>
        <PriorityFlag priority={task.priority} />
      </span>
    </button>
  );
}
