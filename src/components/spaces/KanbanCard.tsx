"use client";

import { useState } from "react";
import { CheckSquare, Clock, FileText, Paperclip } from "lucide-react";
import { getDueDateDisplay, type KanbanCardData } from "@/components/spaces/kanbanTypes";

export function KanbanCard({
  card,
  draggingCardId,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  card: KanbanCardData;
  draggingCardId: string | null;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const due = card.dueDate ? getDueDateDisplay(card.dueDate) : null;
  const checklistDone = card.checklist.filter((i) => i.checked).length;
  const hasMeta =
    due || card.description !== "" || card.attachments.length > 0 || card.checklist.length > 0 || card.assignees.length > 0;
  const showCover = card.coverImageUrl !== null && !coverFailed;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`block w-full cursor-pointer overflow-hidden rounded-[var(--radius-card)] bg-background-elevated text-left shadow-sm transition-opacity hover:bg-background-elevated/80 ${
        draggingCardId === card.id ? "opacity-40" : "opacity-100"
      }`}
    >
      {showCover && (
        // eslint-disable-next-line @next/next/no-img-element -- capa é uma URL externa
        <img
          src={card.coverImageUrl!}
          alt=""
          className="aspect-[3/4] w-full object-cover"
          onError={() => setCoverFailed(true)}
        />
      )}
      <div className="p-2.5">
        {card.labels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {card.labels.map((l) => (
              <span key={l.id} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: l.color }}>
                {l.name}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm font-medium text-foreground">{card.title}</p>
        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {due && (
              <span className={`flex items-center gap-1 ${due.className}`}>
                <Clock size={12} />
                {due.text}
              </span>
            )}
            {card.description !== "" && <FileText size={12} />}
            {card.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip size={12} />
                {card.attachments.length}
              </span>
            )}
            {card.checklist.length > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare size={12} />
                {checklistDone}/{card.checklist.length}
              </span>
            )}
            {card.assignees.length > 0 && (
              <span className="ml-auto flex items-center -space-x-2">
                {card.assignees.map((a) => (
                  <span
                    key={a.id}
                    title={a.name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background-elevated text-[10px] font-semibold text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.initials}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
