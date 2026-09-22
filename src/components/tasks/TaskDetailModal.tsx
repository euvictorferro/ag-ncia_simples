"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  createTask,
  deleteTask,
  updateTask,
  type AgencyMember,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import type { Client } from "@/lib/clients";

export function TaskDetailModal({
  agencyId,
  task,
  clients,
  members,
  onClose,
  onSaved,
  onDeleted,
}: {
  agencyId: string;
  task: Task | null;
  clients: Client[];
  members: AgencyMember[];
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientId, setClientId] = useState(task?.client_id ?? clients[0]?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) {
      setError("Título e cliente são obrigatórios.");
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createBrowserSupabaseClient();
    const input: TaskInput = {
      client_id: clientId,
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    };

    try {
      const saved = task ? await updateTask(supabase, task.id, input) : await createTask(supabase, agencyId, input);
      onSaved(saved);
      onClose();
    } catch {
      setError("Não foi possível salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Excluir esta tarefa?")) return;

    const supabase = createBrowserSupabaseClient();
    try {
      await deleteTask(supabase, task.id);
      onDeleted(task.id);
      onClose();
    } catch {
      setError("Não foi possível excluir a tarefa.");
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">{task ? "Editar tarefa" : "Nova tarefa"}</h2>

        <div className="space-y-1">
          <label htmlFor="task-title" className="text-xs text-muted-foreground">
            Título
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="task-description" className="text-xs text-muted-foreground">
            Descrição (markdown)
          </label>
          <textarea
            id="task-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
          {description && (
            <div className="prose prose-invert prose-sm max-w-none rounded-md border border-border bg-background px-3 py-2">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="task-client" className="text-xs text-muted-foreground">
              Cliente
            </label>
            <select
              id="task-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-assignee" className="text-xs text-muted-foreground">
              Responsável
            </label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user_id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-status" className="text-xs text-muted-foreground">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="done">Concluída</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-priority" className="text-xs text-muted-foreground">
              Prioridade
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="col-span-2 space-y-1">
            <label htmlFor="task-due-date" className="text-xs text-muted-foreground">
              Data de entrega
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between">
          <div>
            {task && (
              <button type="button" onClick={handleDelete} className="text-xs text-red-400 hover:underline">
                Excluir tarefa
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
