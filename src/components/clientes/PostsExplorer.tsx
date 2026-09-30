"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Calendar as CalendarIcon, X } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, TiktokIcon, LinkedinIcon } from "@hugeicons/core-free-icons";
import { Facebook01Icon } from "@hugeicons/core-free-icons";
import { buildMockClientPosts, engagementRate, PLATFORM_LABEL, type ClientPost, type Platform } from "@/lib/mockClientSocial";

type View = "grid" | "list" | "calendar";

const PLATFORM_ICON = {
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  linkedin: LinkedinIcon,
  facebook: Facebook01Icon,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function PlatformIcon({ platform, size = 14 }: { platform: Platform; size?: number }) {
  return <HugeiconsIcon icon={PLATFORM_ICON[platform]} size={size} />;
}

function PostCard({ post, onClick }: { post: ClientPost; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-background-elevated p-3 text-left transition-colors hover:border-foreground-strong/40"
    >
      <div className="flex h-28 items-center justify-center rounded-md bg-muted text-4xl">{post.coverEmoji}</div>
      <p className="truncate text-sm text-foreground">{post.caption}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <PlatformIcon platform={post.platform} />
          {formatDate(post.publishedAt)}
        </span>
        <span>{engagementRate(post).toFixed(1)}% ER</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>♥ {post.likes}</span>
        <span>💬 {post.comments}</span>
        <span>👁 {post.views}</span>
      </div>
    </button>
  );
}

function PostDetailModal({ post, onClose }: { post: ClientPost; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground-strong">Post Details</h2>
            <p className="text-xs text-muted-foreground">Publicado em {formatDate(post.publishedAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legenda</p>
            <p className="text-sm text-foreground">{post.caption}</p>
          </div>

          <div className="flex h-40 items-center justify-center rounded-md bg-muted text-6xl">{post.coverEmoji}</div>

          <div className="flex items-center gap-2 text-sm text-foreground">
            <PlatformIcon platform={post.platform} />
            {PLATFORM_LABEL[post.platform]}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Analytics</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Likes", post.likes],
                ["Comments", post.comments],
                ["Shares", post.shares],
                ["Saves", post.saves],
                ["Clicks", post.clicks],
                ["Views", post.views],
                ["Impr.", post.impressions],
                ["Reach", post.reach],
                ["ER", `${engagementRate(post).toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-md border border-border p-2">
                  <p className="text-sm font-semibold text-foreground-strong">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Post ID: {post.id}</p>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ posts, onSelect }: { posts: ClientPost[]; onSelect: (post: ClientPost) => void }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const monthYear = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = month.getDay();
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const postsByDay = new Map<number, ClientPost[]>();
  for (const post of posts) {
    const d = new Date(post.publishedAt);
    if (d.getFullYear() === monthYear && d.getMonth() === monthIndex) {
      const list = postsByDay.get(d.getDate()) ?? [];
      list.push(post);
      postsByDay.set(d.getDate(), list);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-strong">
          {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <button type="button" onClick={() => setMonthOffset((v) => v - 1)} className="rounded-md border border-border px-2 py-1 text-xs">
            ←
          </button>
          <button type="button" onClick={() => setMonthOffset(0)} className="rounded-md border border-border px-2 py-1 text-xs">
            Hoje
          </button>
          <button type="button" onClick={() => setMonthOffset((v) => v + 1)} className="rounded-md border border-border px-2 py-1 text-xs">
            →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border text-xs">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="bg-background-elevated p-1.5 text-center text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="min-h-20 bg-background-elevated p-1">
            {day && (
              <>
                <p className="mb-1 text-[11px] text-muted-foreground">{day}</p>
                {(postsByDay.get(day) ?? []).map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelect(post)}
                    className="mb-1 block w-full truncate rounded-sm bg-muted px-1 py-0.5 text-left text-[10px] text-foreground hover:bg-foreground/10"
                  >
                    {post.coverEmoji} {post.caption}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostsExplorer({ clientId, defaultView = "grid" }: { clientId: string; defaultView?: View }) {
  const [view, setView] = useState<View>(defaultView);
  const [selected, setSelected] = useState<ClientPost | null>(null);
  const posts = useMemo(() => buildMockClientPosts(clientId), [clientId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground-strong">Posts</h1>
          <p className="text-sm text-muted-foreground">Veja os posts do cliente e suas métricas</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {([
            ["grid", LayoutGrid],
            ["list", List],
            ["calendar", CalendarIcon],
          ] as const).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-label={key}
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                view === key ? "bg-muted text-foreground-strong" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => setSelected(post)} />
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-background-elevated">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pl-3 pr-3">Content</th>
                <th className="px-3">Platform</th>
                <th className="px-3">Date</th>
                <th className="px-3">Likes</th>
                <th className="px-3">Comments</th>
                <th className="px-3">Views</th>
                <th className="pr-3">ER</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => setSelected(post)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                >
                  <td className="flex items-center gap-2 py-2 pl-3 pr-3 text-foreground">
                    <span className="text-base">{post.coverEmoji}</span>
                    <span className="max-w-56 truncate">{post.caption}</span>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    <PlatformIcon platform={post.platform} />
                  </td>
                  <td className="px-3 text-muted-foreground">{formatDate(post.publishedAt)}</td>
                  <td className="px-3 text-muted-foreground">{post.likes}</td>
                  <td className="px-3 text-muted-foreground">{post.comments}</td>
                  <td className="px-3 text-muted-foreground">{post.views}</td>
                  <td className="pr-3 font-medium text-emerald-400">{engagementRate(post).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "calendar" && <CalendarView posts={posts} onSelect={setSelected} />}

      {selected && <PostDetailModal post={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
