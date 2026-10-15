import { randomUUID } from "node:crypto";
import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.TEST_SUPABASE_URL!;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!;
const mailpitUrl = "http://127.0.0.1:54324";

function createAnonClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

async function confirmationLinkFor(email: string) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const search = new URL(`${mailpitUrl}/api/v1/search`);
    search.searchParams.set("query", `to:${email}`);
    const searchResponse = await fetch(search);
    if (searchResponse.ok) {
      const searchResult = (await searchResponse.json()) as {
        messages?: Array<{ ID?: string; id?: string }>;
      };
      const messageId = searchResult.messages?.[0]?.ID ?? searchResult.messages?.[0]?.id;

      if (messageId) {
        const messageResponse = await fetch(
          `${mailpitUrl}/api/v1/message/${encodeURIComponent(messageId)}`,
        );
        if (messageResponse.ok) {
          const message = (await messageResponse.json()) as {
            HTML?: string;
            Text?: string;
            html?: string;
            text?: string;
          };
          const content = `${message.HTML ?? message.html ?? ""}\n${message.Text ?? message.text ?? ""}`;
          const links = [...content.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((match) =>
            match[0]
              .replace(/&amp;/g, "&")
              .replace(/&#x3D;/gi, "=")
              .replace(/&quot;/g, '"'),
          );
          const confirmationLink = links.find((link) => link.includes("/auth/v1/verify"));
          if (confirmationLink) return confirmationLink;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`O e-mail de confirmação para ${email} não chegou ao Mailpit local.`);
}

async function confirmedApiUser(email: string, password: string) {
  const anonymousClient = createAnonClient();
  const { data: signup, error: signupError } = await anonymousClient.auth.signUp({ email, password });
  expect(signupError).toBeNull();
  expect(signup.session).toBeNull();
  expect(signup.user).not.toBeNull();

  const link = new URL(await confirmationLinkFor(email));
  const tokenHash = link.searchParams.get("token_hash") ?? link.searchParams.get("token");
  const otpType = link.searchParams.get("type") as EmailOtpType | null;
  expect(tokenHash).toBeTruthy();
  expect(otpType).toBeTruthy();

  const { data: confirmation, error: confirmationError } = await anonymousClient.auth.verifyOtp({
    token_hash: tokenHash!,
    type: otpType!,
  });
  expect(confirmationError).toBeNull();
  expect(confirmation.session).not.toBeNull();

  const signedInClient = createAnonClient();
  const { error: sessionError } = await signedInClient.auth.setSession({
    access_token: confirmation.session!.access_token,
    refresh_token: confirmation.session!.refresh_token,
  });
  expect(sessionError).toBeNull();

  return { userId: signup.user!.id, signedInClient };
}

test("um dono confirma o e-mail, configura a agência e chega à área de clientes", async ({
  page,
  browser,
}) => {
  const email = `pr2-e2e-${randomUUID()}@example.com`;
  const password = "FerroTeste!2026";
  const agencyName = `Agência E2E ${randomUUID().slice(0, 8)}`;
  const agencyNiche = "Clínicas odontológicas";
  const admin = createAdminClient();

  await page.goto("/cadastro");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("status")).toContainText("Confirme seu e-mail");

  await page.goto(await confirmationLinkFor(email));
  await page.waitForURL(/\/onboarding(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Vamos configurar sua agência" })).toBeVisible();

  const duplicateContext = await browser.newContext();
  const duplicatePage = await duplicateContext.newPage();
  await duplicatePage.goto("/cadastro");
  await duplicatePage.getByLabel("E-mail").fill(email);
  await duplicatePage.getByLabel("Senha").fill(password);
  await duplicatePage.getByRole("button", { name: "Criar conta" }).click();
  await expect(duplicatePage.locator('[role="status"], [role="alert"]')).toBeVisible();

  const { data: duplicateUsers, error: duplicateUsersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  expect(duplicateUsersError).toBeNull();
  expect(duplicateUsers.users.filter((user) => user.email === email)).toHaveLength(1);
  await duplicateContext.close();

  await page.getByLabel("Nome da agência").fill(agencyName);
  await page.getByLabel("Nicho principal").fill(agencyNiche);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Quantas pessoas estão na equipe?" })).toBeVisible();
  await page.getByRole("button", { name: "2 a 5 pessoas" }).click();

  await page.route("**/rest/v1/rpc/create_agency_for_current_user", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Falha controlada pelo teste" }),
    });
  });
  await page.getByRole("button", { name: "Criar minha agência" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("Não foi possível criar a agência");
  await page.unroute("**/rest/v1/rpc/create_agency_for_current_user");

  const authUserCountBeforeCreation = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  expect(authUserCountBeforeCreation.data.users.filter((user) => user.email === email)).toHaveLength(1);

  await page.getByRole("button", { name: "Criar minha agência" }).click();
  await expect(page.getByRole("heading", { name: `${agencyName} está pronta` })).toBeVisible();
  await page.getByRole("button", { name: "Cadastrar primeiro cliente" }).click();
  await expect(page).toHaveURL(/\/clientes$/);
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  await expect(page.getByText("Nenhum cliente ainda.")).toBeVisible();
});

test("senha fraca é rejeitada e uma falha real da RPC deixa o dono tentar novamente", async () => {
  const anonymousClient = createAnonClient();
  const admin = createAdminClient();
  const weakEmail = `pr2-fraca-${randomUUID()}@example.com`;
  const weakSignup = await anonymousClient.auth.signUp({ email: weakEmail, password: "fraca7" });
  expect(weakSignup.error).not.toBeNull();

  const { data: weakUsers, error: weakUsersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  expect(weakUsersError).toBeNull();
  expect(weakUsers.users.some((user) => user.email === weakEmail)).toBe(false);

  const email = `pr2-rpc-${randomUUID()}@example.com`;
  const password = "FerroTeste!2026";
  const { userId, signedInClient } = await confirmedApiUser(email, password);
  const agencyName = `Agência Recuperável ${randomUUID().slice(0, 8)}`;
  const { count: agencyCountBefore } = await admin.from("agencies").select("id", { count: "exact", head: true });
  const { count: membershipCountBefore } = await admin
    .from("agency_members")
    .select("id", { count: "exact", head: true });

  const failedRpc = await signedInClient.rpc("create_agency_for_current_user", {
    p_name: "   ",
    p_niche: "Clínicas",
    p_team_size: "1",
  });
  expect(failedRpc.error).not.toBeNull();

  const { data: usersAfterFailure, error: usersAfterFailureError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  expect(usersAfterFailureError).toBeNull();
  expect(usersAfterFailure.users.filter((user) => user.id === userId)).toHaveLength(1);

  const { count: agencyCountAfter } = await admin.from("agencies").select("id", { count: "exact", head: true });
  const { count: membershipCountAfter } = await admin
    .from("agency_members")
    .select("id", { count: "exact", head: true });
  expect(agencyCountAfter).toBe(agencyCountBefore);
  expect(membershipCountAfter).toBe(membershipCountBefore);

  const retryRpc = await signedInClient.rpc("create_agency_for_current_user", {
    p_name: agencyName,
    p_niche: "Clínicas odontológicas",
    p_team_size: "1",
  });
  expect(retryRpc.error).toBeNull();
  expect(retryRpc.data).toBeTruthy();

  const { data: membership, error: membershipError } = await admin
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  expect(membershipError).toBeNull();
  expect(membership).toMatchObject({ agency_id: retryRpc.data, role: "owner" });

  const duplicateSignup = await anonymousClient.auth.signUp({ email, password });
  expect(duplicateSignup.error === null || duplicateSignup.error.message.length > 0).toBe(true);
  const { data: usersAfterDuplicate, error: usersAfterDuplicateError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  expect(usersAfterDuplicateError).toBeNull();
  expect(usersAfterDuplicate.users.filter((user) => user.email === email)).toHaveLength(1);
});
