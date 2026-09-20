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
  mayAuthorOperationalState?: boolean;
  mutatedOperationalRecords?: boolean;
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

function factCapture(lines: string[], pattern: RegExp) {
  for (const line of lines) {
    const match = line.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function bofOperationalSnapshot(context: ContextPayload) {
  const facts = context.narrative.whatSupportsThis;
  return {
    tripRelease: factCapture(facts, /trip release disposition=([A-Z_]+)/i),
    readiness: factCapture(facts, /driver readiness status=([A-Z_]+)/i),
    phase1: factCapture(facts, /Phase 1 pickup authorization status=([A-Z_]+)/i),
    phase2: factCapture(facts, /Phase 2 disposition=([A-Z_]+)/i),
    driverMatch: factCapture(facts, /driver=([A-Z_]+)/i),
    tractorMatch: factCapture(facts, /tractor=([A-Z_]+)/i),
    authorizationMatch: factCapture(facts, /authorization=([A-Z_]+)/i),
  };
}

function LayerLabel({ children, tone }: { children: string; tone: "fact" | "inferred" | "missing" | "review" }) {
  const className =
    tone === "fact"
      ? "border-cyan-700/70 text-cyan-200"
      : tone === "inferred"
        ? "border-amber-700/70 text-amber-200"
        : tone === "review"
          ? "border-teal-700/70 text-teal-200"
          : "border-slate-600 text-slate-400";
  return (
    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${className}`}>{children}</p>
  );
}

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

  const snapshot = context ? bofOperationalSnapshot(context) : null;
  const hasBofState = Boolean(
    snapshot && (snapshot.tripRelease || snapshot.readiness || snapshot.phase1 || snapshot.phase2),
  );
  const hasRecordMatch = Boolean(
    snapshot && (snapshot.driverMatch || snapshot.tractorMatch || snapshot.authorizationMatch),
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Samba intelligence</p>
          <h2 className="mt-1 text-lg font-bold text-white">Operational context</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Samba observes and correlates stored BOF records. It does not make the operational decision. The BOF LIVE
            operating spine remains authoritative. Samba will not release, stop, authorize, or clear a load. LLM
            rendering is {llm} and is not operational authority.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void evaluate()}
          className="rounded border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-100"
        >
          Refresh observation
        </button>
      </div>

      {context ? (
        <div className="mt-4 space-y-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
          {hasBofState && snapshot ? (
            <div className="rounded-md border border-cyan-900/60 bg-cyan-950/20 p-3">
              <LayerLabel tone="fact">LIVE BOF FACT · BOF operational state</LayerLabel>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {snapshot.tripRelease ? (
                  <div>
                    <dt className="text-slate-500">Trip release</dt>
                    <dd className="font-semibold text-white">{snapshot.tripRelease}</dd>
                  </div>
                ) : null}
                {snapshot.readiness ? (
                  <div>
                    <dt className="text-slate-500">Driver readiness</dt>
                    <dd className="font-semibold text-white">{snapshot.readiness}</dd>
                  </div>
                ) : null}
                {snapshot.phase1 ? (
                  <div>
                    <dt className="text-slate-500">Phase 1 pickup authorization</dt>
                    <dd className="font-semibold text-white">{snapshot.phase1}</dd>
                  </div>
                ) : null}
                {snapshot.phase2 ? (
                  <div>
                    <dt className="text-slate-500">Phase 2 physical disposition</dt>
                    <dd className="font-semibold text-white">{snapshot.phase2}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {hasRecordMatch && snapshot ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-cyan-900/60 bg-cyan-950/10 p-3">
                <LayerLabel tone="fact">LIVE BOF FACT · Record reconciliation</LayerLabel>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  {snapshot.driverMatch ? (
                    <div>
                      <dt className="text-slate-500">Driver</dt>
                      <dd className="font-semibold text-white">{snapshot.driverMatch}</dd>
                    </div>
                  ) : null}
                  {snapshot.tractorMatch ? (
                    <div>
                      <dt className="text-slate-500">Tractor</dt>
                      <dd className="font-semibold text-white">{snapshot.tractorMatch}</dd>
                    </div>
                  ) : null}
                  {snapshot.authorizationMatch ? (
                    <div>
                      <dt className="text-slate-500">Authorization</dt>
                      <dd className="font-semibold text-white">{snapshot.authorizationMatch}</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  MATCH means stored records matched the authorization. It is not physical identity verification.
                </p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/50 p-3">
                <LayerLabel tone="missing">MISSING / UNVERIFIED EVIDENCE · Physical identity</LayerLabel>
                <p className="mt-2 text-sm font-semibold text-white">UNVERIFIED</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{context.narrative.whatIsNotVerified}</p>
              </div>
            </div>
          ) : (
            <div>
              <LayerLabel tone="missing">MISSING / UNVERIFIED EVIDENCE</LayerLabel>
              <p className="mt-1 text-slate-300">{context.narrative.whatIsNotVerified}</p>
            </div>
          )}

          <div>
            <LayerLabel tone="fact">What happened</LayerLabel>
            <p className="mt-1 text-white">{context.narrative.whatHappened}</p>
          </div>
          <div>
            <LayerLabel tone="inferred">Why it matters · INFERRED SAMBA CONTEXT</LayerLabel>
            <p className="mt-1">{context.narrative.whyItMatters}</p>
          </div>

          <div className="rounded-md border border-amber-900/50 bg-amber-950/10 p-3">
            <LayerLabel tone="inferred">INFERRED SAMBA CONTEXT · What Samba found</LayerLabel>
            {findings.length === 0 && context.repeatedPatterns.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Samba found no open intelligence findings for this query.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-amber-100">
                {findings.length > 0 ? (
                  <li>
                    Samba identified {findings.length} open finding{findings.length === 1 ? "" : "s"}
                    {findings.every((row) => row.findingType === findings[0]?.findingType)
                      ? ` (${findings[0].findingType})`
                      : ""}
                    . These are intelligence, not a BOF operational decision.
                  </li>
                ) : null}
                {context.repeatedPatterns.map((pattern) => (
                  <li key={pattern.patternType}>
                    Pattern {pattern.patternType} ({pattern.evidenceCount}): {pattern.inference} This pattern does not
                    itself change the BOF release decision.
                  </li>
                ))}
              </ul>
            )}
          </div>

          {context.narrative.whatSupportsThis.length > 0 ? (
            <div>
              <LayerLabel tone="fact">LIVE BOF FACT · What is verified in stored BOF records</LayerLabel>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-400">
                {context.narrative.whatSupportsThis.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {context.recentEvents.length > 0 ? (
            <p className="text-xs text-slate-500">
              BOF process events:{" "}
              {context.recentEvents
                .map((event) => `${event.eventType}${event.resultingState ? `=${event.resultingState}` : ""}`)
                .join(" → ")}
            </p>
          ) : null}

          {context.missingEvidence.length > 0 ? (
            <div className="rounded-md border border-slate-700 p-3">
              <LayerLabel tone="missing">MISSING / UNVERIFIED EVIDENCE · Evidence limitation</LayerLabel>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                {context.missingEvidence.map((item) => (
                  <li key={item}>{item} This is a limitation of stored evidence, not an operating error.</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-md border border-teal-900/50 bg-teal-950/10 p-3">
            <LayerLabel tone="review">RECOMMENDED REVIEW</LayerLabel>
            <p className="mt-2 text-slate-200">{context.recommendedReview?.text ?? context.narrative.whatToReviewNext}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Samba recommends review only. It does not execute an operational action
              {context.recommendedReview ? " (executesAction: false)" : ""}.
            </p>
            {context.recommendedReview ? (
              <Link className="mt-2 inline-block text-xs text-teal-200 underline" href={context.recommendedReview.workflowHref}>
                Open existing BOF workflow: {context.recommendedReview.workflowLabel}
              </Link>
            ) : context.narrative.workflowHref ? (
              <Link className="mt-2 inline-block text-xs text-teal-200 underline" href={context.narrative.workflowHref}>
                Open existing BOF workflow
                {context.narrative.workflowLabel ? `: ${context.narrative.workflowLabel}` : ""}
              </Link>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-500">
            Provenance {context.provenance}. Samba mayAuthorOperationalState=
            {String(context.mayAuthorOperationalState ?? false)}. Samba mutatedOperationalRecords=
            {String(context.mutatedOperationalRecords ?? false)}.
          </p>
        </div>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold text-white">Existing Samba findings</h3>
      <p className="mt-1 text-xs text-slate-500">
        Findings are Samba intelligence. Acknowledge, resolve, and dismiss only change Samba finding status, not BOF
        operational records.
      </p>
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
                    Open existing BOF workflow
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
