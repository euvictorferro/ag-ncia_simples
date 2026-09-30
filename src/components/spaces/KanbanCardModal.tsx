"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckSquare, FileText, MessageSquare, Paperclip, Trash2, X } from "lucide-react";
import {
  LABEL_PALETTE,
  TEAM_POOL,
  checklistBarColor,
  formatRelativeTime,
  newId,
  type ChecklistItem,
  type KanbanAssignee,
  type KanbanAttachment,
  type KanbanCardData,
  type KanbanComment,
  type KanbanLabel,
} from "@/components/spaces/kanbanTypes";

const ME = { name: "Você", initials: "V" };
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)(\?|$)/i;

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function Field({
  label,
  icon,
  action,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground-strong">
          {icon}
          {label}
        </p>
        {action}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground"
    >
      +
    </button>
  );
}

function MembersField({
  assignees,
  onToggle,
}: {
  assignees: KanbanAssignee[];
  onToggle: (assignee: KanbanAssignee) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <Field
      label="Membros"
      action={
        <div ref={ref} className="relative">
          <PlusButton onClick={() => setOpen((o) => !o)} />
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-background-elevated p-1.5 shadow-lg">
              {TEAM_POOL.map((member) => {
                const isAssigned = assignees.some((a) => a.id === member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onToggle(member)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted ${isAssigned ? "bg-muted/70" : ""}`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{member.name}</span>
                    {isAssigned && <span className="shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      {assignees.length === 0 ? (
        <span className="text-muted-foreground">Sem responsável</span>
      ) : (
        <div className="flex items-center -space-x-2">
          {assignees.map((a) => (
            <span
              key={a.id}
              title={a.name}
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background-elevated text-[11px] font-semibold text-white"
              style={{ backgroundColor: a.color }}
            >
              {a.initials}
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

function LabelsField({ labels, onToggle }: { labels: KanbanLabel[]; onToggle: (label: KanbanLabel) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <Field
      label="Labels"
      action={
        <div ref={ref} className="relative">
          <PlusButton onClick={() => setOpen((o) => !o)} />
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-background-elevated p-1.5 shadow-lg">
              {LABEL_PALETTE.map((label) => {
                const isApplied = labels.some((l) => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => onToggle(label)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: label.color }} />
                    <span className="min-w-0 flex-1 truncate">{label.name}</span>
                    {isApplied && <span className="shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      {labels.length === 0 ? (
        <span className="text-muted-foreground">Sem labels</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <span key={label.id} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: label.color }}>
              {label.name}
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

function DescriptionField({
  text,
  onSave,
}: {
  text: string;
  onSave: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  return (
    <Field
      label="Descrição"
      icon={<FileText size={14} />}
      action={
        !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(text);
              setEditing(true);
            }}
            className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
          >
            Editar
          </button>
        )
      }
    >
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            autoFocus
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                setEditing(false);
              }}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : text ? (
        <p className="whitespace-pre-wrap">{text}</p>
      ) : (
        <span className="text-muted-foreground">Sem descrição</span>
      )}
    </Field>
  );
}

function ChecklistField({
  checklist,
  onToggle,
  onAdd,
  onDelete,
}: {
  checklist: ChecklistItem[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState("");
  const done = checklist.filter((i) => i.checked).length;
  const percent = checklist.length === 0 ? 0 : Math.round((done / checklist.length) * 100);

  function submit() {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  }

  return (
    <Field label={`Checklist (${done}/${checklist.length})`} icon={<CheckSquare size={14} />}>
      {checklist.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="w-9 shrink-0 text-xs font-semibold text-muted-foreground">{percent}%</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${checklistBarColor(percent)}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
      <ul className="space-y-1.5">
        {checklist.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button type="button" onClick={() => onToggle(item.id)} className="shrink-0">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  item.checked ? "border-foreground bg-foreground text-background" : "border-border"
                }`}
              >
                {item.checked && <Check size={11} />}
              </span>
            </button>
            <span className={`flex-1 text-xs ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              aria-label="Remover item"
              className="shrink-0 text-muted-foreground opacity-0 hover:text-red-400 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Adicionar item"
          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-foreground"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="shrink-0 rounded-md bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/70 disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </Field>
  );
}

function LinkRow({ attachment, onDelete }: { attachment: KanbanAttachment; onDelete: (id: string) => void }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  let domain = "";
  try {
    domain = new URL(attachment.url).hostname;
  } catch {
    // ponytail: url sem protocolo — cai no ícone genérico
  }

  return (
    <li className="group flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
      {domain && !faviconFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- favicon de serviço externo (Google)
        <img
          src={`https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}`}
          alt=""
          className="h-4 w-4 shrink-0 rounded-sm"
          onError={() => setFaviconFailed(true)}
        />
      ) : (
        <Paperclip size={12} className="shrink-0 text-muted-foreground" />
      )}
      <a href={attachment.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-foreground hover:underline">
        {attachment.name}
      </a>
      <button
        onClick={() => onDelete(attachment.id)}
        aria-label="Remover anexo"
        className="shrink-0 text-muted-foreground opacity-0 hover:text-red-400 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
    </li>
  );
}

function AttachmentsField({
  attachments,
  onAdd,
  onDelete,
}: {
  attachments: KanbanAttachment[];
  onAdd: (name: string, url: string) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");

  function submit() {
    if (!url.trim()) return;
    let name = url;
    try {
      name = new URL(url).hostname;
    } catch {
      // ponytail: url sem protocolo — mantém o texto cru como nome
    }
    onAdd(name, url.trim());
    setUrl("");
    setAdding(false);
  }

  return (
    <Field
      label="Anexos"
      icon={<Paperclip size={14} />}
      action={
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
        >
          Adicionar
        </button>
      }
    >
      {adding && (
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Cole um link..."
            className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-foreground"
          />
          <button onClick={submit} className="shrink-0 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background">
            Salvar
          </button>
        </div>
      )}
      {attachments.length === 0 ? (
        <span className="text-muted-foreground">Sem anexos</span>
      ) : (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Links</p>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <LinkRow key={a.id} attachment={a} onDelete={onDelete} />
            ))}
          </ul>
        </div>
      )}
    </Field>
  );
}

function CommentBox({ onPost }: { onPost: (text: string) => void }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
  }

  return (
    <div className="mb-5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva um comentário..."
        rows={2}
        className="w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
      />
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
        >
          Comentar
        </button>
      </div>
    </div>
  );
}

function ActivityField({ comments, activity, onComment }: { comments: KanbanComment[]; activity: { id: string; text: string; createdAt: string }[]; onComment: (text: string) => void }) {
  const [showDetails, setShowDetails] = useState(false);

  const timeline = [
    ...comments.map((c) => ({ ...c, kind: "comment" as const })),
    ...activity.map((a) => ({ ...a, kind: "activity" as const, authorName: "", authorInitials: "" })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const visible = showDetails ? timeline : timeline.slice(0, 1);

  return (
    <div>
      <div className="mb-3 flex flex-nowrap items-center justify-between gap-3">
        <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-bold text-foreground-strong">
          <MessageSquare size={14} />
          Comentários e atividade
        </p>
        {timeline.length > 1 && (
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
          >
            {showDetails ? "Fechar Detalhes" : "Mostrar Detalhes"}
          </button>
        )}
      </div>

      <CommentBox onPost={onComment} />

      {timeline.length === 0 ? (
        <span className="text-sm text-muted-foreground">Sem comentários ou atividade.</span>
      ) : (
        <ul className="space-y-4">
          {visible.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {entry.kind === "comment" ? entry.authorInitials : "•"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  {entry.kind === "comment" && <span className="font-bold text-foreground-strong">{entry.authorName} </span>}
                  {entry.text}
                </p>
                <span className="text-[11px] font-medium text-muted-foreground">{formatRelativeTime(entry.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function KanbanCardModal({
  card,
  columnTitle,
  onClose,
  onUpdate,
}: {
  card: KanbanCardData;
  columnTitle: string;
  onClose: () => void;
  onUpdate: (updater: (prev: KanbanCardData) => KanbanCardData) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = card.coverImageUrl !== null && !coverFailed;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function logActivity(text: string) {
    onUpdate((prev) => ({ ...prev, activity: [...prev.activity, { id: newId(), text, createdAt: new Date().toISOString() }] }));
  }

  function saveTitle() {
    const title = titleDraft.trim();
    if (title && title !== card.title) onUpdate((prev) => ({ ...prev, title }));
    setEditingTitle(false);
  }

  function saveDescription(description: string) {
    onUpdate((prev) => ({ ...prev, description }));
    logActivity("atualizou a descrição");
  }

  function toggleMember(member: KanbanAssignee) {
    const isAssigned = card.assignees.some((a) => a.id === member.id);
    onUpdate((prev) => ({
      ...prev,
      assignees: isAssigned ? prev.assignees.filter((a) => a.id !== member.id) : [...prev.assignees, member],
    }));
    logActivity(isAssigned ? `removeu ${member.name}` : `adicionou ${member.name}`);
  }

  function toggleLabel(label: KanbanLabel) {
    const isApplied = card.labels.some((l) => l.id === label.id);
    onUpdate((prev) => ({
      ...prev,
      labels: isApplied ? prev.labels.filter((l) => l.id !== label.id) : [...prev.labels, label],
    }));
  }

  function setDueDate(value: string) {
    onUpdate((prev) => ({ ...prev, dueDate: value || null }));
  }

  function toggleChecklistItem(id: string) {
    onUpdate((prev) => ({
      ...prev,
      checklist: prev.checklist.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }));
  }

  function addChecklistItem(text: string) {
    onUpdate((prev) => ({ ...prev, checklist: [...prev.checklist, { id: newId(), text, checked: false }] }));
  }

  function deleteChecklistItem(id: string) {
    onUpdate((prev) => ({ ...prev, checklist: prev.checklist.filter((i) => i.id !== id) }));
  }

  function addAttachment(name: string, url: string) {
    onUpdate((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { id: newId(), name, url }],
      // ponytail: sem upload real — a capa vira automaticamente o primeiro anexo de imagem, igual ao Trello
      coverImageUrl: prev.coverImageUrl === null && IMAGE_EXT.test(url) ? url : prev.coverImageUrl,
    }));
    logActivity("anexou um link");
  }

  function deleteAttachment(id: string) {
    onUpdate((prev) => {
      const removed = prev.attachments.find((a) => a.id === id);
      const wasCover = removed && removed.url === prev.coverImageUrl;
      return {
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== id),
        coverImageUrl: wasCover ? null : prev.coverImageUrl,
      };
    });
  }

  function addComment(text: string) {
    onUpdate((prev) => ({
      ...prev,
      comments: [...prev.comments, { id: newId(), authorName: ME.name, authorInitials: ME.initials, text, createdAt: new Date().toISOString() }],
    }));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-card)] bg-background-elevated shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-3">
          <span className="truncate rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{columnTitle}</span>
          <button onClick={onClose} aria-label="Fechar" className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {showCover && (
          <div className="flex shrink-0 items-center justify-center border-b border-border bg-muted/40 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- capa vem de um anexo externo */}
            <img
              src={card.coverImageUrl!}
              alt=""
              className="max-h-56 max-w-[70%] rounded-[var(--radius-card)] object-contain"
              onError={() => setCoverFailed(true)}
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-7">
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                className="mb-6 w-full rounded-md border border-border bg-transparent px-2 py-1 text-xl font-bold text-foreground-strong outline-none focus:border-foreground"
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                className="mb-6 cursor-text rounded-md px-2 py-1 text-xl font-bold text-foreground-strong hover:bg-muted"
              >
                {card.title}
              </h1>
            )}

            <div className="space-y-6">
              <div className="flex flex-wrap gap-x-10 gap-y-6">
                <MembersField assignees={card.assignees} onToggle={toggleMember} />
                <LabelsField labels={card.labels} onToggle={toggleLabel} />
              </div>

              <Field label="Data prevista">
                <input
                  type="date"
                  value={card.dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-foreground"
                />
              </Field>

              <DescriptionField text={card.description} onSave={saveDescription} />

              <AttachmentsField attachments={card.attachments} onAdd={addAttachment} onDelete={deleteAttachment} />

              <ChecklistField
                checklist={card.checklist}
                onToggle={toggleChecklistItem}
                onAdd={addChecklistItem}
                onDelete={deleteChecklistItem}
              />
            </div>
          </div>

          <div className="min-w-0 shrink-0 overflow-y-auto border-l border-border bg-muted/30 md:w-[420px]">
            <div className="p-6">
              <ActivityField comments={card.comments} activity={card.activity} onComment={addComment} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
