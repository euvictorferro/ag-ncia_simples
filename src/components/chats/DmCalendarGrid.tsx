"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DM_EVENTS, type DmEvent } from "@/lib/mockChats";

const HOUR_START = 6;
const HOUR_END = 22;
const ROW_H = 48;
const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + 1); // segunda-feira
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function hoursFraction(iso: string) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

export function DmCalendarGrid({ threadId }: { threadId: string }) {
  const [mode, setMode] = useState<"week" | "day">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const events = DM_EVENTS[threadId] ?? [];

  const days = mode === "week" ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)) : [anchor];

  const navigate = (dir: 1 | -1) => setAnchor((prev) => addDays(prev, dir * (mode === "week" ? 7 : 1)));

  const monthLabel = days[0].toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} aria-label="Semana anterior" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={15} />
          </button>
          <button type="button" onClick={() => navigate(1)} aria-label="Próxima semana" className="text-muted-foreground hover:text-foreground">
            <ChevronRight size={15} />
          </button>
          <p className="text-sm font-semibold text-foreground-strong">{monthLabel}</p>
        </div>
        <div className="relative">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "week" | "day")}
            className="appearance-none rounded-md border border-border bg-background-elevated py-1 pl-3 pr-7 text-xs text-foreground outline-none"
          >
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="grid border-b border-border text-center" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className="border-l border-border py-1.5">
            <p className="text-[11px] text-muted-foreground">{WEEKDAY_LABEL[d.getDay()]}</p>
            <p
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isSameDay(d, today) ? "bg-red-500 font-semibold text-white" : "text-foreground"
              }`}
            >
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: ROW_H }} className="-translate-y-2 pr-1.5 text-right text-[11px] text-muted-foreground">
                {h % 12 === 0 ? 12 : h % 12} {h < 12 ? "am" : "pm"}
              </div>
            ))}
          </div>
          {days.map((d) => {
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.start), d));
            return (
              <div key={d.toISOString()} className="relative border-l border-border">
                {hours.map((h) => (
                  <div key={h} style={{ height: ROW_H }} className="border-b border-border/60" />
                ))}
                {dayEvents.map((ev) => (
                  <DmEventBlock key={ev.id} event={ev} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DmEventBlock({ event }: { event: DmEvent }) {
  const top = (hoursFraction(event.start) - HOUR_START) * ROW_H;
  const height = Math.max((hoursFraction(event.end) - hoursFraction(event.start)) * ROW_H, 20);
  return (
    <div
      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[11px] leading-tight"
      style={{ top, height, backgroundColor: `${event.color ?? "#818cf8"}26`, borderColor: event.color ?? "#818cf8", color: event.color ?? "#818cf8" }}
    >
      <p className="truncate font-medium">{event.title}</p>
      <p className="truncate opacity-80">
        {new Date(event.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
        {new Date(event.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}
