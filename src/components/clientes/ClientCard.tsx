import Link from "next/link";
import type { Client } from "@/lib/clients";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M9.5 1.5 12.5 4.5 4.5 12.5H1.5V9.5L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClientCard({ client, onEdit }: { client: Client; onEdit: () => void }) {
  return (
    <div className="group relative rounded-[var(--radius-card)] border border-border bg-muted/40 p-4 transition-colors hover:bg-muted">
      <Link href={`/clientes/${client.id}/tarefas`} className="block">
        <p className="truncate pr-6 text-sm font-medium text-foreground-strong">{client.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{client.archived ? "Arquivado" : "Ativo"}</p>
      </Link>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${client.name}`}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground-strong group-hover:opacity-100"
      >
        <EditIcon />
      </button>
    </div>
  );
}
