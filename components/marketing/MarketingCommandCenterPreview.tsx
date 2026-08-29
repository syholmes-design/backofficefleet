import Link from "next/link";

export type CcMockRow = {
  label: string;
  title: string;
  meta: string;
  val: string;
  valClass?: string;
  href?: string;
};

const DEFAULT_ROWS: readonly CcMockRow[] = [
  {
    label: "Control tower",
    title: "Critical risks",
    meta: "Seal exception / HOS coaching",
    val: "2",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
    href: "/rf-actions",
  },
  {
    label: "Dispatch / RFID",
    title: "Seal exception",
    meta: "L001 proof packet needs closeout",
    val: "L001",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
    href: "/loads/L001",
  },
  {
    label: "Settlement",
    title: "QR lumper closeout",
    meta: "L007 dock proof / Zelle confirmation",
    val: "$180",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
    href: "/settlements",
  },
  {
    label: "Safety",
    title: "HOS coaching hold",
    meta: "DRV-010 release and bonus impact",
    val: "L010",
    href: "/safety",
  },
  {
    label: "Route control",
    title: "Storm reroute exercise",
    meta: "I-40 weather cell / dispatch workaround",
    val: "LIVE",
    href: "/dispatch",
  },
];

/**
 * Marketing-only control tower mock - same chrome as the home page block.
 * Demo navigation uses `demoHref` (defaults to command center).
 */
export function MarketingCommandCenterPreview({
  rows = DEFAULT_ROWS,
  headingId = "bof-mkt-cc-heading",
  title = "What Needs Attention Right Now",
  lead = "BOF gives operations leaders a real-time command center for compliance, proof, settlements, and financial risk.",
  demoHref = "/dashboard",
  demoLabel = "Explore the operational overview ->",
}: {
  rows?: readonly CcMockRow[];
  /** For `aria-labelledby` on the wrapping section. */
  headingId?: string;
  title?: string;
  lead?: string;
  demoHref?: string;
  demoLabel?: string;
}) {
  return (
    <div className="bof-mkt-container">
      <div className="bof-mkt-cc-split">
        <div className="bof-mkt-cc-split-copy">
          <h2 id={headingId} className="bof-mkt-cc-title">
            {title}
          </h2>
          <p className="bof-mkt-cc-lead">{lead}</p>
          <div className="bof-mkt-cc-split-foot">
            <Link href={demoHref} className="bof-mkt-inline-link">
              {demoLabel}
            </Link>
          </div>
        </div>
        <div className="bof-mkt-cc-mock-wrap">
          <div className="bof-mkt-cc-mock" aria-label="Control tower preview">
            <div className="bof-mkt-cc-mock-head">
              <div className="bof-mkt-cc-mock-head-left">
                <div className="bof-mkt-cc-mock-dots" aria-hidden>
                  <span className="bof-mkt-cc-mock-dot" />
                  <span className="bof-mkt-cc-mock-dot" />
                  <span className="bof-mkt-cc-mock-dot" />
                </div>
                <span className="bof-mkt-cc-mock-title">BOF Control Tower</span>
              </div>
              <span className="bof-mkt-cc-mock-live">Live priority</span>
            </div>
            <div className="bof-mkt-cc-mock-body">
              {rows.map((row) => {
                const content = (
                  <>
                    <div>
                      <div className="bof-mkt-cc-mock-kpi-label">{row.label}</div>
                      <p className="bof-mkt-cc-mock-kpi-title">{row.title}</p>
                      <p className="bof-mkt-cc-mock-kpi-meta">{row.meta}</p>
                    </div>
                    <div
                      className={
                        row.valClass
                          ? `bof-mkt-cc-mock-kpi-val ${row.valClass}`
                          : "bof-mkt-cc-mock-kpi-val"
                      }
                    >
                      {row.val}
                    </div>
                  </>
                );

                return row.href ? (
                  <Link key={row.title} href={row.href} className="bof-mkt-cc-mock-kpi">
                    {content}
                  </Link>
                ) : (
                  <div key={row.title} className="bof-mkt-cc-mock-kpi">
                    {content}
                  </div>
                );
              })}
              <p className="bof-mkt-cc-mock-foot">
                Clickable demo paths mirror the live Control Tower: owners, proof, route response,
                payment holds, and next actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
