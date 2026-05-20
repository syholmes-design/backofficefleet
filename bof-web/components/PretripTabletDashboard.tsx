import Link from "next/link";
import type { PretripTabletModel } from "@/lib/pretrip-tablet";
import type { LoadArtifactPacket } from "@/lib/load-artifact-registry";
import { LoadRouteMapClient } from "@/components/LoadRouteMapClient";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { LoadPacketControlPanel } from "@/components/load-artifacts/LoadPacketControlPanel";

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
  artifactPacket: LoadArtifactPacket | null;
  loadOptions: {
    loadId: string;
    loadNumber: string;
    status: string;
    driverName: string;
    routeLabel: string;
  }[];
  startDisabled: boolean;
};

function tripPhase(status: string) {
  if (status === "Pending") {
    return {
      label: "Pre-trip",
      tone: "ready",
      title: "Pre-trip packet and inspection",
      summary:
        "Line up documents, driver credentials, equipment inspection, route requirements, proof photos, and dispatch release before departure.",
      cta: "Open pre-trip packet",
      selectorHint: "Best live signoff example",
    };
  }
  if (status === "En Route") {
    return {
      label: "En route",
      tone: "review",
      title: "En-route operations and packet record",
      summary:
        "Monitor weather, traffic, HOS, fuel, rest stops, route exceptions, speeding or safety alerts, while keeping pre-trip approvals available for review.",
      cta: "Open en-route packet record",
      selectorHint: "Active trip monitoring",
    };
  }
  if (status === "Delivered") {
    return {
      label: "Post-trip",
      tone: "complete",
      title: "Post-trip proof and settlement packet",
      summary:
        "Confirm POD, BOL, seal, cargo, lumper, claim, factoring, and settlement documents after delivery.",
      cta: "Open post-trip proof packet",
      selectorHint: "Proof and settlement review",
    };
  }
  return {
    label: status,
    tone: "review",
    title: "Trip packet review",
    summary: "Review the current packet, documents, proof records, and operational actions for this load.",
    cta: "Open packet review",
    selectorHint: "Packet review",
  };
}

function phaseBadgeClass(status: string, active = false) {
  const phase = tripPhase(status);
  if (phase.tone === "ready") {
    return active
      ? "border-emerald-300 bg-emerald-500/15 text-emerald-100"
      : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  }
  if (phase.tone === "complete") {
    return active
      ? "border-sky-300 bg-sky-500/15 text-sky-100"
      : "border-sky-400/40 bg-sky-500/10 text-sky-200";
  }
  return active
    ? "border-amber-300 bg-amber-500/15 text-amber-100"
    : "border-amber-400/40 bg-amber-500/10 text-amber-200";
}

export function PretripTabletDashboard({
  model,
  loadId,
  artifactPacket,
  loadOptions,
  startDisabled,
}: Props) {
  const needsPacketReview = model.overall === "BLOCKED";
  const phase = tripPhase(model.loadStatus);

  return (
    <div className="bof-tablet-shell">
      <section className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              Pre-trip load selector
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Review any active packet</h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose one of the 12 load packets. The driver view changes by trip phase: pre-trip setup,
              en-route monitoring, or post-trip proof and settlement review.
            </p>
          </div>
          <Link
            href="/dispatch"
            className="rounded-md border border-teal-500/60 bg-teal-500/10 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-500/20"
          >
            Back to dispatch board
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loadOptions.map((option) => {
            const active = option.loadId === loadId;
            const optionPhase = tripPhase(option.status);
            return (
              <a
                key={option.loadId}
                href={`/pretrip/${option.loadId}`}
                className={[
                  "rounded-lg border p-3 transition hover:border-teal-300 hover:bg-teal-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300",
                  active ? "border-teal-300 bg-teal-500/10" : "border-slate-800 bg-slate-900/60",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-black text-teal-200">{option.loadId}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${phaseBadgeClass(option.status, active)}`}>
                    {optionPhase.label}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-white">Load {option.loadNumber}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{option.driverName}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{option.routeLabel}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {optionPhase.selectorHint}
                </p>
              </a>
            );
          })}
        </div>
      </section>

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
                to
              </span>
              <span className="bof-tablet-route-dest">{model.destination}</span>
            </p>
          </div>
        </div>
        <div
          className={
            model.loadStatus === "Pending"
              ? "bof-tablet-status-pill bof-tablet-status-pill--ready"
              : "bof-tablet-status-pill bof-tablet-status-pill--blocked"
          }
          role="status"
          aria-live="polite"
        >
          {phase.label}
        </div>
      </header>

      {model.dispatchPhaseMessage && (
        <p className="bof-tablet-phase-note" role="note">
          {model.dispatchPhaseMessage}
        </p>
      )}

      <section
        className={
          needsPacketReview
            ? "bof-tablet-primary-card bof-tablet-primary-card--blocked"
            : "bof-tablet-primary-card bof-tablet-primary-card--ready"
        }
        aria-labelledby="tablet-primary-status"
      >
        <div className="bof-tablet-primary-head">
          <h2 id="tablet-primary-status" className="bof-tablet-primary-title">
            {phase.title}
          </h2>
          <p className="bof-tablet-primary-sub">
            {phase.summary}
          </p>
        </div>
        {model.blockReasons.length > 0 && (
          <ul className="bof-tablet-reasons" aria-label="Packet review items">
            {model.blockReasons.map((r, i) => (
              <li key={`${r}-${i}`}>{r}</li>
            ))}
          </ul>
        )}
        {needsPacketReview && (
          <div className="bof-tablet-primary-cta-wrap">
            <Link href="#pretrip-artifact-packet" className="bof-tablet-resolve-cta">
              {phase.cta}
            </Link>
          </div>
        )}
      </section>

      <div className="bof-tablet-control-row">
        {startDisabled ? (
          <Link href="#pretrip-artifact-packet" className="bof-tablet-start-btn">
            {phase.cta}
          </Link>
        ) : (
          <button type="button" className="bof-tablet-start-btn">
            Start load
          </button>
        )}
        <div className="bof-tablet-quick-links">
          <Link href={`/drivers/${model.driverId}/dispatch`} className="bof-tablet-quick-link">
            Driver dispatch
          </Link>
          <Link href={`/loads/${loadId}`} className="bof-tablet-quick-link">
            Manager load file
          </Link>
          <Link href="#pretrip-artifact-packet" className="bof-tablet-quick-link">
            Packet docs
          </Link>
          <Link href={`/trip-release/${loadId}`} className="bof-tablet-quick-link">
            Trip release
          </Link>
          <Link href={`/drivers/${model.driverId}/settlements`} className="bof-tablet-quick-link">
            Driver settlement
          </Link>
          <Link href={`/money-at-risk?loadId=${loadId}`} className="bof-tablet-quick-link">
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
              Route risk overlay - same map as load detail.
            </p>
            {model.routeMapModel ? (
              <LoadRouteMapClient model={model.routeMapModel} />
            ) : (
              <p className="bof-muted bof-small">Map unavailable.</p>
            )}
          </section>
        ))}

      <div id="pretrip-artifact-packet">
        <LoadPacketControlPanel
          packet={artifactPacket}
          mode="pretrip"
          loadId={model.loadId}
          driverName={model.driverName}
          dispatcherName="dispatch"
        />
      </div>
    </div>
  );
}
