"use client";

import { useMemo, useState } from "react";
import type { Task, TaskStatus, AgencyMember } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskGroupHeader } from "@/components/tasks/TaskGroupHeader";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { STATUS_LABEL } from "@/components/tasks/StatusIcon";

const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "done"];

type StatusGroup = { status: TaskStatus; tasks: Task[] };
type ClientGroup = { clientId: string; clientLabel: string; statusGroups: StatusGroup[] };

function groupByStatus(tasks: Task[]): StatusGroup[] {
  return STATUS_ORDER.map((status) => ({ status, tasks: tasks.filter((t) => t.status === status) })).filter(
    (group) => group.tasks.length > 0,
  );
}

function groupByClientThenStatus(tasks: Task[], clientById: Map<string, Client>): ClientGroup[] {
  const byClient = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = byClient.get(task.client_id) ?? [];
    list.push(task);
    byClient.set(task.client_id, list);
  }

  return Array.from(byClient.entries())
    .map(([clientId, clientTasks]) => ({
      clientId,
      clientLabel: clientById.get(clientId)?.name ?? "Sem cliente",
      statusGroups: groupByStatus(clientTasks),
    }))
    .sort((a, b) => a.clientLabel.localeCompare(b.clientLabel));
}

export function TasksTable({
  agencyId,
  initialTasks,
  clients = [],
  members,
  lockedClientId,
}: {
  agencyId: string;
  initialTasks: Task[];
  clients?: Client[];
  members: AgencyMember[];
  lockedClientId?: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editing, setEditing] = useState<Task | null | "new">(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const showClient = !lockedClientId;
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredTasks = tasks.filter((t) => {
    if (showClient && clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const clientGroups = useMemo(
    () => (showClient ? groupByClientThenStatus(filteredTasks, clientById) : []),
    [showClient, filteredTasks, clientById],
  );
  const statusGroups = useMemo(() => (!showClient ? groupByStatus(filteredTasks) : []), [showClient, filteredTasks]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function upsert(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function renderStatusGroup(group: StatusGroup, groupKey: string) {
    const collapsed = collapsedGroups.has(groupKey);
    return (
      <div key={groupKey}>
        <TaskGroupHeader
          label={STATUS_LABEL[group.status]}
          count={group.tasks.length}
          collapsed={collapsed}
          onToggle={() => toggleGroup(groupKey)}
        />
        {!collapsed &&
          group.tasks.map((task) => <TaskRow key={task.id} task={task} members={members} onClick={() => setEditing(task)} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-sm font-semibold text-foreground-strong">Tarefas</h1>
        <div className="flex flex-wrap items-center gap-2">
          {showClient && (
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            >
              <option value="all">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="all">Todos os status</option>
            <option value="todo">A fazer</option>
            <option value="doing">Em andamento</option>
            <option value="done">Concluída</option>
          </select>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Nova tarefa
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/40">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_120px_100px_90px] items-center gap-3 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span />
          <span>Responsável</span>
          <span>Entrega</span>
          <span>Prioridade</span>
        </div>
        {showClient
          ? clientGroups.map((clientGroup) => (
              <div key={clientGroup.clientId}>
                <p className="truncate border-t border-border px-3 py-2 text-sm font-medium text-foreground-strong first:border-t-0">
                  {clientGroup.clientLabel}
                </p>
                {clientGroup.statusGroups.map((group) => renderStatusGroup(group, `${clientGroup.clientId}:${group.status}`))}
              </div>
            ))
          : statusGroups.map((group) => renderStatusGroup(group, group.status))}
        {filteredTasks.length === 0 && (
          <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground first:border-t-0">
            Nenhuma tarefa encontrada.
          </p>
        )}
      </div>

      {editing !== null && (
        <TaskDetailModal
          agencyId={agencyId}
          task={editing === "new" ? null : editing}
          clients={clients}
          members={members}
          lockedClientId={lockedClientId}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onDeleted={remove}
        />
      )}
    </div>
  );
}
