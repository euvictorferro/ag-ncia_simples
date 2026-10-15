"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const TEAM_SIZES = [
  { value: "1", label: "Só eu" },
  { value: "2-5", label: "2 a 5 pessoas" },
  { value: "6-10", label: "6 a 10 pessoas" },
  { value: "11+", label: "11 ou mais" },
] as const;

type TeamSize = (typeof TEAM_SIZES)[number]["value"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agencyName, setAgencyName] = useState("");
  const [niche, setNiche] = useState("");
  const [teamSize, setTeamSize] = useState<TeamSize | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createAgency() {
    if (!teamSize) {
      setError("Escolha o tamanho da equipe para continuar.");
      return;
    }

    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: createError } = await supabase.rpc("create_agency_for_current_user", {
      p_name: agencyName.trim(),
      p_niche: niche.trim(),
      p_team_size: teamSize,
    });

    setLoading(false);

    if (createError) {
      setError("Não foi possível criar a agência. Atualize a página e tente novamente.");
      return;
    }

    setStep(3);
  }

  function goToFirstClient() {
    router.push("/clientes");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg space-y-6 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6 sm:p-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {step < 3 ? `Configuração inicial · ${step} de 2` : "Configuração concluída"}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-button transition-[width]"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </header>

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground-strong">Vamos configurar sua agência</h1>
              <p className="text-sm text-muted-foreground">Essas informações ajudam a preparar seu espaço de trabalho.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="agency-name" className="text-sm text-foreground-strong">Nome da agência</label>
              <input
                id="agency-name"
                autoComplete="organization"
                maxLength={80}
                required
                value={agencyName}
                onChange={(event) => setAgencyName(event.target.value)}
                placeholder="Ex.: Agência Aurora"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground-strong"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="agency-niche" className="text-sm text-foreground-strong">Nicho principal</label>
              <input
                id="agency-niche"
                maxLength={100}
                required
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                placeholder="Ex.: clínicas, e-commerce, negócios locais"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground-strong"
              />
            </div>

            <button
              type="button"
              disabled={!agencyName.trim() || !niche.trim()}
              onClick={() => setStep(2)}
              className="w-full rounded-md bg-button px-3 py-2.5 text-sm font-medium text-button-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground-strong">Quantas pessoas estão na equipe?</h1>
              <p className="text-sm text-muted-foreground">Você poderá ajustar isso depois.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {TEAM_SIZES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={teamSize === option.value}
                  onClick={() => {
                    setTeamSize(option.value);
                    setError(null);
                  }}
                  className={`rounded-md border px-3 py-3 text-left text-sm transition-colors ${
                    teamSize === option.value
                      ? "border-foreground-strong bg-muted text-foreground-strong"
                      : "border-border text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground disabled:opacity-60"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loading || !teamSize}
                onClick={createAgency}
                className="flex-1 rounded-md bg-button px-3 py-2.5 text-sm font-medium text-button-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Criando espaço…" : "Criar minha agência"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground-strong">{agencyName} está pronta</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Seu espaço de trabalho foi criado. Comece cadastrando seu primeiro cliente para organizar a operação da agência.
              </p>
            </div>

            <button
              type="button"
              onClick={goToFirstClient}
              className="w-full rounded-md bg-button px-3 py-2.5 text-sm font-medium text-button-foreground"
            >
              Cadastrar primeiro cliente
            </button>
            <button
              type="button"
              onClick={() => router.push("/home/dashboard")}
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm text-foreground"
            >
              Ir para o painel
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
