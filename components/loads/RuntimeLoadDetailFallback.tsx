"use client";

import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { getCanonicalDispatchLoadState } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { getDriverOperatingIssuePaths } from "@/lib/driver-operating-issue-path";
import { DriverOperatingIssuePathList } from "@/components/drivers/DriverOperatingIssuePathList";
import { LoadProcessIntelligencePanel } from "@/components/loads/LoadProcessIntelligencePanel";
import { getLoadProofItems } from "@/lib/load-proof";
import { getCanonicalLoadEvidenceForLoad } from "@/lib/canonical-load-evidence";
import { allMaintenanceAssetIds } from "@/lib/maintenance-data";
import { DemoBackButton } from "@/components/navigation/DemoBackButton";
import { getCanonicalLoadStory, normalizeCanonicalLoadId } from "@/lib/canonical-load-stories";

export function RuntimeLoadDetailFallback({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const canonicalId = /^PI-TEST-/i.test(loadId) ? loadId : normalizeCanonicalLoadId(loadId);
  const rawLoad = data.loads.find((l) => l.id === canonicalId || l.id === loadId || l.number === loadId);

  if (!rawLoad) {
    return (
      <div className="bof-page bg-slate-50 text-slate-900 min-h-screen p-6">
        <h1 className="text-2xl font-bold text-slate-950">Load {loadId}</h1>
        <p className="mt-2 text-sm text-slate-600">
          This identifier is not in demo seed data. Process intelligence below uses persisted operating events only.
        </p>
        <LoadProcessIntelligencePanel loadId={loadId} />
        <p className="mt-4">
          <Link href="/loads" className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Back to loads
          </Link>
        </p>
      </div>
    );
  }

  const canonicalStory = getCanonicalLoadStory(rawLoad.id);
  const pretripModel = buildPretripTabletModel(data, rawLoad.id);
  const proofItems = getLoadProofItems(data, rawLoad.id);
  const evidenceAssets = getCanonicalLoadEvidenceForLoad(data, rawLoad.id);

  const driver = data.drivers.find((d) => d.id === rawLoad.driverId);
  const driverName = driver?.name || pretripModel?.driverName || rawLoad.driverId;

  const settlement = data.settlements.find(
    (s) => (s as { loadId?: string }).loadId === rawLoad.id || s.driverId === rawLoad.driverId
  );

  const load = rawLoad as typeof rawLoad & {
    customerName?: string;
    brokerName?: string;
    commodity?: string;
    weight?: number;
    trailerNumber?: string;
    rateConfirmationNumber?: string;
    bolNumber?: string;
    pickupSeal?: string;
    deliverySeal?: string;
    settlementHold?: boolean;
    settlementHoldReason?: string;
    lumperAmount?: number;
    fuelSurcharge?: number;
    linehaulRate?: number;
    workOrderId?: string;
    dispatcherName?: string;
    invoiceNumber?: string;
  };

  const operating = getCanonicalDispatchLoadState(data, rawLoad.id);
  const isBlocked = operating?.pretripOverall === "BLOCKED" || operating?.releaseDisposition === "HOLD";
  const dispatchGateState =
    operating?.releaseDisposition === "HOLD"
      ? "HARD BLOCK"
      : operating?.releaseDisposition === "REVIEW"
        ? "REVIEW REQUIRED"
        : "RELEASED / READY";
  const dispatchGateReason = operating?.releaseSummary ?? "Canonical operating state is not available for this load.";
  const maintenanceBlocker = operating?.blockers.find((row) => row.source === "maintenance");
  const conversationHref = `/operational-chat?recordType=LOAD&recordId=${encodeURIComponent(rawLoad.id)}`;
  const exceptionHref = `/dispatch?view=exceptions&loadId=${encodeURIComponent(rawLoad.id)}`;
  const maintenanceHref = load.assetId && allMaintenanceAssetIds().includes(load.assetId) ? `/maintenance/${load.assetId}` : "/maintenance";

  return (
    <div className="bof-page bg-slate-50 text-slate-900 min-h-screen overflow-x-hidden py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <DemoBackButton fallbackHref="/loads" />
      </div>

      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
        <Link href="/loads" className="font-semibold text-slate-700 hover:text-slate-950 hover:underline">
          Loads / Dispatch
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-bold text-slate-950">Load {load.id} (Ref: {load.number || "501"})</span>
      </nav>

      {/* Hero Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Load {load.id}</h1>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                load.status === "Delivered" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                load.status === "En Route" ? "border-sky-300 bg-sky-100 text-sky-800" :
                "border-amber-300 bg-amber-100 text-amber-800"
              }`}>
                Status: {load.status}
              </span>

              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                !isBlocked ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"
              }`}>
                Pre-Trip: {isBlocked ? "BLOCKED" : "READY"}
              </span>

              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                dispatchGateState === "RELEASED / READY" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                dispatchGateState === "REVIEW REQUIRED" ? "border-amber-300 bg-amber-100 text-amber-800" :
                "border-rose-300 bg-rose-100 text-rose-800"
              }`}>
                Gate: {dispatchGateState}
              </span>
            </div>

            <p className="mt-2 text-lg font-semibold text-slate-800">
              {load.origin} → {load.destination}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>Customer: <strong className="text-slate-950">{load.customerName || "Peachtree Foods"}</strong></span>
              {load.brokerName ? <span>Broker: <strong className="text-slate-950">{load.brokerName}</strong></span> : null}
              {load.commodity ? <span>Commodity: <strong className="text-slate-950">{load.commodity}</strong></span> : null}
              {load.weight ? <span>Weight: <strong className="text-slate-950">{load.weight.toLocaleString()} lbs</strong></span> : null}
              <span>Revenue: <strong className="text-emerald-700 font-bold">${load.revenue?.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/pretrip/${load.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:bg-teal-100"
            >
              Pre-trip tablet
            </Link>
            <Link
              href={`/trip-release/${load.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
            >
              Trip release
            </Link>
            <Link
              href={`/dispatch?loadId=${load.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-900 transition hover:bg-sky-100"
            >
              Dispatch board
            </Link>
            <Link
              href={conversationHref}
              className="inline-flex items-center justify-center rounded-lg border border-teal-300 bg-white px-4 py-2 text-sm font-bold text-teal-900 transition hover:bg-teal-50"
            >
              Conversations
            </Link>
            {operating?.needsAttention ? (
              <Link
                href={exceptionHref}
                className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-100"
              >
                Review exception
              </Link>
            ) : null}
          </div>
        </div>

        {/* Assignments & Reference Bar */}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Driver</span>
            <p className="mt-1 text-base font-bold text-slate-950">
              {driverName} ({load.driverId})
            </p>
            <Link href={`/drivers/${load.driverId}`} className="mt-1 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View driver profile →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Power Unit &amp; Trailer</span>
            <p className="mt-1 text-base font-bold text-slate-950">
              Truck: {load.assetId || "T-102"} · {load.trailerNumber || "TRL-2854"}
            </p>
            <Link href={maintenanceHref} className="mt-1 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View maintenance status →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch &amp; Seals</span>
            <p className="mt-1 text-xs text-slate-800 font-semibold">
              Dispatcher: {load.dispatcherName || "Tina Brooks"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Pickup Seal: <strong className="font-mono text-slate-900">{load.pickupSeal || "SEAL-83921"}</strong>
            </p>
            <p className="text-xs text-slate-600">
              Delivery Seal: <strong className="font-mono text-slate-900">{load.deliverySeal || "SEAL-83920"}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document References</span>
            <p className="mt-1 text-xs font-mono font-medium text-slate-900">
              Rate Con: {load.rateConfirmationNumber || "RC-501-204"}
            </p>
            <p className="text-xs font-mono font-medium text-slate-900">
              BOL: {load.bolNumber || "BOL-501-9935"}
            </p>
            <p className="text-xs font-mono font-medium text-slate-900">
              Invoice: {load.invoiceNumber || `INV-${load.id}`}
            </p>
          </div>
        </div>
      </section>

      <LoadProcessIntelligencePanel loadId={load.id} />

      {/* Operational Dispatch Gate & Exceptions Section */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Dispatch Release Gate &amp; Operational Controls</h2>
            <p className="text-sm text-slate-600">Gate condition evaluating pre-trip readiness, driver credentials, vehicle safety, and required proof.</p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            dispatchGateState === "RELEASED / READY" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
            dispatchGateState === "REVIEW REQUIRED" ? "border-amber-300 bg-amber-100 text-amber-800" :
            "border-rose-300 bg-rose-100 text-rose-800"
          }`}>
            {dispatchGateState}
          </span>
        </div>

        <div className={`rounded-xl border p-4 mb-4 ${
          dispatchGateState === "RELEASED / READY" ? "border-emerald-200 bg-emerald-50 text-emerald-900" :
          dispatchGateState === "REVIEW REQUIRED" ? "border-amber-200 bg-amber-50 text-amber-900" :
          "border-rose-200 bg-rose-50 text-rose-900"
        }`}>
          <p className="text-sm font-bold">Gate Condition Summary:</p>
          <p className="mt-1 text-xs font-medium">{dispatchGateReason}</p>
        </div>

        {load.driverId ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <DriverOperatingIssuePathList
              issues={getDriverOperatingIssuePaths(data, load.driverId)}
              compact
              heading="Assigned driver document path"
            />
            <p className="mt-2 text-xs text-slate-500">
              Driver qualification issues come from existing DQF and eligibility helpers. Load HOLD/REVIEW above is the canonical dispatch operating state and is not replaced.
            </p>
          </div>
        ) : null}

        {/* Linked Operational Records */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Maintenance</span>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {maintenanceBlocker?.label ?? "No canonical maintenance blocker"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {maintenanceBlocker?.detail ?? `Asset ${load.assetId ?? "unassigned"}`}
            </p>
            <Link href={maintenanceHref} className="mt-2 inline-block text-xs font-semibold text-teal-800 hover:underline">
              Open asset maintenance →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Safety Events</span>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {canonicalStory?.safetyEventId ? `${canonicalStory.safetyEventId}: ${canonicalStory.primaryIssue}` : "No active safety incidents"}
            </p>
            {canonicalStory?.claimId ? (
              <p className="mt-1 text-xs font-semibold text-rose-700">
                Claim: {canonicalStory.claimId} (${canonicalStory.claimAmount?.toLocaleString()})
              </p>
            ) : null}
            <Link href={`/drivers/${load.driverId}#safety-events`} className="mt-2 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View driver safety log →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Settlement &amp; Payroll Closeout</span>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {load.settlementHold ? "⚠️ SETTLEMENT HOLD ACTIVE" : "RELEASED FOR SETTLEMENT"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {load.settlementHoldReason || (load.settlementHold ? "Pending manager review" : "Proof bundle complete")}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-800">
              Driver Pay: ${settlement ? settlement.netPay.toLocaleString() : "560"} Net
            </p>
            <Link href={`/drivers/${load.driverId}/settlements`} className="mt-2 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View settlement file →
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Trip Report Inspection Summary Section */}
      {pretripModel ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Pre-Trip Report Inspection Summary</h2>
              <p className="text-sm text-slate-600">Operational inspection controls across documents, driver, vehicle, and route conditions.</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              pretripModel.overall === "READY" ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"
            }`}>
              {pretripModel.overall}
            </span>
          </div>

          {pretripModel.blockReasons.length > 0 ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-bold text-rose-950">Pre-Trip Inspection Block Reasons:</h3>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs font-medium text-rose-900">
                {pretripModel.blockReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pretripModel.sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
                    {section.letter}
                  </span>
                  <h3 className="text-sm font-bold text-slate-950">{section.title}</h3>
                </div>
                <div className="space-y-2">
                  {section.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                      <span className="font-semibold text-slate-900">{line.label}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        line.status === "OK" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                        line.status === "Warning" ? "border-amber-300 bg-amber-100 text-amber-800" :
                        "border-rose-300 bg-rose-100 text-rose-800"
                      }`}>
                        {line.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Proof & Evidence Artifacts Section */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950 mb-4">Operational Proof &amp; Evidence Items</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((p) => (
            <div key={p.type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.type}</span>
              <p className="mt-1 text-sm font-bold text-slate-950">{p.status}</p>
              {p.riskNote || p.notes || p.rfAction ? (
                <p className="mt-1 text-xs text-slate-600">{p.riskNote || p.notes || p.rfAction}</p>
              ) : null}
              {p.fileUrl || p.previewUrl ? (
                <Link href={p.fileUrl || p.previewUrl || "#"} className="mt-3 inline-block text-xs font-semibold text-teal-800 hover:underline">
                  {p.rfAction || "View proof"} →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Evidence assets resolved from the canonical load evidence manifest */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Evidence Assets</h2>
        <p className="mt-1 text-sm text-slate-600">
          Load {load.id} · resolved from the canonical evidence manifest. Assets belong to this load only.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {evidenceAssets.map((asset) => {
            const viewable = Boolean(asset.url) && (asset.status === "available" || asset.status === "placeholder");
            return (
              <div key={asset.evidenceType} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{asset.title}</span>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {asset.status === "available"
                    ? "Available"
                    : asset.status === "placeholder"
                      ? "Available (demo render)"
                      : asset.status === "not_required"
                        ? "Not required for this load"
                        : "EVIDENCE ASSET NOT AVAILABLE"}
                </p>
                {asset.reason ? <p className="mt-1 text-xs text-slate-600">{asset.reason}</p> : null}
                {viewable ? (
                  <>
                    <p className="mt-1 break-all text-[11px] text-slate-500">{asset.fileName}</p>
                    <a
                      href={asset.url}
                      className="mt-3 inline-block text-xs font-semibold text-teal-800 hover:underline"
                    >
                      View evidence →
                    </a>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

