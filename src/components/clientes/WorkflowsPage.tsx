"use client";

import { useState } from "react";
import { Plus, Search, Workflow as WorkflowIconLucide, Copy, MoreVertical, Trash2, GitBranch } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, WhatsappIcon } from "@hugeicons/core-free-icons";
import type { NodeKind, Workflow, WorkflowEdge, WorkflowNode, WorkflowPlatform, WorkflowStatus } from "@/lib/mockWorkflows";
import { NewWorkflowModal } from "@/components/clientes/NewWorkflowModal";
import { WorkflowEditor } from "@/components/clientes/WorkflowEditor";
import { clientWorkflowDomain } from "@/components/clientes/clientWorkflowDomain";

const STATUS_STYLE: Record<WorkflowStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-400/10 text-emerald-400",
  paused: "bg-yellow-400/10 text-yellow-400",
};

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: "draft",
  active: "active",
  paused: "paused",
};

const PLATFORM_ICON = { instagram: InstagramIcon, whatsapp: WhatsappIcon };
const PLATFORM_LABEL: Record<WorkflowPlatform, string> = { instagram: "Instagram", whatsapp: "WhatsApp" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
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

export function WorkflowsPage({ clientId }: { clientId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | WorkflowPlatform>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "all" || w.status === statusFilter) &&
      (platformFilter === "all" || w.platform === platformFilter),
  );
  const editingWorkflow = workflows.find((w) => w.id === editingWorkflowId) ?? null;

  function createWorkflow(input: { name: string; subtitle: string; platform: WorkflowPlatform; accountLabel: string }) {
    const workflow: Workflow = {
      id: `wf-${clientId.slice(0, 6)}-${Date.now()}`,
      name: input.name,
      subtitle: input.subtitle,
      platform: input.platform,
      accountLabel: input.accountLabel,
      status: "draft",
      nodes: [],
      edges: [],
      runsStarted: 0,
      runsDone: 0,
      createdAt: new Date().toISOString(),
    };
    setWorkflows((prev) => [workflow, ...prev]);
    setShowNewModal(false);
    setEditingWorkflowId(workflow.id);
  }

  function saveWorkflow(id: string, nodes: WorkflowNode<NodeKind>[], edges: WorkflowEdge[], status: "draft" | "active") {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, nodes, edges, status } : w)));
    setEditingWorkflowId(null);
  }

  function deleteWorkflow(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function copyId(id: string) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  }

  if (editingWorkflow) {
    return (
      <WorkflowEditor
        workflow={editingWorkflow}
        domain={clientWorkflowDomain}
        onCancel={() => setEditingWorkflowId(null)}
        onSave={(nodes, edges, status) => saveWorkflow(editingWorkflow.id, nodes, edges, status)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground-strong">Workflows</h1>
          <p className="text-sm text-muted-foreground">Graph-based automations that respond to inbound messages</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows…"
            className="w-full rounded-md border border-border bg-background-elevated py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | WorkflowStatus)}
            className="rounded-md border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as "all" | WorkflowPlatform)}
            className="rounded-md border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="all">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      <div className="overflow-visible rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Name</th>
              <th className="px-3">Platform</th>
              <th className="px-3">Account</th>
              <th className="px-3">Nodes</th>
              <th className="px-3">Runs</th>
              <th className="px-3">Created</th>
              <th className="pr-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <WorkflowIconLucide size={20} />
                    </span>
                    <p className="text-sm text-muted-foreground">No workflows yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowNewModal(true)}
                      className="flex items-center gap-1.5 rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
                    >
                      <Plus size={14} />
                      Create workflow
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((workflow) => (
                <tr
                  key={workflow.id}
                  onClick={() => setEditingWorkflowId(workflow.id)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                >
                  <td className="py-2 pl-3 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground">{workflow.name}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${STATUS_STYLE[workflow.status]}`}>
                        {STATUS_LABEL[workflow.status]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyId(workflow.id);
                      }}
                      className="mt-1 flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      ID: {workflow.id.slice(-6)}
                      <Copy size={10} />
                      {copiedId === workflow.id && <span className="text-emerald-400">copiado</span>}
                    </button>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={PLATFORM_ICON[workflow.platform]} size={14} />
                      {PLATFORM_LABEL[workflow.platform]}
                    </span>
                  </td>
                  <td className="px-3 text-muted-foreground">{workflow.accountLabel}</td>
                  <td className="px-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} />
                      {workflow.nodes.length}
                    </span>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    {workflow.runsStarted} started <span className="text-emerald-400">{workflow.runsDone} done</span>
                  </td>
                  <td className="px-3 text-muted-foreground">{formatDate(workflow.createdAt)}</td>
                  <td className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowMenu onDelete={() => deleteWorkflow(workflow.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNewModal && <NewWorkflowModal onClose={() => setShowNewModal(false)} onCreate={createWorkflow} />}
    </div>
  );
}
