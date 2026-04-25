"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";

type Props = {
  entityId: string;
  /** Slightly smaller copy for detail pages */
  compact?: boolean;
};

/**
 * Prominent on-screen path to the BOF-native load tender (intake form) in the document viewer:
 * open → edit → save draft → generate final — not a hidden template row.
 */
export function BofIntakeFormPrimaryPanel({ entityId, compact }: Props) {
  const pathname = usePathname() ?? "";
  const returnTo = pathname || undefined;
  const href = buildBofDocumentViewerHref({
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
              ? "BOF document viewer: edit the commercial intake, then generate rate confirmation and trip schedule from the same load context."
              : "The primary BOF load intake is the load tender. Open it here, write into the fields, save a draft, and generate a final. What you capture flows to contract clarity, customer expectation (rate con), and lane timing (trip schedule) — then dispatch readiness, proof, billing, and claims work off the same load story."}
          </p>
          <ol className="bof-intake-form-primary-steps" aria-label="What happens next in BOF">
            <li>Contract / tender baseline and shipper terms</li>
            <li>Rate confirmation and trip schedule (generated from BOF data)</li>
            <li>Driver assignment packet and pre-trip / release discipline</li>
            <li>Proof, settlement, and claim packets downstream</li>
          </ol>
        </div>
        <div className="bof-intake-form-primary-cta">
          <Link href={href} className="bof-intake-form-primary-btn">
            Open load intake form
          </Link>
          <p className="bof-intake-form-primary-hint bof-small bof-muted">
            Also reachable from the shortcuts below. Same session as the template workspace; you are not required to use{" "}
            <code className="bof-code">/template-packs</code> to find it.
          </p>
        </div>
      </div>
    </section>
  );
}
