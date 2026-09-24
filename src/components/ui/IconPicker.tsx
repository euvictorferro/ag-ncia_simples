"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

export type NodeIcon = { type: "emoji"; value: string } | { type: "image"; value: string };

const EMOJI_OPTIONS = [
  "📁",
  "📊",
  "📈",
  "📣",
  "🎯",
  "💰",
  "🧾",
  "🛠️",
  "🚀",
  "💡",
  "📅",
  "✅",
  "📌",
  "🗂️",
  "🎨",
  "📷",
  "🧠",
  "⚙️",
  "🔗",
  "👥",
];

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
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-xl hover:bg-border"
      >
        {icon?.type === "image" ? (
          <img src={icon.value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{icon?.value ?? "📁"}</span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-background-elevated p-3 shadow-xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Escolha um emoji</p>
            <div className="mb-3 grid grid-cols-6 gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange({ type: "emoji", value: emoji });
                    setOpen(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
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
