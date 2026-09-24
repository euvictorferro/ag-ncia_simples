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
- Backend/persistência — segue o padrão do resto do projeto até aqui
  (estado mockado local, sem Supabase ainda).

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
- Avatar do cliente: emoji ou imagem (reaproveita `IconPicker`, o mesmo
  seletor usado no `CreateSpaceModal`), com fallback de inicial do nome
  se não houver ícone definido.
- Nome do cliente (truncado).
- No hover: botão `···` (reaproveita `SidebarFlyout`) com ações rápidas:
  - Arquivar (ou Desarquivar, se já estiver na seção Arquivados)
  - Renomear
  - Excluir
- Sem botão `+` por linha (não existe "criar dentro" de um cliente aqui).
- Sem drag handle (não é reordenável).

### 3. Navegação

- Clique na linha do cliente navega para `/clientes/[id]/dashboard`.
- A partir daí, o `ClientPanel` já existente assume a sidebar (abas
  Dashboard/Anúncios/Orgânico/Financeiro/Tarefas/Conteúdos) — nenhuma
  mudança necessária nesse componente.

### 4. Criar cliente

- O botão "+" do `SidebarPanelHeader` (já existe visualmente, hoje sem
  ação) abre um modal de criação de cliente, no mesmo padrão do
  `CreateSpaceModal`: campo de nome + `IconPicker` (emoji ou upload de
  imagem via FileReader/data URL, sem Storage).
- Ao confirmar, o novo cliente entra na lista de ativos na posição
  alfabética correta.

### 5. Dados

- Lista de clientes mockada localmente (mesmo padrão do `SPACES_TREE` em
  `Sidebar.tsx`): array de objetos `{ id, name, icon?, archived }` em
  estado React (`useState`), sem persistência entre reloads.
- Ações do menu `···` (arquivar/renomear/excluir) e o modal de criação
  mutam esse estado local, igual ao que já foi feito para Spaces.

## Componentes tocados/reaproveitados

- `src/components/layout/Sidebar.tsx`: novo componente de lista de
  clientes dentro do já existente `ClientsSidebarPanel` (hoje só tem o
  header).
- `src/components/ui/CreateSpaceModal.tsx` / `IconPicker.tsx`: reaproveitar
  padrão para um modal de criar cliente (pode virar um componente novo
  `CreateClientModal` seguindo a mesma estrutura, ou generalizar o
  existente — decisão de implementação, não de design).
- `src/components/ui/SidebarFlyout.tsx`: reaproveitado para o menu `···`
  de cada cliente.

## Testes/validação

- Verificação manual na UI (ponytail: sem framework de teste, feature de
  UI local): criar cliente, ver aparecer em ordem alfabética, arquivar,
  ver mover pra seção colapsada, desarquivar, renomear, excluir, navegar
  clicando no cliente e confirmar que o `ClientPanel` existente aparece
  correto.
