import Link from "next/link";
import type { EngineDocument } from "@/lib/document-engine";
import type { PretripTabletModel } from "@/lib/pretrip-tablet";
import { LoadRouteMapClient } from "@/components/LoadRouteMapClient";
import { DocumentEnginePanel } from "@/components/DocumentEnginePanel";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";

function statusIconClass(s: string) {
  if (s === "OK") return "bof-tablet-ic bof-tablet-ic-ok";
  if (s === "Warning") return "bof-tablet-ic bof-tablet-ic-warn";
  return "bof-tablet-ic bof-tablet-ic-miss";
}

function tagClass(s: string) {
  if (s === "OK") return "bof-tablet-tag bof-tablet-tag-ok";
  if (s === "Warning") return "bof-tablet-tag bof-tablet-tag-warn";
  return "bof-tablet-tag bof-tablet-tag-miss";
}

function defaultActionLabel(
  kind: "view" | "upload" | "resolve" | undefined,
  fallback?: string
) {
  if (fallback) return fallback;
  if (kind === "upload") return "Upload";
  if (kind === "resolve") return "Resolve";
  return "View";
}

type Props = {
  model: PretripTabletModel;
  loadId: string;
  pretripEngineDocs: EngineDocument[];
  startDisabled: boolean;
};

export function PretripTabletDashboard({
  model,
  loadId,
  pretripEngineDocs,
  startDisabled,
}: Props) {
  const resolveHref = `/loads/${loadId}#document-engine`;
  const isBlocked = model.overall === "BLOCKED";

  return (
    <div className="bof-tablet-shell">
      <header className="bof-tablet-header">
        <div className="bof-tablet-header-id">
          <DriverAvatar
            name={model.driverName}
            photoUrl={driverPhotoPath(model.driverId)}
            size={64}
          />
          <div className="bof-tablet-header-text">
            <p className="bof-tablet-kicker">BOF pre-trip tablet</p>
            <h1 className="bof-tablet-driver-name">{model.driverName}</h1>
            <div className="bof-tablet-meta-row">
              <span className="bof-tablet-meta-pill">
                Truck <strong>{model.assetId}</strong>
              </span>
              <span className="bof-tablet-meta-pill">
                Load <strong>{model.loadNumber}</strong>{" "}
                <code className="bof-code bof-tablet-code">{model.loadId}</code>
              </span>
            </div>
            <p className="bof-tablet-route" title="Route">
              <span className="bof-tablet-route-origin">{model.origin}</span>
              <span className="bof-tablet-route-arrow" aria-hidden>
                →
              </span>
              <span className="bof-tablet-route-dest">{model.destination}</span>
            </p>
          </div>
        </div>
        <div
          className={
            model.overall === "READY"
              ? "bof-tablet-status-pill bof-tablet-status-pill--ready"
              : "bof-tablet-status-pill bof-tablet-status-pill--blocked"
          }
          role="status"
          aria-live="polite"
        >
          {model.overall === "READY" ? "READY" : "BLOCKED"}
        </div>
      </header>

      {model.dispatchPhaseMessage && (
        <p className="bof-tablet-phase-note" role="note">
          {model.dispatchPhaseMessage}
        </p>
      )}

      <section
        className={
          isBlocked
            ? "bof-tablet-primary-card bof-tablet-primary-card--blocked"
            : "bof-tablet-primary-card bof-tablet-primary-card--ready"
        }
        aria-labelledby="tablet-primary-status"
      >
        <div className="bof-tablet-primary-head">
          <h2 id="tablet-primary-status" className="bof-tablet-primary-title">
            {isBlocked ? "Blocked — dispatch gate closed" : "Ready for dispatch"}
          </h2>
          <p className="bof-tablet-primary-sub">
            {isBlocked
              ? "Resolve missing proof, compliance, or RF items before starting."
              : "All pre-trip gates passed for this load phase."}
          </p>
        </div>
        {model.blockReasons.length > 0 && (
          <ul className="bof-tablet-reasons" aria-label="Blocking reasons">
            {model.blockReasons.map((r, i) => (
              <li key={`${r}-${i}`}>{r}</li>
            ))}
          </ul>
        )}
        {isBlocked && (
          <div className="bof-tablet-primary-cta-wrap">
            <Link href={resolveHref} className="bof-tablet-resolve-cta">
              Resolve issues to start load
            </Link>
          </div>
        )}
      </section>

      <div className="bof-tablet-control-row">
        <button
          type="button"
          className="bof-tablet-start-btn"
          disabled={startDisabled}
        >
          Start load
        </button>
        <div className="bof-tablet-quick-links">
          <Link href={`/drivers/${model.driverId}`} className="bof-tablet-quick-link">
            Driver
          </Link>
          <Link href={`/loads/${loadId}`} className="bof-tablet-quick-link">
            Load detail
          </Link>
          <Link href="/documents" className="bof-tablet-quick-link">
            Documents
          </Link>
          <Link href="/rf-actions" className="bof-tablet-quick-link">
            RF actions
          </Link>
          <Link href="/settlements" className="bof-tablet-quick-link">
            Settlements
          </Link>
          <Link href="/money-at-risk" className="bof-tablet-quick-link">
            Money at risk
          </Link>
        </div>
      </div>

      <div className="bof-tablet-sections-grid">
        {model.sections.map((sec) =>
          sec.id === "route-intel" ? null : (
            <section
              key={sec.id}
              className="bof-tablet-section-card"
              aria-labelledby={`tablet-sec-${sec.id}`}
            >
              <div className="bof-tablet-section-head">
                <span className="bof-tablet-section-letter" aria-hidden>
                  {sec.letter}
                </span>
                <h2 id={`tablet-sec-${sec.id}`} className="bof-tablet-section-title">
                  {sec.title}
                </h2>
              </div>
              <ul className="bof-tablet-item-list">
                {sec.lines.map((ln) => (
                  <li key={ln.id} className="bof-tablet-item">
                    <span
                      className={statusIconClass(ln.status)}
                      title={ln.status}
                      aria-hidden
                    />
                    <div className="bof-tablet-item-body">
                      <Link href={ln.href} className="bof-tablet-item-label">
                        {ln.label}
                      </Link>
                      <div className="bof-tablet-item-meta">
                        <span className={tagClass(ln.status)}>{ln.status}</span>
                        {ln.critical && (
                          <span className="bof-tablet-tag bof-tablet-tag-crit">
                            Gate
                          </span>
                        )}
                      </div>
                      <Link
                        href={ln.href}
                        className={`bof-tablet-tap-btn bof-tablet-tap-btn--${ln.actionKind ?? "view"}`}
                      >
                        {defaultActionLabel(ln.actionKind, ln.actionLabel)}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        )}
      </div>

      {model.sections
        .filter((s) => s.id === "route-intel")
        .map((sec) => (
          <section
            key={sec.id}
            className="bof-tablet-section-card bof-tablet-section-card--route"
            aria-labelledby={`tablet-sec-${sec.id}`}
          >
            <div className="bof-tablet-section-head">
              <span className="bof-tablet-section-letter" aria-hidden>
                {sec.letter}
              </span>
              <h2 id={`tablet-sec-${sec.id}`} className="bof-tablet-section-title">
                {sec.title}
              </h2>
            </div>
            <ul className="bof-tablet-item-list bof-tablet-item-list--inline">
              {sec.lines.map((ln) => (
                <li key={ln.id} className="bof-tablet-item bof-tablet-item--compact">
                  <span className={statusIconClass(ln.status)} aria-hidden />
                  <div className="bof-tablet-item-body">
                    <span className="bof-tablet-item-label-text">{ln.label}</span>
                    <span className={tagClass(ln.status)}>{ln.status}</span>
                    <Link
                      href={ln.href}
                      className={`bof-tablet-tap-btn bof-tablet-tap-btn--sm bof-tablet-tap-btn--${ln.actionKind ?? "view"}`}
                    >
                      {defaultActionLabel(ln.actionKind, ln.actionLabel)}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <p className="bof-tablet-map-lead bof-muted bof-small">
              Route risk overlay — same map as load detail (demo).
            </p>
            {model.routeMapModel ? (
              <LoadRouteMapClient model={model.routeMapModel} />
            ) : (
              <p className="bof-muted bof-small">Map unavailable.</p>
            )}
          </section>
        ))}

      <DocumentEnginePanel
        title="Load documents — automation packet"
        lead="Pre-trip subset of generated forms. Cross-links to driver, load, RF, and settlements."
        documents={pretripEngineDocs}
        crossLinks={[
          { label: "Driver profile", href: `/drivers/${model.driverId}` },
          { label: "Load detail + proofs", href: `/loads/${loadId}` },
          { label: "Document vault", href: "/documents" },
          { label: "RF actions", href: "/rf-actions" },
          { label: "Settlements", href: "/settlements" },
        ]}
      />
    </div>
  );
}
