import Link from "next/link";

export type CcMockRow = {
  label: string;
  title: string;
  meta: string;
  val: string;
  valClass?: string;
};

const DEFAULT_ROWS: readonly CcMockRow[] = [
  {
    label: "Attention queue",
    title: "Drivers at risk",
    meta: "Expired med card · 2 dispatch blocks",
    val: "7",
    valClass: "",
  },
  {
    label: "Loads",
    title: "Loads at risk",
    meta: "Open POD · seal mismatch",
    val: "4",
    valClass: "",
  },
  {
    label: "Claims",
    title: "Claim exposure",
    meta: "Dispute-ready packet in progress",
    val: "$42K",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
  },
  {
    label: "Compliance",
    title: "Compliance violations",
    meta: "Auditable enforcement events",
    val: "11",
    valClass: "",
  },
  {
    label: "Finance",
    title: "Money at risk",
    meta: "Held pay · settlement blocks",
    val: "$128K",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
  },
];

/**
 * Marketing-only command center mock — same chrome as the home page block.
 * Demo navigation uses `demoHref` (defaults to command center).
 */
export function MarketingCommandCenterPreview({
  rows = DEFAULT_ROWS,
  headingId = "bof-mkt-cc-heading",
  title = "What Needs Attention Right Now",
  lead = "BOF gives operations leaders a real-time command center for compliance, proof, settlements, and financial risk.",
  demoHref = "/command-center",
  demoLabel = "Explore the command center in the demo →",
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
          <div className="bof-mkt-cc-mock" aria-label="Command center preview">
            <div className="bof-mkt-cc-mock-head">
              <div className="bof-mkt-cc-mock-head-left">
                <div className="bof-mkt-cc-mock-dots" aria-hidden>
                  <span className="bof-mkt-cc-mock-dot" />
                  <span className="bof-mkt-cc-mock-dot" />
                  <span className="bof-mkt-cc-mock-dot" />
                </div>
                <span className="bof-mkt-cc-mock-title">BOF Command Center</span>
              </div>
              <span className="bof-mkt-cc-mock-live">Live priority</span>
            </div>
            <div className="bof-mkt-cc-mock-body">
              {rows.map((row) => (
                <div key={row.title} className="bof-mkt-cc-mock-kpi">
                  <div>
                    <div className="bof-mkt-cc-mock-kpi-label">{row.label}</div>
                    <p className="bof-mkt-cc-mock-kpi-title">{row.title}</p>
                    <p className="bof-mkt-cc-mock-kpi-meta">{row.meta}</p>
                  </div>
                  <div
                    className={
                      row.valClass ? `bof-mkt-cc-mock-kpi-val ${row.valClass}` : "bof-mkt-cc-mock-kpi-val"
                    }
                  >
                    {row.val}
                  </div>
                </div>
              ))}
              <p className="bof-mkt-cc-mock-foot">
                Illustrative metrics — your operation surfaces its own queue, owners, and next actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
