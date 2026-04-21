"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildTripReleaseEvaluation,
  listTripReleaseEngineDocs,
  tripReleaseCanRelease,
  type TripReleaseEvaluation,
} from "@/lib/trip-release";
import type { EngineDocument } from "@/lib/document-engine";
import { RouteSupportWidget } from "@/components/route-support/RouteSupportWidget";
import { DieselRouteInsightWidget } from "@/components/fuel/DieselRouteInsightWidget";
import { getLoadProofItems, getLoadProofSummary } from "@/lib/load-proof";
import { BofAdvantageCard, BofAdvantageStrip } from "@/components/bof-advantage/BofAdvantageCard";

function firstHref(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (c && String(c).trim().length > 0) return c;
  }
  return undefined;
}

function docByType(docs: EngineDocument[], type: string) {
  return docs.find((d) => d.type === type);
}

function fmtDt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function packetReadinessLabel(ev: TripReleaseEvaluation): string {
  const o = ev.load_packet_status;
  if (o === "Ready") return "Ready";
  if (o === "Missing") return "Missing required items";
  if (o === "Incomplete") return "Incomplete";
  return o;
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "bad" | "muted" }) {
  const cls =
    tone === "ok"
      ? "trip-release-chip trip-release-chip-ok"
      : tone === "warn"
        ? "trip-release-chip trip-release-chip-warn"
        : tone === "bad"
          ? "trip-release-chip trip-release-chip-bad"
          : "trip-release-chip trip-release-chip-muted";
  return <span className={cls}>{children}</span>;
}

export function DriverTripReleaseClient({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [releasedFlash, setReleasedFlash] = useState<string | null>(null);

  const ev = useMemo(() => buildTripReleaseEvaluation(data, loadId), [data, loadId]);

  const proofSummary = useMemo(() => {
    if (!data.loads.some((l) => l.id === loadId)) return null;
    return getLoadProofSummary(getLoadProofItems(data, loadId));
  }, [data, loadId]);

  const engineDocs = useMemo(() => {
    if (!ev) return [];
    return listTripReleaseEngineDocs(data, loadId);
  }, [data, loadId, ev]);

  const onSaveProgress = useCallback(() => {
    setSavedFlash("Marked in progress (demo — not persisted to server).");
    setReleasedFlash(null);
    window.setTimeout(() => setSavedFlash(null), 4000);
  }, []);

  const onRelease = useCallback(() => {
    if (!ev || !tripReleaseCanRelease(ev)) return;
    setReleasedFlash("Trip release recorded (demo UI only — wire to TMS / telematics in production).");
    setSavedFlash(null);
    window.setTimeout(() => setReleasedFlash(null), 5000);
  }, [ev]);

  if (!ev) {
    return (
      <div className="bof-page trip-release-page">
        <p className="bof-muted">
          Load <code className="bof-code">{loadId}</code> not found.
        </p>
        <Link href="/loads" className="bof-link-secondary">
          Back to loads
        </Link>
      </div>
    );
  }

  const canRelease = tripReleaseCanRelease(ev);
  const pretripChecklist = docByType(engineDocs, "Pre-Trip Checklist");
  const cargoRecord = docByType(engineDocs, "Cargo Photo Record");
  const hrefPretripReport = firstHref(pretripChecklist?.fileUrl, cargoRecord?.fileUrl, `/pretrip/${loadId}`);
  const hrefBol = firstHref(ev.dispatch_load.bol_url, docByType(engineDocs, "BOL")?.fileUrl);
  const hrefRate = firstHref(ev.dispatch_load.rate_con_url, docByType(engineDocs, "Rate Confirmation")?.fileUrl);
  const hrefPodReq = `/loads/${loadId}#document-engine`;
  const hrefPacket = `/shipper-portal/${loadId}`;

  const bannerTone =
    ev.trip_release_status === "Cleared"
      ? "cleared"
      : ev.trip_release_status === "At Risk"
        ? "risk"
        : "blocked";

  const blockers = ev.checks.filter((c) => c.severity === "blocking");
  const warns = ev.checks.filter((c) => c.severity === "warning");

  return (
    <div className="bof-page trip-release-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <span>Trip release · {ev.load_number}</span>
      </nav>

      <header className="trip-release-header">
        <div>
          <h1 className="bof-title bof-title-tight">
            Driver trip release · Load <span className="trip-release-teal">{ev.load_number}</span>{" "}
            <code className="bof-code">{ev.load_id}</code>
          </h1>
          <p className="bof-muted bof-small">
            Operational go / no-go before departure — combines packet, driver, equipment, and pre-trip
            signals from BOF demo data.
          </p>
        </div>
      </header>

      <div className={`trip-release-banner trip-release-banner--${bannerTone}`}>
        <div className="trip-release-banner-row">
          <div>
            <p className="trip-release-banner-label">Trip release status</p>
            <p className="trip-release-banner-status">{ev.trip_release_status}</p>
            {ev.primary_block_reason && (
              <p className="trip-release-banner-reason">{ev.primary_block_reason}</p>
            )}
          </div>
          <div className="trip-release-banner-counts">
            <span>
              <strong>{ev.blocking_count}</strong> blocking
            </span>
            <span>
              <strong>{ev.warning_count}</strong> warnings
            </span>
          </div>
        </div>
        <p className="trip-release-banner-hint">
          Release Trip is enabled only when there are <strong>zero blocking items</strong>. When status is
          At Risk, warnings remain — operator judgment still applies.
        </p>
      </div>

      {savedFlash && <p className="trip-release-flash trip-release-flash-info">{savedFlash}</p>}
      {releasedFlash && <p className="trip-release-flash trip-release-flash-ok">{releasedFlash}</p>}

      <div className="trip-release-layout">
        <div className="trip-release-main">
          <RouteSupportWidget loadId={loadId} variant="full" />

          <DieselRouteInsightWidget loadId={loadId} variant="full" />

          {proofSummary && (
            <BofAdvantageStrip>
              <BofAdvantageCard
                eyebrow="BOF Advantage"
                title="Credentials & departure proof"
                subtitle={ev.driver_dispatch_eligibility}
                value={`${proofSummary.completeCount}/${proofSummary.applicableCount} proof lines complete (${proofSummary.completionPct}%)`}
                delta={
                  proofSummary.blockingCount === 0
                    ? "Required proof path clear of payment blockers"
                    : `${proofSummary.blockingCount} line(s) still block pay until resolved`
                }
                explanation="Counts from BOF load proof stack; credentials from dispatch + document engine rules on this evaluation."
                tone={proofSummary.blockingCount > 0 ? "caution" : "positive"}
              />
            </BofAdvantageStrip>
          )}

          <section className="trip-release-card" aria-labelledby="tr-overview">
            <h2 id="tr-overview" className="trip-release-card-title">
              Driver trip release overview
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Driver</th>
                  <td>
                    {ev.driver_name} <code className="bof-code">{ev.driver_id}</code>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Dispatch control</th>
                  <td>{ev.dispatch_ref}</td>
                </tr>
                <tr>
                  <th scope="row">Load</th>
                  <td>
                    <code className="bof-code">{ev.load_id}</code> · PRO {ev.load_number}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Tractor</th>
                  <td>{ev.tractor_unit}</td>
                </tr>
                <tr>
                  <th scope="row">Trailer</th>
                  <td>{ev.trailer_unit}</td>
                </tr>
                <tr>
                  <th scope="row">Origin</th>
                  <td>{ev.origin}</td>
                </tr>
                <tr>
                  <th scope="row">Destination</th>
                  <td>{ev.destination}</td>
                </tr>
                <tr>
                  <th scope="row">Pickup</th>
                  <td>{fmtDt(ev.pickup_datetime)}</td>
                </tr>
                <tr>
                  <th scope="row">Delivery</th>
                  <td>{fmtDt(ev.delivery_datetime)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-shipper">
            <h2 id="tr-shipper" className="trip-release-card-title">
              Load / shipper packet
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Shipper</th>
                  <td>{ev.shipper_name}</td>
                </tr>
                <tr>
                  <th scope="row">Facility / window</th>
                  <td>{ev.facility_appointment}</td>
                </tr>
                <tr>
                  <th scope="row">Commodity</th>
                  <td>{ev.commodity}</td>
                </tr>
                <tr>
                  <th scope="row">Weight / pallets</th>
                  <td>{ev.weight_pallets}</td>
                </tr>
                <tr>
                  <th scope="row">Equipment</th>
                  <td>{ev.equipment_type}</td>
                </tr>
                <tr>
                  <th scope="row">Temperature</th>
                  <td>{ev.temperature_requirement}</td>
                </tr>
                <tr>
                  <th scope="row">Seal required</th>
                  <td>{ev.seal_required ? "Yes" : "Not indicated"}</td>
                </tr>
                <tr>
                  <th scope="row">Photo requirements</th>
                  <td>{ev.photo_requirements_summary}</td>
                </tr>
                <tr>
                  <th scope="row">BOL / dock instructions</th>
                  <td>{ev.bol_instructions}</td>
                </tr>
                <tr>
                  <th scope="row">POD</th>
                  <td>{ev.pod_requirements_summary}</td>
                </tr>
                <tr>
                  <th scope="row">Accessorial / lumper</th>
                  <td>{ev.accessorial_lumper_summary}</td>
                </tr>
                <tr>
                  <th scope="row">Load packet readiness</th>
                  <td>
                    <Chip tone={ev.load_packet_missing_count === 0 && ev.load_packet_status === "Ready" ? "ok" : "warn"}>
                      {packetReadinessLabel(ev)}
                    </Chip>{" "}
                    <span className="bof-muted bof-small">
                      ({ev.load_packet_missing_count} missing line
                      {ev.load_packet_missing_count === 1 ? "" : "s"} on packet rules)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="trip-release-actions">
              <a href={hrefPacket}>Open load packet</a>
              <a href={hrefBol} target="_blank" rel="noreferrer">
                Open BOL
              </a>
              <a href={hrefRate} target="_blank" rel="noreferrer">
                Open rate confirmation
              </a>
              <a href={hrefPodReq}>Open POD requirements</a>
            </div>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-driver">
            <h2 id="tr-driver" className="trip-release-card-title">
              Driver qualification
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">CDL</th>
                  <td>{ev.cdl_status_label}</td>
                </tr>
                <tr>
                  <th scope="row">Med card</th>
                  <td>{ev.med_status_label}</td>
                </tr>
                <tr>
                  <th scope="row">MVR</th>
                  <td>{ev.mvr_status_label}</td>
                </tr>
                <tr>
                  <th scope="row">Endorsements (CDL row)</th>
                  <td>{ev.endorsements_display}</td>
                </tr>
                <tr>
                  <th scope="row">TWIC</th>
                  <td>{ev.twic_display}</td>
                </tr>
                <tr>
                  <th scope="row">HazMat</th>
                  <td>{ev.hazmat_display}</td>
                </tr>
                <tr>
                  <th scope="row">Dispatch eligibility</th>
                  <td>{ev.driver_dispatch_eligibility}</td>
                </tr>
              </tbody>
            </table>
            <div className="trip-release-actions">
              <Link href={`/drivers/${ev.driver_id}#document-engine`}>Open driver credentials</Link>
            </div>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-asset">
            <h2 id="tr-asset" className="trip-release-card-title">
              Tractor / trailer readiness
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Tractor status</th>
                  <td>{ev.tractor_status}</td>
                </tr>
                <tr>
                  <th scope="row">Trailer status</th>
                  <td>{ev.trailer_status}</td>
                </tr>
                <tr>
                  <th scope="row">Tractor inspection / MAR</th>
                  <td>{ev.tractor_inspection_display}</td>
                </tr>
                <tr>
                  <th scope="row">Trailer inspection</th>
                  <td>{ev.trailer_inspection_display}</td>
                </tr>
                <tr>
                  <th scope="row">Trailer type</th>
                  <td>{ev.trailer_type_display}</td>
                </tr>
                <tr>
                  <th scope="row">Seal chain</th>
                  <td>{ev.trailer_seal_display}</td>
                </tr>
                <tr>
                  <th scope="row">Summary</th>
                  <td>{ev.asset_readiness_summary}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-pretrip">
            <h2 id="tr-pretrip" className="trip-release-card-title">
              Pre-trip inspection &amp; proof
            </h2>
            <p className="trip-release-card-lead">{ev.checklist_summary}</p>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Pre-trip phase</th>
                  <td>
                    <Chip
                      tone={
                        ev.pretrip_phase === "Complete"
                          ? "ok"
                          : ev.pretrip_phase === "Exception Review Needed"
                            ? "bad"
                            : "warn"
                      }
                    >
                      {ev.pretrip_phase}
                    </Chip>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Cargo photos (proof line)</th>
                  <td>{ev.cargo_photo_status}</td>
                </tr>
                <tr>
                  <th scope="row">Pickup photo (packet URL)</th>
                  <td>{ev.pickup_photo_status}</td>
                </tr>
                <tr>
                  <th scope="row">Seal photos (proof lines)</th>
                  <td>{ev.seal_photo_status}</td>
                </tr>
                <tr>
                  <th scope="row">Seal numbers</th>
                  <td>{ev.seal_number_display}</td>
                </tr>
                <tr>
                  <th scope="row">Exception flag</th>
                  <td>{ev.pretrip_exception_flag ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <th scope="row">Notes</th>
                  <td>{ev.pretrip_notes}</td>
                </tr>
              </tbody>
            </table>
            <div className="trip-release-actions">
              <a href={hrefPretripReport} target="_blank" rel="noreferrer">
                Open pre-trip inspection report
              </a>
              <Link href={`/pretrip/${loadId}`}>Pre-trip tablet</Link>
              <Link href={`/loads/${loadId}#document-engine`}>Upload / proof stack</Link>
              <Link href={`/loads/${loadId}`}>Resolve exception on load</Link>
            </div>
          </section>
        </div>

        <aside className="trip-release-side" aria-labelledby="tr-panel">
          <h2 id="tr-panel" className="trip-release-card-title">
            Blockers &amp; warnings
          </h2>
          {blockers.length === 0 && warns.length === 0 ? (
            <p className="bof-muted bof-small">No checklist items on this evaluation.</p>
          ) : (
            <>
              {blockers.length > 0 && (
                <div className="trip-release-panel-block">
                  <h3 className="trip-release-panel-sub">Blocking</h3>
                  <ul className="trip-release-checklist">
                    {blockers.map((c) => (
                      <li key={c.check_id} className="trip-release-check-item trip-release-check-item--block">
                        <span className="trip-release-check-cat">{c.category}</span>
                        <p>{c.message}</p>
                        {c.fixHref && (
                          <a href={c.fixHref} className="trip-release-fix">
                            {c.fixLabel ?? "Fix now"}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {warns.length > 0 && (
                <div className="trip-release-panel-block">
                  <h3 className="trip-release-panel-sub">Warnings</h3>
                  <ul className="trip-release-checklist">
                    {warns.map((c) => (
                      <li key={c.check_id} className="trip-release-check-item trip-release-check-item--warn">
                        <span className="trip-release-check-cat">{c.category}</span>
                        <p>{c.message}</p>
                        {c.fixHref && (
                          <a href={c.fixHref} className="trip-release-fix">
                            {c.fixLabel ?? "Review"}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      <footer className="trip-release-footer">
        <button
          type="button"
          className="trip-release-btn trip-release-btn-primary"
          disabled={!canRelease}
          title={!canRelease ? "Resolve all blocking items to enable release" : undefined}
          onClick={onRelease}
        >
          Release trip
        </button>
        <button type="button" className="trip-release-btn trip-release-btn-secondary" onClick={onSaveProgress}>
          Save as in progress
        </button>
        <Link href="/dispatch" className="trip-release-btn trip-release-btn-secondary">
          Open dispatch packet
        </Link>
        {!canRelease && (
          <p className="trip-release-footer-note">
            Driver cannot pull off until blocking count is zero. Address items in the panel above or via linked
            workflows.
          </p>
        )}
      </footer>

      <p className="bof-muted bof-small" style={{ marginTop: "1rem" }}>
        <Link href={`/loads/${loadId}`} className="bof-link-secondary">
          Load detail
        </Link>
        {" · "}
        <Link href={`/shipper-portal/${loadId}`} className="bof-link-secondary">
          Shipper portal
        </Link>
      </p>
    </div>
  );
}
