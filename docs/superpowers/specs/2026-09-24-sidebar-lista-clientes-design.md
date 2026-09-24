# Sidebar de navegação entre clientes ("Clientes")

## Contexto

A página `/clientes` já existe e hoje só renderiza um `SidebarPanelHeader`
vazio (título "Clientes" + botão "+", ícones de busca/filtro/colapsar no
hover — igual o header da sidebar da Home). Um cliente individual já tem
seu próprio painel (`ClientPanel`) com abas fixas: Dashboard, Anúncios,
Orgânico, Financeiro, Tarefas, Conteúdos.

Falta o nível "entre" esses dois: uma lista, dentro da sidebar de
`/clientes`, para navegar até um cliente específico. Isso é o objeto
deste spec — **não** mexe no `ClientPanel` nem nas abas internas do
cliente.

## Objetivo

Donos de agência precisam achar rápido o cliente que querem administrar
(tasks, campanhas, mídias sociais, etc. — tudo dentro do `ClientPanel`
existente) a partir da página `/clientes`.

## Fora de escopo

- Qualquer conteúdo/dashboard dentro de um cliente já aberto (não muda).
- Agrupamento por pasta/tag, times, ou qualquer hierarquia além de
  Ativos/Arquivados (usuário pediu ordem alfabética simples).
- Drag-and-drop de reordenação (ordem é sempre alfabética).
- Avatar com emoji/imagem (fica pra depois — sem coluna `icon` no schema
  hoje, ver seção 5).

## Design

### 1. Estrutura da lista

- Lista de clientes **ativos**, ordenada alfabeticamente, renderizada
  direto abaixo do `SidebarPanelHeader` — sem cabeçalho de seção própria.
- Seção **"Arquivados/Inativos"** no fim, colapsada por padrão,
  reaproveitando o padrão visual de seção colapsável já usado na Home
  (`SectionCollapseHeader`: chevron à direita, só aparece no hover da
  seção).

### 2. Linha de cliente

Cada linha mostra:
- Avatar do cliente: círculo com a inicial do nome (sem picker de
  emoji/imagem por enquanto — a tabela `clients` não tem coluna de ícone;
  fica pra uma iteração futura se quiserem).
- Nome do cliente (truncado).
- No hover: botão `···` (reaproveita `SidebarFlyout`) com ações rápidas:
  - Arquivar (ou Desarquivar, se já estiver na seção Arquivados) — chama
    `updateClient(supabase, id, { archived: !archived })` direto, sem modal.
  - Renomear — abre o `ClientFormModal` já existente em modo edição
    (já suporta editar nome e o toggle de arquivado).
  - Excluir — confirmação simples (`window.confirm`) e chama
    `deleteClient` (nova função, ver seção 5).
- Sem botão `+` por linha (não existe "criar dentro" de um cliente aqui).
- Sem drag handle (não é reordenável).

### 3. Navegação

- Clique na linha do cliente navega para `/clientes/[id]/dashboard`.
- A partir daí, o `ClientPanel` já existente assume a sidebar (abas
  Dashboard/Anúncios/Orgânico/Financeiro/Tarefas/Conteúdos) — nenhuma
  mudança necessária nesse componente.

### 4. Criar cliente

- O botão "+" do `SidebarPanelHeader` (já existe visualmente, hoje sem
  ação) abre o `ClientFormModal` já existente (usado hoje pelo botão
  "+ Novo cliente" da `ClientsGrid`), em modo criação.
- Ao salvar, o novo cliente entra na lista de ativos na posição
  alfabética correta.

### 5. Dados

- **Não é mock**: clientes já são dados reais no Supabase, tabela
  `clients` (`src/lib/clients.ts`: `Client { id, agency_id, name,
  archived, created_at }`, funções `listClients`/`createClient`/
  `updateClient`).
- A sidebar recebe a lista inicial de clientes via prop, carregada no
  server component (`listClients(supabase, agencyId, { includeArchived:
  true })` — mesma chamada que a página `/clientes` já faz para a
  `ClientsGrid`) e mantém estado local (`useState`) sincronizado pelas
  ações de criar/arquivar/renomear/excluir, no mesmo padrão que
  `ClientsGrid` já usa (`upsert` local após `onSaved`).
- **Excluir** cliente: não existe função de delete em `src/lib/clients.ts`
  hoje — precisa adicionar `deleteClient(supabase, id)` (delete real na
  tabela `clients`).
- Ícone não existe no schema (ver seção 2) — avatar é sempre inicial do
  nome, calculada no componente, não persistida.

## Componentes tocados/reaproveitados

- `src/lib/clients.ts`: adicionar `deleteClient(supabase, id)`.
- `src/components/layout/Sidebar.tsx`: novo componente de lista de
  clientes dentro do já existente `ClientsSidebarPanel` (hoje só tem o
  header); `SidebarContext` (`type: "clients"`) passa a carregar
  `agencyId` + `initialClients` para a sidebar poder listar/criar/editar.
- `src/components/layout/AppFrame.tsx`: sem mudança de estrutura, só o
  tipo de `context` ganhando os campos novos.
- `src/app/(authed)/clientes/page.tsx`: já chama `listClients(...,
  { includeArchived: true })` — só passa a construir
  `context={{ type: "clients", agencyId, initialClients: allClients }}`
  em vez de `{ type: "clients" }`. As páginas de cliente individual
  (`clientes/[id]/*/page.tsx`) usam `context.type === "client"`, não
  `"clients"` — continuam intocadas.
- `src/components/clientes/ClientFormModal.tsx`: reaproveitado como está
  (cria em modo `client={null}`, edita/renomeia em modo `client={...}`)
  — nenhuma mudança nele.
- `src/components/ui/SidebarFlyout.tsx`: reaproveitado para o menu `···`
  de cada cliente.

## Testes/validação

- Verificação manual na UI (ponytail: sem framework de teste, feature de
  UI local): criar cliente, ver aparecer em ordem alfabética, arquivar,
  ver mover pra seção colapsada, desarquivar, renomear, excluir, navegar
  clicando no cliente e confirmar que o `ClientPanel` existente aparece
  correto.
