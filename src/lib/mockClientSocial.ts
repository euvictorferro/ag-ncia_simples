// ponytail: dados mock determinísticos para as páginas Analytics/Posts/Ads do cliente —
// sem persistência real ainda (mesma abordagem do mockAgency/mockFinance).

export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook";
export type PostFormat = "carousel" | "reel" | "static" | "video";

export type ClientPost = {
  id: string;
  platform: Platform;
  format: PostFormat;
  caption: string;
  publishedAt: string; // ISO
  coverEmoji: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number;
  impressions: number;
  reach: number;
};

export type QueueSlot = { day: string; time: string };
export type Queue = {
  id: string;
  profile: string;
  name: string;
  slots: QueueSlot[];
  status: "active" | "paused";
};

export type AdStatus = "active" | "paused" | "rejected" | "in_review";
export type AdCampaign = {
  id: string;
  name: string;
  platform: "meta" | "tiktok" | "linkedin";
  status: AdStatus;
  budgetPerDay: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  adSets: { id: string; name: string; status: AdStatus; ads: { id: string; name: string; status: AdStatus }[] }[];
};

export type Audience = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "ready" | "processing";
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

export const FORMAT_LABEL: Record<PostFormat, string> = {
  carousel: "Carrossel",
  reel: "Reels",
  static: "Estático",
  video: "Vídeo",
};

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ponytail: usar meia-noite local como "agora" evita mismatch de hidratação
// (server e client renderizando em instantes ligeiramente diferentes gerariam datas mock diferentes).
export function todayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h;
}

const CAPTIONS = [
  "Bastidores do último projeto ✨",
  "Você já sabia disso?",
  "Resultado de quem confia no processo",
  "Novidade chegando por aqui 👀",
  "Depoimento de cliente satisfeito",
  "Dica rápida pra hoje",
  "Antes e depois que fala por si",
  "Por trás das câmeras",
  "Chamada pro novo lançamento",
  "Resumo da semana",
];

const PLATFORMS: Platform[] = ["instagram", "instagram", "instagram", "tiktok", "linkedin"];
const FORMATS: PostFormat[] = ["carousel", "reel", "static", "reel", "carousel", "video"];
const COVER_EMOJIS = ["🌆", "🎬", "📸", "🎉", "🛠️", "📈", "🗓️", "🍃", "🏆", "💡"];

export function buildMockClientPosts(clientId: string, count = 22): ClientPost[] {
  const rand = mulberry32(seedFromId(clientId));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.floor(rand() * 60) - 5; // alguns futuros (agendados), maioria passado
    const publishedAt = new Date(todayMs() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const reach = 80 + Math.floor(rand() * 2200);
    const views = reach + Math.floor(rand() * 400);
    const likes = Math.floor(reach * (0.02 + rand() * 0.09));
    const comments = Math.floor(likes * (0.05 + rand() * 0.2));
    const shares = Math.floor(likes * rand() * 0.1);
    const saves = Math.floor(likes * rand() * 0.15);
    const clicks = Math.floor(reach * rand() * 0.04);

    return {
      id: `post-${clientId.slice(0, 6)}-${i}`,
      platform: pick(PLATFORMS),
      format: pick(FORMATS),
      caption: pick(CAPTIONS),
      publishedAt,
      coverEmoji: pick(COVER_EMOJIS),
      likes,
      comments,
      shares,
      saves,
      clicks,
      views,
      impressions: views + Math.floor(rand() * 200),
      reach,
    };
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function engagementRate(post: ClientPost): number {
  if (post.reach === 0) return 0;
  return ((post.likes + post.comments + post.shares + post.saves) / post.reach) * 100;
}

export function buildMockQueues(clientId: string): Queue[] {
  const rand = mulberry32(seedFromId(clientId) + 1);
  if (rand() > 0.5) {
    return [
      {
        id: `queue-${clientId.slice(0, 6)}-1`,
        profile: "Default",
        name: "Posts semanais",
        status: "active",
        slots: [
          { day: "Seg", time: "09:00" },
          { day: "Qua", time: "12:00" },
          { day: "Sex", time: "18:00" },
        ],
      },
    ];
  }
  return [];
}

const AD_NAMES = [
  "Leads - Forms Nativo",
  "Remarketing - Carrinho abandonado",
  "Alcance - Novo produto",
  "Conversão - Página de vendas",
];

export function buildMockAdCampaigns(clientId: string): AdCampaign[] {
  const rand = mulberry32(seedFromId(clientId) + 2);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const statuses: AdStatus[] = ["active", "paused", "in_review"];

  return AD_NAMES.map((name, i) => {
    const status = pick(statuses);
    const spend = Math.floor(rand() * 800);
    return {
      id: `camp-${clientId.slice(0, 6)}-${i}`,
      name,
      platform: pick(["meta", "meta", "tiktok"] as const),
      status,
      budgetPerDay: [15, 25, 40, 10][i] ?? 20,
      spend,
      impressions: spend * (20 + Math.floor(rand() * 40)),
      clicks: Math.floor(spend * rand() * 2),
      conversions: Math.floor(spend * rand() * 0.1),
      adSets: [
        {
          id: `adset-${clientId.slice(0, 6)}-${i}-1`,
          name: "Criativos",
          status,
          ads: [
            { id: `ad-${clientId.slice(0, 6)}-${i}-1`, name: `00${i + 1} — Criativo A`, status },
            { id: `ad-${clientId.slice(0, 6)}-${i}-2`, name: `00${i + 1} — Criativo B`, status: pick(statuses) },
          ],
        },
      ],
    };
  });
}

const AUDIENCE_WINDOWS = ["365D", "180D", "90D", "60D", "30D", "14D", "7D"];

export function buildMockAudiences(clientId: string): Audience[] {
  const rand = mulberry32(seedFromId(clientId) + 3);
  return AUDIENCE_WINDOWS.map((window, i) => ({
    id: `aud-${clientId.slice(0, 6)}-${i}`,
    name: `(Engajamento) — cliente • ${window}`,
    type: "Lista de clientes",
    size: 800 + Math.floor(rand() * 400),
    status: rand() > 0.3 ? "processing" : "ready",
  }));
}
