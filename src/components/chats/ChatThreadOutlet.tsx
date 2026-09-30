"use client";

import { useChatThread } from "@/components/chats/ChatThreadContext";
import { ChatThreadView } from "@/components/chats/ChatThreadView";
import { AllChannelsPage } from "@/components/chats/AllChannelsPage";

export function ChatThreadOutlet({ children }: { children: React.ReactNode }) {
  const { openThread, allChannelsOpen, close } = useChatThread();

  if (openThread) return <ChatThreadView thread={openThread} onClose={close} />;
  if (allChannelsOpen) return <AllChannelsPage onBack={close} />;

  return <>{children}</>;
}
