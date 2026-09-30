import { AlertTriangle, CheckCircle2, CircleDashed, Clock, ListTodo, Users } from "lucide-react";
import type { Client, ClientHealth, ServiceType } from "@/lib/clients";
import type { AgencyMember, Task, TaskStatus } from "@/lib/tasks";
import { DonutChart } from "@/components/charts/DonutChart";
import { StackedColumnChart, type StackedColumnItem } from "@/components/charts/StackedColumnChart";
import { AvatarCountList } from "@/components/charts/AvatarCountList";
import { LineChart } from "@/components/charts/LineChart";
import { WidgetBoardProvider, WidgetToggleButton, Widget } from "@/components/home/WidgetBoard";
import {
  CATEGORICAL,
  ChartCard,
  RankedList,
  StatCard,
  STATUS_GOOD,
  STATUS_WARNING,
  STATUS_CRITICAL,
  countBy,
  formatDueDate,
  healthColor,
  normalizeHealth,
} from "@/components/home/shared";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const HEALTH_LABEL: Record<ClientHealth, string> = {
  green: "Saudáveis",
  yellow: "Atenção",
  red: "Risco",
};

const SERVICE_LABEL: Record<ServiceType, string> = {
  trafego: "Tráfego",
  conteudo: "Conteúdo",
  chamadas: "Chamadas",
  "360": "360",
  outro: "Outro",
};

const WIDGET_OPTIONS = [
  { id: "task-status", label: "Tarefas por status" },
  { id: "client-health", label: "Saúde dos clientes" },
  { id: "completed-line", label: "Tarefas concluídas (14 dias)" },
  { id: "workload", label: "Carga por responsável" },
  { id: "client-load", label: "Clientes por responsável" },
  { id: "niche", label: "Clientes por nicho" },
  { id: "service-type", label: "Clientes por tipo de serviço" },
  { id: "clients-at-risk", label: "Clientes em risco" },
  { id: "upcoming", label: "Próximas entregas" },
];

function memberLabel(member: AgencyMember | undefined): string {
  return member ? (member.name ?? member.user_id.slice(0, 8)) : "Sem responsável";
}

export function DashboardOverview({
  clients,
  tasks,
  members,
}: {
  clients: Client[];
  tasks: Task[];
  members: AgencyMember[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const countByStatus: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const task of tasks) countByStatus[task.status] += 1;

  const countByHealth: Record<ClientHealth, number> = { green: 0, yellow: 0, red: 0 };
  for (const client of clients) countByHealth[normalizeHealth(client.health)] += 1;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const in30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => t.due_date !== null && t.due_date < today).length;
  const dueThisWeek = openTasks.filter(
    (t) => t.due_date !== null && t.due_date >= today && t.due_date <= in7Days,
  ).length;
  const highPriorityOpen = openTasks.filter((t) => t.priority === "high").length;

  const doneWithDueDate = tasks.filter((t) => t.status === "done" && t.due_date !== null);
  const onTimeCount = doneWithDueDate.filter((t) => t.updated_at.slice(0, 10) <= t.due_date!).length;
  const onTimeRate =
    doneWithDueDate.length === 0 ? null : Math.round((onTimeCount / doneWithDueDate.length) * 100);

  const completedLast30Days = tasks.filter(
    (t) => t.status === "done" && new Date(t.updated_at) >= in30Days,
  ).length;

  const completedByDay = new Map<string, number>();
  for (const task of tasks) {
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

  const upcoming = tasks
    .filter(
      (task): task is typeof task & { due_date: string } =>
        task.due_date !== null && task.status !== "done" && task.due_date >= today,
    )
    .sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
    .slice(0, 6);

  const clientsAtRisk = clients
    .filter((c) => normalizeHealth(c.health) !== "green")
    .sort((a, b) => (normalizeHealth(a.health) === "red" ? -1 : normalizeHealth(b.health) === "red" ? 1 : 0));

  const workloadByAssignee = new Map<string, StackedColumnItem>();
  for (const task of tasks) {
    if (!task.assignee_id) continue;
    const key = task.assignee_id;
    const entry =
      workloadByAssignee.get(key) ?? { label: memberLabel(memberById.get(key)), todo: 0, doing: 0, done: 0, overdue: 0 };
    const isOverdue = task.status !== "done" && task.due_date !== null && task.due_date < today;
    if (isOverdue) entry.overdue += 1;
    else if (task.status === "todo") entry.todo += 1;
    else if (task.status === "doing") entry.doing += 1;
    else entry.done += 1;
    workloadByAssignee.set(key, entry);
  }
  const workloadItems = [...workloadByAssignee.values()];

  const clientsByAssignee = countBy(
    clients.filter((c) => c.assigned_to !== null),
    (c) => c.assigned_to as string,
  );
  const clientLoadItems = [...clientsByAssignee.entries()].map(([memberId, value]) => ({
    label: memberLabel(memberById.get(memberId)),
    value,
  }));

  const nicheItems = [...countBy(clients, (c) => c.niche ?? "Sem nicho").entries()].map(([label, value]) => ({
    label,
    value,
  }));
  const serviceItems = [
    ...countBy(clients, (c) => (c.service_type ? SERVICE_LABEL[c.service_type] : "Sem tipo")).entries(),
  ].map(([label, value]) => ({ label, value }));

  return (
    <WidgetBoardProvider storageKey="dash-widgets-geral">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold text-foreground-strong">Geral</h1>
            <p className="text-xs text-muted-foreground">Visão geral da agência</p>
          </div>
          <WidgetToggleButton options={WIDGET_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Clientes ativos" value={String(clients.length)} />
          <StatCard icon={ListTodo} label="Tarefas em aberto" value={String(openTasks.length)} />
          <StatCard icon={Clock} label="Atrasadas" value={String(overdue)} tone={overdue > 0 ? "warning" : undefined} />
          <StatCard icon={CircleDashed} label="Vencendo em 7 dias" value={String(dueThisWeek)} />
          <StatCard icon={AlertTriangle} label="Alta prioridade em aberto" value={String(highPriorityOpen)} />
          <StatCard icon={CheckCircle2} label="Concluídas (30 dias)" value={String(completedLast30Days)} />
          <StatCard icon={CheckCircle2} label="Entregues no prazo" value={onTimeRate === null ? "—" : `${onTimeRate}%`} />
          <StatCard
            icon={AlertTriangle}
            label="Clientes em risco"
            value={String(countByHealth.yellow + countByHealth.red)}
            tone={countByHealth.yellow + countByHealth.red > 0 ? "warning" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Widget id="task-status">
            <ChartCard title="Tarefas por status">
              <DonutChart
                segments={[
                  { label: STATUS_LABEL.todo, value: countByStatus.todo, color: CATEGORICAL[0] },
                  { label: STATUS_LABEL.doing, value: countByStatus.doing, color: CATEGORICAL[3] },
                  { label: STATUS_LABEL.done, value: countByStatus.done, color: CATEGORICAL[5] },
                ]}
              />
            </ChartCard>
          </Widget>
          <Widget id="client-health">
            <ChartCard title="Saúde dos clientes">
              <DonutChart
                segments={[
                  { label: HEALTH_LABEL.green, value: countByHealth.green, color: STATUS_GOOD },
                  { label: HEALTH_LABEL.yellow, value: countByHealth.yellow, color: STATUS_WARNING },
                  { label: HEALTH_LABEL.red, value: countByHealth.red, color: STATUS_CRITICAL },
                ]}
              />
            </ChartCard>
          </Widget>
        </div>

        <Widget id="completed-line">
          <ChartCard title="Tarefas concluídas (últimos 14 dias)">
            <LineChart points={dailyCompletions} color={CATEGORICAL[0]} />
          </ChartCard>
        </Widget>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Widget id="workload">
            <ChartCard title="Carga por responsável">
              {workloadItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa atribuída.</p>
              ) : (
                <StackedColumnChart items={workloadItems} />
              )}
            </ChartCard>
          </Widget>
          <Widget id="client-load">
            <ChartCard title="Clientes por responsável">
              <AvatarCountList items={clientLoadItems} emptyLabel="Nenhum cliente com responsável." />
            </ChartCard>
          </Widget>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Widget id="niche">
            <RankedList title="Clientes por nicho" items={nicheItems} emptyLabel="Sem clientes cadastrados." />
          </Widget>
          <Widget id="service-type">
            <RankedList title="Clientes por tipo de serviço" items={serviceItems} emptyLabel="Sem clientes cadastrados." />
          </Widget>
        </div>

        <Widget id="clients-at-risk">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clientes em risco</h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
              {clientsAtRisk.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum cliente em atenção ou risco. 🎉</p>
              )}
              {clientsAtRisk.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_140px] items-center gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0"
                >
                  <span className="flex items-center gap-2 truncate text-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: healthColor(client.health) }} />
                    {client.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{client.niche ?? "—"}</span>
                  <span className="truncate text-xs text-muted-foreground">{memberLabel(memberById.get(client.assigned_to ?? ""))}</span>
                </div>
              ))}
            </div>
          </div>
        </Widget>

        <Widget id="upcoming">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximas entregas</h2>
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
