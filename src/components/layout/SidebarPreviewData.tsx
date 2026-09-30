"use client";

import { createContext, useContext } from "react";
import type { AgencyMember } from "@/lib/tasks";
import type { Client } from "@/lib/clients";

/**
 * Dados que várias sidebars (Clientes, Calendário, Atas…) precisam pra montar seu painel real —
 * carregados uma vez no layout autenticado pra podermos mostrar o preview completo (igual ao clique)
 * ao passar o mouse no rail, mesmo estando em outra página.
 */
export type SidebarPreviewData = {
  agencyId: string;
  members: AgencyMember[];
  clients: Client[];
};

const SidebarPreviewDataContext = createContext<SidebarPreviewData | null>(null);

export function SidebarPreviewDataProvider({
  value,
  children,
}: {
  value: SidebarPreviewData;
  children: React.ReactNode;
}) {
  return <SidebarPreviewDataContext.Provider value={value}>{children}</SidebarPreviewDataContext.Provider>;
}

export function useSidebarPreviewData(): SidebarPreviewData | null {
  return useContext(SidebarPreviewDataContext);
}
