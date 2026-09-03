"use client";

import Link from "next/link";
import type { DriverOperatingIssuePath } from "@/lib/driver-operating-issue-path";

type Props = {
  issues: DriverOperatingIssuePath[];
  compact?: boolean;
  heading?: string;
};

export function DriverOperatingIssuePathList({
  issues,
  compact = false,
  heading = "Operating issue path",
}: Props) {
  if (issues.length === 0) {
    return (
      <p className="bof-muted bof-small" style={{ margin: "0.5rem 0 0" }}>
        No expired, expiring, or missing core qualification documents on the current DQF result.
      </p>
    );
  }

  return (
    <div className="bof-op-issue-list">
      {heading ? (
        <h3 className="bof-h3" style={{ margin: "0 0 0.65rem", fontSize: compact ? "0.95rem" : undefined }}>
          {heading}
        </h3>
      ) : null}
      {issues.map((issue) => (
        <article
          key={issue.id}
          className={`bof-op-issue-card${issue.status === "expired" || issue.status === "missing" ? " bof-op-issue-card--danger" : " bof-op-issue-card--warn"}`}
        >
          <header className="bof-op-issue-card__head">
            <strong>{issue.problem}</strong>
            <span className="bof-op-issue-card__meta">
              {issue.driverName} ({issue.driverId})
            </span>
          </header>
          <dl className="bof-op-issue-dl">
            <div>
              <dt>Record</dt>
              <dd>
                {issue.recordName}
                {issue.expirationDate ? ` · date ${issue.expirationDate}` : ""}
                {issue.fileOnRecord ? " · file on record" : " · no indexed file"}
              </dd>
            </div>
            <div>
              <dt>Cause</dt>
              <dd>{issue.cause}</dd>
            </div>
            <div>
              <dt>Correction</dt>
              <dd>{issue.requiredCorrection}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{issue.owner}</dd>
            </div>
            <div>
              <dt>Authority</dt>
              <dd>{issue.authorityToChange}</dd>
            </div>
            <div>
              <dt>Exception</dt>
              <dd>{issue.exceptionCapability}</dd>
            </div>
            <div>
              <dt>Response</dt>
              <dd>
                {issue.responseRecorded
                  ? `${issue.responseRecorded.action} · ${issue.responseRecorded.by} · ${issue.responseRecorded.at} · acknowledged (demo), not corrected`
                  : issue.responseCapability}
              </dd>
            </div>
            <div>
              <dt>Dispatch</dt>
              <dd>{issue.dispatchImpact}</dd>
            </div>
            <div>
              <dt>DQF</dt>
              <dd>{issue.dqfImpact}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{issue.nextStep}</dd>
            </div>
            <div>
              <dt>Recheck</dt>
              <dd>{issue.recheck}</dd>
            </div>
          </dl>
          {issue.actionHref ? (
            <p style={{ margin: "0.55rem 0 0" }}>
              <Link href={issue.actionHref} className="bof-link-primary">
                {issue.actionLabel ?? "Open record"}
              </Link>
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
