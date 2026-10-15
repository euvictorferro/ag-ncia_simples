import { execFileSync } from "node:child_process";
import { defineConfig } from "@playwright/test";

function readLocalSupabaseEnvironment() {
  const output = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const environment = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf("=");
        return separator > 0
          ? [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, "")]
          : null;
      })
      .filter((entry): entry is [string, string] => entry !== null),
  );

  const apiUrl = environment.API_URL;
  const anonKey = environment.ANON_KEY;
  const serviceRoleKey = environment.SERVICE_ROLE_KEY;
  const host = apiUrl ? new URL(apiUrl).hostname : "";

  if (!["127.0.0.1", "localhost"].includes(host)) {
    throw new Error("Os testes exigem um Supabase local em 127.0.0.1 ou localhost.");
  }
  if (!anonKey || !serviceRoleKey) {
    throw new Error("A Supabase CLI não retornou as chaves locais necessárias para os testes.");
  }

  return { apiUrl, anonKey, serviceRoleKey };
}

const localSupabase = readLocalSupabaseEnvironment();
process.env.TEST_SUPABASE_URL = localSupabase.apiUrl;
process.env.TEST_SUPABASE_ANON_KEY = localSupabase.anonKey;
process.env.TEST_SUPABASE_SERVICE_ROLE_KEY = localSupabase.serviceRoleKey;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://localhost:3000/cadastro",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: localSupabase.apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localSupabase.anonKey,
    },
  },
});
