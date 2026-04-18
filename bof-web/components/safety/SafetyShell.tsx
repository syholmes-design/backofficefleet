"use client";

import { useMemo } from "react";
import { SafetyNav } from "./SafetyNav";
import { SafetyDashboardScreen } from "./SafetyDashboardScreen";
import { DriverSafetyProfileScreen } from "./DriverSafetyProfileScreen";
import { ExpirationsScreen } from "./ExpirationsScreen";
import { RiskClaimsScreen } from "./RiskClaimsScreen";
import { SafetyEventDetailDrawer } from "./SafetyEventDetailDrawer";
import { useSafetyStore } from "@/lib/stores/safety-store";

export function SafetyShell() {
  const nav = useSafetyStore((s) => s.nav);
  const setNav = useSafetyStore((s) => s.setNav);
  const events = useSafetyStore((s) => s.events);
  const eventDrawerEventId = useSafetyStore((s) => s.eventDrawerEventId);
  const closeEventDrawer = useSafetyStore((s) => s.closeEventDrawer);

  const drawerEvent = useMemo(
    () => events.find((e) => e.event_id === eventDrawerEventId) ?? null,
    [events, eventDrawerEventId]
  );

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-1 text-slate-200">
      <SafetyNav active={nav} onChange={setNav} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-950/40">
        {nav === "dashboard" && <SafetyDashboardScreen />}
        {nav === "driver_profile" && <DriverSafetyProfileScreen />}
        {nav === "expirations" && <ExpirationsScreen />}
        {nav === "risk_claims" && <RiskClaimsScreen />}
      </div>
      <SafetyEventDetailDrawer
        event={drawerEvent}
        open={Boolean(eventDrawerEventId)}
        onClose={closeEventDrawer}
      />
    </div>
  );
}
