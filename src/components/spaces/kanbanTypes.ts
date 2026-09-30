export type KanbanLabel = { id: string; name: string; color: string };
export type KanbanAssignee = { id: string; name: string; initials: string; color: string };
export type ChecklistItem = { id: string; text: string; checked: boolean };
export type KanbanAttachment = { id: string; name: string; url: string };
export type KanbanComment = { id: string; authorName: string; authorInitials: string; text: string; createdAt: string };
export type KanbanActivityEntry = { id: string; text: string; createdAt: string };

export type KanbanCardData = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  coverImageUrl: string | null;
  labels: KanbanLabel[];
  assignees: KanbanAssignee[];
  checklist: ChecklistItem[];
  attachments: KanbanAttachment[];
  comments: KanbanComment[];
  activity: KanbanActivityEntry[];
};

export const LABEL_PALETTE: KanbanLabel[] = [
  { id: "l1", name: "Reels", color: "purple" },
  { id: "l2", name: "Post", color: "green" },
  { id: "l3", name: "Vídeo", color: "blue" },
  { id: "l4", name: "Urgente", color: "red" },
];

export function checklistBarColor(percent: number): string {
  if (percent === 100) return "bg-green-500";
  if (percent >= 50) return "bg-blue-500";
  if (percent > 0) return "bg-amber-400";
  return "bg-neutral-500";
}

export const TEAM_POOL: KanbanAssignee[] = [
  { id: "a1", name: "Ana Costa", initials: "AC", color: "#3987e5" },
  { id: "a2", name: "Bruno Alves", initials: "BA", color: "#d95926" },
  { id: "a3", name: "Carla Menezes", initials: "CM", color: "#199e70" },
  { id: "a4", name: "Diego Souza", initials: "DS", color: "#c98500" },
  { id: "a5", name: "Elisa Prado", initials: "EP", color: "#d55181" },
];

export function newId(): string {
  return crypto.randomUUID();
}

export function getDueDateDisplay(dueDate: string): { text: string; className: string } {
  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysDiff = Math.round((due.getTime() - today.getTime()) / 86400000);
  const text = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  const className = daysDiff < 0 ? "text-red-400" : daysDiff <= 3 ? "text-amber-400" : "text-muted-foreground";
  return { text, className };
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  return `há ${days}d`;
}

export function emptyCard(title: string): KanbanCardData {
  return {
    id: newId(),
    title,
    description: "",
    dueDate: null,
    coverImageUrl: null,
    labels: [],
    assignees: [],
    checklist: [],
    attachments: [],
    comments: [],
    activity: [{ id: newId(), text: "criou este card", createdAt: new Date().toISOString() }],
  };
}

export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function richCard(
  title: string,
  overrides: Partial<Pick<KanbanCardData, "description" | "dueDate" | "labels" | "assignees" | "checklist">>,
): KanbanCardData {
  return { ...emptyCard(title), ...overrides };
}
