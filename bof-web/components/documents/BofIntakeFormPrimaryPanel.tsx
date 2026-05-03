"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";

type Props = {
  entityId: string;
  /** Slightly smaller copy for detail pages */
  compact?: boolean;
  /** When set, canonical intake opens prefilled from this intake engine record */
  intakeId?: string;
};

function canonicalDispatchIntakeHref(intakeId?: string): string {
  const id = intakeId?.trim();
  return id ? `/dispatch/intake?intakeId=${encodeURIComponent(id)}` : "/dispatch/intake";
}

/**
 * Primary CTA to canonical BOF load intake (`/dispatch/intake`).
 * Optional link to the load tender in the document viewer for template-style editing.
 */
export function BofIntakeFormPrimaryPanel({ entityId, compact, intakeId }: Props) {
  const pathname = usePathname() ?? "";
  const returnTo = pathname || undefined;
  const canonicalHref = canonicalDispatchIntakeHref(intakeId);
  const tenderViewerHref = buildBofDocumentViewerHref({
    templateId: "load-tender",
    entityId,
    packId: "load-intake-v3",
    returnTo,
  });

  return (
    <section
      className="bof-intake-form-primary"
      aria-labelledby="bof-intake-form-primary-h"
    >
      <div className="bof-intake-form-primary-inner">
        <div>
          <h2 id="bof-intake-form-primary-h" className="bof-intake-form-primary-title">
            Load Intake Form
          </h2>
          <p className="bof-intake-form-primary-lead">
            {compact
              ? "Canonical Dispatch Load Intake: shipper & facility, requirements, compliance & proof, review & packet, then save to the BOF dispatch pipeline."
              : "The primary path is Dispatch → Load Intake — one wizard for manual entry, upload/parser, or client request. What you save flows into loads, assignments, proof, billing, and claims. Use the load tender in the document viewer only when you need template-style field editing for the same entity."}
          </p>
          <ol className="bof-intake-form-primary-steps" aria-label="What happens next in BOF">
            <li>Shipper, facilities, lane, and equipment baseline</li>
            <li>Load requirements and operational constraints</li>
            <li>Compliance, proof, and financial readiness</li>
            <li>Review &amp; packet, then save to dispatch</li>
          </ol>
        </div>
        <div className="bof-intake-form-primary-cta">
          <Link href={canonicalHref} className="bof-intake-form-primary-btn">
            Open load intake form
          </Link>
          <p className="bof-intake-form-primary-hint bof-small bof-muted">
            <Link href={tenderViewerHref} className="bof-link-secondary">
              Load tender (document viewer)
            </Link>
            {" · "}
            Internal template admin stays under{" "}
            <Link href="/documents/template-packs" className="bof-link-secondary">
              Documents → Template packs
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
