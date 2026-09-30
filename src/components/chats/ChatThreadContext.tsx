"use client";

import { createContext, useContext, useState } from "react";

export type ChatThreadRef = { type: "channel" | "dm" | "ai"; id: string; name: string };

function threadKey(t: ChatThreadRef) {
  return `${t.type}:${t.id}`;
}

type ChatThreadCtxValue = {
  openThread: ChatThreadRef | null;
  allChannelsOpen: boolean;
  favorites: ChatThreadRef[];
  open: (thread: ChatThreadRef) => void;
  openAllChannels: () => void;
  close: () => void;
  isFavorite: (thread: ChatThreadRef) => boolean;
  toggleFavorite: (thread: ChatThreadRef) => void;
};

const ChatThreadCtx = createContext<ChatThreadCtxValue | null>(null);

export function ChatThreadProvider({ children }: { children: React.ReactNode }) {
  const [openThread, setOpenThread] = useState<ChatThreadRef | null>(null);
  const [allChannelsOpen, setAllChannelsOpen] = useState(false);
  const [favorites, setFavorites] = useState<ChatThreadRef[]>([]);

  return (
    <ChatThreadCtx.Provider
      value={{
        openThread,
        allChannelsOpen,
        favorites,
        open: (thread) => {
          setOpenThread(thread);
          setAllChannelsOpen(false);
        },
        openAllChannels: () => {
          setAllChannelsOpen(true);
          setOpenThread(null);
        },
        close: () => {
          setOpenThread(null);
          setAllChannelsOpen(false);
        },
        isFavorite: (thread) => favorites.some((f) => threadKey(f) === threadKey(thread)),
        toggleFavorite: (thread) => {
          setFavorites((prev) =>
            prev.some((f) => threadKey(f) === threadKey(thread))
              ? prev.filter((f) => threadKey(f) !== threadKey(thread))
              : [...prev, thread],
          );
        },
      }}
    >
      {children}
    </ChatThreadCtx.Provider>
  );
}

export function useChatThread() {
  const ctx = useContext(ChatThreadCtx);
  if (!ctx) throw new Error("useChatThread precisa estar dentro de ChatThreadProvider");
  return ctx;
}
