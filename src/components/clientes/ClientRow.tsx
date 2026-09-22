import type { Client } from "@/lib/clients";

export function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_100px] items-center gap-3 border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate text-foreground">{client.name}</span>
      <span className="text-xs text-muted-foreground">{client.archived ? "Arquivado" : "Ativo"}</span>
    </button>
  );
}
