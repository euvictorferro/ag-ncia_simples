"use client";

import { useEffect, useState } from "react";
import { Link2, X } from "lucide-react";

const STORAGE_KEY = "finance-connect-dismissed";
const PROVIDERS = ["Stripe", "AbacatePay", "Hotmart", "Mercado Pago"];

export function ConnectBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ponytail: preferência local, ignora falha de escrita
    }
  }

  function connect(provider: string) {
    // ponytail: stub — sem OAuth real ainda, só um retorno visual de "em breve"
    setConnecting(provider);
    setTimeout(() => setConnecting(null), 1800);
  }

  if (dismissed) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-background-elevated px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs">
        <Link2 size={14} className="shrink-0 text-muted-foreground" />
        <span className="text-foreground">Conecte seus meios de recebimento</span>
        <span className="hidden text-muted-foreground sm:inline">
          para trazer receita e despesas de verdade pra este dashboard.
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            onClick={() => connect(provider)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {connecting === provider ? "Em breve…" : `Conectar ${provider}`}
          </button>
        ))}
        <button
          onClick={dismiss}
          className="ml-1 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fechar aviso de conexão"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
