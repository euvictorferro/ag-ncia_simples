"use client";

import { Eye, Users, FileText, Trophy, Heart } from "lucide-react";
import {
  buildMockClientPosts,
  engagementRate,
  todayMs,
  PLATFORM_LABEL,
  FORMAT_LABEL,
  type ClientPost,
  type Platform,
} from "@/lib/mockClientSocial";
import { LineChart } from "@/components/charts/LineChart";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { ChartCard, RankedList, StatCard, CATEGORICAL } from "@/components/home/shared";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function weekBuckets(posts: ClientPost[], weeks = 5, valueFn: (p: ClientPost) => number) {
  const now = todayMs();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = now - (weeks - i) * 7 * 24 * 60 * 60 * 1000;
    const label = new Date(start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return { label, start, end: start + 7 * 24 * 60 * 60 * 1000, value: 0 };
  });
  for (const post of posts) {
    const t = new Date(post.publishedAt).getTime();
    const bucket = buckets.find((b) => t >= b.start && t < b.end);
    if (bucket) bucket.value += valueFn(post);
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

function countBy<T extends string>(posts: ClientPost[], key: (p: ClientPost) => T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const post of posts) {
    const k = key(post);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function sumBy(posts: ClientPost[], valueFn: (p: ClientPost) => number, key: (p: ClientPost) => string) {
  const out: Record<string, number> = {};
  for (const post of posts) {
    const k = key(post);
    out[k] = (out[k] ?? 0) + valueFn(post);
  }
  return out;
}

function filterLast30(posts: ClientPost[]): ClientPost[] {
  const now = todayMs();
  return posts.filter((p) => now - new Date(p.publishedAt).getTime() <= 30 * 24 * 60 * 60 * 1000);
}

export function ClientAnalytics({ clientId }: { clientId: string }) {
  const last30 = filterLast30(buildMockClientPosts(clientId));

  const totalReach = last30.reduce((s, p) => s + p.reach, 0);
  const totalLikes = last30.reduce((s, p) => s + p.likes, 0);
  const avgEr = last30.length
    ? last30.reduce((s, p) => s + engagementRate(p), 0) / last30.length
    : 0;
  const bestPost = [...last30].sort((a, b) => engagementRate(b) - engagementRate(a))[0];

  const postsByPlatform = countBy(last30, (p) => p.platform);
  const likesByPlatform = sumBy(last30, (p) => p.likes, (p) => p.platform);
  const formatCounts = countBy(last30, (p) => p.format);

  const platforms = Array.from(new Set(last30.map((p) => p.platform))) as Platform[];

  // Best time to post: soma de likes por dia da semana x faixa de horário
  const heat = DAYS.map(() => HOURS.map(() => 0));
  for (const post of last30) {
    const d = new Date(post.publishedAt);
    const day = d.getDay();
    const hourIdx = Math.min(Math.floor(d.getHours() / 3), HOURS.length - 1);
    heat[day][hourIdx] += post.likes;
  }
  const heatMax = Math.max(...heat.flat(), 1);
  let bestCell = { day: 0, hour: 0, value: 0 };
  heat.forEach((row, day) => row.forEach((value, hour) => {
    if (value > bestCell.value) bestCell = { day, hour, value };
  }));

  const topPosts = [...last30].sort((a, b) => engagementRate(b) - engagementRate(a)).slice(0, 5);

  // Engagement accumulation: curva simplificada (metade do engajamento chega em ~3 dias, 100% em ~14)
  const accumulation = [
    { label: "Publicação", value: 0 },
    { label: "1d", value: 22 },
    { label: "3d", value: 50 },
    { label: "7d", value: 78 },
    { label: "14d", value: 92 },
    { label: "30d", value: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground-strong">Analytics</h1>
        <p className="text-sm text-muted-foreground">Métricas de posts dos últimos 30 dias</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard icon={Heart} label="Taxa de engajamento" value={`${avgEr.toFixed(1)}%`} tone="positive" />
        <StatCard icon={Eye} label="Alcance total" value={totalReach.toLocaleString("pt-BR")} />
        <StatCard icon={Users} label="Seguidores" value={(1200 + totalLikes * 3).toLocaleString("pt-BR")} />
        <StatCard icon={FileText} label="Posts no período" value={String(last30.length)} />
        <StatCard icon={Trophy} label="Melhor post" value={bestPost ? `${Math.round(engagementRate(bestPost))}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankedList
          title="Posts per platform"
          items={Object.entries(postsByPlatform).map(([k, v]) => ({ label: PLATFORM_LABEL[k as Platform], value: v }))}
          emptyLabel="Sem posts no período."
        />
        <ChartCard title="Posts over time · últimos 30 dias">
          <LineChart points={weekBuckets(last30, 5, () => 1)} />
        </ChartCard>

        <RankedList
          title="Likes per platform"
          items={Object.entries(likesByPlatform).map(([k, v]) => ({ label: PLATFORM_LABEL[k as Platform], value: v }))}
          emptyLabel="Sem curtidas no período."
        />
        <ChartCard title="Likes over time · últimos 30 dias">
          <LineChart points={weekBuckets(last30, 5, (p) => p.likes)} color="#d55181" />
        </ChartCard>
      </div>

      <ChartCard title="Engagement over time · últimos 30 dias">
        <MultiLineChart
          series={[
            { id: "likes", label: "Likes", color: "#d55181", points: weekBuckets(last30, 5, (p) => p.likes) },
            { id: "comments", label: "Comments", color: "#3987e5", points: weekBuckets(last30, 5, (p) => p.comments) },
          ]}
          formatValue={(v) => String(Math.round(v))}
        />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ["Likes", last30.reduce((s, p) => s + p.likes, 0)],
            ["Comments", last30.reduce((s, p) => s + p.comments, 0)],
            ["Shares", last30.reduce((s, p) => s + p.shares, 0)],
            ["Saves", last30.reduce((s, p) => s + p.saves, 0)],
            ["Views", last30.reduce((s, p) => s + p.views, 0)],
            ["Impress.", last30.reduce((s, p) => s + p.impressions, 0)],
            ["Reach", totalReach],
            ["Clicks", last30.reduce((s, p) => s + p.clicks, 0)],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-md border border-border p-2 text-center">
              <p className="text-sm font-semibold text-foreground-strong">{(value as number).toLocaleString("pt-BR")}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Best time to post">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th />
                  {HOURS.map((h) => (
                    <th key={h} className="pb-1 text-[10px] font-normal text-muted-foreground">
                      {h}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day}>
                    <td className="pr-2 text-[10px] text-muted-foreground">{day}</td>
                    {HOURS.map((_, hi) => {
                      const v = heat[di][hi];
                      const alpha = v === 0 ? 0.08 : 0.15 + (v / heatMax) * 0.85;
                      return (
                        <td key={hi}>
                          <div
                            className="h-4 w-4 rounded-sm"
                            style={{ backgroundColor: `rgba(16, 185, 129, ${alpha})` }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bestCell.value > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Melhor horário:{" "}
              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-emerald-400">
                {DAYS[bestCell.day]} {HOURS[bestCell.hour]}h · {bestCell.value}
              </span>
            </p>
          )}
        </ChartCard>

        <RankedList
          title="Content format breakdown"
          items={Object.entries(formatCounts).map(([k, v]) => ({ label: FORMAT_LABEL[k as keyof typeof FORMAT_LABEL], value: v }))}
          emptyLabel="Sem posts no período."
        />
      </div>

      <ChartCard title="Platform breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Platform</th>
                <th className="px-3">Posts</th>
                <th className="px-3">Likes</th>
                <th className="px-3">Comments</th>
                <th className="px-3">Shares</th>
                <th className="px-3">Saves</th>
                <th className="px-3">Clicks</th>
                <th className="px-3">Views</th>
                <th className="px-3">Impr.</th>
                <th className="px-3">Reach</th>
                <th className="pl-3">ER</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((platform) => {
                const posts = last30.filter((p) => p.platform === platform);
                const sum = (fn: (p: ClientPost) => number) => posts.reduce((s, p) => s + fn(p), 0);
                const reach = sum((p) => p.reach);
                const er = reach ? ((sum((p) => p.likes) + sum((p) => p.comments) + sum((p) => p.shares) + sum((p) => p.saves)) / reach) * 100 : 0;
                return (
                  <tr key={platform} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{PLATFORM_LABEL[platform]}</td>
                    <td className="px-3 text-muted-foreground">{posts.length}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.likes)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.comments)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.shares)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.saves)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.clicks)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.views)}</td>
                    <td className="px-3 text-muted-foreground">{sum((p) => p.impressions)}</td>
                    <td className="px-3 text-muted-foreground">{reach}</td>
                    <td className="pl-3 font-medium text-emerald-400">{er.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="Top performing posts">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Post</th>
                <th className="px-3">Likes</th>
                <th className="px-3">Comments</th>
                <th className="px-3">Shares</th>
                <th className="px-3">Saves</th>
                <th className="px-3">Clicks</th>
                <th className="px-3">Views</th>
                <th className="px-3">Impr.</th>
                <th className="px-3">Reach</th>
                <th className="pl-3">ER</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post) => (
                <tr key={post.id} className="border-b border-border/60 last:border-0">
                  <td className="flex items-center gap-2 py-2 pr-3 text-foreground">
                    <span className="text-base">{post.coverEmoji}</span>
                    <span className="max-w-40 truncate">{post.caption}</span>
                  </td>
                  <td className="px-3 text-muted-foreground">{post.likes}</td>
                  <td className="px-3 text-muted-foreground">{post.comments}</td>
                  <td className="px-3 text-muted-foreground">{post.shares}</td>
                  <td className="px-3 text-muted-foreground">{post.saves}</td>
                  <td className="px-3 text-muted-foreground">{post.clicks}</td>
                  <td className="px-3 text-muted-foreground">{post.views}</td>
                  <td className="px-3 text-muted-foreground">{post.impressions}</td>
                  <td className="px-3 text-muted-foreground">{post.reach}</td>
                  <td className="pl-3 font-medium text-emerald-400">{engagementRate(post).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Posting frequency vs engagement">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Platform</th>
                <th className="px-3">Cadência</th>
                <th className="pl-3">ER média</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((platform, i) => {
                const posts = last30.filter((p) => p.platform === platform);
                const perWeek = (posts.length / 4.3).toFixed(1);
                const er = posts.length ? posts.reduce((s, p) => s + engagementRate(p), 0) / posts.length : 0;
                return (
                  <tr key={platform} className="border-b border-border/60 last:border-0">
                    <td className="flex items-center gap-2 py-2 pr-3 text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORICAL[i % CATEGORICAL.length] }} />
                      {PLATFORM_LABEL[platform]}
                    </td>
                    <td className="px-3 text-muted-foreground">{perWeek}/sem</td>
                    <td className="pl-3 font-medium text-emerald-400">{er.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard title="Engagement accumulation">
          <p className="mb-2 text-xs text-muted-foreground">Como o engajamento se acumula após a publicação</p>
          <LineChart points={accumulation} color="#ffffff" />
        </ChartCard>
      </div>
    </div>
  );
}
