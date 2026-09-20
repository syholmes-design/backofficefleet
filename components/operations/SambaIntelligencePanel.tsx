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
  patternType?: string | null;
  whatHappened?: string | null;
  whyItMatters?: string | null;
  whatIsNotVerified?: string | null;
  recommendedAction?: string | null;
  temporalContext?: string | null;
};

type ContextPayload = {
  summary: string;
  provenance: string;
  missingEvidence: string[];
  narrative: {
    whatHappened: string;
    whyItMatters: string;
    whatSupportsThis: string[];
    whatIsNotVerified: string;
    whatToReviewNext: string;
    workflowHref: string | null;
    workflowLabel: string | null;
  };
  recommendedReview: { text: string; workflowHref: string; workflowLabel: string; executesAction: false } | null;
  repeatedPatterns: Array<{ patternType: string; inference: string; evidenceCount: number }>;
  relatedEntities: Array<{ entityType: string; relationship: string; provenance: string; temporalLabel: string }>;
  recentEvents: Array<{ eventType: string; resultingState: string | null; temporalLabel: string }>;
  llm?: { capability?: string };
};

export function SambaIntelligencePanel({ entityId, loadId, carrierRegistryId }: { entityId?: string; loadId?: string; carrierRegistryId?: string }) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [context, setContext] = useState<ContextPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [llm, setLlm] = useState<string>("AI-INTEGRATION-DEPENDENT");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (loadId) params.set("loadId", loadId);
      if (entityId && !loadId) params.set("authorizationId", entityId);
      if (carrierRegistryId) params.set("carrierRegistryId", carrierRegistryId);
      const query = params.toString();
      const [next, ctx] = await Promise.all([
        requestJson<{ findings: Finding[]; llm?: { capability?: string } }>(
          `/api/samba/findings${entityId ? `?relatedEntityId=${encodeURIComponent(entityId)}` : ""}`,
        ),
        requestJson<ContextPayload>(`/api/samba/context${query ? `?${query}` : ""}`),
      ]);
      const rows = entityId
        ? next.findings.filter(
            (row) =>
              row.explanation.includes(entityId) ||
              row.fact.includes(entityId) ||
              row.id === entityId,
          )
        : next.findings;
      setFindings(rows.filter((row) => row.status === "OPEN" || row.status === "ACKNOWLEDGED"));
      setContext(ctx);
      setLlm(ctx.llm?.capability ?? next.llm?.capability ?? "AI-INTEGRATION-DEPENDENT");
      setError(null);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }, [carrierRegistryId, entityId, loadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function evaluate() {
    setBusy(true);
    try {
      await requestJson("/api/samba/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loadId: loadId ?? null, carrierRegistryId: carrierRegistryId ?? null }),
      });
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
          <h2 className="mt-1 text-lg font-bold text-white">Operational context</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Samba correlates stored BOF records, explains why they matter, and recommends existing workflows. It does
            not release loads, stop pickups, or change carrier/driver status. LLM rendering is {llm} and is not
            operational authority.
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

      {context ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current operational context · provenance {context.provenance}</p>
          <p className="text-white">{context.summary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">What happened</p>
              <p className="mt-1">{context.narrative.whatHappened}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Why it matters</p>
              <p className="mt-1">{context.narrative.whyItMatters}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Related evidence</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-400">
                {context.narrative.whatSupportsThis.slice(0, 6).map((line) => (
                  <li key={line}>{line}</li>
                ))}
                {context.relatedEntities.slice(0, 4).map((row) => (
                  <li key={`${row.entityType}-${row.relationship}`}>
                    {row.entityType} · {row.relationship} · {row.provenance} · {row.temporalLabel}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">What is not verified</p>
              <p className="mt-1 text-slate-300">{context.narrative.whatIsNotVerified}</p>
            </div>
          </div>
          {context.recentEvents.length > 0 ? (
            <p className="text-xs text-slate-500">
              Process events: {context.recentEvents.map((event) => `${event.eventType}${event.resultingState ? `=${event.resultingState}` : ""}`).join(" → ")}
            </p>
          ) : null}
          {context.repeatedPatterns.length > 0 ? (
            <ul className="text-xs text-amber-200">
              {context.repeatedPatterns.map((pattern) => (
                <li key={pattern.patternType}>
                  Pattern {pattern.patternType} ({pattern.evidenceCount}): {pattern.inference}
                </li>
              ))}
            </ul>
          ) : null}
          {context.missingEvidence.length > 0 ? (
            <p className="text-xs text-slate-500">Missing evidence: {context.missingEvidence[0]}</p>
          ) : null}
          <p className="text-slate-300">Recommended review: {context.recommendedReview?.text ?? context.narrative.whatToReviewNext}</p>
          {context.recommendedReview ? (
            <Link className="text-xs text-teal-200 underline" href={context.recommendedReview.workflowHref}>
              Open {context.recommendedReview.workflowLabel}
            </Link>
          ) : context.narrative.workflowHref ? (
            <Link className="text-xs text-teal-200 underline" href={context.narrative.workflowHref}>
              Open existing workflow
            </Link>
          ) : null}
        </div>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold text-white">Existing findings</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No open Samba findings for this tenant.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {findings.slice(0, 8).map((finding) => (
            <li key={finding.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {finding.findingType} · {finding.severity} · {finding.status} · provenance {finding.provenance}
                {finding.patternType ? ` · pattern ${finding.patternType}` : ""}
                {finding.evidenceFreshness ? ` · ${finding.evidenceFreshness}` : ""}
                {finding.liveConnected ? " · live evidence" : ""}
                {finding.demoReferenceUsed ? " · DEMO_REFERENCE carrier snapshot (not LIVE authority)" : ""}
                {finding.llmUsed ? " · LLM used" : " · deterministic"}
              </p>
              <p className="mt-2 text-white">{finding.whatHappened ?? finding.fact}</p>
              {finding.whyItMatters ? <p className="mt-1 text-slate-300">Why it matters: {finding.whyItMatters}</p> : null}
              {finding.inference ? <p className="mt-1 text-slate-300">Inference: {finding.inference}</p> : null}
              <p className="mt-1 text-slate-400">Recommendation: {finding.recommendedAction ?? finding.recommendation}</p>
              {finding.whatIsNotVerified ? <p className="mt-1 text-xs text-slate-500">Not verified: {finding.whatIsNotVerified}</p> : null}
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
