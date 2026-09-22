export function Header({ agencyName, pageLabel }: { agencyName: string; pageLabel: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center border-b border-border bg-background-elevated px-4">
      <p className="text-sm text-muted-foreground">
        {agencyName} / <span className="font-medium text-foreground-strong">{pageLabel}</span>
      </p>
    </header>
  );
}
