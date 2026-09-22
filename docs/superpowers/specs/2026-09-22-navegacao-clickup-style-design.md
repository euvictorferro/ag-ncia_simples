# Navegação estilo ClickUp — esqueleto de 5 seções

Data: 2026-09-22

## Contexto

A navegação em duas camadas (rail + sidebar contextual Agência x Cliente) construída ontem já está em produção. Este documento expande essa estrutura pra se aproximar do modelo do ClickUp: uma rail fixa com várias seções de topo (não só "Agência"), cada uma com sua própria sub-navegação. É explicitamente um **esqueleto** — a maioria das seções novas nasce como placeholder "em breve"; só o que já existe (Tarefas, CRUD de clientes) continua funcional. Integrações reais (WhatsApp/e-mail/Instagram em Chats, Granola/calendário em Nodes, dashboards de anúncios/orgânico/financeiro por cliente, customização de Spaces dentro de Tasks) são sub-projetos futuros, cada um com sua própria spec.

## Decisões

- **Rail com 5 ícones fixos**: Home, Inbox, Clientes, Chats, Nodes. Substitui o ícone único da agência de ontem — o ícone "Home" herda essa mesma aparência (inicial da agência) e vira o novo destino padrão pós-login.
- **Home** agrupa o que antes vivia solto no contexto "Agência": Dashboard (era `/overview`), Financeiro (novo, placeholder) e Tasks (era `/tasks`). Customização de "Spaces" dentro de Tasks (múltiplos quadros por agência, como no ClickUp) fica fora de escopo desta spec.
- **Clientes vira uma grade de blocos**, fundindo a tela de CRUD que já existe com a navegação de clientes que antes ficava dentro do contexto Agência. Não existem mais duas telas (uma de gerenciar, outra de navegar) — é uma só. Cada bloco tem uma ação de editar (nome/arquivar, reaproveitando o modal que já existe) sem sair da grade, e clicar no corpo do bloco entra no workspace daquele cliente.
- **Workspace de cliente ganha mais abas**: Dashboard, Anúncios, Orgânico, Financeiro, Tasks, Conteúdos. Só **Tasks** é funcional (reaproveita a tabela/modal que já existe, sem mudança de comportamento); as demais mostram uma tela "em breve", mas já existem como rota navegável — a ideia é a navegação já nascer com a forma final, mesmo com conteúdo vazio.
- **Inbox, Chats, Nodes**: cada um é uma seção de topo própria na rail, sem sub-navegação por enquanto — uma única tela "em breve" cada.
- **Sem redirect de compatibilidade** para as rotas antigas `/overview` e `/tasks` — foram criadas ontem, nada fora do app aponta pra elas.

## Rail e sub-navegação

```
Rail (5 ícones fixos):
  [Home]     → sempre navega para /home/dashboard
  [Inbox]    → /inbox
  [Clientes] → /clientes
  [Chats]    → /chats
  [Nodes]    → /nodes

Sidebar larga — contexto Home (rotas /home/*):
  Dashboard    → /home/dashboard
  Financeiro   → /home/financeiro (placeholder)
  Tasks        → /home/tasks

Sidebar larga — contexto Clientes (rota /clientes): sem sub-navegação — a
própria página é a grade de blocos.

Sidebar larga — contexto Cliente (rotas /clientes/[id]/*):
  ← <Nome do Cliente>  → volta para /clientes
  Dashboard    → /clientes/[id]/dashboard (placeholder)
  Anúncios     → /clientes/[id]/anuncios (placeholder)
  Orgânico     → /clientes/[id]/organico (placeholder)
  Financeiro   → /clientes/[id]/financeiro (placeholder)
  Tarefas      → /clientes/[id]/tarefas (funcional, já existe)
  Conteúdos    → /clientes/[id]/conteudos (placeholder)

Sidebar larga — contexto Inbox/Chats/Nodes: sem sub-navegação, tela única.
```

`SidebarContext` (tipo discriminado, substitui o de ontem):

```ts
type SidebarContext =
  | { type: "home"; active: "dashboard" | "financeiro" | "tasks" }
  | { type: "clients" }
  | {
      type: "client";
      clientId: string;
      clientName: string;
      active: "dashboard" | "anuncios" | "organico" | "financeiro" | "tasks" | "conteudos";
    }
  | { type: "inbox" }
  | { type: "chats" }
  | { type: "nodes" };
```

## Rotas

| Rota | Status | Descrição |
|---|---|---|
| `/home/dashboard` | **Nova** (era `/overview`) | Mesmo conteúdo de hoje (clientes ativos, tarefas por status, próximas entregas), só movido de lugar. |
| `/home/financeiro` | **Nova** | Placeholder "em breve". |
| `/home/tasks` | **Nova** (era `/tasks`) | Mesmo conteúdo de hoje ("Todas as tarefas"), só movido de lugar. |
| `/inbox` | **Nova** | Placeholder "em breve". |
| `/clientes` | Reescrita | Grade de blocos, fundindo CRUD + navegação. |
| `/clientes/[id]` | Inalterada | Continua redirecionando para `/clientes/[id]/tarefas` (única aba funcional). |
| `/clientes/[id]/tarefas` | Inalterada | Mesmo comportamento de hoje. |
| `/clientes/[id]/dashboard` | **Nova** | Placeholder "em breve". |
| `/clientes/[id]/anuncios` | **Nova** | Placeholder "em breve". |
| `/clientes/[id]/organico` | **Nova** | Placeholder "em breve". |
| `/clientes/[id]/financeiro` | **Nova** | Placeholder "em breve". |
| `/clientes/[id]/conteudos` | **Nova** | Placeholder "em breve". |
| `/chats` | **Nova** | Placeholder "em breve". |
| `/nodes` | **Nova** | Placeholder "em breve". |
| `/overview`, `/tasks` | **Removidas** | Sem redirect — substituídas por `/home/dashboard` e `/home/tasks`. |

O `middleware.ts` (allowlist de rotas públicas) não precisa de nenhuma mudança — continua protegendo tudo por padrão, e todas as rotas novas já nascem protegidas automaticamente.

## Tela de Clientes (grade fundida)

Substitui `ClientsTable`/`ClientRow` por uma grade de cards (`ClientsGrid`/`ClientCard`). Cada card mostra nome + status (Ativo/Arquivado) + um botão de editar (ícone de lápis) que abre o `ClientFormModal` existente em modo edição sem navegar para outra página. Clicar em qualquer outra área do card navega para `/clientes/[id]/tarefas`. Um botão "+ Novo cliente" no topo da página abre o mesmo modal em modo criação. Comportamento de dados idêntico ao de hoje (`listClients` com `includeArchived: true`, `createClient`, `updateClient`) — só a apresentação visual muda de linhas de tabela para blocos.

## Páginas placeholder

Um componente compartilhado simples, ex. `PlaceholderSection({ title })`, renderizado dentro do `AppFrame` de cada rota placeholder, mostrando o título da seção e o texto "Em breve" — sem lógica, sem busca de dados. Reaproveitado por `/home/financeiro`, `/inbox`, `/chats`, `/nodes`, `/clientes/[id]/dashboard`, `/clientes/[id]/anuncios`, `/clientes/[id]/organico`, `/clientes/[id]/financeiro`, `/clientes/[id]/conteudos`.

## Fora de escopo (adiado para specs futuras)

- Customização de Spaces dentro de Tasks (múltiplos quadros/pastas por agência, como no ClickUp).
- Conteúdo real de Inbox (replies, menções, notificações).
- Integrações de Chats (WhatsApp, DMs, e-mail, Instagram).
- Integração de Nodes (calendário, reuniões, Granola).
- Dashboards reais por cliente (Anúncios, Orgânico, Financeiro, Conteúdos) — hoje só a estrutura de rota e navegação existe.
- Financeiro da agência (hoje só placeholder).
