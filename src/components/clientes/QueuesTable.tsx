"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { buildMockQueues, type Queue } from "@/lib/mockClientSocial";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CreateQueueModal({ onClose, onCreate }: { onClose: () => void; onCreate: (queue: Queue) => void }) {
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState("09:00");
  const [slots, setSlots] = useState<{ day: string; time: string }[]>([]);

  function toggleDay(day: string) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function addSlots() {
    const next = selectedDays.map((day) => ({ day, time }));
    setSlots((prev) => [...prev, ...next]);
    setSelectedDays([]);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md space-y-4 rounded-[var(--radius-card)] border border-border bg-background-elevated p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground-strong">Create Queue</h2>
            <p className="text-xs text-muted-foreground">Profile: Default</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Queue Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Posts, Evergreen Content"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
          />
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-xs font-medium text-foreground-strong">Add Slots</p>
          <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  selectedDays.includes(day)
                    ? "border-foreground-strong bg-muted text-foreground-strong"
                    : "border-border text-muted-foreground"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-strong"
            />
            <button
              type="button"
              onClick={addSlots}
              disabled={selectedDays.length === 0}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50"
            >
              Add Slots
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-foreground-strong">Slots ({slots.length})</p>
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">No slots yet. Add slots above to get started.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {slots.map((slot, i) => (
                <span key={i} className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                  {slot.day} {slot.time}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || slots.length === 0}
            onClick={() => {
              onCreate({ id: `queue-${Date.now()}`, profile: "Default", name, status: "active", slots });
              onClose();
            }}
            className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground disabled:opacity-50"
          >
            Create Queue
          </button>
        </div>
      </div>
    </div>
  );
}

export function QueuesTable({ clientId }: { clientId: string }) {
  const [queues, setQueues] = useState<Queue[]>(() => buildMockQueues(clientId));
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground-strong">Queues</h1>
          <p className="text-sm text-muted-foreground">Manage your posting schedules</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-md bg-button px-3 py-2 text-sm font-medium text-button-foreground"
        >
          + Create queue
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="py-2 pl-3 pr-3">Profile</th>
              <th className="px-3">Queue</th>
              <th className="px-3">Slots</th>
              <th className="px-3">Next Slot</th>
              <th className="px-3">Status</th>
              <th className="pr-3" />
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60 last:border-0">
              <td className="flex items-center gap-2 py-3 pl-3 pr-3 text-foreground">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Default
              </td>
              <td className="px-3 text-muted-foreground">
                {queues.length === 0 ? "No queues configured" : queues.map((q) => q.name).join(", ")}
              </td>
              <td className="px-3 text-muted-foreground">{queues.reduce((s, q) => s + q.slots.length, 0)}</td>
              <td className="px-3 text-muted-foreground">
                {queues[0]?.slots[0] ? `${queues[0].slots[0].day} ${queues[0].slots[0].time}` : "—"}
              </td>
              <td className="px-3 text-muted-foreground">{queues.length > 0 ? "Active" : "—"}</td>
              <td className="pr-3 text-right">
                <button type="button" onClick={() => setShowModal(true)} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground">
                  Configure
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        No posts in queue. When creating a post, select &quot;Add to Queue&quot; to schedule it automatically.
      </p>

      {showModal && (
        <CreateQueueModal onClose={() => setShowModal(false)} onCreate={(q) => setQueues((prev) => [...prev, q])} />
      )}
    </div>
  );
}
