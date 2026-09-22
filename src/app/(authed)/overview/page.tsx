import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgencyMembership } from "@/lib/agency";
import { listClients } from "@/lib/clients";
import { listTasks, type TaskStatus } from "@/lib/tasks";
import { AppFrame } from "@/components/layout/AppFrame";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { agencyId, agencyName } = await requireAgencyMembership(supabase);

  const [clients, tasks] = await Promise.all([
    listClients(supabase, agencyId),
    listTasks(supabase, agencyId),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));

  const countByStatus: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const task of tasks) {
    countByStatus[task.status] += 1;
  }

  const upcoming = tasks
    .filter((task): task is typeof task & { due_date: string } => task.due_date !== null)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
    .slice(0, 5);

  return (
    <AppFrame context={{ type: "agency", active: "overview" }} agencyName={agencyName} clients={clients}>
      <div className="space-y-6">
        <h1 className="text-sm font-semibold text-foreground-strong">Visão geral</h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
            <p className="text-2xl font-semibold text-foreground-strong">{clients.length}</p>
          </div>
          {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((status) => (
            <div key={status} className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{STATUS_LABEL[status]}</p>
              <p className="text-2xl font-semibold text-foreground-strong">{countByStatus[status]}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximas entregas</h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
            {upcoming.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">Nenhuma tarefa com data de entrega.</p>
            )}
            {upcoming.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[minmax(0,1fr)_140px_90px] gap-3 border-t border-border px-3 py-2 text-sm first:border-t-0"
              >
                <span className="truncate text-foreground">{task.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {clientById.get(task.client_id)?.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
