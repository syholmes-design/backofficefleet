"use client";

import { useEffect, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";
import { LoadReviewDrawer } from "@/components/review/LoadReviewDrawer";

export function LoadDetailReviewIsland({ loadId }: { loadId: string }) {
  const { data, demoRiskOverrides, resolveLoadRiskReason, resolveDriverRiskReason } = useBofDemoData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      setOpen(window.location.hash === "#load-review");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const risk = getLoadRiskExplanation(data, loadId, demoRiskOverrides);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#load-review") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  };

  const launch = () => {
    setOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#load-review`
      );
    }
  };

  if (risk.riskStatus === "clean" && !open) return null;

  return (
    <>
      {risk.riskStatus !== "clean" ? (
        <div className="mb-3">
          <button type="button" className="bof-link-secondary bof-small" onClick={launch}>
            What needs review?
          </button>
        </div>
      ) : null}
      {open ? (
        <LoadReviewDrawer
          data={data}
          loadId={loadId}
          demoRiskOverrides={demoRiskOverrides}
          open
          onClose={close}
          resolveLoadRiskReason={resolveLoadRiskReason}
          resolveDriverRiskReason={resolveDriverRiskReason}
        />
      ) : null}
    </>
  );
}
