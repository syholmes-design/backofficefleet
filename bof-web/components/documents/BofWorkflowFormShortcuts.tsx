"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";
import type { BofTemplatePackId } from "@/lib/bof-template-system";

export type WorkflowShortcutContext =
  | "intake"
  | "load"
  | "documents"
  | "settlement"
  | "claims"
  | "vault";

type Shortcut = {
  label: string;
  sub: string;
  href: string;
  kind: "editable" | "generated" | "workspace";
  gate?: string;
};

function kindPill(kind: Shortcut["kind"]) {
  if (kind === "generated") return "bof-wf-sh-pill bof-wf-sh-pill--gen";
  if (kind === "workspace") return "bof-wf-sh-pill bof-wf-sh-pill--ws";
  return "bof-wf-sh-pill bof-wf-sh-pill--edit";
}

function kindLabel(kind: Shortcut["kind"]) {
  if (kind === "generated") return "Generated";
  if (kind === "workspace") return "Pack index";
  return "Editable";
}

export function BofWorkflowFormShortcuts({
  entityId,
  context,
  settlementId,
  intakeId,
  title,
  className = "",
  variant = "bof",
}: {
  entityId: string;
  context: WorkflowShortcutContext;
  /** For settlement_billing, entityId may be settlement id; pass for claim-style copy */
  settlementId?: string;
  /** Prefill canonical `/dispatch/intake` from an intake engine record */
  intakeId?: string;
  title?: string;
  className?: string;
  /** `dispatch` — dark surfaces (dispatch load detail drawer). */
  variant?: "bof" | "dispatch";
}) {
  const pathname = usePathname() ?? "";
  const ret = pathname || undefined;
  const eid = entityId;

  const shortcuts: Shortcut[] = [];
  const pack = (p: BofTemplatePackId) => p;

  const dispatchIntakeHref =
    intakeId?.trim().length
      ? `/dispatch/intake?intakeId=${encodeURIComponent(intakeId.trim())}`
      : "/dispatch/intake";

  if (context === "intake" || context === "load" || context === "documents") {
    shortcuts.push(
      {
        label: "Open Dispatch Load Intake",
        sub: "Canonical wizard · manual, upload, or client request",
        href: dispatchIntakeHref,
        kind: "editable",
        gate: "Saves into BOF dispatch pipeline",
      },
      {
        label: "Load tender (document viewer)",
        sub: "Commercial intake · contract baseline",
        href: buildBofDocumentViewerHref({
          templateId: "load-tender",
          entityId: eid,
          packId: pack("load-intake-v3"),
          returnTo: ret,
        }),
        kind: "editable",
        gate: "Template-style editing",
      },
      {
        label: "Rate Confirmation",
        sub: "Autofill from BOF data",
        href: buildBofDocumentViewerHref({
          templateId: "rate-confirmation",
          entityId: eid,
          packId: pack("load-intake-v3"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "AR / customer expectation",
      },
      {
        label: "Trip Schedule",
        sub: "Appointments + lane control",
        href: buildBofDocumentViewerHref({
          templateId: "trip-schedule",
          entityId: eid,
          packId: pack("load-intake-v3"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "Readiness + proof timing",
      },
      {
        label: "Open driver packet",
        sub: "Dispatch-facing · assignment + readiness",
        href: buildBofDocumentViewerHref({
          templateId: "driver-assignment-packet",
          entityId: eid,
          packId: pack("driver-dispatch-readiness-v2"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "Required before release",
      }
    );
  }

  if (context === "settlement" && (settlementId || eid)) {
    const sid = settlementId ?? eid;
    shortcuts.push(
      {
        label: "Open billing packet",
        sub: "AR / packet rollup",
        href: buildBofDocumentViewerHref({
          templateId: "billing-packet-cover",
          entityId: sid,
          packId: pack("billing-settlement-v3"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "Required before billing",
      },
      {
        label: "Settlement Hold Notice",
        sub: "Holds and exceptions",
        href: buildBofDocumentViewerHref({
          templateId: "settlement-hold-notice",
          entityId: sid,
          packId: pack("billing-settlement-v3"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "Owner + billing",
      }
    );
  }

  if (context === "claims" || context === "load") {
    shortcuts.push(
      {
        label: "Open claim packet (cover)",
        sub: "Insurer + reserve posture",
        href: buildBofDocumentViewerHref({
          templateId: "claim-support-packet-cover",
          entityId: eid,
          packId: pack("insurance-claims-v2"),
          returnTo: ret,
        }),
        kind: "generated",
        gate: "Claim packet",
      }
    );
  }

  if (context === "vault" || context === "documents") {
    shortcuts.push(
      {
        label: "Open vault & compliance notice",
        sub: "Driver file gap loop",
        href: buildBofDocumentViewerHref({
          templateId: "compliance-missing-doc-notice",
          entityId: eid,
          packId: pack("driver-dispatch-readiness-v2"),
          returnTo: ret,
        }),
        kind: "editable",
        gate: "Credential gating",
      }
    );
  }

  shortcuts.push({
    label: "Internal Template Admin (full index)",
    sub: "Browse every BOF form template — not the primary intake path",
    href: `/documents/template-packs?entityId=${encodeURIComponent(eid)}`,
    kind: "workspace",
  });

  const v = variant === "dispatch" ? "bof-wf-sh bof-wf-sh--dispatch" : "bof-wf-sh";
  return (
    <section className={`${v} ${className}`.trim()} aria-label="BOF forms and packets">
      <div className="bof-wf-sh-head">
        <h2 className="bof-wf-sh-title">{title ?? "BOF forms & packets — open and work here"}</h2>
        <p className="bof-wf-sh-lead">
          Start loads in <strong>Dispatch Load Intake</strong> (<code className="bof-code">/dispatch/intake</code>
          ). Other cards open the BOF <strong>document viewer</strong> for generated packets and the load
          tender. Internal template admin is labeled separately.
        </p>
      </div>
      <ul className="bof-wf-sh-grid">
        {shortcuts.map((s) => (
          <li key={s.label} className="bof-wf-sh-card">
            <Link href={s.href} className="bof-wf-sh-link">
              <span className="bof-wf-sh-top">
                <span className={kindPill(s.kind)}>{kindLabel(s.kind)}</span>
                {s.gate ? <span className="bof-wf-sh-gate">{s.gate}</span> : null}
              </span>
              <span className="bof-wf-sh-label">{s.label}</span>
              <span className="bof-wf-sh-sub">{s.sub}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
