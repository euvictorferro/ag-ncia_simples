"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  FileBarChart,
  Hash,
  Lightbulb,
  ListChecks,
  ListTodo,
  Lock,
  Mail,
  Mic,
  Phone,
  PhoneOff,
  Plus,
  Send,
  Sparkles,
  SquarePen,
  Star,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { useChatThread, type ChatThreadRef } from "@/components/chats/ChatThreadContext";
import { DM_PROFILES, DM_TASKS, messagesFor, type ChatMessage } from "@/lib/mockChats";
import { DmCalendarGrid } from "@/components/chats/DmCalendarGrid";

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong">
      {initial}
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function MessageGroup({ author, you, messages }: { author: string; you?: boolean; messages: ChatMessage[] }) {
  return (
    <div className="flex gap-3 px-4 py-2 hover:bg-muted/40">
      <Avatar name={author} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground-strong">{author}{you && " (você)"}</span>
          <span className="text-xs text-muted-foreground">{formatTime(messages[0].sentAt)}</span>
        </p>
        <div className="space-y-0.5">
          {messages.map((m) => (
            <p key={m.id} className="text-sm text-foreground">
              {m.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupMessages(messages: ChatMessage[]) {
  const groups: { author: string; you?: boolean; messages: ChatMessage[] }[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.author === m.author) last.messages.push(m);
    else groups.push({ author: m.author, you: m.you, messages: [m] });
  }
  return groups;
}

const PROFILE_TABS = ["Activity", "Tasks", "Comments"] as const;

function ProfileModal({ thread, onClose, onStartCall }: { thread: ChatThreadRef; onClose: () => void; onStartCall: () => void }) {
  const profile = DM_PROFILES[thread.id];
  const tasks = DM_TASKS[thread.id] ?? [];
  const [tab, setTab] = useState<(typeof PROFILE_TABS)[number]>("Activity");
  const localTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-2xl">
        <div className="h-16 bg-gradient-to-br from-muted to-background-elevated" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50"
        >
          <X size={14} />
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="-mt-8 flex items-end justify-between">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background-elevated bg-muted text-xl font-semibold text-foreground-strong">
              {thread.name.trim().charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-foreground-strong">{thread.name}</h2>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground" />
            Offline
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Sparkles size={12} />
              Message
            </button>
            <button
              type="button"
              onClick={onStartCall}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Phone size={12} />
              Call
            </button>
          </div>

          <div className="mt-4 flex gap-4 border-b border-border text-sm">
            {PROFILE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border-b-2 pb-2 transition-colors ${
                  tab === t ? "border-foreground-strong text-foreground-strong" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t} {t === "Tasks" && `(${tasks.length})`} {t === "Comments" && "(0)"}
              </button>
            ))}
          </div>

          {profile && (
            <div className="mt-4 space-y-2.5 border-b border-border pb-4">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Mail size={14} className="shrink-0 text-muted-foreground" />
                {profile.email}
              </p>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CircleUserRound size={14} className="shrink-0 text-muted-foreground" />
                {localTime} local time
              </p>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Bot size={14} className="shrink-0 text-muted-foreground" />
                {profile.role}
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-foreground-strong">Priorities</p>
            <div className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
              + Add important tasks here.
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-foreground-strong">{tab}</p>
            {tab === "Tasks" && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm text-foreground">
                    <ListChecks size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CircleUserRound size={28} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground-strong">Nothing to see here</p>
                <p className="text-xs text-muted-foreground">This user doesn&apos;t have any {tab.toLowerCase()} yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncUpCallModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated p-8 text-center shadow-2xl">
        <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-400/10 text-xl font-semibold text-emerald-400">
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground-strong">Chamando {name}…</p>
          <p className="text-xs text-muted-foreground">SyncUp — chamada de voz</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          <PhoneOff size={14} />
          Encerrar
        </button>
      </div>
    </div>
  );
}

function DmEmptyState({ thread, onViewProfile, onViewCalendar, onStartCall }: {
  thread: ChatThreadRef;
  onViewProfile: () => void;
  onViewCalendar: () => void;
  onStartCall: () => void;
}) {
  const profile = DM_PROFILES[thread.id];
  const startedAt = profile
    ? new Date(profile.startedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <div>
        <p className="text-sm font-semibold text-foreground-strong">Chat with {thread.name}</p>
        {startedAt && <p className="text-xs text-muted-foreground">This conversation started on {startedAt}.</p>}
      </div>
      <button
        type="button"
        onClick={onViewProfile}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <CircleUserRound size={15} />
        View Profile
      </button>
      <div className="w-full space-y-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onViewCalendar}
          className="flex w-full items-center gap-3 rounded-lg bg-red-400/10 px-3 py-2.5 text-left hover:bg-red-400/20"
        >
          <CalendarIcon size={16} className="shrink-0 text-red-400" />
          <span>
            <span className="block text-sm font-medium text-foreground-strong">View Calendar</span>
            <span className="block text-xs text-muted-foreground">Find time to meet or just grab some coffee</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onStartCall}
          className="flex w-full items-center gap-3 rounded-lg bg-emerald-400/10 px-3 py-2.5 text-left hover:bg-emerald-400/20"
        >
          <Phone size={16} className="shrink-0 text-emerald-400" />
          <span>
            <span className="block text-sm font-medium text-foreground-strong">Start SyncUp</span>
            <span className="block text-xs text-muted-foreground">Jump on a voice call or video call</span>
          </span>
        </button>
      </div>
    </div>
  );
}

const TASK_STATUS_LABEL: Record<string, string> = { todo: "A fazer", doing: "Em andamento", done: "Concluída" };

function DmTasksTab({ threadId }: { threadId: string }) {
  const tasks = DM_TASKS[threadId] ?? [];
  if (tasks.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma task atribuída.</p>;
  }
  return (
    <div className="space-y-2 p-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <ListChecks size={16} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {TASK_STATUS_LABEL[task.status]}
              {task.dueDate && ` · vence ${new Date(task.dueDate).toLocaleDateString("pt-BR")}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const AI_QUICK_ACTIONS: { icon: LucideIcon; title: string; subtitle: string; prompt: string }[] = [
  { icon: FileBarChart, title: "Relatório semanal", subtitle: "Resumo de performance dos clientes", prompt: "Monta um resumo da performance dos clientes essa semana" },
  { icon: CalendarDays, title: "Planejar conteúdo", subtitle: "Esboça o calendário do mês", prompt: "Me ajuda a planejar o calendário de conteúdo do mês" },
  { icon: Lightbulb, title: "Brainstorm de campanha", subtitle: "Gera ideias pra uma campanha nova", prompt: "Bora fazer um brainstorm de campanha pra um cliente novo" },
  { icon: ListTodo, title: "Ver tasks pendentes", subtitle: "Lista o que ainda falta entregar", prompt: "Lista minhas tasks pendentes dessa semana" },
];

function AiLandingView({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="flex items-center gap-2">
        <Sparkles size={22} className="text-muted-foreground" />
        <p className="text-2xl font-semibold text-foreground-strong">Max</p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-2 gap-2">
        {AI_QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => onPick(action.prompt)}
            className="flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left hover:bg-muted"
          >
            <action.icon size={15} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground-strong">{action.title}</span>
            <span className="text-xs text-muted-foreground">{action.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AiSheetView({ thread, onClose }: { thread: ChatThreadRef; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => messagesFor("ai", thread.id));
  const [title, setTitle] = useState(thread.name);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, author: "Victor Ferro", you: true, text, sentAt: new Date().toISOString() },
    ]);
    setDraft("");
    // ponytail: mockup — resposta canned só pra dar a sensação do fluxo; plugar modelo de verdade depois.
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          author: "Max",
          text: "Isso aqui ainda é só o frontend do AI sheet — a próxima etapa é ligar esse chat num modelo de verdade.",
          sentAt: new Date().toISOString(),
        },
      ]);
      setThinking(false);
    }, 700);
  };

  const renameTitle = () => {
    const next = window.prompt("Renomear chat", title);
    if (next) setTitle(next.trim());
  };

  const { isFavorite, toggleFavorite } = useChatThread();
  const favorited = isFavorite(thread);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar pra All Channels"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={renameTitle}
            className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium text-foreground-strong hover:bg-border"
          >
            <SquarePen size={13} className="text-muted-foreground" />
            {title}
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(thread)}
            aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
            className={favorited ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}
          >
            <Star size={14} className={favorited ? "fill-current" : undefined} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && !thinking ? (
          <AiLandingView onPick={setDraft} />
        ) : (
          groupMessages(messages).map((group, i) => <MessageGroup key={i} {...group} />)
        )}
        {thinking && (
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
            <Bot size={16} className="shrink-0 animate-pulse" />
            Max está pensando…
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background-elevated p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Tell AI what to do next"
          className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Adicionar"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Zap size={13} />
              Skills
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles size={13} />
              Max
              <ChevronDown size={12} />
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Enviar"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Mic size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DmTab = "chat" | "calendar" | "tasks";

export function ChatThreadView({ thread, onClose }: { thread: ChatThreadRef; onClose: () => void }) {
  if (thread.type === "ai") return <AiSheetView thread={thread} onClose={onClose} />;
  return <ConversationThreadView thread={thread} onClose={onClose} />;
}

function ConversationThreadView({ thread, onClose }: { thread: ChatThreadRef; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => messagesFor(thread.type, thread.id));
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<DmTab>("chat");
  const [showProfile, setShowProfile] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const { isFavorite, toggleFavorite } = useChatThread();
  const favorited = isFavorite(thread);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, author: "Victor Ferro", you: true, text: draft.trim(), sentAt: new Date().toISOString() },
    ]);
    setDraft("");
  };

  const icon =
    thread.type === "channel" ? <Hash size={16} className="text-muted-foreground" /> : <Avatar name={thread.name} />;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col">
      <div className="border-b border-border pb-0">
        <div className="flex items-center gap-2 pb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar pra All Channels"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={15} />
          </button>
          {icon}
          <h1 className="text-sm font-semibold text-foreground-strong">{thread.name}</h1>
          {thread.type === "channel" && <Lock size={12} className="text-muted-foreground" />}
          <button
            type="button"
            onClick={() => toggleFavorite(thread)}
            aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
            className={`ml-1 ${favorited ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Star size={13} className={favorited ? "fill-current" : undefined} />
          </button>
        </div>
        {thread.type === "dm" && (
          <div className="flex gap-4 text-sm">
            {(["chat", "calendar", "tasks"] as DmTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border-b-2 pb-2 capitalize transition-colors ${
                  tab === t ? "border-foreground-strong text-foreground-strong" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "chat" ? "Chat" : t === "calendar" ? "Calendar" : "Tasks"}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto py-2">
            {messages.length === 0 ? (
              thread.type === "dm" ? (
                <DmEmptyState
                  thread={thread}
                  onViewProfile={() => setShowProfile(true)}
                  onViewCalendar={() => setTab("calendar")}
                  onStartCall={() => setShowCall(true)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles size={20} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Manda o primeiro &quot;oi&quot; 👋</p>
                </div>
              )
            ) : (
              groupMessages(messages).map((group, i) => <MessageGroup key={i} {...group} />)
            )}
          </div>

          <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Write to ${thread.name}…`}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Enviar"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-button text-button-foreground disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </>
      ) : tab === "calendar" ? (
        <div className="flex-1 overflow-hidden">
          <DmCalendarGrid threadId={thread.id} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <DmTasksTab threadId={thread.id} />
        </div>
      )}

      {showProfile && (
        <ProfileModal thread={thread} onClose={() => setShowProfile(false)} onStartCall={() => setShowCall(true)} />
      )}
      {showCall && <SyncUpCallModal name={thread.name} onClose={() => setShowCall(false)} />}
    </div>
  );
}
