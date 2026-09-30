"use client";

import { useState } from "react";
import { ArrowLeft, Plus, RotateCcw } from "lucide-react";
import type { SidebarTreeNode } from "@/components/ui/SidebarTree";
import { KanbanCard } from "@/components/spaces/KanbanCard";
import { KanbanCardModal } from "@/components/spaces/KanbanCardModal";
import { CreateNamedModal } from "@/components/ui/CreateNamedModal";
import { LABEL_PALETTE, TEAM_POOL, dateOffset, emptyCard, newId, richCard, type KanbanCardData } from "@/components/spaces/kanbanTypes";

type KanbanColumn = { id: string; title: string; cards: KanbanCardData[] };

const [REELS, POST, VIDEO, URGENTE] = LABEL_PALETTE;
const [ANA, BRUNO] = TEAM_POOL;

function checklist(...items: [string, boolean][]) {
  return items.map(([text, checked]) => ({ id: newId(), text, checked }));
}

function seedColumns(): KanbanColumn[] {
  return [
    {
      id: newId(),
      title: "Ideias",
      cards: [
        richCard("Trend de áudio viral — adaptar pro nicho", {
          description: "Testar o áudio que está bombando essa semana, roteiro rápido de 15s.",
          labels: [REELS],
        }),
        richCard("Enquete no story sobre dores do cliente", {
          description: "Levantar as 3 maiores dúvidas pra virar conteúdo educativo.",
          labels: [POST],
        }),
        richCard("Bastidores da equipe — dia a dia", { labels: [REELS] }),
      ],
    },
    {
      id: newId(),
      title: "Semana 1",
      cards: [
        richCard("Post — 3 erros que fazem você perder clientes", {
          description: "Post educativo, carrossel de 5 slides.",
          labels: [POST],
          dueDate: dateOffset(1),
          assignees: [BRUNO],
          checklist: checklist(["Escrever legenda", true], ["Criar arte no Canva", false], ["Aprovar com cliente", false]),
        }),
        richCard("Reels — rotina de trabalho em 30s", { labels: [REELS], dueDate: dateOffset(2), assignees: [ANA] }),
      ],
    },
    {
      id: newId(),
      title: "Semana 2",
      cards: [
        richCard("Depoimento em vídeo — cliente satisfeito", {
          description: "Editar depoimento gravado na call de sexta.",
          labels: [VIDEO],
          dueDate: dateOffset(9),
          assignees: [ANA],
          checklist: checklist(["Cortar melhores trechos", false], ["Adicionar legenda", false]),
        }),
        richCard("Post — comparativo antes/depois", { labels: [POST], dueDate: dateOffset(10) }),
        richCard("Story — enquete de satisfação", { labels: [POST] }),
      ],
    },
    {
      id: newId(),
      title: "Semana 3",
      cards: [
        richCard("Reels — tutorial rápido", { labels: [REELS, URGENTE], dueDate: dateOffset(16), assignees: [ANA] }),
        richCard("Post — bastidores de um projeto entregue", { labels: [POST], dueDate: dateOffset(17) }),
      ],
    },
    {
      id: newId(),
      title: "Semana 4",
      cards: [
        richCard("Vídeo — recap do mês", {
          description: "Compilado dos melhores momentos do mês pras redes.",
          labels: [VIDEO],
          dueDate: dateOffset(23),
          assignees: [BRUNO],
        }),
        richCard("Post — convite pra promoção do próximo mês", { labels: [POST, URGENTE], dueDate: dateOffset(24) }),
      ],
    },
    {
      id: newId(),
      title: "Postados",
      cards: [
        richCard("Post — resultados do mês passado", {
          labels: [POST],
          dueDate: dateOffset(-3),
          assignees: [ANA],
          checklist: checklist(["Escrever legenda", true], ["Criar arte", true], ["Publicar", true]),
        }),
        richCard("Reels — trend da semana passada", { labels: [REELS], dueDate: dateOffset(-5) }),
        richCard("Depoimento em vídeo publicado", { labels: [VIDEO], dueDate: dateOffset(-8) }),
      ],
    },
  ];
}

function AddCardInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function submit() {
    if (!name.trim() || saving) return;
    setSaving(true);
    onAdd(name.trim());
    setName("");
    setAdding(false);
    setSaving(false);
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-1.5 rounded-[var(--radius-card)] px-2 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted"
      >
        + Adicionar card
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setAdding(false);
        }}
        placeholder="Nome do card..."
        rows={2}
        autoFocus
        className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-foreground"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving || !name.trim()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setName("");
          }}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function KanbanBoard({ node, onClose }: { node: SidebarTreeNode; onClose: () => void }) {
  // ponytail: board nasce vazio (o cliente decide as colunas); "seedColumns" fica só como
  // template opcional atrás do botão "Usar exemplo" — não é mais o estado inicial.
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<{ columnId: string; cardId: string } | null>(null);
  const [creatingColumn, setCreatingColumn] = useState(false);

  function addCard(columnId: string, title: string) {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, cards: [...col.cards, emptyCard(title)] } : col)),
    );
  }

  function moveCard(cardId: string, toColumnId: string) {
    setColumns((prev) => {
      let moved: KanbanCardData | null = null;
      const withoutCard = prev.map((col) => {
        const found = col.cards.find((c) => c.id === cardId);
        if (found) moved = found;
        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
      });
      if (!moved) return prev;
      return withoutCard.map((col) => (col.id === toColumnId ? { ...col, cards: [...col.cards, moved!] } : col));
    });
  }

  function updateCard(columnId: string, cardId: string, updater: (prev: KanbanCardData) => KanbanCardData) {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, cards: col.cards.map((c) => (c.id === cardId ? updater(c) : c)) } : col,
      ),
    );
  }

  function renameColumn(columnId: string) {
    const current = columns.find((c) => c.id === columnId);
    const title = window.prompt("Novo nome da coluna", current?.title);
    if (!title) return;
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, title } : col)));
  }

  function resetToExample() {
    if (columns.length > 0 && !window.confirm("Isso substitui todas as colunas e cards deste board pelo template de exemplo. Continuar?")) return;
    setColumns(seedColumns());
  }

  const activeCard =
    openCard && columns.find((c) => c.id === openCard.columnId)?.cards.find((c) => c.id === openCard.cardId);
  const activeColumn = openCard && columns.find((c) => c.id === openCard.columnId);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Voltar">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-sm font-semibold text-foreground-strong">{node.label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToExample}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={13} /> Usar template de exemplo
          </button>
          <button
            onClick={() => setCreatingColumn(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus size={13} /> Nova coluna
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Board vazio — comece adicionando a primeira lista.</p>
          <button
            onClick={() => setCreatingColumn(true)}
            className="flex items-center gap-1.5 rounded-full bg-button px-4 py-2 text-sm font-medium text-button-foreground"
          >
            <Plus size={14} /> Add list
          </button>
        </div>
      ) : (
      <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumnId(column.id);
            }}
            onDragLeave={() => setDragOverColumnId((id) => (id === column.id ? null : id))}
            onDrop={(e) => {
              e.preventDefault();
              const cardId = e.dataTransfer.getData("text/plain");
              if (cardId) moveCard(cardId, column.id);
              setDraggingCardId(null);
              setDragOverColumnId(null);
            }}
            className={`flex max-h-full w-72 shrink-0 flex-col rounded-[var(--radius-card)] pb-3 transition-colors ${
              dragOverColumnId === column.id ? "bg-muted" : "bg-muted/60"
            }`}
          >
            <button
              onClick={() => renameColumn(column.id)}
              className="flex shrink-0 items-center justify-between gap-2 rounded-t-[var(--radius-card)] px-3 py-2.5 text-left hover:bg-muted"
            >
              <p className="truncate text-sm font-bold text-foreground-strong">{column.title}</p>
              <span className="text-xs font-medium text-muted-foreground">{column.cards.length}</span>
            </button>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pt-3">
              {column.cards.map((card) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  draggingCardId={draggingCardId}
                  onDragStart={(e, cardId) => {
                    e.dataTransfer.setData("text/plain", cardId);
                    setDraggingCardId(cardId);
                  }}
                  onDragEnd={() => {
                    setDraggingCardId(null);
                    setDragOverColumnId(null);
                  }}
                  onClick={() => setOpenCard({ columnId: column.id, cardId: card.id })}
                />
              ))}
            </div>
            <div className="shrink-0 px-3 pt-2">
              <AddCardInput onAdd={(title) => addCard(column.id, title)} />
            </div>
          </div>
        ))}
      </div>
      )}

      {activeCard && activeColumn && openCard && (
        <KanbanCardModal
          card={activeCard}
          columnTitle={activeColumn.title}
          onClose={() => setOpenCard(null)}
          onUpdate={(updater) => updateCard(openCard.columnId, openCard.cardId, updater)}
        />
      )}

      <CreateNamedModal
        open={creatingColumn}
        title="Nova coluna"
        description="Cada coluna representa uma etapa do board — arraste os cards entre elas."
        placeholder="e.g. Em revisão"
        onClose={() => setCreatingColumn(false)}
        onCreate={({ name }) => {
          setColumns((prev) => [...prev, { id: newId(), title: name, cards: [] }]);
          setCreatingColumn(false);
        }}
      />
    </div>
  );
}
