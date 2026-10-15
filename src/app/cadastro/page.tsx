"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError("Não foi possível criar a conta. Confira os dados ou tente entrar se já tiver cadastro.");
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setMessage("Conta criada. Confirme seu e-mail pelo link que enviamos para começar.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground-strong">Crie sua conta</h1>
          <p className="text-sm text-muted-foreground">Comece a organizar sua agência no Agência Simples.</p>
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
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
          <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-60"
        >
          {loading ? "Criando conta…" : "Criar conta"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link href="/login" className="text-foreground-strong underline underline-offset-4">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
