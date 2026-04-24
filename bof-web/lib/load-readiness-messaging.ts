import type { BofData } from "@/lib/load-bof-data";
import { buildTripReleaseEvaluation } from "@/lib/trip-release";
import { getLoadProofItems } from "@/lib/load-proof";

export type PretripReadinessState = "complete" | "incomplete" | "at_risk";
export type PretripFinalStatus = "Ready" | "At Risk" | "Blocked";

export type MessageRecipientType = "driver" | "dispatch" | "manager" | "owner";
export type MessageChannelType = "sms_simulated" | "in_app" | "notification";
export type MessageType = "info" | "question" | "approval" | "acknowledgment" | "alert";
export type MessageExpectedResponseType =
  | "yes_no"
  | "acknowledge"
  | "free_text"
  | "approve_hold"
  | "seal_number"
  | "none";
export type MessageStatus = "pending" | "delivered" | "responded" | "expired";

export type ReadinessMessage = {
  messageId: string;
  loadId: string;
  driverId?: string;
  recipientType: MessageRecipientType;
  recipientName: string;
  recipientRole: string;
  channelType: MessageChannelType;
  messageType: MessageType;
  subject: string;
  messageBody: string;
  expectedResponseType: MessageExpectedResponseType;
  responseValue: string | null;
  responseReceivedAt: string | null;
  sentAt: string;
  status: MessageStatus;
  relatedWorkflowImpact: string;
  exceptionId?: string;
};

export type ReadinessCheckRow = {
  id: string;
  label: string;
  state: PretripReadinessState;
  waitingOn: string;
  detail: string;
};

export type ReadinessSummaryModel = {
  loadId: string;
  driverId: string;
  loadNumber: string;
  checks: ReadinessCheckRow[];
  missingItems: string[];
  finalStatus: PretripFinalStatus;
};

function stateFrom(ok: boolean, risk = false): PretripReadinessState {
  if (ok) return "complete";
  return risk ? "at_risk" : "incomplete";
}

function hasPositiveMessageResponse(
  messages: ReadinessMessage[],
  needle: RegExp,
  expected?: MessageExpectedResponseType
) {
  return messages.some((m) => {
    if (expected && m.expectedResponseType !== expected) return false;
    const txt = `${m.subject} ${m.messageBody}`.toLowerCase();
    if (!needle.test(txt)) return false;
    if (m.status !== "responded") return false;
    const rv = (m.responseValue ?? "").toUpperCase();
    return rv === "YES" || rv === "ACK" || rv === "APPROVE" || rv === "PHOTOS COMPLETE" || rv.length > 0;
  });
}

export function buildLoadReadinessSummaryModel(
  data: BofData,
  loadId: string,
  messages: ReadinessMessage[]
): ReadinessSummaryModel | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;
  const ev = buildTripReleaseEvaluation(data, loadId);
  if (!ev) return null;
  const proofs = getLoadProofItems(data, loadId);
  const proof = (t: string) => proofs.find((p) => p.type === t) ?? null;
  const rate = proof("Rate Confirmation");
  const bol = proof("BOL");
  const pod = proof("POD");
  const pretripPhoto = proof("Pre-Trip Cargo Photo");
  const emptyTrailer = proof("Delivery / Empty-Trailer Photo");

  const hasDriver = Boolean(load.driverId?.trim());
  const hasTruck = Boolean(load.assetId?.trim());
  const hasTrailer = Boolean(ev.dispatch_trailer?.trailer_id || ev.dispatch_load.trailer_id);
  const driverComplianceReady = !ev.checks.some(
    (c) => c.category === "driver" || c.category === "compliance"
  );
  const equipmentReady = !ev.checks.some((c) => c.category === "equipment");
  const emptyTrailerDone =
    emptyTrailer?.status === "Complete" ||
    emptyTrailer?.status === "Not required" ||
    hasPositiveMessageResponse(messages, /empty trailer inspection/, "yes_no");
  const cargoPhotosDone =
    pretripPhoto?.status === "Complete" ||
    hasPositiveMessageResponse(messages, /cargo photo|pre-trip photo/, "free_text");
  const sealAckDone =
    (load.sealStatus === "OK" && Boolean(load.pickupSeal?.trim())) ||
    hasPositiveMessageResponse(messages, /seal/, "seal_number");
  const specialHandlingAckDone =
    hasPositiveMessageResponse(messages, /special handling/, "acknowledge") ||
    !(load.dispatchOpsNotes ?? "").toLowerCase().includes("special");
  const appointmentConfirmed = hasPositiveMessageResponse(messages, /appointment/, "yes_no");
  const proofExpectationsDefined = Boolean(rate && bol && pod);
  const dispatchReleased = load.status !== "Pending";
  const activeExceptions = ev.checks.filter((c) => c.severity === "blocking").length > 0;
  const pendingCriticalMessages = messages.some(
    (m) =>
      m.status !== "responded" &&
      (m.messageType === "approval" || m.messageType === "alert") &&
      /hold|blocked|confirm|approval|seal|pre-trip|pod/i.test(`${m.subject} ${m.messageBody}`)
  );

  const checks: ReadinessCheckRow[] = [
    {
      id: "driver-assigned",
      label: "Driver assigned",
      state: stateFrom(hasDriver),
      waitingOn: hasDriver ? "None" : "Dispatch",
      detail: hasDriver ? `Assigned ${load.driverId}` : "No driver assigned yet.",
    },
    {
      id: "truck-assigned",
      label: "Truck assigned",
      state: stateFrom(hasTruck),
      waitingOn: hasTruck ? "None" : "Dispatch",
      detail: hasTruck ? `Asset ${load.assetId}` : "No truck/power unit on load.",
    },
    {
      id: "trailer-assigned",
      label: "Trailer assigned",
      state: stateFrom(hasTrailer, true),
      waitingOn: hasTrailer ? "None" : "Dispatch",
      detail: hasTrailer ? ev.trailer_unit : "Trailer assignment still pending.",
    },
    {
      id: "driver-compliance-ready",
      label: "Driver compliance/docs ready",
      state: stateFrom(driverComplianceReady, true),
      waitingOn: driverComplianceReady ? "None" : "Driver / Safety",
      detail: driverComplianceReady ? "Credential and compliance blockers cleared." : ev.driver_dispatch_eligibility,
    },
    {
      id: "equipment-ready",
      label: "Truck/equipment ready",
      state: stateFrom(equipmentReady, true),
      waitingOn: equipmentReady ? "None" : "Maintenance / Dispatch",
      detail: ev.asset_readiness_summary,
    },
    {
      id: "empty-trailer",
      label: "Empty trailer inspection complete",
      state: stateFrom(emptyTrailerDone, true),
      waitingOn: emptyTrailerDone ? "None" : "Driver",
      detail: emptyTrailerDone ? "Inspection confirmed." : "Waiting for empty trailer inspection confirmation.",
    },
    {
      id: "cargo-photos",
      label: "Cargo photo / pre-trip requirements complete",
      state: stateFrom(cargoPhotosDone, true),
      waitingOn: cargoPhotosDone ? "None" : "Driver",
      detail: cargoPhotosDone ? "Cargo photo requirement complete." : "Pre-trip cargo photos still missing.",
    },
    {
      id: "seal-ack",
      label: "Seal requirement complete / acknowledged",
      state: stateFrom(sealAckDone, true),
      waitingOn: sealAckDone ? "None" : "Driver / Dispatch",
      detail: sealAckDone ? "Seal workflow acknowledged." : "Waiting on seal confirmation/number.",
    },
    {
      id: "special-handling",
      label: "Special handling instructions acknowledged",
      state: stateFrom(specialHandlingAckDone, true),
      waitingOn: specialHandlingAckDone ? "None" : "Driver",
      detail: specialHandlingAckDone ? "Acknowledged in ops flow." : "Awaiting acknowledgment of special handling notes.",
    },
    {
      id: "appointment",
      label: "Appointment confirmed",
      state: stateFrom(appointmentConfirmed, true),
      waitingOn: appointmentConfirmed ? "None" : "Dispatch",
      detail: appointmentConfirmed ? "Appointment acknowledged by dispatch." : "No appointment confirmation response yet.",
    },
    {
      id: "proof-defined",
      label: "Required BOL/POD/proof expectations defined",
      state: stateFrom(proofExpectationsDefined, true),
      waitingOn: proofExpectationsDefined ? "None" : "Dispatch",
      detail: proofExpectationsDefined ? "Core proof lines are defined in BOF proof stack." : "Core proof expectations not fully defined.",
    },
    {
      id: "dispatch-released",
      label: "Dispatch released",
      state: stateFrom(dispatchReleased, true),
      waitingOn: dispatchReleased ? "None" : "Dispatch Manager",
      detail: dispatchReleased ? `Load status ${load.status}` : "Load is still pending dispatch release.",
    },
  ];

  const missingItems = checks
    .filter((c) => c.state !== "complete")
    .map((c) => `${c.label} — waiting on ${c.waitingOn}`);

  if (activeExceptions) {
    missingItems.push("Blocking exceptions exist in trip release checks.");
  }
  if (pendingCriticalMessages) {
    missingItems.push("Critical BOF message responses are still pending.");
  }

  const hasIncomplete = checks.some((c) => c.state === "incomplete");
  const hasRisk = checks.some((c) => c.state === "at_risk");
  const finalStatus: PretripFinalStatus =
    hasIncomplete || activeExceptions ? "Blocked" : hasRisk || pendingCriticalMessages ? "At Risk" : "Ready";

  return {
    loadId,
    driverId: load.driverId,
    loadNumber: load.number,
    checks,
    missingItems,
    finalStatus,
  };
}

export function buildReadinessSummaryArtifactHtml(model: ReadinessSummaryModel, generatedAt: string) {
  const rows = model.checks
    .map(
      (c) =>
        `<tr><td>${c.label}</td><td>${c.state.replace(/_/g, " ")}</td><td>${c.waitingOn}</td><td>${c.detail}</td></tr>`
    )
    .join("");
  const missing = model.missingItems.length
    ? `<ul>${model.missingItems.map((m) => `<li>${m}</li>`).join("")}</ul>`
    : "<p>None</p>";
  return `<!doctype html><html><head><meta charset="utf-8"/><title>BOF Pre-Trip Readiness Summary</title>
  <style>
  body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#0f1419;color:#dbe7f3;padding:24px;}
  .card{max-width:1100px;margin:0 auto;border:1px solid #223041;border-radius:10px;background:#121a23;}
  .head{padding:18px 20px;border-bottom:1px solid #223041}.k{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5eead4}
  h1{margin:8px 0 0}.meta{padding:10px 20px;color:#93a8bd}.body{padding:16px 20px}
  table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #223041;padding:8px;text-align:left;font-size:13px}th{color:#8fa5bc}
  </style></head><body><div class="card"><div class="head"><div class="k">BOF Driver Pre-Trip Readiness Summary</div><h1>Load ${model.loadNumber} (${model.loadId})</h1></div>
  <div class="meta">Final Status: ${model.finalStatus} · Generated ${new Date(generatedAt).toLocaleString()}</div>
  <div class="body"><h3>Readiness checks</h3><table><tr><th>Check</th><th>State</th><th>Waiting on</th><th>Detail</th></tr>${rows}</table>
  <h3>Missing items / exceptions</h3>${missing}</div></div></body></html>`;
}
