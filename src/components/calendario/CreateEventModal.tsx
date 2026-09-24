"use client";

import { useState } from "react";
import type { Client } from "@/lib/clients";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO datetime
  clientId?: string;
  clientName?: string;
};

export function CreateEventModal({
  clients,
  event,
  onClose,
  onSave,
}: {
  clients: Client[];
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}) {
  const initial = event ? new Date(event.date) : null;
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(initial ? toDateInput(initial) : "");
  const [time, setTime] = useState(initial ? toTimeInput(initial) : "");
  const [clientId, setClientId] = useState(event?.clientId ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError("Título, data e hora são obrigatórios.");
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    onSave({
      id: event?.id ?? crypto.randomUUID(),
      title: title.trim(),
      date: new Date(`${date}T${time}`).toISOString(),
      clientId: client?.id,
      clientName: client?.name,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6"
      >
        <h2 className="text-sm font-semibold text-foreground-strong">
          {event ? "Editar evento" : "Novo evento"}
        </h2>

        <div className="space-y-1">
          <label htmlFor="event-title" className="text-xs text-muted-foreground">
            Título
          </label>
          <input
            id="event-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="event-date" className="text-xs text-muted-foreground">
              Data
            </label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label htmlFor="event-time" className="text-xs text-muted-foreground">
              Hora
            </label>
            <input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="event-client" className="text-xs text-muted-foreground">
            Cliente (opcional)
          </label>
          <select
            id="event-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          >
            <option value="">Nenhum</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toTimeInput(d: Date): string {
  return d.toTimeString().slice(0, 5);
}
