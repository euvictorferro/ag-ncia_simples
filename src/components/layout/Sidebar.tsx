import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export type ActiveKey = "tasks" | "clientes";

const NAV_ITEMS: { key: ActiveKey; href: string; label: string }[] = [
  { key: "tasks", href: "/tasks", label: "Tarefas" },
  { key: "clientes", href: "/clientes", label: "Clientes" },
];

export function Sidebar({ active }: { active: ActiveKey }) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col gap-6 border-r border-border bg-background-elevated px-4 py-5">
      <Logo width={120} height={28} />
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active === item.key
                ? "bg-muted text-foreground-strong"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
