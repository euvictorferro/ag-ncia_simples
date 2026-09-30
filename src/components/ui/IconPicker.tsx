"use client";

import { useRef, useState } from "react";
import {
  ImagePlus,
  Folder,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Megaphone,
  Target,
  DollarSign,
  Receipt,
  Wrench,
  Rocket,
  Lightbulb,
  CalendarDays,
  CheckCircle2,
  Pin,
  Palette,
  Camera,
  Brain,
  Settings2,
  Link2,
  Users2,
  ListChecks,
  Kanban,
  type LucideIcon,
} from "lucide-react";

export type NodeIcon = { type: "icon"; value: string } | { type: "image"; value: string };

export const ICON_LIBRARY: Record<string, LucideIcon> = {
  folder: Folder,
  "folder-open": FolderOpen,
  "bar-chart": BarChart3,
  "trending-up": TrendingUp,
  megaphone: Megaphone,
  target: Target,
  "dollar-sign": DollarSign,
  receipt: Receipt,
  wrench: Wrench,
  rocket: Rocket,
  lightbulb: Lightbulb,
  calendar: CalendarDays,
  "check-circle": CheckCircle2,
  pin: Pin,
  palette: Palette,
  camera: Camera,
  brain: Brain,
  settings: Settings2,
  link: Link2,
  users: Users2,
  "list-checks": ListChecks,
  kanban: Kanban,
};

const ICON_GRID = Object.keys(ICON_LIBRARY);

export function NodeIconGlyph({ icon, size = 16, className }: { icon: NodeIcon; size?: number; className?: string }) {
  if (icon.type === "image") {
    return <img src={icon.value} alt="" className={`shrink-0 rounded object-cover ${className ?? ""}`} style={{ height: size, width: size }} />;
  }
  const Icon = ICON_LIBRARY[icon.value] ?? Folder;
  return <Icon size={size} className={`shrink-0 ${className ?? ""}`} />;
}

export function IconPickerButton({ icon, onChange }: { icon: NodeIcon | null; onChange: (icon: NodeIcon) => void }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ type: "image", value: reader.result });
        setOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground hover:bg-border"
      >
        <NodeIconGlyph icon={icon ?? { type: "icon", value: "folder" }} size={20} />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-background-elevated p-3 shadow-xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Escolha um ícone</p>
            <div className="mb-3 grid grid-cols-6 gap-1">
              {ICON_GRID.map((key) => {
                const Icon = ICON_LIBRARY[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange({ type: "icon", value: key });
                      setOpen(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ImagePlus size={14} /> Enviar imagem
              </button>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">Recomendado 500x500px</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
