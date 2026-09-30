"use client";

import { createContext, useContext, useState } from "react";
import type { SidebarTreeNode } from "@/components/ui/SidebarTree";

type SpaceBoardCtxValue = {
  openNode: SidebarTreeNode | null;
  open: (node: SidebarTreeNode) => void;
  close: () => void;
};

const SpaceBoardCtx = createContext<SpaceBoardCtxValue | null>(null);

export function SpaceBoardProvider({ children }: { children: React.ReactNode }) {
  const [openNode, setOpenNode] = useState<SidebarTreeNode | null>(null);
  return (
    <SpaceBoardCtx.Provider value={{ openNode, open: setOpenNode, close: () => setOpenNode(null) }}>
      {children}
    </SpaceBoardCtx.Provider>
  );
}

export function useSpaceBoard() {
  const ctx = useContext(SpaceBoardCtx);
  if (!ctx) throw new Error("useSpaceBoard precisa estar dentro de SpaceBoardProvider");
  return ctx;
}
