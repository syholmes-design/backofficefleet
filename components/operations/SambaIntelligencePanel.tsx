"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

type Finding = {
  id: string;
  findingType: string;
  severity: string;
  status: string;
  provenance: string;
  evidenceFreshness: string | null;
  evidenceSource: string;
  fact: string;
  inference: string | null;
  recommendation: string;
  explanation: string;
  workflowHref: string | null;
  demoReferenceUsed: boolean;
  liveConnected: boolean;
  llmUsed: boolean;
};

export function SambaIntelligencePanel({ entityId }: { entityId?: string }) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [llm, setLlm] = useState<string>("AI-INTEGRATION-DEPENDENT");

  const load = useCallback(async () => {
    try {
      const next = await requestJson<{ findings: Finding[]; llm?: { capability?: string } }>("/api/samba/findings");
      const rows = entityId ? next.findings.filter((row) => row.explanation.includes(entityId) || row.fact.includes(entityId)) : next.findings;
      setFindings(rows.filter((row) => row.status === "OPEN" || row.status === "ACKNOWLEDGED"));
      setLlm(next.llm?.capability ?? "AI-INTEGRATION-DEPENDENT");
      setError(null);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }, [entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function evaluate() {
    setBusy(true);
    try {
      await requestJson("/api/samba/findings", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      await load();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function transition(id: string, status: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED") {
    setBusy(true);
    try {
      await requestJson(`/api/samba/findings/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Samba intelligence</p>
          <h2 className="mt-1 text-lg font-bold text-white">Evidence-grounded findings</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Samba explains existing BOF records and verified external evidence. It does not release loads, stop pickups,
            or change carrier/driver status. LLM rendering is {llm} and is not operational authority.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void evaluate()}
          className="rounded border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-100"
        >
          Evaluate
        </button>
      </div>
      {findings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No open Samba findings for this tenant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {findings.slice(0, 8).map((finding) => (
            <li key={finding.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {finding.findingType} · {finding.severity} · {finding.status} · provenance {finding.provenance}
                {finding.evidenceFreshness ? ` · ${finding.evidenceFreshness}` : ""}
                {finding.liveConnected ? " · live evidence" : ""}
                {finding.demoReferenceUsed ? " · DEMO_REFERENCE carrier snapshot (not LIVE authority)" : ""}
                {finding.llmUsed ? " · LLM used" : " · deterministic"}
              </p>
              <p className="mt-2 text-white">{finding.fact}</p>
              {finding.inference ? <p className="mt-1 text-slate-300">Inference: {finding.inference}</p> : null}
              <p className="mt-1 text-slate-400">Recommendation: {finding.recommendation}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{finding.explanation}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {finding.workflowHref ? (
                  <Link className="text-xs text-teal-200 underline" href={finding.workflowHref}>
                    Open existing workflow
                  </Link>
                ) : null}
                <button type="button" className="text-xs text-slate-300 underline" onClick={() => void transition(finding.id, "ACKNOWLEDGED")}>
                  Acknowledge
                </button>
                <button type="button" className="text-xs text-slate-300 underline" onClick={() => void transition(finding.id, "RESOLVED")}>
                  Resolve
                </button>
                <button type="button" className="text-xs text-slate-300 underline" onClick={() => void transition(finding.id, "DISMISSED")}>
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
