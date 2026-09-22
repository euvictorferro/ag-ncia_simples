import { Sidebar, type ActiveKey } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppFrame({
  active,
  pageLabel,
  agencyName,
  children,
}: {
  active: ActiveKey;
  pageLabel: string;
  agencyName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header agencyName={agencyName} pageLabel={pageLabel} />
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
