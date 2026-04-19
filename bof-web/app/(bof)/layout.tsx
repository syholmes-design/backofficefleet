import { AppShell } from "@/components/AppShell";
import { BofDemoDataShell } from "@/components/BofDemoDataShell";
import { getBofData } from "@/lib/load-bof-data";

export default function BofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seed = getBofData();
  return (
    <AppShell>
      <BofDemoDataShell seed={seed}>{children}</BofDemoDataShell>
    </AppShell>
  );
}
