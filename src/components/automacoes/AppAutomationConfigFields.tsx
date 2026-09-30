"use client";

import type { AutomationNodeKind } from "@/lib/mockAppAutomations";
import type { WorkflowNode, WorkflowNodeConfig } from "@/lib/workflowDomain";
import { Field, inputClass, ConditionFields } from "@/components/shared/workflowFieldKit";

export function AppAutomationConfigFields({
  node,
  config,
  onChange,
}: {
  node: WorkflowNode<AutomationNodeKind>;
  config: WorkflowNodeConfig;
  onChange: (patch: WorkflowNodeConfig) => void;
}) {
  const set = (key: string, value: string) => onChange({ ...config, [key]: value });

  switch (node.kind) {
    case "trigger":
      return (
        <>
          <Field label="Trigger kind">
            <select value={config.triggerKind ?? "schedule"} onChange={(e) => set("triggerKind", e.target.value)} className={inputClass}>
              <option value="schedule">Schedule — roda num horário fixo</option>
              <option value="client-status">Client status change — quando um cliente muda de saúde</option>
              <option value="new-client">New client — quando um cliente novo é cadastrado</option>
              <option value="manual">Manual — dispara só quando você clicar em Run</option>
            </select>
          </Field>
          {config.triggerKind === "client-status" ? (
            <Field label="Status do cliente">
              <select value={config.statusFilter ?? "red"} onChange={(e) => set("statusFilter", e.target.value)} className={inputClass}>
                <option value="red">Vermelho (crítico)</option>
                <option value="yellow">Amarelo (atenção)</option>
                <option value="green">Verde (saudável)</option>
              </select>
            </Field>
          ) : config.triggerKind === "manual" || config.triggerKind === "new-client" ? null : (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Frequência">
                <select value={config.schedule ?? "weekly"} onChange={(e) => set("schedule", e.target.value)} className={inputClass}>
                  <option value="daily">Todo dia</option>
                  <option value="weekly">Toda semana</option>
                  <option value="monthly">Todo mês</option>
                </select>
              </Field>
              {config.schedule === "weekly" && (
                <Field label="Dia da semana">
                  <select value={config.weekday ?? "monday"} onChange={(e) => set("weekday", e.target.value)} className={inputClass}>
                    <option value="monday">Segunda</option>
                    <option value="tuesday">Terça</option>
                    <option value="wednesday">Quarta</option>
                    <option value="thursday">Quinta</option>
                    <option value="friday">Sexta</option>
                  </select>
                </Field>
              )}
              <Field label="Horário">
                <input type="time" value={config.time ?? "09:00"} onChange={(e) => set("time", e.target.value)} className={inputClass} />
              </Field>
            </div>
          )}
        </>
      );
    case "send-report":
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tipo de relatório">
              <select value={config.reportType ?? "performance"} onChange={(e) => set("reportType", e.target.value)} className={inputClass}>
                <option value="performance">Performance de campanhas</option>
                <option value="financeiro">Financeiro</option>
                <option value="conteudo">Conteúdo/Posts</option>
              </select>
            </Field>
            <Field label="Período">
              <select value={config.period ?? "last_7_days"} onChange={(e) => set("period", e.target.value)} className={inputClass}>
                <option value="last_7_days">Últimos 7 dias</option>
                <option value="last_30_days">Últimos 30 dias</option>
                <option value="mes_atual">Mês atual</option>
              </select>
            </Field>
          </div>
          <Field label="Destinatários (e-mails, separados por vírgula)">
            <input value={config.recipients ?? ""} onChange={(e) => set("recipients", e.target.value)} placeholder="equipe@agencia.com" className={inputClass} />
          </Field>
          <Field label="Formato">
            <select value={config.format ?? "pdf"} onChange={(e) => set("format", e.target.value)} className={inputClass}>
              <option value="pdf">PDF</option>
              <option value="link">Link (dashboard)</option>
            </select>
          </Field>
        </>
      );
    case "create-task":
      return (
        <>
          <Field label="Título da task">
            <input value={config.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Revisar campanhas do cliente {{cliente}}" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Atribuir a">
              <input value={config.assignTo ?? ""} onChange={(e) => set("assignTo", e.target.value)} placeholder="responsável" className={inputClass} />
            </Field>
            <Field label="Prazo (dias)">
              <input value={config.dueInDays ?? "3"} onChange={(e) => set("dueInDays", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Clientes-alvo" hint="Roda uma task por cliente que cair no filtro.">
            <select value={config.targetClients ?? "all"} onChange={(e) => set("targetClients", e.target.value)} className={inputClass}>
              <option value="all">Todos os clientes</option>
              <option value="triggered">Só o cliente que disparou o trigger</option>
            </select>
          </Field>
        </>
      );
    case "notify-internal":
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Canal">
              <select value={config.channel ?? "app"} onChange={(e) => set("channel", e.target.value)} className={inputClass}>
                <option value="app">Notificação no app</option>
                <option value="whatsapp">WhatsApp interno</option>
                <option value="email">E-mail</option>
              </select>
            </Field>
            <Field label="Destinatários">
              <input value={config.recipients ?? ""} onChange={(e) => set("recipients", e.target.value)} placeholder="equipe, responsável" className={inputClass} />
            </Field>
          </div>
          <Field label="Mensagem">
            <textarea
              value={config.message ?? ""}
              onChange={(e) => set("message", e.target.value)}
              rows={3}
              placeholder="Cliente {{cliente}} caiu pra status vermelho — dá uma olhada."
              className={`${inputClass} resize-none`}
            />
          </Field>
        </>
      );
    case "condition":
      return <ConditionFields config={config} onChange={onChange} />;
    case "delay":
      return (
        <Field label="Wait for">
          <select value={config.waitFor ?? "60"} onChange={(e) => set("waitFor", e.target.value)} className={inputClass}>
            <option value="15">15 min</option>
            <option value="60">1 hora</option>
            <option value="1440">1 dia</option>
          </select>
        </Field>
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
          <Field label="Body (opcional)">
            <textarea
              value={config.body ?? ""}
              onChange={(e) => set("body", e.target.value)}
              rows={4}
              placeholder='{"cliente": "{{cliente}}"}'
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </Field>
        </>
      );
    case "end":
      return <p className="text-sm text-muted-foreground">Termina a automação aqui. Nenhum passo depois roda.</p>;
  }
}
