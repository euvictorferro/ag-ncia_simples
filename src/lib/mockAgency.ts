import type { Client, ClientHealth, ServiceType } from "@/lib/clients";
import type { AgencyMember, Task, TaskPriority, TaskStatus } from "@/lib/tasks";

// ponytail: RNG determinística só pra essa massa de dados de demonstração ficar
// estável entre reloads (não é usada em nenhum código de produção real).
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260924);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const uuid = (prefix: string, i: number) => `00000000-0000-4000-8000-${prefix}${String(i).padStart(8, "0")}`;
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const dateDaysFromNow = (days: number) => isoDaysFromNow(days).slice(0, 10);

const MEMBER_NAMES = [
  "Ana Costa",
  "Bruno Alves",
  "Carla Menezes",
  "Diego Souza",
  "Elisa Prado",
  "Fábio Nogueira",
  "Giulia Rossi",
  "Henrique Lima",
  "Isabela Martins",
  "João Pedro Reis",
];

const CLIENT_NAMES = [
  "Bella Vita Estética",
  "NutriPlena Alimentos",
  "Doutor Sorriso Odonto",
  "Fit360 Academia",
  "Clínica VidaPlena",
  "Auto Center Rodas",
  "Studio Ana Moda",
  "EduTech Cursos Online",
  "Imob Prime Imóveis",
  "Café Raiz",
  "PetLife Veterinária",
  "Construtora Horizonte",
  "SaaS Metrics.io",
  "Loja Verde Orgânicos",
  "Advocacia Bastos & Lima",
  "Studio Yoga Raiz",
  "Barbearia Império",
  "Doce Ponto Confeitaria",
  "TechRepair Assistência",
  "Viva Bem Seguros",
];

const NICHES = ["Saúde", "Beleza", "Educação", "Imobiliário", "Alimentação", "Fitness", "SaaS", "Varejo", "Jurídico", "Serviços"];
const SERVICE_TYPES: ServiceType[] = ["trafego", "conteudo", "chamadas", "360", "outro"];
const HEALTHS: ClientHealth[] = ["green", "green", "green", "green", "yellow", "yellow", "red"];

const TASK_VERBS = [
  "Criar criativos para",
  "Revisar copy da campanha de",
  "Configurar públicos de",
  "Relatório mensal de",
  "Reunião de alinhamento com",
  "Otimizar campanhas de",
  "Gravar vídeo institucional de",
  "Planejar calendário de conteúdo de",
  "Auditoria de contas de",
  "Configurar automações de",
];

export function buildMockAgency(): { members: AgencyMember[]; clients: Client[]; tasks: Task[] } {
  const agencyId = "00000000-0000-4000-8000-000000000000";

  const members: AgencyMember[] = MEMBER_NAMES.map((name, i) => ({
    id: uuid("m", i),
    user_id: uuid("u", i),
    name,
  }));

  const clients: Client[] = CLIENT_NAMES.map((name, i) => ({
    id: uuid("c", i),
    agency_id: agencyId,
    name,
    archived: false,
    created_at: isoDaysFromNow(-Math.floor(rand() * 400) - 30),
    niche: pick(NICHES),
    service_type: pick(SERVICE_TYPES),
    assigned_to: pick(members).id,
    health: pick(HEALTHS),
  }));

  const tasks: Task[] = [];
  let taskIndex = 0;
  for (const client of clients) {
    const taskCount = 3 + Math.floor(rand() * 4);
    for (let j = 0; j < taskCount; j++) {
      const status: TaskStatus = pick(["todo", "todo", "doing", "doing", "done", "done", "done"] as const);
      const priority: TaskPriority = pick(["low", "medium", "medium", "high"] as const);
      const dueOffset = Math.floor(rand() * 40) - 12;
      const createdOffset = dueOffset - 5 - Math.floor(rand() * 10);
      const updatedOffset = status === "done" ? Math.max(createdOffset, dueOffset - Math.floor(rand() * 14)) : 0;

      tasks.push({
        id: uuid("t", taskIndex),
        agency_id: agencyId,
        client_id: client.id,
        title: `${pick(TASK_VERBS)} ${client.name}`,
        description: "",
        status,
        priority,
        assignee_id: pick(members).id,
        due_date: dateDaysFromNow(dueOffset),
        created_at: isoDaysFromNow(createdOffset),
        updated_at: status === "done" ? isoDaysFromNow(updatedOffset) : isoDaysFromNow(createdOffset),
      });
      taskIndex++;
    }
  }

  return { members, clients, tasks };
}
