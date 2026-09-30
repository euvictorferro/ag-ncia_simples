"use client";

import { useState } from "react";
import { Plus, Search, Workflow as WorkflowIconLucide, Copy, MoreVertical, Trash2, GitBranch } from "lucide-react";
import { seedTemplateAutomations, type Automation, type AutomationStatus } from "@/lib/mockAppAutomations";
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflowDomain";
import type { AutomationNodeKind } from "@/lib/mockAppAutomations";
import { NewAutomationModal } from "@/components/automacoes/NewAutomationModal";
import { WorkflowEditor } from "@/components/clientes/WorkflowEditor";
import { appAutomationDomain } from "@/components/automacoes/appAutomationDomain";

const STATUS_STYLE: Record<AutomationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-400/10 text-emerald-400",
  paused: "bg-yellow-400/10 text-yellow-400",
};

const STATUS_LABEL: Record<AutomationStatus, string> = {
  draft: "draft",
  active: "active",
  paused: "paused",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function RowMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Mais opções"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-border bg-background-elevated p-1 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-red-400 hover:bg-muted"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(seedTemplateAutomations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AutomationStatus>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = automations.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "all" || a.status === statusFilter),
  );
  const editing = automations.find((a) => a.id === editingId) ?? null;

  function createAutomation(input: { name: string; subtitle: string }) {
    const automation: Automation = {
      id: `auto-${Date.now()}`,
      name: input.name,
      subtitle: input.subtitle,
      status: "draft",
      nodes: [],
      edges: [],
      runsStarted: 0,
      runsDone: 0,
      createdAt: new Date().toISOString(),
    };
    setAutomations((prev) => [automation, ...prev]);
    setShowNewModal(false);
    setEditingId(automation.id);
  }

  function saveAutomation(id: string, nodes: WorkflowNode<AutomationNodeKind>[], edges: WorkflowEdge[], status: "draft" | "active") {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, nodes, edges, status } : a)));
    setEditingId(null);
  }

  function deleteAutomation(id: string) {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  }

  function copyId(id: string) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  }

  if (editing) {
    return (
      <WorkflowEditor
        workflow={editing}
        domain={appAutomationDomain}
        onCancel={() => setEditingId(null)}
        onSave={(nodes, edges, status) => saveAutomation(editing.id, nodes, edges, status)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground-strong">Automações</h1>
          <p className="text-sm text-muted-foreground">Automações internas do app — relatórios, tasks e notificações</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
        >
          <Plus size={14} />
          Nova automação
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar automações…"
            className="w-full rounded-md border border-border bg-background-elevated py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | AutomationStatus)}
          className="rounded-md border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
        >
          <option value="all">Todos os status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="overflow-visible rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Nome</th>
              <th className="px-3">Nós</th>
              <th className="px-3">Execuções</th>
              <th className="px-3">Criada em</th>
              <th className="pr-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <WorkflowIconLucide size={20} />
                    </span>
                    <p className="text-sm text-muted-foreground">Nenhuma automação ainda.</p>
                    <button
                      type="button"
                      onClick={() => setShowNewModal(true)}
                      className="flex items-center gap-1.5 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
                    >
                      <Plus size={14} />
                      Criar automação
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((automation) => (
                <tr
                  key={automation.id}
                  onClick={() => setEditingId(automation.id)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                >
                  <td className="py-2 pl-3 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground">{automation.name}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${STATUS_STYLE[automation.status]}`}>
                        {STATUS_LABEL[automation.status]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyId(automation.id);
                      }}
                      className="mt-1 flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      ID: {automation.id.slice(-6)}
                      <Copy size={10} />
                      {copiedId === automation.id && <span className="text-emerald-400">copiado</span>}
                    </button>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} />
                      {automation.nodes.length}
                    </span>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    {automation.runsStarted} iniciadas <span className="text-emerald-400">{automation.runsDone} concluídas</span>
                  </td>
                  <td className="px-3 text-muted-foreground">{formatDate(automation.createdAt)}</td>
                  <td className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowMenu onDelete={() => deleteAutomation(automation.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && <NewAutomationModal onClose={() => setShowNewModal(false)} onCreate={createAutomation} />}
    </div>
  );
}
