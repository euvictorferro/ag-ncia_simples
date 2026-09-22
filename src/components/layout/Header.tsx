"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function Header({ agencyName, pageLabel }: { agencyName: string; pageLabel: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-background-elevated px-4">
      <p className="text-sm text-muted-foreground">
        {agencyName} / <span className="font-medium text-foreground-strong">{pageLabel}</span>
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-muted-foreground hover:text-foreground-strong"
      >
        Sair
      </button>
    </header>
  );
}
