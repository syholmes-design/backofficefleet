"use client";

import { useMemo } from "react";
import { Radio, MapPin, Shield, Link2 } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getCanonicalLoadEvidenceByType } from "@/lib/canonical-load-evidence";
import { getLoadProofItems } from "@/lib/load-proof";

type Props = {
  loadId: string;
};

function lineOk(status: string): boolean {
  return status === "Complete" || status === "Not required";
}

export function RfidPodStatusCard({ loadId }: Props) {
  const { data } = useBofDemoData();
  const canonicalLoad = useMemo(
    () => data.loads.find((l) => l.id === loadId) ?? null,
    [data.loads, loadId]
  );
  const rfidEvidence = useMemo(
    () => getCanonicalLoadEvidenceByType(data, loadId, "rfid_geo_proof"),
    [data, loadId]
  );
  const proofItems = useMemo(() => getLoadProofItems(data, loadId), [data, loadId]);
  const rfidLine = useMemo(
    () => proofItems.find((i) => i.type === "RFID / Dock Validation Record"),
    [proofItems]
  );
  const podLine = useMemo(() => proofItems.find((i) => i.type === "POD"), [proofItems]);

  const rfidFileOk =
    rfidEvidence?.status === "available" && Boolean(rfidEvidence.url?.trim());
  const dockScan =
    rfidFileOk || (rfidLine && lineOk(rfidLine.status));
  const podVerified =
    String(canonicalLoad?.podStatus ?? "").toLowerCase() === "verified";
  const gpsWindowOk = podVerified && dockScan;
  const sealOk = String(canonicalLoad?.sealStatus ?? "").toUpperCase() === "OK";
  const chainOk = sealOk && podVerified;

  const rows = [
    {
      label: "RFID verified",
      ok: rfidFileOk,
      detail: rfidFileOk
        ? "RFID / geo proof artifact on file."
        : "RFID proof file not available or pending.",
    },
    {
      label: "Dock scan confirmed",
      ok: Boolean(dockScan),
      detail: dockScan
        ? "Dock validation record complete or not required."
        : "Confirm RFID handoff with yard / dock record.",
    },
    {
      label: "GPS matched delivery window",
      ok: gpsWindowOk,
      detail: gpsWindowOk
        ? "POD verified with RFID context."
        : "Align POD timing with dock scan where equipped.",
    },
    {
      label: "Chain of custody confirmed",
      ok: chainOk,
      detail: chainOk
        ? "Seals and POD align for custody narrative."
        : "Resolve seal or POD gaps before claiming clean custody.",
    },
    {
      label: "Seal match / exception status",
      ok: sealOk,
      detail: sealOk
        ? "Seal references align with load record."
        : "Seal mismatch or missing reference — review BOL and photos.",
    },
  ];

  return (
    <section
      className="rounded-lg border border-teal-900/40 bg-teal-950/15 p-4"
      aria-label="RFID and POD verification"
    >
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">
        <Radio className="h-3.5 w-3.5" aria-hidden />
        RFID-enhanced POD status
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex gap-3 rounded border border-slate-800/80 bg-slate-950/40 px-2 py-2 text-xs"
          >
            <span
              className={[
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                row.ok ? "bg-emerald-400" : "bg-amber-500",
              ].join(" ")}
              aria-hidden
            />
            <div>
              <p className="font-semibold text-slate-100">{row.label}</p>
              <p className="mt-0.5 text-slate-400">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-teal-500" aria-hidden />
          POD line: {podLine?.status ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3 w-3 text-teal-500" aria-hidden />
          RFID record: {rfidLine?.status ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Link2 className="h-3 w-3 text-teal-500" aria-hidden />
          Canonical POD: {canonicalLoad?.podStatus ?? "—"}
        </span>
      </div>
    </section>
  );
}
