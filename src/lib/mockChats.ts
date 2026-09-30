// ponytail: canais/mensagens/AI chats mockados — trocar por dados reais quando existir backend de chat.
// Seed compartilhado entre a sidebar (Channels/Chats sections) e a página /chats (All Channels).

export type Channel = { id: string; name: string; private?: boolean };
export type DirectMessage = { id: string; name: string; you?: boolean; online?: boolean };
export type AiChat = { id: string; title: string };

export const INITIAL_CHANNELS: Channel[] = [{ id: "ch-1", name: "[Equipe] - Clique Boost", private: true }];

export const INITIAL_DMS: DirectMessage[] = [
  { id: "dm-1", name: "Vicenzo Valentino" },
  { id: "dm-2", name: "Leonardo Gualbino", online: true },
  { id: "dm-3", name: "Clique Boost" },
  { id: "dm-4", name: "Victor Ferro", you: true, online: true },
];

export const INITIAL_AI_CHATS: AiChat[] = [
  { id: "ai-1", title: "Create Brand Voice Skill" },
  { id: "ai-2", title: "Untitled" },
];

export type ChatMessage = { id: string; author: string; you?: boolean; text: string; sentAt: string };

function threadKey(type: "channel" | "dm" | "ai", id: string) {
  return `${type}:${id}`;
}

// ponytail: histórico de mensagens mockado — sem persistência, some ao recarregar
export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  [threadKey("channel", "ch-1")]: [
    { id: "m-1", author: "Leonardo Gualbino", text: "Bom dia! Subi os relatórios da semana no drive.", sentAt: "2026-09-25T09:12:00" },
    { id: "m-2", author: "Vicenzo Valentino", text: "Show, já vou revisar aqui 🙌", sentAt: "2026-09-25T09:14:00" },
    { id: "m-3", author: "Victor Ferro", you: true, text: "Valeu time, bom trabalho essa semana.", sentAt: "2026-09-25T09:20:00" },
  ],
};

export function messagesFor(type: "channel" | "dm" | "ai", id: string): ChatMessage[] {
  return INITIAL_MESSAGES[threadKey(type, id)] ?? [];
}

// ponytail: perfil/agenda/tasks por DM mockados — plugar em agency_members/tasks reais quando
// os contatos de DM deixarem de ser mock e virarem membros/clientes de verdade.
export type DmProfile = { role: string; email: string; startedAt: string };

export const DM_PROFILES: Record<string, DmProfile> = {
  "dm-1": { role: "Social Media", email: "vicenzo@cliqueboost.com", startedAt: "2026-01-09" },
  "dm-2": { role: "Tráfego Pago", email: "leonardo@cliqueboost.com", startedAt: "2026-01-09" },
  "dm-3": { role: "Cliente", email: "contato@cliqueboost.com", startedAt: "2026-01-09" },
  "dm-4": { role: "Founder", email: "victor@cliqueboost.com", startedAt: "2026-01-09" },
};

export type DmEvent = { id: string; title: string; start: string; end: string; color?: string };

export const DM_EVENTS: Record<string, DmEvent[]> = {
  "dm-1": [
    { id: "dme-1", title: "Alinhamento semanal", start: "2026-09-28T10:00:00", end: "2026-09-28T11:00:00", color: "#f87171" },
    { id: "dme-2", title: "Revisão de calendário de conteúdo", start: "2026-09-29T15:00:00", end: "2026-09-29T16:15:00", color: "#818cf8" },
    { id: "dme-3", title: "Gravação de reels", start: "2026-09-30T13:00:00", end: "2026-09-30T14:00:00", color: "#4ade80" },
    { id: "dme-4", title: "Call com cliente", start: "2026-10-02T09:00:00", end: "2026-10-02T09:30:00", color: "#facc15" },
  ],
  "dm-2": [
    { id: "dme-5", title: "Review de campanhas pagas", start: "2026-09-29T09:30:00", end: "2026-09-29T10:30:00", color: "#f87171" },
    { id: "dme-6", title: "Planejamento de mídia", start: "2026-10-01T14:00:00", end: "2026-10-01T15:00:00", color: "#22d3ee" },
  ],
};

export type DmTask = { id: string; title: string; status: "todo" | "doing" | "done"; dueDate: string | null };

export const DM_TASKS: Record<string, DmTask[]> = {
  "dm-1": [
    { id: "dmt-1", title: "Fechar 3 posts do calendário de outubro", status: "doing", dueDate: "2026-10-01" },
    { id: "dmt-2", title: "Revisar reels da semana", status: "todo", dueDate: "2026-10-03" },
  ],
  "dm-2": [{ id: "dmt-3", title: "Ajustar segmentação da campanha X", status: "todo", dueDate: "2026-10-02" }],
};
