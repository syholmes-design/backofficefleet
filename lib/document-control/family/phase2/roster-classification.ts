import { CONTROLLED_DOCUMENT_ROSTER } from "@/lib/document-control/registry";
import type {
  Phase2ContentPosture,
  Phase2RosterClassification,
} from "./types";

const COLLISION_PRESENT_CODES = new Set([
  "BOF-OPS-001",
  "BOF-OPS-EVD-003",
  "BOF-FIN-REC-001",
  "BOF-FIN-FORM-001",
  "BOF-SAF-FORM-002",
  "BOF-DRV-003",
  "BOF-FIN-POL-001",
  "BOF-FIN-POL-002",
]);

const HUMAN_DECISION_CODES = new Set([
  "BOF-SAF-POL-001",
  "BOF-SAF-FORM-001",
  "BOF-SAF-SOP-001",
  "BOF-DRV-CHK-001",
  "BOF-SAF-FORM-003",
  "BOF-DRV-001",
  "BOF-OPS-FORM-002",
]);

const IT_POL_CATALOG_SHELL = /^BOF-IT-POL-00[1-7]$/;

const COLLISION_NOTES: Record<string, string> = {
  "BOF-OPS-001":
    "Roster family BOF-OPS-001 is Load Intake only. Set B Dispatch Release is a different document and has no family key; the shared printed OPS-001 label is unresolved. BOF master approval is not claimed.",
  "BOF-OPS-EVD-003":
    "Proof of Delivery collides with Set B pickup/delivery checklists; BOF master approval is not claimed.",
  "BOF-FIN-REC-001":
    "Driver settlement statement record is distinct from any second settlement document; BOF master approval is not claimed.",
  "BOF-FIN-FORM-001":
    "Roster IFTA href is distinct from the carrier-originated document whose printed number is BOF-OPS-008; a carrier-local code is not established. BOF master approval is not claimed.",
  "BOF-SAF-FORM-002":
    "Short incident template is distinct from the carrier-originated document whose printed number is BOF-OPS-009, and from BOF-DRV-003; a carrier-local code is not established. BOF master approval is not claimed.",
  "BOF-DRV-003":
    "Accident register is not an incident report; BOF master approval is not claimed.",
  "BOF-FIN-POL-001":
    "Ordinary payroll policy is distinct from the carrier-originated documents whose printed numbers are BOF-PAY-001 and BOF-PAY-002; carrier-local codes are not established. BOF master approval is not claimed.",
  "BOF-FIN-POL-002":
    "Factoring policy is distinct from the factoring notice; BOF master approval is not claimed.",
};

function contentPostureFor(code: string, notes: string): Phase2ContentPosture {
  if (COLLISION_PRESENT_CODES.has(code)) return "COLLISION_PRESENT";
  if (HUMAN_DECISION_CODES.has(code)) return "HUMAN_DECISION";
  if (IT_POL_CATALOG_SHELL.test(code)) return "CATALOG_SHELL";
  if (notes.includes("SOURCE NOT RECOVERED")) return "SOURCE_NOT_RECOVERED";
  return "UNCLASSIFIED";
}

function noteFor(code: string, posture: Phase2ContentPosture): string {
  switch (posture) {
    case "COLLISION_PRESENT":
      return (
        COLLISION_NOTES[code] ??
        `Identity collision is present for ${code}; BOF master approval is not claimed.`
      );
    case "HUMAN_DECISION":
      return `${code} requires a human content decision before classification advances; BOF master approval is not claimed.`;
    case "CATALOG_SHELL":
      return `${code} is a catalog shell IT policy lift, not recovered carrier-neutral body; BOF master approval is not claimed.`;
    case "SOURCE_NOT_RECOVERED":
      return `Source body for ${code} is not recovered on the current surface; BOF master approval is not claimed.`;
    case "UNCLASSIFIED":
      return `${code} has no Phase 2 posture match yet beyond the compatibility lift; BOF master approval is not claimed.`;
  }
}

export const PHASE2_ROSTER_CLASSIFICATIONS: readonly Phase2RosterClassification[] =
  CONTROLLED_DOCUMENT_ROSTER.map((record) => {
    const contentPosture = contentPostureFor(record.code, record.notes);
    return {
      familyKey: record.code,
      compatibilityMasterId: `${record.code}@${record.version}`,
      genuineBofMaster: false,
      contentPosture,
      note: noteFor(record.code, contentPosture),
    };
  });
