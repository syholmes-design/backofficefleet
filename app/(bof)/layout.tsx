import { AppShell } from "@/components/AppShell";
import { BofDemoDataShell } from "@/components/BofDemoDataShell";
import { BofRouteBadge } from "@/components/dev/BofRouteBadge";
import { OperatorSurfaceModeBanner } from "@/components/operations/OperatorSurfaceModeBanner";
import { getBofData } from "@/lib/load-bof-data";

export default function BofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seed = getBofData();
  return (
    <AppShell>
      <BofDemoDataShell seed={seed}>
        <OperatorSurfaceModeBanner />
        {children}
        <BofRouteBadge />
      </BofDemoDataShell>
    </AppShell>
  );
}
