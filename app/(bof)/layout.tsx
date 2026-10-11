import { AppShell } from "@/components/AppShell";
import { BofDemoDataShell } from "@/components/BofDemoDataShell";
import { EpodAvailabilityProvider } from "@/components/dispatch/EpodAvailability";
import { BofRouteBadge } from "@/components/dev/BofRouteBadge";
import { OperatorSurfaceModeBanner } from "@/components/operations/OperatorSurfaceModeBanner";
import { getBofData } from "@/lib/load-bof-data";
import { isEpodEnabled } from "@/lib/services/epod/deliveryLifecycle";

export default function BofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seed = getBofData();
  return (
    <AppShell>
      <BofDemoDataShell seed={seed}>
        <EpodAvailabilityProvider enabled={isEpodEnabled()}>
          <OperatorSurfaceModeBanner />
          {children}
          <BofRouteBadge />
        </EpodAvailabilityProvider>
      </BofDemoDataShell>
    </AppShell>
  );
}
