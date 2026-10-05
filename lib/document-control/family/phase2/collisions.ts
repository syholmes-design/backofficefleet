import type { Phase2Collision } from "./types";

/**
 * Known identity collisions. Records do not merge documents and do not
 * assign new global family keys. familyKey is set only when the document
 * is already a roster (or Phase 2 carrier-originated) family.
 */
export const PHASE2_COLLISIONS: readonly Phase2Collision[] = [
  {
    collisionId: "ops-001-load-intake-vs-dispatch-release",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Load Intake",
        familyKey: "BOF-OPS-001",
        localCode: null,
        source: "roster + load tender href",
      },
      {
        label: "Dispatch Release Checklist (Set B)",
        familyKey: null,
        localCode: "OPS-001",
        source: "Delta controlled set, not registered",
      },
    ],
    note: "Same printed OPS-001 local code class, different documents; Load Intake is already rostered.",
  },
  {
    collisionId: "pod-and-pickup-delivery",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Proof of Delivery",
        familyKey: "BOF-OPS-EVD-003",
        localCode: null,
        source: "roster",
      },
      {
        label: "POD & Exception Report (Set A)",
        familyKey: null,
        localCode: "OPS-002",
        source: "Phase 3D set, not the live roster code",
      },
      {
        label: "Pickup Readiness (Set B)",
        familyKey: null,
        localCode: "OPS-002",
        source: "Delta controlled set",
      },
      {
        label: "Delivery/POD Checklist (Set B)",
        familyKey: null,
        localCode: "OPS-003",
        source: "Delta controlled set",
      },
    ],
    note: "Four distinct POD/pickup/delivery identities; shared printed codes are not the same document.",
  },
  {
    collisionId: "seal-cargo-security",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "One-row seal template",
        familyKey: null,
        localCode: null,
        source: "scripts/templates/load-docs/seal-verification.template.html",
      },
      {
        label: "Seal & Cargo Security Record (Set B)",
        familyKey: null,
        localCode: "OPS-004",
        source: "Delta controlled set, not registered",
      },
    ],
    note: "Template and Set B seal record are distinct; neither is registered as a roster family.",
  },
  {
    collisionId: "cargo-photo-condition",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Cargo photo checklist identity",
        familyKey: null,
        localCode: null,
        source: "cabinet id cargo-photo-checklist has no recovered body",
      },
      {
        label: "Cargo Photo/Condition Record (Set B)",
        familyKey: null,
        localCode: "OPS-005",
        source: "only OPS-005 source; not registered",
      },
    ],
    note: "Cabinet identity lacks a recovered body; Set B OPS-005 is a separate unregistered source.",
  },
  {
    collisionId: "accessorial-authorization",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Accessorial Charges & Authorization Log (Set A)",
        familyKey: null,
        localCode: "OPS-004",
        source:
          "Phase 3D set; same printed code as Set B seal record; not the same document",
      },
    ],
    note: "Set A OPS-004 accessorial log shares a printed code with Set B seal record but is a different document.",
  },
  {
    collisionId: "driver-settlement-statement",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Driver settlement statement",
        familyKey: "BOF-FIN-REC-001",
        localCode: null,
        source: "roster structured record",
      },
      {
        label: "Driver Settlement Statement (Set A)",
        familyKey: null,
        localCode: "OPS-003",
        source: "Phase 3D set; do not create a second settlement family",
      },
    ],
    note: "Set A settlement printout collides with the existing roster settlement family; do not create a second family.",
  },
  {
    collisionId: "settlement-hold-notice",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Settlement statement family",
        familyKey: "BOF-FIN-REC-001",
        localCode: null,
        source: "roster",
      },
      {
        label: "Settlement Hold Notice",
        familyKey: "BOF-OPS-006",
        localCode: null,
        source:
          "Printed document number: BOF-OPS-006. source-assets DOCX; separate family, not a merge into the statement; carrier-local code is not established",
      },
    ],
    note: "Hold notice is a distinct Phase 2 carrier-originated family from the settlement statement; not a merge.",
  },
  {
    collisionId: "factoring-notice-vs-policy",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Factoring policy",
        familyKey: "BOF-FIN-POL-002",
        localCode: null,
        source: "roster; source not recovered policy",
      },
      {
        label: "Factoring Notice",
        familyKey: "BOF-OPS-007",
        localCode: null,
        source:
          "Printed document number: BOF-OPS-007. source-assets DOCX; not the policy; carrier-local code is not established",
      },
    ],
    note: "Factoring notice DOCX is not the roster factoring policy.",
  },
  {
    collisionId: "ifta-log-vs-roster-form",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Roster form whose href is an IFTA html log",
        familyKey: "BOF-FIN-FORM-001",
        localCode: null,
        source: "roster",
      },
      {
        label: "IFTA Quarterly Mileage and Fuel Log DOCX",
        familyKey: "BOF-OPS-008",
        localCode: null,
        source:
          "Printed document number: BOF-OPS-008. source-assets DOCX; different controlled log; do not merge; carrier-local code is not established",
      },
    ],
    note: "DOCX IFTA log is a different controlled log from the roster form; do not merge.",
  },
  {
    collisionId: "incident-report-vs-register",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Short incident template",
        familyKey: "BOF-SAF-FORM-002",
        localCode: null,
        source: "roster",
      },
      {
        label: "Accident register",
        familyKey: "BOF-DRV-003",
        localCode: null,
        source: "roster; log, not an incident report",
      },
      {
        label: "Incident Report DOCX",
        familyKey: "BOF-OPS-009",
        localCode: null,
        source:
          "Printed document number: BOF-OPS-009. source-assets DOCX; not the register and not the short template; carrier-local code is not established",
      },
    ],
    note: "Short template, accident register, and DOCX incident report are three distinct controlled identities.",
  },
  {
    collisionId: "payroll-flexibility-vs-base-payroll",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Ordinary payroll policy",
        familyKey: "BOF-FIN-POL-001",
        localCode: null,
        source: "roster; HR payroll policy",
      },
      {
        label: "Payroll Flexibility Policy",
        familyKey: "BOF-PAY-001",
        localCode: null,
        source:
          "Printed document number: BOF-PAY-001. source-assets DOCX; carrier-originated; no BOF master; carrier-local code is not established",
      },
      {
        label: "Payroll Flexibility SOP",
        familyKey: "BOF-PAY-002",
        localCode: null,
        source:
          "Printed document number: BOF-PAY-002. source-assets DOCX; not merged into the policy or into BOF-FIN-POL-001; carrier-local code is not established",
      },
    ],
    note: "Carrier payroll-flexibility DOCX pair is distinct from the ordinary roster payroll policy; policy and SOP stay separate.",
  },
  {
    collisionId: "set-a-vs-set-b-ops-series",
    status: "UNRESOLVED",
    decision: "DO_NOT_MERGE",
    distinctDocuments: [
      {
        label: "Set A Phase 3D load/POD/settlement/accessorial series",
        familyKey: null,
        localCode: null,
        source: "printed OPS-001 through OPS-004, Dispatch & Load Operations",
      },
      {
        label: "Set B Delta controlled checklist series",
        familyKey: null,
        localCode: null,
        source: "printed OPS-001 through OPS-005, not revisions of Set A",
      },
    ],
    note: "Same printed OPS numbers across Set A and Set B are not the same documents; no code assigned here.",
  },
];
