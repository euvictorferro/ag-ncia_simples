"use client";

import { Plus, Trash2 } from "lucide-react";
import { parseRules, stringifyRules, type ConditionRule, type WorkflowNodeConfig } from "@/lib/workflowDomain";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong";

/** Campos de regra genéricos pra qualquer nó "condition" (independe do domínio de workflow). */
export function ConditionFields({ config, onChange }: { config: WorkflowNodeConfig; onChange: (patch: WorkflowNodeConfig) => void }) {
  const rules = parseRules(config.rules);

  function updateRule(i: number, patch: Partial<ConditionRule>) {
    const next = rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange({ ...config, rules: stringifyRules(next) });
  }

  function addRule() {
    onChange({ ...config, rules: stringifyRules([...rules, { variable: "", operator: "contains", value: "" }]) });
  }

  function removeRule(i: number) {
    const next = rules.filter((_, idx) => idx !== i);
    onChange({ ...config, rules: stringifyRules(next.length ? next : [{ variable: "", operator: "contains", value: "" }]) });
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          <Field label={i === 0 ? "Variable" : `Variable (r${i + 1})`}>
            <input
              value={rule.variable}
              onChange={(e) => updateRule(i, { variable: e.target.value })}
              placeholder="answer (type {"
              className={inputClass}
            />
          </Field>
          <Field label="Operator">
            <select value={rule.operator} onChange={(e) => updateRule(i, { operator: e.target.value })} className={inputClass}>
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="not_equals">not equals</option>
              <option value="starts_with">starts with</option>
            </select>
          </Field>
          <div className="flex items-end gap-1">
            <Field label="Value">
              <input value={rule.value} onChange={(e) => updateRule(i, { value: e.target.value })} className={inputClass} />
            </Field>
            {rules.length > 1 && (
              <button
                type="button"
                onClick={() => removeRule(i)}
                aria-label="Remover regra"
                className="mb-2 shrink-0 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={addRule} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Plus size={12} />
        Add rule (matches if ANY rule matches)
      </button>
      <p className="text-[11px] text-muted-foreground">
        Puxe uma linha de cada rN pro próximo passo. O handle <span className="font-mono text-yellow-500">else</span> roda quando
        nenhuma regra bate.
      </p>
    </div>
  );
}
