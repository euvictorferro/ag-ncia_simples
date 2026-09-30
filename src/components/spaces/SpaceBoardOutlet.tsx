"use client";

import { useSpaceBoard } from "@/components/spaces/SpaceBoardContext";
import { KanbanBoard } from "@/components/spaces/KanbanBoard";
import { ListBoard } from "@/components/spaces/ListBoard";

export function SpaceBoardOutlet({ children }: { children: React.ReactNode }) {
  const { openNode, close } = useSpaceBoard();

  if (!openNode) return <>{children}</>;

  if (openNode.view === "kanban") {
    return <KanbanBoard node={openNode} onClose={close} />;
  }

  return <ListBoard node={openNode} onClose={close} />;
}
