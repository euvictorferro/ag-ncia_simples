import { TEAM_POOL, dateOffset, newId, type KanbanAssignee } from "@/components/spaces/kanbanTypes";

export type ListStatusType = "open" | "custom" | "closed";
export type ListStatus = { status: string; color: string; type: ListStatusType };
export type ListPriority = { label: string; color: string };
export type ListTask = {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  assignees: KanbanAssignee[];
  priority: ListPriority | null;
};

export const LIST_STATUSES: ListStatus[] = [
  { status: "a fazer", color: "#8b8d97", type: "open" },
  { status: "em produção", color: "#3384f5", type: "custom" },
  { status: "concluído", color: "#6bc950", type: "closed" },
];

export const PRIORITIES: Record<"urgente" | "alta" | "normal" | "baixa", ListPriority> = {
  urgente: { label: "Urgente", color: "#f2555a" },
  alta: { label: "Alta", color: "#f2b31b" },
  normal: { label: "Normal", color: "#6fddff" },
  baixa: { label: "Baixa", color: "#8a897f" },
};

const [ANA, BRUNO, CARLA] = TEAM_POOL;

function task(name: string, status: string, opts: Partial<Omit<ListTask, "id" | "name" | "status">> = {}): ListTask {
  return { id: newId(), name, status, dueDate: null, assignees: [], priority: null, ...opts };
}

export function seedListTasks(): ListTask[] {
  return [
    task("Configurar públicos de campanha", "a fazer", { priority: PRIORITIES.alta, dueDate: dateOffset(3) }),
    task("Roteirizar vídeo institucional", "a fazer", { assignees: [BRUNO], dueDate: dateOffset(5) }),
    task("Revisar copy da landing page", "a fazer", { priority: PRIORITIES.normal }),
    task("Criar criativos para Meta Ads", "em produção", { assignees: [ANA], priority: PRIORITIES.urgente, dueDate: dateOffset(1) }),
    task("Editar reels da semana", "em produção", { assignees: [CARLA], dueDate: dateOffset(2) }),
    task("Relatório mensal de performance", "concluído", { assignees: [ANA], priority: PRIORITIES.baixa, dueDate: dateOffset(-4) }),
    task("Aprovação de calendário com cliente", "concluído", { assignees: [BRUNO], dueDate: dateOffset(-7) }),
  ];
}
