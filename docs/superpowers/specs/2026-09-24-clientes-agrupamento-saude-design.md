# Agrupamento e saúde de clientes na sidebar

## Contexto

A sidebar de `/clientes` (implementada em `2026-09-24-sidebar-lista-clientes-design.md`)
hoje é uma lista alfabética plana de clientes ativos + uma seção
"Arquivados". O usuário quer: (1) poder agrupar essa lista por diferentes
critérios (o dono da agência escolhe), e (2) ver um sinal de saúde por
cliente direto na linha.

## Objetivo

Dono de agência olha a sidebar de Clientes e já entende, sem clicar em
nada: quais clientes precisam de atenção (saúde), e consegue reorganizar
a visão pelo critério que importa no momento (tipo de serviço, quem
administra, ou nicho do cliente).

## Fora de escopo

- Sistema de nomes de usuário/perfis — não existe hoje (`agency_members`
  só tem `user_id`); "responsável" mostra um trecho do `user_id`, igual o
  padrão já usado em Tarefas (`TaskRow.tsx`, `assignee.user_id.slice(0, 8)`).
  Não estamos criando uma tabela de perfis agora.
- Lógica real de cálculo de saúde (ex: baseada em tasks atrasadas,
  pagamento em atraso) — o campo `health` é definido manualmente pelo
  usuário no modal, não calculado automaticamente.
- Múltiplos responsáveis por cliente — um cliente tem no máximo um
  `assigned_to`.

## Design

### 1. Migration (`clients`)

Nova migration `supabase/migrations/0002_clients_grouping.sql`, adicionando
à tabela `clients` existente:

```sql
alter table clients
  add column niche text,
  add column service_type text
    check (service_type in ('trafego', 'conteudo', 'chamadas', '360', 'outro')),
  add column assigned_to uuid references agency_members(id) on delete set null,
  add column health text not null default 'green'
    check (health in ('green', 'yellow', 'red'));
```

- `niche`: texto livre (ex: "Estética", "Jurídico"), nullable — nem todo
  cliente precisa ter definido.
- `service_type`: enum fechado (mesmo padrão de `tasks.status`/`priority`
  na migration `0001_foundation.sql`), nullable.
- `assigned_to`: aponta pra `agency_members`, igual `tasks.assignee_id`
  (`on delete set null`, não `cascade` — remover o membro não deve
  apagar o cliente).
- `health`: sempre tem valor (default `'green'`), nunca nulo.

RLS já cobre a tabela inteira (`clients` já tem policies de select/insert/
update/delete por `is_agency_member`) — novas colunas não precisam de
policy própria.

### 2. `src/lib/clients.ts`

- `Client` type ganha os 4 campos novos (`niche: string | null`,
  `service_type: string | null`, `assigned_to: string | null`,
  `health: "green" | "yellow" | "red"`).
- `updateClient`/`createClient` passam a aceitar esses campos no patch
  (todos opcionais na criação, exceto `health` que sempre tem o default
  do banco se omitido).

### 3. `ClientFormModal`

Ganha 4 campos novos, todos opcionais exceto saúde (que já vem com
default `green` ao criar):
- Nicho: input de texto livre.
- Plano/serviço: select (Nenhum / Tráfego / Conteúdo / Chamadas / 360 /
  Outro).
- Responsável: select populado com `listAgencyMembers` (mostrando
  `user_id.slice(0, 8)` como label, igual `TaskDetailModal.tsx`) + opção
  "Nenhum".
- Saúde: select (Verde / Amarelo / Vermelho), default Verde.

O modal precisa passar a receber `members: AgencyMember[]` como prop
(vindo de `listAgencyMembers`, já existente em `src/lib/tasks.ts`) — a
página `/clientes` (`clientes/page.tsx`) passa isso pra
`ClientsSidebarPanel`, que passa pro modal.

### 4. Sidebar — agrupamento

- Controle "Agrupar por" no topo da lista (abaixo do header, antes da
  lista): um `<select>` simples com as opções Nenhum / Plano ou serviço /
  Responsável / Nicho. Estado local (`useState`), não persiste entre
  sessões.
- Quando "Nenhum": comportamento atual (lista alfabética plana).
- Quando um critério é escolhido: clientes ativos são agrupados pelo
  valor daquele campo (`service_type`, `assigned_to` ou `niche`).
  Clientes sem valor definido nesse campo caem num grupo "Sem
  [critério]" (ex: "Sem nicho"), sempre por último entre os grupos.
  Cada grupo é uma seção colapsável (`SectionCollapseHeader`, aberta por
  padrão), com os clientes daquele grupo em ordem alfabética dentro
  dele.
  - Para "Responsável", o título do grupo é o mesmo texto truncado do
    `user_id` (não temos nome).
  - Para "Plano ou serviço", o título é o label em português do enum
    (Tráfego, Conteúdo, Chamadas, 360, Outro).
- "Arquivados" continua sempre como a última seção, fixa, independente
  do agrupamento escolhido (não participa do agrupamento — critério
  pedido foi só pra ativos).

### 5. Sidebar — indicador de saúde

- `ClientRow` ganha um pontinho colorido (verde/amarelo/vermelho) antes
  do avatar, refletindo `client.health`. Mesmo estilo visual dos badges
  já usados (bolinha de status de Automações/Documentos:
  `h-1.5 w-1.5 rounded-full`).

## Componentes tocados

- `supabase/migrations/0002_clients_grouping.sql` (novo).
- `src/lib/clients.ts`: `Client` type, `createClient`, `updateClient`.
- `src/components/clientes/ClientFormModal.tsx`: campos novos, prop
  `members`.
- `src/app/(authed)/clientes/page.tsx`: busca `listAgencyMembers` e passa
  adiante.
- `src/components/layout/Sidebar.tsx`: `ClientsSidebarPanel` (controle de
  agrupamento, lógica de grupos, prop `members` repassada pro modal),
  `ClientRow` (pontinho de saúde).

## Testes/validação

- Verificação manual (sem framework de teste, padrão do projeto): rodar
  a migration, criar/editar um cliente definindo nicho/plano/
  responsável/saúde, trocar o "Agrupar por" entre as 4 opções e
  conferir que os grupos batem, confirmar que "Arquivados" continua
  fixo no fim em qualquer agrupamento, confirmar que o pontinho de saúde
  aparece e muda de cor.
