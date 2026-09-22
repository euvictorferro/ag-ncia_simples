function ClockGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8v6l4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ClockGlyph />
      </div>
      <h1 className="text-sm font-semibold text-foreground-strong">{title}</h1>
      <p className="text-sm text-muted-foreground">Em breve.</p>
    </div>
  );
}
