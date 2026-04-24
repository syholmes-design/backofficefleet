/**
 * BOF Intake Engine — demo-native trigger rows and thin downstream side effects.
 * Derived from intake fields + lifecycle events (no separate orchestration engine).
 */

import type { CommandCenterItem } from "@/lib/executive-layer";
import type { IntakeRecord } from "@/lib/intake-engine-types";
import type { Load } from "@/types/dispatch";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { useSettlementsPayrollStore } from "@/lib/stores/settlements-payroll-store";

export type IntakeTriggerType =
  | "contract_required"
  | "insurance_review_required"
  | "proof_requirements_created"
  | "driver_readiness_update"
  | "settlement_hold_configured"
  | "ops_followup_required"
  | "command_center_alert";

export type IntakeTriggerStatus = "open" | "in_progress" | "done" | "blocked";

export type IntakeTriggerSeverity = "info" | "medium" | "high" | "critical";

export type IntakeTrigger = {
  trigger_id: string;
  intake_id: string;
  trigger_type: IntakeTriggerType;
  trigger_status: IntakeTriggerStatus;
  title: string;
  description: string;
  owner_team: string;
  linked_entity_type: "load" | "settlement" | "driver" | "intake" | "none";
  linked_entity_id: string | null;
  severity: IntakeTriggerSeverity;
  created_at: string;
};

export type IntakeLoadProofContext = {
  intake_id: string;
  signed_bol: boolean;
  signed_pod: boolean;
  delivery_photos: boolean;
  seal_verification: boolean;
  lumper_receipt: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function tid(intake_id: string, type: IntakeTriggerType, suffix: string) {
  return `${intake_id}:${type}:${suffix}`;
}

export function deriveProofFlagsFromIntake(intake: IntakeRecord): Omit<
  IntakeLoadProofContext,
  "intake_id"
> {
  const bol = (intake.bol_requirements ?? "").toLowerCase();
  const pod = (intake.pod_requirements ?? "").toLowerCase();
  const miss = intake.missing_items.join(" ").toLowerCase();
  return {
    signed_bol: /signed.*bol|bol.*signed/.test(bol),
    signed_pod: /signed.*pod|pod.*signed/.test(pod),
    delivery_photos: /photo|imaging|os\s*&\s*d|picture/.test(pod),
    seal_verification: /seal/.test(pod) || /seal/.test(bol),
    lumper_receipt: /lumper/.test(miss) || /lumper/.test(pod) || /lumper/.test(bol),
  };
}

export function buildIntakeLoadProofContext(intake: IntakeRecord): IntakeLoadProofContext {
  const f = deriveProofFlagsFromIntake(intake);
  return { intake_id: intake.intake_id, ...f };
}

function insuranceReviewNeeded(intake: IntakeRecord): boolean {
  const t = (intake.insurance_requirements ?? "").toLowerCase();
  return (
    intake.intake_demo_flags?.sensitive_cargo === true ||
    /additional insured|endorsement|certificate required|enhanced coi|cargo filing|carrier gl|reefer cargo|temp log required/i.test(
      t
    )
  );
}

function contractRequired(intake: IntakeRecord): boolean {
  if (intake.intake_kind !== "single_trip" && intake.intake_kind !== "multi_trip") return false;
  const f = intake.intake_demo_flags;
  if (f?.master_contract_missing || f?.new_counterparty) return true;
  return false;
}

function settlementHoldSuggested(intake: IntakeRecord): boolean {
  const miss = intake.missing_items.join(" ").toLowerCase();
  if (/lumper|pod|signed pod|receipt|temperature|reefer|detention|mismatch/.test(miss)) return true;
  if (intake.intake_kind === "claim_document") return true;
  if (intake.intake_kind === "billing_document" && /detention|mismatch|flag/i.test(intake.pricing_summary ?? ""))
    return true;
  if (deriveProofFlagsFromIntake(intake).lumper_receipt) return true;
  return false;
}

function opsFollowUp(intake: IntakeRecord): boolean {
  return (
    intake.status === "awaiting_info" ||
    intake.status === "on_hold" ||
    intake.missing_items.length > 0 ||
    (intake.match_confidence === "none" && intake.linked_load_id == null && intake.linked_driver_id == null) ||
    (intake.intake_kind === "single_trip" &&
      intake.linked_load_id == null &&
      intake.match_confidence !== "high")
  );
}

function commandCenterFromIntake(intake: IntakeRecord): boolean {
  if (intake.extraction_confidence === "low") return true;
  if (/handwritten|low confidence|ocr/i.test(intake.review_reason ?? "")) return true;
  if (/handwritten|ocr confidence/i.test(intake.extracted.notes ?? "")) return true;
  return false;
}

/** Rows for Intake detail / inbox — derived from current intake snapshot. */
export function buildIntakeTriggerRows(intake: IntakeRecord): IntakeTrigger[] {
  const rows: IntakeTrigger[] = [];
  const created = intake.finalized_at ?? intake.received_at;

  if (contractRequired(intake)) {
    rows.push({
      trigger_id: tid(intake.intake_id, "contract_required", "0"),
      intake_id: intake.intake_id,
      trigger_type: "contract_required",
      trigger_status: intake.status === "finalized" ? "in_progress" : "open",
      title: "Contract / order setup",
      description:
        "Counterparty or lane needs executed agreement on file before commercial release.",
      owner_team: "Commercial",
      linked_entity_type: "intake",
      linked_entity_id: intake.intake_id,
      severity: "high",
      created_at: created,
    });
  }

  if (insuranceReviewNeeded(intake)) {
    rows.push({
      trigger_id: tid(intake.intake_id, "insurance_review_required", "0"),
      intake_id: intake.intake_id,
      trigger_type: "insurance_review_required",
      trigger_status: "open",
      title: "Insurance review",
      description: `Review COI / endorsements against tender: ${intake.insurance_requirements || "—"}`,
      owner_team: "Compliance",
      linked_entity_type: intake.linked_load_id ? "load" : "intake",
      linked_entity_id: intake.linked_load_id,
      severity: intake.intake_demo_flags?.sensitive_cargo ? "critical" : "medium",
      created_at: created,
    });
  }

  const proof = deriveProofFlagsFromIntake(intake);
  const proofActive =
    intake.intake_kind === "single_trip" ||
    intake.intake_kind === "multi_trip" ||
    intake.intake_kind === "load_document" ||
    intake.status === "finalized";

  if (
    proofActive &&
    (proof.signed_bol ||
      proof.signed_pod ||
      proof.delivery_photos ||
      proof.seal_verification ||
      proof.lumper_receipt)
  ) {
    const primaryLoad =
      intake.derived_load_ids[0] ?? intake.linked_load_id ?? null;
    rows.push({
      trigger_id: tid(intake.intake_id, "proof_requirements_created", "0"),
      intake_id: intake.intake_id,
      trigger_type: "proof_requirements_created",
      trigger_status: intake.status === "finalized" ? "done" : "open",
      title: "Proof requirements",
      description: [
        proof.signed_bol ? "Signed BOL" : null,
        proof.signed_pod ? "Signed POD" : null,
        proof.delivery_photos ? "Delivery photos" : null,
        proof.seal_verification ? "Seal verification" : null,
        proof.lumper_receipt ? "Lumper receipt" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      owner_team: "Dispatch",
      linked_entity_type: primaryLoad ? "load" : "intake",
      linked_entity_id: primaryLoad,
      severity: "medium",
      created_at: created,
    });
  }

  if (intake.intake_kind === "driver_document" && intake.linked_driver_id) {
    const impact = intake.readiness_impact ?? "neutral";
    rows.push({
      trigger_id: tid(intake.intake_id, "driver_readiness_update", "0"),
      intake_id: intake.intake_id,
      trigger_type: "driver_readiness_update",
      trigger_status: intake.status === "finalized" ? "done" : "open",
      title: "Driver readiness",
      description: `Credential impact: ${impact.replace(/_/g, " ")} · ${intake.extracted.credential_type ?? "driver file"}`,
      owner_team: "Safety",
      linked_entity_type: "driver",
      linked_entity_id: intake.linked_driver_id,
      severity: impact === "missing_review" ? "high" : "info",
      created_at: created,
    });
  }

  if (settlementHoldSuggested(intake)) {
    rows.push({
      trigger_id: tid(intake.intake_id, "settlement_hold_configured", "0"),
      intake_id: intake.intake_id,
      trigger_type: "settlement_hold_configured",
      trigger_status: intake.status === "finalized" ? "in_progress" : "open",
      title: "Settlement / payroll hold",
      description:
        "Finance hold or proof gate suggested from packet (demo — ties to settlements workbook when linked load exists).",
      owner_team: "Finance",
      linked_entity_type: intake.linked_load_id ? "load" : "intake",
      linked_entity_id: intake.linked_load_id,
      severity: "high",
      created_at: created,
    });
  }

  if (opsFollowUp(intake)) {
    rows.push({
      trigger_id: tid(intake.intake_id, "ops_followup_required", "0"),
      intake_id: intake.intake_id,
      trigger_type: "ops_followup_required",
      trigger_status: "open",
      title: "Ops follow-up",
      description:
        intake.review_reason ||
        (intake.missing_items.length ? intake.missing_items.join("; ") : "Planner review or match confirmation."),
      owner_team: "Operations",
      linked_entity_type: "intake",
      linked_entity_id: intake.intake_id,
      severity: "medium",
      created_at: created,
    });
  }

  if (commandCenterFromIntake(intake)) {
    rows.push({
      trigger_id: tid(intake.intake_id, "command_center_alert", "0"),
      intake_id: intake.intake_id,
      trigger_type: "command_center_alert",
      trigger_status: "open",
      title: "Command Center visibility",
      description: "Low extraction confidence or handwritten / ambiguous packet — surfaced to Command Center.",
      owner_team: "Operations",
      linked_entity_type: intake.linked_load_id ? "load" : "intake",
      linked_entity_id: intake.linked_load_id ?? intake.intake_id,
      severity: "high",
      created_at: created,
    });
  }

  return rows;
}

export function intakeTriggerSummary(intake: IntakeRecord): {
  count: number;
  chips: string[];
} {
  const rows = buildIntakeTriggerRows(intake);
  const chips: string[] = [];
  if (rows.some((r) => r.trigger_type === "contract_required")) chips.push("Contract");
  if (rows.some((r) => r.trigger_type === "insurance_review_required")) chips.push("Insurance");
  if (rows.some((r) => r.trigger_type === "proof_requirements_created")) chips.push("Proof");
  if (rows.some((r) => r.trigger_type === "settlement_hold_configured")) chips.push("Finance hold");
  if (rows.some((r) => r.trigger_type === "driver_readiness_update")) chips.push("Driver readiness");
  if (rows.some((r) => r.trigger_type === "ops_followup_required")) chips.push("Ops follow-up");
  if (rows.some((r) => r.trigger_type === "command_center_alert")) chips.push("CC alert");
  return { count: rows.length, chips };
}

export function findSettlementIdForPayrollLoadId(loadId: string | null | undefined): string | null {
  if (!loadId) return null;
  const { lines } = useSettlementsPayrollStore.getState();
  const hit = lines.find((l) => l.load_id === loadId);
  return hit?.settlement_id ?? null;
}

export type DriverReadinessLogEntry = {
  id: string;
  driver_id: string;
  intake_id: string;
  readiness_impact: string;
  detail: string;
  created_at: string;
};

export type IntakeSideEffectApi = {
  pushCommandCenterIntake: (item: CommandCenterItem) => void;
  pushDriverReadiness: (entry: DriverReadinessLogEntry) => void;
};

function ccItemFromIntake(intake: IntakeRecord, title: string, detail: string): CommandCenterItem {
  const severity: CommandCenterItem["severity"] =
    intake.extraction_confidence === "low" ? "high" : "medium";
  return {
    id: `INTAKE-CC-${intake.intake_id}-${Date.now().toString(36)}`,
    severity,
    bucket: "Dispatch / proof",
    title,
    detail,
    driver: intake.linked_driver_id ?? undefined,
    driverId: intake.linked_driver_id ?? undefined,
    loadId: intake.linked_load_id ?? intake.derived_load_ids[0] ?? undefined,
    nextAction: "Open Intake Engine detail and complete review / finalize.",
    owner: "Operations",
    status: "Needs review",
  };
}

/** After intake state is committed (finalize, hold, request info). */
export function runIntakeLifecycleSideEffects(
  intake: IntakeRecord,
  phase: "finalize" | "hold" | "request_info",
  api: IntakeSideEffectApi
): void {
  const dispatch = useDispatchDashboardStore.getState();

  if (phase === "hold" || phase === "request_info") {
    api.pushCommandCenterIntake(
      ccItemFromIntake(
        intake,
        `Intake Engine · ${phase === "hold" ? "On hold" : "Awaiting info"} — ${intake.intake_id}`,
        intake.review_notes || intake.review_reason || "Ops follow-up from intake state change."
      )
    );
  }

  if (phase !== "finalize") return;

  if (intake.intake_kind === "driver_document" && intake.linked_driver_id) {
    api.pushDriverReadiness({
      id: `DR-${intake.intake_id}-${Date.now().toString(36)}`,
      driver_id: intake.linked_driver_id,
      intake_id: intake.intake_id,
      readiness_impact: intake.readiness_impact ?? "neutral",
      detail: `${intake.extracted.credential_type ?? "Driver credential"} finalized via Intake Engine.`,
      created_at: nowIso(),
    });
  }

  if (commandCenterFromIntake(intake) || intake.extraction_confidence !== "high") {
    api.pushCommandCenterIntake(
      ccItemFromIntake(
        intake,
        `Intake Engine · finalized packet — ${intake.intake_id}`,
        intake.review_reason ||
          intake.extracted.notes ||
          "Intake finalized — confirm downstream proof and commercial flags."
      )
    );
  }

  const holdLoadId = intake.linked_load_id ?? intake.derived_load_ids[0] ?? null;
  if (settlementHoldSuggested(intake) && holdLoadId) {
    const sid = findSettlementIdForPayrollLoadId(holdLoadId);
    if (sid) {
      useSettlementsPayrollStore
        .getState()
        .placeHold(
          sid,
          `Intake Engine ${intake.intake_id} — hold from packet (${intake.intake_kind.replace(/_/g, " ")}).`
        );
    }
  }

  if (
    (intake.intake_kind === "load_document" ||
      intake.intake_kind === "claim_document" ||
      intake.intake_kind === "billing_document") &&
    intake.linked_load_id
  ) {
    dispatch.patchLoad(intake.linked_load_id, dispatchLoadStampFromIntake(intake));
  }
}

/** Proof flags + optional settlement hold on dispatch load (new or existing board row). */
export function dispatchLoadStampFromIntake(intake: IntakeRecord): Partial<Load> {
  const proof = buildIntakeLoadProofContext(intake);
  const hold = settlementHoldSuggested(intake);
  return {
    source_intake_id: intake.intake_id,
    intake_signed_bol_required: proof.signed_bol,
    intake_signed_pod_required: proof.signed_pod,
    intake_delivery_photos_required: proof.delivery_photos,
    intake_seal_verification_required: proof.seal_verification,
    lumper_receipt_required: proof.lumper_receipt || undefined,
    settlement_hold: hold,
    settlement_hold_reason: hold
      ? `Intake ${intake.intake_id} — proof or billing gate flagged on finalize.`
      : undefined,
  };
}
