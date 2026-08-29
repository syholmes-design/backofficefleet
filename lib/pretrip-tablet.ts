import type { BofData } from "./load-bof-data";
import { reconcileCredentialIncident } from "./compliance/credential-incident-reconciliation";
import {
  getOrderedDocumentsForDriver,
  type DocumentRow,
} from "./driver-queries";
import { buildLoadRouteMapModel, type LoadRouteMapModel } from "./load-route-map";
import {
  buildRfActions,
  getLoadProofItems,
  proofBlockingCount,
} from "./load-proof";
import { getLoadArtifactActionUrl } from "./load-artifact-registry";
import { getCanonicalLoadStory } from "./canonical-load-stories";

export type PretripLineStatus = "OK" | "Missing" | "Warning";

export type PretripActionKind = "view" | "upload" | "resolve";

export type PretripLine = {
  id: string;
  label: string;
  status: PretripLineStatus;
  /** When true, Missing or Warning blocks Start Load (pre-dispatch). */
  critical: boolean;
  href: string;
  /** Tablet CTA label; if omitted, derived from actionKind. */
  actionLabel?: string;
  /** Touch-target action type for enterprise tablet styling. */
  actionKind?: PretripActionKind;
};

export type PretripSection = {
  id: string;
  /** A–F section letter for tablet chrome */
  letter: string;
  title: string;
  lines: PretripLine[];
};

export type PretripTabletModel = {
  loadId: string;
  loadNumber: string;
  driverId: string;
  driverName: string;
  /** Truck / power unit id from loads[].assetId */
  assetId: string;
  origin: string;
  destination: string;
  loadStatus: string;
  overall: "READY" | "BLOCKED";
  blockReasons: string[];
  sections: PretripSection[];
  routeMapModel: LoadRouteMapModel | null;
  /** Shown when load is not Pending - Start Load is not offered. */
  dispatchPhaseMessage: string | null;
};

function docRowStatus(doc: DocumentRow): PretripLineStatus {
  const s = doc.status.toUpperCase();
  if (s === "VALID") return "OK";
  if (s === "EXPIRED") return "Warning";
  return "Missing";
}

function proofByType(
  data: BofData,
  loadId: string,
  type: string
) {
  return getLoadProofItems(data, loadId).find((p) => p.type === type) ?? null;
}

function proofDocStatus(
  p: ReturnType<typeof getLoadProofItems>[number] | null
): PretripLineStatus {
  if (!p) return "Missing";
  if (p.status === "Complete") return "OK";
  if (p.status === "Not required") return "OK";
  if (p.status === "Disputed" || p.status === "Pending") return "Warning";
  return "Missing";
}

function maintenanceMarForAsset(data: BofData, assetId: string) {
  if (!("moneyAtRisk" in data) || !Array.isArray(data.moneyAtRisk)) return null;
  return data.moneyAtRisk.find(
    (m) =>
      m.assetId === assetId &&
      /maintenance/i.test(m.category) &&
      /open|at risk|blocked/i.test(m.status)
  );
}

function openComplianceForDriver(data: BofData, driverId: string) {
  return data.complianceIncidents.filter((c) => {
    if (c.driverId !== driverId) return false;
    const st = String(c.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") return false;
    return reconcileCredentialIncident(data, c).display;
  });
}

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function weatherTraffic(loadId: string): { weather: PretripLine; traffic: PretripLine } {
  const h = hashSeed(loadId);
  const weatherOpts: PretripLineStatus[] = ["OK", "OK", "Warning"];
  const trafficOpts: PretripLineStatus[] = ["OK", "Warning", "OK"];
  const w = weatherOpts[h % 3];
  const t = trafficOpts[(h >> 2) % 3];
  return {
    weather: {
      id: "wx",
      label: "Weather along lane",
      status: w,
      critical: false,
      href: "/dashboard",
      actionKind: w === "OK" ? "view" : "resolve",
      actionLabel: w === "OK" ? "Open route weather" : "Review weather plan",
    },
    traffic: {
      id: "traffic",
      label: "Traffic / ETA risk",
      status: t,
      critical: false,
      href: "/dashboard",
      actionKind: t === "OK" ? "view" : "resolve",
      actionLabel: t === "OK" ? "Open traffic plan" : "Review traffic plan",
    },
  };
}

function lineBlocks(line: PretripLine): boolean {
  return line.critical && (line.status === "Missing" || line.status === "Warning");
}

export function buildPretripTabletModel(
  data: BofData,
  loadId: string
): PretripTabletModel | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;
  const driver = data.drivers.find((d) => d.id === load.driverId);
  const driverName = driver?.name ?? load.driverId;
  const driverHref = `/drivers/${load.driverId}`;
  const loadHref = `/loads/${loadId}`;
  const artifactHref = (key: string, fallback = loadHref) =>
    getLoadArtifactActionUrl(data, loadId, key, fallback);
  const docs = getOrderedDocumentsForDriver(data, load.driverId);
  const docMap = new Map(docs.map((d) => [d.type, d]));
  const proofs = getLoadProofItems(data, loadId);
  const proofBlockers = proofBlockingCount(proofs);
  const rfForLoad = buildRfActions(data).filter((a) => a.loadId === loadId);
  const rfBlocking = rfForLoad.some(
    (a) => a.blocksPayment || a.priority === "P0"
  );

  const pendingAssign = load.status === "Pending";
  const delivered = load.status === "Delivered";
  const enRoute = load.status === "En Route";
  const canonicalStory = getCanonicalLoadStory(loadId);
  const canonicalPretripBlock = canonicalStory?.loadId === "L009" && !delivered;

  const rate = proofByType(data, loadId, "Rate Confirmation");
  const bol = proofByType(data, loadId, "BOL");
  const pretripPhoto = proofByType(data, loadId, "Pre-Trip Cargo Photo");
  const lumper = proofByType(data, loadId, "Lumper QR Closeout") ?? proofByType(data, loadId, "Lumper Receipt");

  const rateSt = proofDocStatus(rate);
  const bolSt = proofDocStatus(bol);

  const dispatchNotes = (load.dispatchOpsNotes ?? "").trim();
  const dispatchLine: PretripLine = {
    id: "dispatch-instructions",
    label: "Dispatch instructions",
    status:
      dispatchNotes.length > 0
        ? "OK"
        : pendingAssign
          ? "Missing"
          : "Warning",
    critical: pendingAssign && !delivered,
    href: artifactHref("work_order", `${loadHref}#artifact-work_order`),
    actionKind: dispatchNotes.length > 0 ? "view" : "upload",
    actionLabel:
      dispatchNotes.length > 0 ? "Open work order" : "Add dispatch instructions",
  };

  const sealOk =
    Boolean(load.pickupSeal?.trim()) &&
    Boolean(load.deliverySeal?.trim()) &&
    load.sealStatus === "OK";
  const sealLine: PretripLine = {
    id: "seal-verify",
    label: "Seal verification",
    status: sealOk
      ? "OK"
      : load.sealStatus === "Mismatch"
        ? "Warning"
        : "Missing",
    critical: !delivered && !sealOk,
    href: artifactHref("seal_pickup_photo", `${loadHref}#artifact-seal_pickup_photo`),
    actionKind: sealOk ? undefined : "resolve",
    actionLabel: sealOk ? "Open seal proof" : "Resolve seal proof",
  };

  const pretripSt = proofDocStatus(pretripPhoto);
  const pretripLine: PretripLine = {
    id: "pretrip-cargo",
    label: "Pre-trip cargo photo",
    status:
      pretripSt === "OK"
        ? "OK"
        : pretripSt === "Warning"
          ? "Warning"
          : pendingAssign || enRoute
            ? "Missing"
            : delivered
              ? "Warning"
              : "Missing",
    critical: !delivered && pretripSt !== "OK",
    href: artifactHref("cargo_photo", `${loadHref}#artifact-cargo_photo`),
    actionKind: pretripSt === "OK" ? undefined : "upload",
    actionLabel: pretripSt === "OK" ? "Open cargo photo" : "Attach cargo photo",
  };

  const mar = maintenanceMarForAsset(data, load.assetId);
  const maintLine: PretripLine = {
    id: "maint-report",
    label: "Maintenance report",
    status: mar || canonicalPretripBlock ? "Warning" : "OK",
    critical: Boolean(mar || canonicalPretripBlock) && !delivered,
    href: canonicalPretripBlock ? "/maintenance/work-orders/WO-003" : "/money-at-risk",
    actionKind: mar || canonicalPretripBlock ? "resolve" : "view",
    actionLabel: mar || canonicalPretripBlock ? "Review maintenance hold" : "Open maintenance status",
  };

  const tireLine: PretripLine = {
    id: "tire-check",
    label: "Tire check",
    status: mar || canonicalPretripBlock ? "Warning" : "OK",
    critical: canonicalPretripBlock,
    href: canonicalPretripBlock ? "/maintenance/work-orders/WO-003" : "/money-at-risk",
    actionKind: canonicalPretripBlock ? "resolve" : "view",
    actionLabel: canonicalPretripBlock ? "Clear tire defect" : "Open tire status",
  };

  const fuelLine: PretripLine = {
    id: "fuel-check",
    label: "Fuel check",
    status: "OK",
    critical: false,
    href: `/dispatch?loadId=${loadId}#route-control`,
    actionKind: "view",
    actionLabel: "Open fuel plan",
  };

  const trailerLine: PretripLine = {
    id: "trailer-condition",
    label: "Trailer condition",
    status: mar ? "Warning" : "OK",
    critical: false,
    href: loadHref,
    actionKind: "view",
    actionLabel: "Open trailer status",
  };

  const incidents = openComplianceForDriver(data, load.driverId);
  const criticalInc = incidents.some((i) => i.severity === "CRITICAL");
  const dueSoonInc = incidents.some((i) => i.severity === "DUE_SOON");
  const complianceBlocksDispatch =
    incidents.some(
      (i) => i.severity === "CRITICAL" || i.severity === "DUE_SOON"
    ) && pendingAssign;
  const hosLine: PretripLine = {
    id: "hos",
    label: "HOS / open compliance",
    status:
      incidents.length === 0
        ? "OK"
        : criticalInc
          ? "Missing"
          : dueSoonInc
            ? "Warning"
            : "Warning",
    critical: complianceBlocksDispatch && !delivered,
    href: `${driverHref}#document-engine`,
    actionKind: incidents.length ? "resolve" : "view",
    actionLabel: incidents.length ? "Resolve compliance item" : "Open compliance file",
  };

  const cameraLine: PretripLine = {
    id: "camera",
    label: "Camera status",
    status: "OK",
    critical: false,
    href: `${driverHref}#document-engine`,
    actionKind: "view",
    actionLabel: "Open camera status",
  };

  const cdl = docMap.get("CDL");
  const med = docMap.get("Medical Card");
  const mvr = docMap.get("MVR");
  const cdlLine: PretripLine = {
    id: "cdl",
    label: "CDL",
    status: cdl ? docRowStatus(cdl) : "Missing",
    critical: !delivered && (!cdl || docRowStatus(cdl) !== "OK"),
    href: `${driverHref}#document-engine`,
    actionKind: cdl && docRowStatus(cdl) === "OK" ? "view" : "resolve",
    actionLabel: cdl && docRowStatus(cdl) === "OK" ? "Open CDL" : "Resolve CDL",
  };
  const medLine: PretripLine = {
    id: "med",
    label: "Medical Card",
    status: med ? docRowStatus(med) : "Missing",
    critical: !delivered && (!med || docRowStatus(med) !== "OK"),
    href: `${driverHref}#document-engine`,
    actionKind: med && docRowStatus(med) === "OK" ? "view" : "resolve",
    actionLabel: med && docRowStatus(med) === "OK" ? "Open medical card" : "Resolve medical card",
  };
  const mvrLine: PretripLine = {
    id: "mvr",
    label: "MVR",
    status: mvr ? docRowStatus(mvr) : "Missing",
    critical: !delivered && (!mvr || docRowStatus(mvr) !== "OK"),
    href: `${driverHref}#document-engine`,
    actionKind: mvr && docRowStatus(mvr) === "OK" ? "view" : "resolve",
    actionLabel: mvr && docRowStatus(mvr) === "OK" ? "Open MVR" : "Resolve MVR",
  };

  const lumperSt = proofDocStatus(lumper);
  const lumperLine: PretripLine = {
    id: "lumper-setup",
    label: "QR lumper closeout",
    status:
      lumper?.status === "Not required"
        ? "OK"
        : lumperSt === "OK"
          ? "OK"
          : "Warning",
    critical: false,
    href: artifactHref("lumper_receipt", `${loadHref}#artifact-lumper_receipt`),
    actionKind:
      lumper?.status === "Not required" ? "view" : lumperSt === "OK" ? "view" : "resolve",
    actionLabel:
      lumper?.status === "Not required"
        ? "View lumper context"
        : lumperSt === "OK"
          ? "Open QR lumper closeout"
          : "Resolve QR lumper closeout",
  };

  const payLine: PretripLine = {
    id: "payment-flags",
    label: "Payment proof packet",
    status: proofBlockers > 0 ? "Missing" : "OK",
    critical: proofBlockers > 0 && pendingAssign && !delivered,
    href: artifactHref("settlement_hold_notice", `${loadHref}#artifact-settlement_hold_notice`),
    actionKind: proofBlockers > 0 ? "resolve" : "view",
    actionLabel: proofBlockers > 0 ? "Review proof packet" : "Open payment packet",
  };

  const rfLine: PretripLine = {
    id: "rf-actions",
    label: "RFID / proof chain",
    status: rfBlocking ? "Missing" : rfForLoad.length ? "Warning" : "OK",
    critical: rfBlocking && pendingAssign && !delivered,
    href: `${loadHref}#rfid-proof`,
    actionKind: rfForLoad.length ? "resolve" : "view",
    actionLabel: rfForLoad.length ? "Review load proof chain" : "Open proof chain",
  };

  const pod = proofByType(data, loadId, "POD");
  const podSt = proofDocStatus(pod);
  const podLine: PretripLine = {
    id: "pod-pretrip",
    label: "POD stack (readiness)",
    status: podSt,
    critical: Boolean(pod?.blocksPayment) && pendingAssign && !delivered,
    href: artifactHref("pod", `${loadHref}#artifact-pod`),
    actionKind: podSt === "OK" || pod?.status === "Not required" ? "view" : "resolve",
    actionLabel:
      podSt === "OK" || pod?.status === "Not required" ? "Open POD" : "Resolve POD readiness",
  };

  const settlementRow = data.settlements?.find(
    (s) => s.driverId === load.driverId
  );
  const pendingSettlement = settlementRow?.status ?? "";
  const settlementLine: PretripLine = {
    id: "settlements",
    label: "Settlements / payroll",
    status: /hold|pending|awaiting|on hold/i.test(pendingSettlement)
      ? "Warning"
      : "OK",
    critical: false,
    href: `${driverHref}/settlements`,
    actionKind: "view",
    actionLabel: "Open settlement status",
  };

  const { weather, traffic } = weatherTraffic(loadId);

  const loadDocs: PretripSection = {
    id: "load-docs",
    letter: "A",
    title: "Load Documents",
    lines: [
      {
        id: "rate-con",
        label: "Rate Confirmation",
        status: rateSt,
        critical: !delivered && rateSt !== "OK",
        href: artifactHref("rate_confirmation", `${loadHref}#artifact-rate_confirmation`),
        actionKind: rateSt === "OK" ? "view" : "upload",
        actionLabel: rateSt === "OK" ? "Open rate confirmation" : "Attach rate confirmation",
      },
      {
        id: "bol",
        label: "BOL",
        status: bolSt,
        critical: !delivered && bolSt !== "OK",
        href: artifactHref("bol", `${loadHref}#artifact-bol`),
        actionKind: bolSt === "OK" ? "view" : "upload",
        actionLabel: bolSt === "OK" ? "Open BOL" : "Attach BOL",
      },
      dispatchLine,
    ],
  };

  const proofReq: PretripSection = {
    id: "proof-req",
    letter: "B",
    title: "Proof Requirements",
    lines: [pretripLine, sealLine, podLine, trailerLine],
  };

  const vehicle: PretripSection = {
    id: "vehicle",
    letter: "C",
    title: "Vehicle Readiness",
    lines: [maintLine, tireLine, fuelLine],
  };

  const routeIntel: PretripSection = {
    id: "route-intel",
    letter: "D",
    title: "Route Intelligence",
    lines: [weather, traffic],
  };

  const compliance: PretripSection = {
    id: "compliance",
    letter: "E",
    title: "Compliance & Safety",
    lines: [hosLine, cameraLine, cdlLine, medLine, mvrLine],
  };

  const financial: PretripSection = {
    id: "financial",
    letter: "F",
    title: "Financial / Ops",
    lines: [lumperLine, payLine, rfLine, settlementLine],
  };

  const sections = [
    loadDocs,
    proofReq,
    vehicle,
    routeIntel,
    compliance,
    financial,
  ];

  const blockReasons: string[] = [];
  for (const sec of sections) {
    for (const ln of sec.lines) {
      if (lineBlocks(ln)) {
        blockReasons.push(`${ln.label}: ${ln.status}`);
      }
    }
  }

  let dispatchPhaseMessage: string | null = null;
  if (enRoute) {
    dispatchPhaseMessage =
      "This load is already active (En Route). The packet remains available for driver, dispatch, and manager review.";
  } else if (delivered) {
    dispatchPhaseMessage =
      "Trip completed. The packet remains available as the historical trip file.";
  }

  const overall: "READY" | "BLOCKED" =
    blockReasons.length > 0 ? "BLOCKED" : "READY";

  return {
    loadId: load.id,
    loadNumber: load.number,
    driverId: load.driverId,
    driverName,
    assetId: load.assetId,
    origin: load.origin,
    destination: load.destination,
    loadStatus: load.status,
    overall,
    blockReasons,
    sections,
    routeMapModel: buildLoadRouteMapModel(data, loadId),
    dispatchPhaseMessage,
  };
}
