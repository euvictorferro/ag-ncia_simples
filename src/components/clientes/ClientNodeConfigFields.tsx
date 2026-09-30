"use client";

import type { NodeKind, WorkflowNode } from "@/lib/mockWorkflows";
import type { WorkflowNodeConfig } from "@/lib/workflowDomain";
import { Field, inputClass, ConditionFields } from "@/components/shared/workflowFieldKit";

export function ClientNodeConfigFields({
  node,
  config,
  onChange,
}: {
  node: WorkflowNode<NodeKind>;
  config: WorkflowNodeConfig;
  onChange: (patch: WorkflowNodeConfig) => void;
}) {
  const set = (key: string, value: string) => onChange({ ...config, [key]: value });

  switch (node.kind) {
    case "trigger":
      return (
        <>
          <Field label="Trigger kind">
            <select value={config.triggerKind ?? "inbound"} onChange={(e) => set("triggerKind", e.target.value)} className={inputClass}>
              <option value="inbound">Inbound message — quando o contato manda uma DM</option>
              <option value="comment">Comment — comentário num post</option>
              <option value="follower">New follower — novo seguidor</option>
            </select>
          </Field>
          {config.triggerKind !== "follower" && (
            <Field label="Keywords (comma-separated, empty = match any)">
              <input value={config.keywords ?? ""} onChange={(e) => set("keywords", e.target.value)} placeholder="hi, hello" className={inputClass} />
            </Field>
          )}
          <div className="flex items-end gap-4">
            <Field label="Match">
              <select value={config.match ?? "any"} onChange={(e) => set("match", e.target.value)} className={inputClass}>
                <option value="any">Any</option>
                <option value="all">All</option>
              </select>
            </Field>
            <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.firstMessageOnly === "true"}
                onChange={(e) => set("firstMessageOnly", e.target.checked ? "true" : "false")}
              />
              First message only
            </label>
          </div>
        </>
      );
    case "send-message":
      return (
        <Field label="Message">
          <textarea
            value={config.message ?? ""}
            onChange={(e) => set("message", e.target.value)}
            rows={5}
            placeholder="Oi! Vi que você comentou por aqui 👋"
            className={`${inputClass} resize-none`}
          />
        </Field>
      );
    case "wait-for-reply":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Save reply as">
            <input value={config.saveAs ?? ""} onChange={(e) => set("saveAs", e.target.value)} placeholder="answer" className={inputClass} />
          </Field>
          <Field label="Timeout">
            <select value={config.timeout ?? "10"} onChange={(e) => set("timeout", e.target.value)} className={inputClass}>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="1440">1 day</option>
            </select>
          </Field>
        </div>
      );
    case "delay":
      return (
        <Field label="Wait for">
          <select value={config.waitFor ?? "5"} onChange={(e) => set("waitFor", e.target.value)} className={inputClass}>
            <option value="1">1 min</option>
            <option value="5">5 min</option>
            <option value="10">10 min</option>
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="1440">1 day</option>
          </select>
        </Field>
      );
    case "condition":
      return <ConditionFields config={config} onChange={onChange} />;
    case "set-variable":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Variable name">
            <input value={config.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="greeting" className={inputClass} />
          </Field>
          <Field label="Value">
            <input value={config.value ?? ""} onChange={(e) => set("value", e.target.value)} placeholder="Hi {{ to insert a variable" className={inputClass} />
          </Field>
        </div>
      );
    case "webhook":
      return (
        <>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <Field label="Method">
              <select value={config.method ?? "POST"} onChange={(e) => set("method", e.target.value)} className={inputClass}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </Field>
            <Field label="URL">
              <input value={config.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com/hook" className={inputClass} />
            </Field>
          </div>
          <Field label="Body (optional — empty sends contact + all variables as JSON)">
            <textarea
              value={config.body ?? ""}
              onChange={(e) => set("body", e.target.value)}
              rows={4}
              placeholder={'{"phone": "{{contact.phone}}", "intent": "{{intent}}"}'}
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </Field>
          <Field label="Save response as (optional)">
            <input value={config.saveAs ?? ""} onChange={(e) => set("saveAs", e.target.value)} placeholder="leadResponse" className={inputClass} />
          </Field>
        </>
      );
    case "ai-whatsapp-call":
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Provider">
              <select value={config.provider ?? "anthropic"} onChange={(e) => set("provider", e.target.value)} className={inputClass}>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI</option>
              </select>
            </Field>
            <Field label="Model">
              <select value={config.model ?? "claude-sonnet"} onChange={(e) => set("model", e.target.value)} className={inputClass}>
                <option value="claude-sonnet">Claude Sonnet (padrão)</option>
                <option value="claude-haiku">Claude Haiku</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </Field>
          </div>
          <Field label="System prompt (optional)">
            <textarea
              value={config.systemPrompt ?? ""}
              onChange={(e) => set("systemPrompt", e.target.value)}
              rows={3}
              placeholder="Você é um assistente de suporte simpático da Acme Inc."
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="User prompt">
            <textarea
              value={config.userPrompt ?? ""}
              onChange={(e) => set("userPrompt", e.target.value)}
              rows={3}
              placeholder="Responda essa mensagem em tom amigável: {{message.body}}"
              className={`${inputClass} resize-none`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Save response as">
              <input value={config.saveAs ?? ""} onChange={(e) => set("saveAs", e.target.value)} placeholder="aiResponse" className={inputClass} />
            </Field>
            <Field label="Output type">
              <select value={config.outputType ?? "text"} onChange={(e) => set("outputType", e.target.value)} className={inputClass}>
                <option value="text">Text</option>
                <option value="json">JSON</option>
              </select>
            </Field>
          </div>
          <Field label="Max tokens">
            <input value={config.maxTokens ?? "1500"} onChange={(e) => set("maxTokens", e.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={config.includeHistory === "true"}
              onChange={(e) => set("includeHistory", e.target.checked ? "true" : "false")}
            />
            Include conversation history (multi-turn memory)
          </label>
          <p className="text-[11px] text-muted-foreground">Roteia pra success ao completar ou error se falhar.</p>
        </>
      );
    case "ab-split": {
      const pctA = Number(config.percentageA ?? "50");
      return (
        <Field label={`Percentage to A: ${pctA}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={pctA}
            onChange={(e) => set("percentageA", e.target.value)}
            className="w-full accent-[var(--button)]"
          />
          <p className="text-[11px] text-muted-foreground">
            Cada execução sorteia A com {pctA}% de chance, senão B. Conecte os dois handles pra testar as variantes.
          </p>
        </Field>
      );
    }
    case "set-contact-field":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Field name">
            <input value={config.field ?? ""} onChange={(e) => set("field", e.target.value)} placeholder="lead_score" className={inputClass} />
          </Field>
          <Field label="Value">
            <input value={config.value ?? ""} onChange={(e) => set("value", e.target.value)} placeholder="hot" className={inputClass} />
          </Field>
          <p className="col-span-2 text-[11px] text-muted-foreground">
            Persiste no contato e vale pra qualquer workflow futuro. Use Set variable pra valores só desta execução.
          </p>
        </div>
      );
    case "enroll-sequence":
      return (
        <>
          <Field label="Sequence" hint="Sem sequences ainda — crie uma em Inbox &gt; Sequences.">
            <select value={config.sequence ?? ""} onChange={(e) => set("sequence", e.target.value)} className={inputClass}>
              <option value="">Choose a sequence…</option>
              <option value="onboarding">Onboarding</option>
              <option value="nutricao">Nutrição de leads</option>
            </select>
          </Field>
          <Field label="Save enrollment as">
            <input value={config.saveAs ?? ""} onChange={(e) => set("saveAs", e.target.value)} placeholder="enrollment" className={inputClass} />
          </Field>
        </>
      );
    case "add-tag":
    case "remove-tag":
      return (
        <Field
          label="Tag"
          hint="Suporta {{var}} para tags dinâmicas. Idempotente — rodar de novo não duplica."
        >
          <input value={config.tag ?? ""} onChange={(e) => set("tag", e.target.value)} placeholder="hot-lead" className={inputClass} />
        </Field>
      );
    case "handoff":
      return (
        <>
          <Field label="Assign to (optional)">
            <input value={config.assignTo ?? ""} onChange={(e) => set("assignTo", e.target.value)} placeholder="support" className={inputClass} />
          </Field>
          <Field label="Note">
            <textarea
              value={config.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
              rows={3}
              placeholder="Context for the human agent (type {{ for variables)"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </>
      );
    case "end":
      return <p className="text-sm text-muted-foreground">Ends the workflow here. No further steps run.</p>;
  }
}
