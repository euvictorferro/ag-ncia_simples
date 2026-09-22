export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-sm font-semibold text-foreground-strong">{title}</h1>
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Em breve.</p>
      </div>
    </div>
  );
}
