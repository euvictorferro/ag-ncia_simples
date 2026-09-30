"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, Plus, RotateCcw } from "lucide-react";
import type { SidebarTreeNode } from "@/components/ui/SidebarTree";
import { getDueDateDisplay, newId } from "@/components/spaces/kanbanTypes";
import { LIST_STATUSES, seedListTasks, type ListStatus, type ListTask } from "@/components/spaces/listTypes";

function StatusIcon({ type, color }: { type: ListStatus["type"]; color: string }) {
  if (type === "open") {
    return (
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (type === "closed") {
    return (
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="6" cy="6" r="5" fill={color} />
        <path d="M3.5 6.2l1.7 1.7L8.5 4.3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.4" />
      <path d="M6 1a5 5 0 0 1 0 10Z" fill={color} />
    </svg>
  );
}

function PriorityFlag({ priority }: { priority: ListTask["priority"] }) {
  if (!priority) return null;
  return (
    <span title={priority.label}>
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M2.5 1v10" stroke={priority.color} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M2.5 1.5h6.5l-1.8 2.25L9 6H2.5Z" fill={priority.color} />
      </svg>
    </span>
  );
}

function TaskRow({ task }: { task: ListTask }) {
  const status = LIST_STATUSES.find((s) => s.status === task.status)!;
  const due = task.dueDate ? getDueDateDisplay(task.dueDate) : null;

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_130px_110px_90px_80px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <StatusIcon type={status.type} color={status.color} />
        <span className="truncate text-foreground">{task.name}</span>
      </span>
      <span>
        <span className="inline-block truncate rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: status.color }}>
          {task.status}
        </span>
      </span>
      <span className={`text-xs ${due?.className ?? "text-muted-foreground"}`}>{due?.text ?? "—"}</span>
      <span className="flex items-center -space-x-1.5">
        {task.assignees.map((a) => (
          <span
            key={a.id}
            title={a.name}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background-elevated text-[9px] font-semibold text-white"
            style={{ backgroundColor: a.color }}
          >
            {a.initials}
          </span>
        ))}
      </span>
      <PriorityFlag priority={task.priority} />
    </div>
  );
}

function AddTaskRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted"
      >
        <Plus size={12} /> Add task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        onBlur={() => !name.trim() && setAdding(false)}
        placeholder="Nome da task"
        className="h-8 flex-1 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none focus:border-foreground-strong"
      />
      <button type="button" onClick={submit} className="rounded-md bg-button px-2.5 py-1.5 text-xs font-medium text-button-foreground">
        Add
      </button>
    </div>
  );
}

function TaskSection({ status, tasks, onAddTask }: { status: ListStatus; tasks: ListTask[]; onAddTask: (name: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-muted/60">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left">
        <ChevronDown size={12} className={`shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: status.color }}>
          {status.status}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{tasks.length}</span>
      </button>
      {open && (
        <div className="pb-1">
          {tasks.length > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_130px_110px_90px_80px] gap-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="truncate">Nome</span>
              <span className="truncate">Status</span>
              <span className="truncate">Data</span>
              <span className="truncate">Responsável</span>
              <span className="truncate">Prioridade</span>
            </div>
          )}
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          <AddTaskRow onAdd={onAddTask} />
        </div>
      )}
    </div>
  );
}

export function ListBoard({ node, onClose }: { node: SidebarTreeNode; onClose: () => void }) {
  // ponytail: lista nasce vazia — "seedListTasks" fica só como template opcional atrás do
  // botão "Usar exemplo", não é mais o estado inicial.
  const [tasks, setTasks] = useState<ListTask[]>([]);
  const tasksByStatus = new Map<string, ListTask[]>();
  for (const t of tasks) tasksByStatus.set(t.status, [...(tasksByStatus.get(t.status) ?? []), t]);

  function addTask(status: string, name: string) {
    setTasks((prev) => [...prev, { id: newId(), name, status, dueDate: null, assignees: [], priority: null }]);
  }

  function useExample() {
    if (tasks.length > 0 && !window.confirm("Isso substitui as tasks desta lista pelo template de exemplo. Continuar?")) return;
    setTasks(seedListTasks());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Voltar">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-sm font-semibold text-foreground-strong">{node.label}</h1>
        </div>
        <button
          onClick={useExample}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={13} /> Usar template de exemplo
        </button>
      </div>
      <div className="space-y-4">
        {LIST_STATUSES.map((status) => (
          <TaskSection
            key={status.status}
            status={status}
            tasks={tasksByStatus.get(status.status) ?? []}
            onAddTask={(name) => addTask(status.status, name)}
          />
        ))}
      </div>
    </div>
  );
}
