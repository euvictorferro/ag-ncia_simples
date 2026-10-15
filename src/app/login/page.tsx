"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("E-mail ou senha inválidos.");
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("agency_members")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    setLoading(false);

    if (membershipError) {
      setError("Não foi possível carregar sua agência. Tente novamente.");
      return;
    }

    router.push(membership ? "/home/dashboard" : "/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground-strong">Agência Simples</h1>
          <p className="text-sm text-muted-foreground">Entre para continuar seu trabalho.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs text-muted-foreground">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-xs text-muted-foreground">Senha</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta? <Link href="/cadastro" className="text-foreground-strong underline underline-offset-4">Criar conta</Link>
        </p>
      </form>
    </main>
  );
}
