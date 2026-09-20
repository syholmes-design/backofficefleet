"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

type Comparison = { field: string; bofValue: string | null; fmcsaValue: string | null; result: string };

type Overlay = {
  bof: { id: string; legalName: string; dba: string; dotNumber: string; mcNumber: string; authorityStatus: string; authorityClass?: string } | null;
  freshnessState: string;
  note: string;
  comparisonAuthority?: string;
  verification: {
    result: string;
    provenance: string;
    freshnessState: string;
    verifiedAt: string;
    retrievedAt: string | null;
    liveConnected: boolean;
    queriedKind: string;
    queriedValue: string;
    fmcsa: {
      usdot: string | null;
      docketNumber: string | null;
      legalName: string | null;
      dbaName: string | null;
      allowToOperate: string | null;
      outOfService: string | null;
    };
    fieldComparisons: Comparison[];
    errorMessage: string | null;
    comparisonAuthority?: string;
    note: string;
  } | null;
};

export function FmcsaVerificationPanel({ carrierId, compact = false }: { carrierId: string; compact?: boolean }) {
  const [data, setData] = useState<Overlay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await requestJson<Overlay>(`/api/carriers/fmcsa-verification?carrierId=${encodeURIComponent(carrierId)}`);
      setData(next);
      setError(null);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }, [carrierId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function verify(kind: "USDOT" | "DOCKET") {
    setBusy(true);
    try {
      const issued = await requestJson<{
        verification: Overlay["verification"];
        bof: Overlay["bof"];
      }>("/api/carriers/fmcsa-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrierId, kind, refresh: true }),
      });
      setData({
        bof: issued.bof,
        freshnessState: issued.verification?.freshnessState ?? "NEVER_VERIFIED",
        note: issued.verification?.note ?? "",
        verification: issued.verification,
      });
      setError(null);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  const verification = data?.verification;
  const provenance = verification?.provenance ?? "UNAVAILABLE";

  if (compact) {
    return (
      <p className="mt-2 text-xs text-slate-600">
        FMCSA: {verification?.result ?? data?.freshnessState ?? "NEVER_VERIFIED"}
        {verification ? ` · ${provenance}` : ""}
        {" · DEMO_REFERENCE overlay"}
      </p>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Regulatory evidence</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">FMCSA verification</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This carrier packet is DEMO_REFERENCE, not a LIVE carrier master. FMCSA QCMobile evidence is an overlay and
            never overwrites the packet. Result VERIFIED means fields matched the DEMO_REFERENCE snapshot, not that BOF
            independently verified operating authority. A mismatch is evidence for evaluation, not an automatic dispatch
            or Secure Pickup stop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void verify("USDOT")}
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800"
          >
            Verify USDOT
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void verify("DOCKET")}
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800"
          >
            Verify MC/MX
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">What DEMO_REFERENCE Carrier Registry says</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{data?.bof?.legalName ?? "—"}</p>
          <p className="text-xs text-slate-600">DBA {data?.bof?.dba ?? "—"}</p>
          <p className="mt-2 font-mono text-xs">{data?.bof?.dotNumber} / {data?.bof?.mcNumber}</p>
          <p className="mt-1 text-xs">Authority: {data?.bof?.authorityStatus ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">What FMCSA currently reports</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{verification?.fmcsa.legalName ?? "—"}</p>
          <p className="text-xs text-slate-600">DBA {verification?.fmcsa.dbaName ?? "—"}</p>
          <p className="mt-2 font-mono text-xs">
            DOT {verification?.fmcsa.usdot ?? "—"} / MC {verification?.fmcsa.docketNumber ?? "—"}
          </p>
          <p className="mt-1 text-xs">Allow to operate: {verification?.fmcsa.allowToOperate ?? "UNAVAILABLE"}</p>
          <p className="mt-2 text-xs font-semibold">
            Result {verification?.result ?? data?.freshnessState ?? "NEVER_VERIFIED"} · Provenance {provenance}
            {verification?.liveConnected ? " · FMCSA lookup LIVE" : " · FMCSA lookup not live"} · comparison DEMO_REFERENCE
          </p>
        </div>
      </div>

      {Array.isArray(verification?.fieldComparisons) ? (
        <ul className="mt-4 space-y-1 text-xs text-slate-700">
          {verification.fieldComparisons.map((row) => (
            <li key={row.field}>
              {row.field}: {row.result} · BOF {row.bofValue || "—"} · FMCSA {row.fmcsaValue || "—"}
            </li>
          ))}
        </ul>
      ) : null}

      {verification?.errorMessage ? <p className="mt-3 text-sm text-rose-700">{verification.errorMessage}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <p className="mt-3 text-xs text-slate-500">{data?.note || verification?.note}</p>
    </section>
  );
}
