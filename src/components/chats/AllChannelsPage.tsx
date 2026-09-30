"use client";

import { ArrowLeft, Hash, Lock, Bot, Sparkles } from "lucide-react";
import { INITIAL_CHANNELS, INITIAL_DMS, INITIAL_AI_CHATS } from "@/lib/mockChats";
import { useChatThread } from "@/components/chats/ChatThreadContext";

function Avatar({ name, online }: { name: string; online?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground-strong">
      {initial}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
      )}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-background-elevated p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground-strong">{title}</h2>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </button>
  );
}

export function AllChannelsPage({ onBack }: { onBack?: () => void }) {
  const { open } = useChatThread();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground-strong">All Channels</h1>
          <p className="text-sm text-muted-foreground">Canais, mensagens diretas e AI chats da agência, tudo num lugar só.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Channels">
          {INITIAL_CHANNELS.map((channel) => (
            <Row
              key={channel.id}
              icon={<Hash size={16} className="shrink-0 text-muted-foreground" />}
              title={
                <span className="flex items-center gap-1.5">
                  {channel.name}
                  {channel.private && <Lock size={11} className="shrink-0 text-muted-foreground" />}
                </span>
              }
              onClick={() => open({ type: "channel", id: channel.id, name: channel.name })}
            />
          ))}
        </SectionCard>

        <SectionCard title="Direct Messages">
          {INITIAL_DMS.map((dm) => (
            <Row
              key={dm.id}
              icon={<Avatar name={dm.name} online={dm.online} />}
              title={
                <>
                  {dm.name}
                  {dm.you && <span className="text-muted-foreground"> — You</span>}
                </>
              }
              onClick={() => open({ type: "dm", id: dm.id, name: dm.name })}
            />
          ))}
        </SectionCard>

        <SectionCard title="AI Chats">
          {INITIAL_AI_CHATS.map((chat) => (
            <Row
              key={chat.id}
              icon={<Bot size={16} className="shrink-0 text-muted-foreground" />}
              title={chat.title}
              onClick={() => open({ type: "ai", id: chat.id, name: chat.title })}
            />
          ))}
          <Row
            icon={<Sparkles size={16} className="shrink-0 text-muted-foreground" />}
            title="Novo AI chat"
            subtitle="Comece uma conversa nova"
            onClick={() => open({ type: "ai", id: `ai-${Date.now()}`, name: "Untitled" })}
          />
        </SectionCard>
      </div>
    </div>
  );
}
