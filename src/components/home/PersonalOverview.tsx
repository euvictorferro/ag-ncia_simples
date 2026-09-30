import { AlertTriangle, CheckCircle2, Clock, ListTodo, Target, Users } from "lucide-react";
import type { Client } from "@/lib/clients";
import type { AgencyMember, Task, TaskStatus } from "@/lib/tasks";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import { WidgetBoardProvider, WidgetToggleButton, Widget } from "@/components/home/WidgetBoard";
import {
  CATEGORICAL,
  ChartCard,
  RankedList,
  StatCard,
  formatDueDate,
  healthColor,
  normalizeHealth,
} from "@/components/home/shared";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const WIDGET_OPTIONS = [
  { id: "task-status", label: "Minhas tarefas por status" },
  { id: "completed-line", label: "Minhas tarefas concluídas (14 dias)" },
  { id: "workload-by-client", label: "Minhas tarefas abertas por cliente" },
  { id: "my-clients", label: "Meus clientes" },
  { id: "upcoming", label: "Minhas próximas entregas" },
];

export function PersonalOverview({
  currentMember,
  clients,
  tasks,
}: {
  currentMember: AgencyMember | undefined;
  clients: Client[];
  tasks: Task[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const myClients = clients.filter((c) => c.assigned_to === currentMember?.id);
  const myTasks = tasks.filter((t) => t.assignee_id === currentMember?.id);

  const countByStatus: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const task of myTasks) countByStatus[task.status] += 1;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const in30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const openTasks = myTasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => t.due_date !== null && t.due_date < today).length;
  const dueThisWeek = openTasks.filter(
    (t) => t.due_date !== null && t.due_date >= today && t.due_date <= in7Days,
  ).length;
  const highPriorityOpen = openTasks.filter((t) => t.priority === "high").length;
  const completedLast30Days = myTasks.filter(
    (t) => t.status === "done" && new Date(t.updated_at) >= in30Days,
  ).length;

  const doneWithDueDate = myTasks.filter((t) => t.status === "done" && t.due_date !== null);
  const onTimeCount = doneWithDueDate.filter((t) => t.updated_at.slice(0, 10) <= t.due_date!).length;
  const onTimeRate =
    doneWithDueDate.length === 0 ? null : Math.round((onTimeCount / doneWithDueDate.length) * 100);

  const clientsAtRisk = myClients.filter((c) => normalizeHealth(c.health) !== "green").length;

  const completedByDay = new Map<string, number>();
  for (const task of myTasks) {
    if (task.status !== "done") continue;
    const day = task.updated_at.slice(0, 10);
    completedByDay.set(day, (completedByDay.get(day) ?? 0) + 1);
  }
  const dailyCompletions = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return {
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      value: completedByDay.get(key) ?? 0,
    };
  });

  const upcoming = openTasks
    .filter((task): task is typeof task & { due_date: string } => task.due_date !== null && task.due_date >= today)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
    .slice(0, 6);

  const openTasksByClient = new Map<string, number>();
  for (const task of openTasks) openTasksByClient.set(task.client_id, (openTasksByClient.get(task.client_id) ?? 0) + 1);
  const clientLoadItems = [...openTasksByClient.entries()].map(([clientId, value]) => ({
    label: clientById.get(clientId)?.name ?? "—",
    value,
  }));

  return (
    <WidgetBoardProvider storageKey="dash-widgets-pessoal">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold text-foreground-strong">Pessoal</h1>
            <p className="text-xs text-muted-foreground">
              {currentMember
                ? `Suas tarefas e clientes, ${(currentMember.name ?? "").split(" ")[0] || ""}`.trim()
                : "Suas tarefas e clientes"}
            </p>
          </div>
          <WidgetToggleButton options={WIDGET_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Meus clientes" value={String(myClients.length)} />
          <StatCard icon={ListTodo} label="Minhas tarefas em aberto" value={String(openTasks.length)} />
          <StatCard icon={Clock} label="Atrasadas" value={String(overdue)} tone={overdue > 0 ? "warning" : undefined} />
          <StatCard icon={AlertTriangle} label="Vencendo em 7 dias" value={String(dueThisWeek)} />
          <StatCard icon={AlertTriangle} label="Alta prioridade em aberto" value={String(highPriorityOpen)} />
          <StatCard icon={CheckCircle2} label="Concluídas (30 dias)" value={String(completedLast30Days)} />
          <StatCard
            icon={CheckCircle2}
            label="Entregues no prazo"
            value={onTimeRate === null ? "—" : `${onTimeRate}%`}
            tone={onTimeRate !== null && onTimeRate >= 80 ? "positive" : undefined}
          />
          <StatCard
            icon={Target}
            label="Meus clientes em risco"
            value={String(clientsAtRisk)}
            tone={clientsAtRisk > 0 ? "warning" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Widget id="task-status">
            <ChartCard title="Minhas tarefas por status">
              <DonutChart
                segments={[
                  { label: STATUS_LABEL.todo, value: countByStatus.todo, color: CATEGORICAL[0] },
                  { label: STATUS_LABEL.doing, value: countByStatus.doing, color: CATEGORICAL[3] },
                  { label: STATUS_LABEL.done, value: countByStatus.done, color: CATEGORICAL[5] },
                ]}
              />
            </ChartCard>
          </Widget>
          <Widget id="completed-line">
            <ChartCard title="Minhas tarefas concluídas (últimos 14 dias)">
              <LineChart points={dailyCompletions} color={CATEGORICAL[0]} />
            </ChartCard>
          </Widget>
        </div>

        <Widget id="workload-by-client">
          <RankedList title="Minhas tarefas abertas por cliente" items={clientLoadItems} emptyLabel="Nenhuma tarefa em aberto." />
        </Widget>

        <Widget id="my-clients">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meus clientes</h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
              {myClients.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum cliente atribuído a você.</p>
              )}
              {myClients.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-[minmax(0,1fr)_110px_90px] items-center gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0"
                >
                  <span className="flex items-center gap-2 truncate text-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: healthColor(client.health) }} />
                    {client.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{client.niche ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {openTasksByClient.get(client.id) ?? 0} tarefa{(openTasksByClient.get(client.id) ?? 0) === 1 ? "" : "s"} aberta
                    {(openTasksByClient.get(client.id) ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Widget>

        <Widget id="upcoming">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minhas próximas entregas</h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
              {upcoming.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma entrega pendente com data.</p>
              )}
              {upcoming.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[minmax(0,1fr)_140px_90px] items-center gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0"
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
        </Widget>
      </div>
    </WidgetBoardProvider>
  );
}
