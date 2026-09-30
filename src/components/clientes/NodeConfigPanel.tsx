"use client";

import { useState } from "react";
import { X, type LucideIcon } from "lucide-react";
import type { WorkflowDomain, WorkflowNode, WorkflowNodeConfig } from "@/lib/workflowDomain";
import { Field, inputClass } from "@/components/shared/workflowFieldKit";

export function NodeConfigPanel<K extends string>({
  node,
  domain,
  onClose,
  onSave,
  onDelete,
}: {
  node: WorkflowNode<K>;
  domain: WorkflowDomain<K>;
  onClose: () => void;
  onSave: (config: WorkflowNodeConfig) => void;
  onDelete: () => void;
}) {
  const [config, setConfig] = useState<WorkflowNodeConfig>(node.config);
  const definition = domain.definitionMap[node.kind];
  const Icon = domain.icons[node.kind] as LucideIcon;
  const ConfigFields = domain.ConfigFields;

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-border bg-background-elevated">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground-strong">
              <Icon size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground-strong">{definition.label}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{node.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Field label="Name">
            <input
              value={config._name ?? ""}
              onChange={(e) => setConfig({ ...config, _name: e.target.value })}
              placeholder={definition.label}
              className={inputClass}
            />
          </Field>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Configuration</p>
          <ConfigFields node={node} config={config} onChange={setConfig} />
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          {node.kind === domain.rootKind ? (
            <span />
          ) : (
            <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:underline">
              Delete node
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(config)}
              className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
