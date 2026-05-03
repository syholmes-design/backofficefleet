"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EnrichedCommandCenterItem } from "@/lib/command-center-system";
import { formatUsd } from "@/lib/format-money";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";
import { ProofGapReviewLinks } from "@/components/review/ReviewDeepLinks";

function moneySuffix(item: EnrichedCommandCenterItem): string | null {
  if (item.moneyImpactUsd == null) return null;
  const u = formatUsd(item.moneyImpactUsd);
  switch (item.moneyImpactKind) {
    case "blocked":
      return `${u} blocked`;
    case "exposure":
      return `${u} exposure`;
    case "net_pay_held":
      return `${u} net pay held`;
    default:
      return `${u} at risk`;
  }
}

function actionButtonLabel(item: EnrichedCommandCenterItem): string {
  const suf = moneySuffix(item);
  return suf ? `${item.actionLabel} — ${suf}` : item.actionLabel;
}

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2 };

/** UI-only ordering: blocked and payment-critical first, then severity. */
function attentionSort(a: EnrichedCommandCenterItem, b: EnrichedCommandCenterItem) {
  const rank = (i: EnrichedCommandCenterItem) => {
    if (i.status === "Blocked") return 0;
    if (i.bucket === "Dispatch / proof" && /blocking payment/i.test(i.title))
      return 1;
    if (i.bucket === "Compliance") return 2;
    if (/maintenance/i.test(i.title) || /maintenance/i.test(i.detail)) return 3;
    if (i.bucket === "Dispatch / proof") return 4;
    if (i.bucket === "Driver readiness" || i.id.startsWith("DOC-")) return 5;
    return 6;
  };
  const dr = rank(a) - rank(b);
  if (dr !== 0) return dr;
  const sev =
    (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
  if (sev !== 0) return sev;
  return a.id.localeCompare(b.id);
}

function moneyImpactLine(item: EnrichedCommandCenterItem): string | null {
  if (item.moneyImpactUsd == null) return null;
  const u = formatUsd(item.moneyImpactUsd);
  switch (item.moneyImpactKind) {
    case "blocked":
      return `${u} · settlement / payment blocked until cleared`;
    case "exposure":
      return `${u} · audit or dispute exposure`;
    case "net_pay_held":
      return `${u} · payroll net held pending docs`;
    default:
      return `${u} · revenue or register at risk`;
  }
}

export function CommandCenterIssueList({
  items,
}: {
  items: EnrichedCommandCenterItem[];
}) {
  const [open, setOpen] = useState<EnrichedCommandCenterItem | null>(null);

  const sorted = useMemo(() => [...items].sort(attentionSort), [items]);

  const closeModal = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const critical = items.filter((i) => i.severity === "critical");
  const high = items.filter((i) => i.severity === "high");
  const medium = items.filter((i) => i.severity === "medium");

  return (
    <>
      <p className="bof-cc-attention-meta">
        <strong>{items.length}</strong> open items ·{" "}
        <span className="bof-sev-critical">{critical.length} critical</span> ·{" "}
        <span className="bof-sev-high">{high.length} high</span> ·{" "}
        <span className="bof-sev-medium">{medium.length} medium</span>
        <span className="bof-muted"> · sorted for action (blocked &amp; proof first)</span>
      </p>

      <div className="bof-cc-attention-list">
        {sorted.map((item) => (
          <article key={item.id} className="bof-cc-attention-card">
            <div className="bof-cc-attention-row">
              <div className="bof-cc-attention-aside">
                {item.driverId && item.driver ? (
                  <DriverLink
                    driverId={item.driverId}
                    className="bof-cc-attention-photo"
                  >
                    <DriverAvatar
                      name={item.driver}
                      photoUrl={driverPhotoPath(item.driverId)}
                      size={44}
                    />
                  </DriverLink>
                ) : (
                  <div className="bof-cc-attention-photo-fallback" aria-hidden>
                    <span className="bof-cc-attention-photo-fallback-icon">!</span>
                  </div>
                )}
                <div className="bof-cc-attention-pills">
                  <span className={`bof-sev bof-sev-${item.severity}`}>
                    {item.severity}
                  </span>
                  <span className="bof-cc-attention-bucket">{item.bucket}</span>
                </div>
              </div>

              <div className="bof-cc-attention-main">
                <h2 className="bof-cc-attention-title">{item.title}</h2>
                <p className="bof-cc-attention-cause">{item.detail}</p>
                <div className="bof-cc-attention-context">
                  {item.driver && item.driverId && (
                    <span>
                      <DriverLink driverId={item.driverId}>{item.driver}</DriverLink>
                      <code className="bof-code">{item.driverId}</code>
                    </span>
                  )}
                  {item.loadId && (
                    <span>
                      <Link
                        href={`/loads/${item.loadId}`}
                        className="bof-driver-link"
                      >
                        Load <code className="bof-code">{item.loadId}</code>
                      </Link>
                    </span>
                  )}
                  {item.assetId && (
                    <span>
                      Asset <code className="bof-code">{item.assetId}</code>
                    </span>
                  )}
                  <span className="bof-cc-attention-owner">
                    Owner: {item.owner}
                  </span>
                </div>
                {(item.driverId || item.loadId) && (
                  <div className="mt-2">
                    <ProofGapReviewLinks
                      driverId={item.driverId}
                      loadId={item.loadId}
                      className="flex flex-wrap gap-x-3 gap-y-1"
                    />
                  </div>
                )}
              </div>

              <div className="bof-cc-attention-side">
                <p
                  className={
                    moneyImpactLine(item)
                      ? "bof-cc-attention-money"
                      : "bof-cc-attention-money bof-muted"
                  }
                >
                  {moneyImpactLine(item) ?? "No dollar anchor on file"}
                </p>
                <button
                  type="button"
                  className="bof-cc-next-action-btn bof-cc-next-action-btn-premium"
                  onClick={() => setOpen(item)}
                >
                  {actionButtonLabel(item)}
                </button>
                <span className="bof-cc-action-hint bof-muted bof-small">
                  Opens RF draft · nothing is sent
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="bof-modal bof-modal-wide bof-cc-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bof-cc-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="bof-cc-modal-title">{open.actionLabel}</h3>
              <button
                type="button"
                className="bof-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="bof-modal-body">
              <p className="bof-muted bof-small">
                Draft message (RF-style). Copy and send through your normal
                channels — this demo does not transmit data.
              </p>
              {open.moneyImpactUsd != null && (
                <p className="bof-cc-modal-money">
                  <strong>{formatUsd(open.moneyImpactUsd)}</strong>
                  <span className="bof-muted"> · {open.moneyColumnLabel}</span>
                </p>
              )}
              <pre className="bof-cc-draft-pre">{open.draftBody}</pre>
              {(open.loadId || open.driverId) && (
                <p className="bof-muted bof-small bof-cc-doc-engine-links">
                  Document engine:{" "}
                  {open.loadId && (
                    <Link
                      href={`/loads/${open.loadId}#document-engine`}
                      className="bof-link-secondary"
                    >
                      Load packet
                    </Link>
                  )}
                  {open.loadId && open.driverId ? " · " : null}
                  {open.driverId && (
                    <Link
                      href={`/drivers/${open.driverId}#document-engine`}
                      className="bof-link-secondary"
                    >
                      Driver forms
                    </Link>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
