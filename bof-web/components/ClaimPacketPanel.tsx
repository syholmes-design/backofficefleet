"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClaimDraftKind, ClaimPacketContext } from "@/lib/claim-packet";
import { buildClaimDraft } from "@/lib/claim-packet";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { BofTemplateUsageSurface } from "@/components/documents/BofTemplateUsageSurface";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildRfidReadinessSummaryForSurface } from "@/lib/template-usage-readiness";
import { resolveRfidTemplateGate } from "@/lib/bof-rfid-readiness";

const ACTIONS: { kind: ClaimDraftKind; label: string }[] = [
  { kind: "packet", label: "Generate claim packet" },
  { kind: "insurance", label: "Generate insurance notice" },
  { kind: "dispute_letter", label: "Generate dispute letter" },
  { kind: "evidence", label: "Generate evidence summary" },
];

function generatedDocLabel(kind: ClaimDraftKind): string {
  if (kind === "packet") return "claim packet";
  if (kind === "insurance") return "insurance notice";
  if (kind === "dispute_letter") return "dispute letter";
  return "evidence summary";
}

export function ClaimPacketPanel({ ctx }: { ctx: ClaimPacketContext }) {
  const { data } = useBofDemoData();
  const [open, setOpen] = useState<ClaimDraftKind | null>(null);
  const [busyKind, setBusyKind] = useState<ClaimDraftKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedByKind, setGeneratedByKind] = useState<
    Partial<Record<ClaimDraftKind, string>>
  >({});
  const setLoadDocumentUrls = useDispatchDashboardStore((s) => s.setLoadDocumentUrls);

  const claimSupportRfidGate = useMemo(() => {
    const rfid = buildRfidReadinessSummaryForSurface(data, "claims_insurance", ctx.loadId);
    return resolveRfidTemplateGate("claim-support-packet-cover", rfid);
  }, [data, ctx.loadId]);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function generateClaimAssets(kind: ClaimDraftKind) {
    setBusyKind(kind);
    setError(null);
    try {
      const res = await fetch("/api/generate/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: ctx.loadId,
          description: ctx.issueTypes.join("; ") || "Claim packet workspace",
          claim_photos: [],
        }),
      });
      const data = (await res.json()) as
        | {
            ok: true;
            generatedUrl: string;
            publicUrl?: string;
            metadata?: {
              relatedDocuments?: Array<{
                type?: string;
                generatedUrl?: string;
                publicUrl?: string;
              }>;
            };
          }
        | { ok: false; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error((data as { error?: string }).error || "Claims generation failed");
      }
      const related = data.metadata?.relatedDocuments ?? [];
      const pick = (needle: string) =>
        related.find((r) => String(r.type || "").toLowerCase().includes(needle));
      const packetUrl = data.publicUrl || data.generatedUrl;
      const evidenceUrl =
        pick("evidence")?.publicUrl || pick("evidence")?.generatedUrl;
      const damageUrl = pick("damage")?.publicUrl || pick("damage")?.generatedUrl;
      const insuranceUrl =
        pick("insurance")?.publicUrl || pick("insurance")?.generatedUrl;
      const disputeUrl = pick("dispute")?.publicUrl || pick("dispute")?.generatedUrl;

      const byKind: Partial<Record<ClaimDraftKind, string>> = {
        packet: packetUrl,
        insurance: insuranceUrl ?? packetUrl,
        dispute_letter: disputeUrl ?? packetUrl,
        evidence: evidenceUrl ?? packetUrl,
      };
      setGeneratedByKind((prev) => ({ ...prev, ...byKind }));
      setLoadDocumentUrls(ctx.loadId, {
        claim_form_url: packetUrl,
        supporting_attachment_url: evidenceUrl,
        damage_photo_url: damageUrl,
      });
      window.open(byKind[kind] || packetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown generation error";
      if (/unknown incidentid|missing or unknown incidentid/i.test(msg)) {
        setError(
          "No claim incident is currently linked to this load/driver in demo data. Use a load with an open claim/compliance incident or add one in Source of Truth."
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <section
      id="claim-packet"
      className="bof-claim-section"
      aria-labelledby="claim-packet-heading"
    >
      <h2 id="claim-packet-heading" className="bof-h2">
        Claim packet workspace
      </h2>
      <p className="bof-doc-section-lead">
        Higher-order resolution package for this load — consolidates proof, RFID
        dock context, and settlement signals. Use when disputes, seal/cargo, or
        lumper contention require a single narrative. Drafts are UI-only (nothing
        is sent).
      </p>
      <ul className="bof-claim-facts bof-muted bof-small">
        <li>
          Issues flagged:{" "}
          <strong>
            {ctx.issueTypes.join(" · ") || "General"}
          </strong>
        </li>
        <li>
          At risk (ref.):{" "}
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(ctx.amountAtRiskUsd)}
          </strong>{" "}
          · Recoverable (est.):{" "}
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(ctx.recoverableEstimateUsd)}
          </strong>
        </li>
      </ul>
      <div className="bof-claim-actions">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            className="bof-cc-next-action-btn bof-claim-action-btn"
            disabled={busyKind !== null || claimSupportRfidGate.level === "hard_block"}
            title={
              claimSupportRfidGate.level === "hard_block" ? claimSupportRfidGate.reason : undefined
            }
            onClick={() => {
              setOpen(a.kind);
              void generateClaimAssets(a.kind);
            }}
          >
            {busyKind === a.kind ? "Generating..." : a.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="bof-small" style={{ color: "#fecaca", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      <BofTemplateUsageSurface
        context="claims_insurance"
        entityId={ctx.loadId}
        title="BOF Template Usage — Claims / Insurance"
        subtitle="Claim, insurance, linked proof, and settlement-impact templates for this load claim workflow."
      />

      {open && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={close}
        >
          <div
            className="bof-modal bof-modal-wide bof-cc-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-draft-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="claim-draft-title">
                {ACTIONS.find((x) => x.kind === open)?.label}
              </h3>
              <button
                type="button"
                className="bof-modal-close"
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="bof-modal-body">
              {generatedByKind[open] && (
                <p className="bof-modal-note">
                  <a
                    href={generatedByKind[open]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open generated {generatedDocLabel(open)}
                  </a>
                </p>
              )}
              <pre className="bof-cc-draft-pre">
                {buildClaimDraft(open, ctx)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
