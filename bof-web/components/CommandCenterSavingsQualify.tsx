import type { SavingsQualificationModel } from "@/lib/bof-savings-layer";

export function CommandCenterSavingsQualify({
  model,
}: {
  model: SavingsQualificationModel;
}) {
  return (
    <section
      className="bof-cc-qualify-panel"
      aria-label="Why you qualify"
    >
      <h2 className="bof-cc-qualify-title">Why you qualify</h2>
      <p className="bof-cc-qualify-lead">
        Snapshot of fleet documentation and delivery verification used in the
        savings model above.
      </p>
      <ul className="bof-cc-qualify-metrics">
        <li>
          <span className="bof-cc-qualify-pct">{model.podVerifiedPct}%</span>
          <span className="bof-cc-qualify-desc">
            of delivered loads have verified POD
          </span>
        </li>
        <li>
          <span className="bof-cc-qualify-pct">
            {model.compliancePassRatePct}%
          </span>
          <span className="bof-cc-qualify-desc">
            compliance pass rate (credential register proxy)
          </span>
        </li>
        <li>
          <span className="bof-cc-qualify-pct">
            {model.rfVerifiedDeliveryCount}
          </span>
          <span className="bof-cc-qualify-desc">
            RF-verified deliveries (RFID / dock proof complete)
          </span>
        </li>
        <li>
          <span className="bof-cc-qualify-pct">
            {model.loadsWithoutDocumentationGaps}
          </span>
          <span className="bof-cc-qualify-desc">
            loads without documentation gaps (of {model.loadCount})
          </span>
        </li>
      </ul>
    </section>
  );
}
