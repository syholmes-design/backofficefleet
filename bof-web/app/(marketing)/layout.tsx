import { MarketingShell } from "@/components/MarketingShell";
import { BofRouteBadge } from "@/components/dev/BofRouteBadge";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      {children}
      <BofRouteBadge />
    </MarketingShell>
  );
}
