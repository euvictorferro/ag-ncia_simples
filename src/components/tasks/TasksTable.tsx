"use client";

import { useMemo, useState } from "react";
import type { Task, TaskStatus, AgencyMember } from "@/lib/tasks";
import type { Client } from "@/lib/clients";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

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

  const showClient = !lockedClientId;
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredTasks = tasks.filter((t) => {
    if (showClient && clientFilter !== "all" && t.client_id !== clientFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  function upsert(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const gridCols = showClient
    ? "grid-cols-[minmax(0,1fr)_140px_120px_100px_110px_90px]"
    : "grid-cols-[minmax(0,1fr)_120px_100px_110px_90px]";

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
        <div className={`grid ${gridCols} gap-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`}>
          <span>Título</span>
          {showClient && <span>Cliente</span>}
          <span>Status</span>
          <span>Responsável</span>
          <span>Entrega</span>
          <span>Prioridade</span>
        </div>
        {filteredTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            client={clientById.get(task.client_id)}
            members={members}
            showClient={showClient}
            onClick={() => setEditing(task)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <p className="border-t border-border px-3 py-4 text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
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
