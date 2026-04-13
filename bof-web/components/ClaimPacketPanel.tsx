"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClaimDraftKind, ClaimPacketContext } from "@/lib/claim-packet";
import { buildClaimDraft } from "@/lib/claim-packet";

const ACTIONS: { kind: ClaimDraftKind; label: string }[] = [
  { kind: "packet", label: "Generate claim packet" },
  { kind: "insurance", label: "Generate insurance notice" },
  { kind: "dispute_letter", label: "Generate dispute letter" },
  { kind: "evidence", label: "Generate evidence summary" },
];

export function ClaimPacketPanel({ ctx }: { ctx: ClaimPacketContext }) {
  const [open, setOpen] = useState<ClaimDraftKind | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

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
            onClick={() => setOpen(a.kind)}
          >
            {a.label}
          </button>
        ))}
      </div>

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
