"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

export type FlyoutPosition = { top: number; left: number };

export function useFlyout() {
  const [position, setPosition] = useState<FlyoutPosition | null>(null);

  const openAt = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // ancora na borda direita da sidebar inteira (não do botão), verticalmente alinhado com a linha clicada
    const edge = e.currentTarget.closest<HTMLElement>("[data-sidebar-edge]");
    const edgeRight = edge?.getBoundingClientRect().right ?? rect.right;
    setPosition({ top: rect.top, left: edgeRight + 8 });
  };
  const close = () => setPosition(null);
  const toggleAt = (e: MouseEvent<HTMLElement>) => (position ? close() : openAt(e));

  return { position, openAt, toggleAt, close };
}

export function FlyoutPanel({
  position,
  onClose,
  width = 300,
  children,
}: {
  position: FlyoutPosition;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  // clamp so the panel never renders past the bottom of the viewport
  const maxTop = typeof window !== "undefined" ? Math.max(8, window.innerHeight - 8) : position.top;
  const top = Math.min(position.top, maxTop - 40);

  return (
    <>
      <button type="button" aria-label="Fechar" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <div
        className="fixed z-50 max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-background-elevated p-1.5 shadow-2xl"
        style={{ top, left: position.left, width }}
      >
        {children}
      </div>
    </>
  );
}
