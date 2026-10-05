/**
 * Phase 2 Delta carrier-originated instances.
 *
 * These six recovered DOCX sources are NOT on the 64-code roster.
 * Each is CARRIER_ORIGINATED with no BOF master (masterId null).
 * Do not invent carrier identity facts or approval authority here.
 *
 * The DOCX files print BOF document numbers. They do not establish a
 * carrier-local code, so localCode stays null. The printed number is kept
 * on the source ref and is not rewritten by stripping the BOF prefix.
 */
import type { CarrierInstance, DocumentFamily } from "../types";

const CARRIER_ID = "delta-advanced-trucking" as const;

const PROVENANCE_NOTE =
  "Not BOF master approval; payroll flexibility is not BOF-FIN-POL-001.";

function purposeFor(fileName: string): string {
  return `Carrier-originated Delta source preserved from ${fileName}; not a carrier-neutral BOF master; Delta identity facts remain unresolved.`;
}

function docxRef(ref: string, printedDocumentNumber: string) {
  return {
    kind: "DOCX" as const,
    ref,
    note: `Printed document number: ${printedDocumentNumber}`,
  };
}

export const PHASE2_DELTA_FAMILIES: readonly DocumentFamily[] = [
  {
    familyKey: "BOF-OPS-006",
    title: "Settlement Hold Notice",
    function: "OPS",
    type: "FORM",
    purpose: purposeFor("BOF-OPS-006 Settlement Hold Notice.docx"),
    vaultClass: "OPERATIONAL_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
  {
    familyKey: "BOF-OPS-007",
    title: "Factoring Notice",
    function: "OPS",
    type: "FORM",
    purpose: purposeFor("BOF-OPS-007 Factoring Notice.docx"),
    vaultClass: "OPERATIONAL_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
  {
    familyKey: "BOF-OPS-008",
    title: "IFTA Quarterly Mileage and Fuel Log",
    function: "OPS",
    type: "FORM",
    purpose: purposeFor("BOF-OPS-008 IFTA Quarterly Mileage and Fuel Log.docx"),
    vaultClass: "FINANCIAL_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
  {
    familyKey: "BOF-OPS-009",
    title: "Incident Report",
    function: "OPS",
    type: "FORM",
    purpose: purposeFor("BOF-OPS-009 Incident Report.docx"),
    vaultClass: "OPERATIONAL_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
  {
    familyKey: "BOF-PAY-001",
    title: "Payroll Flexibility Policy",
    function: "FIN",
    type: "POL",
    purpose: purposeFor("BOF-PAY-001 Payroll Flexibility Policy.docx"),
    vaultClass: "EMPLOYER_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
  {
    familyKey: "BOF-PAY-002",
    title: "Payroll Flexibility Operating SOP",
    function: "FIN",
    type: "SOP",
    purpose: purposeFor("BOF-PAY-002 Payroll Flexibility Operating SOP.docx"),
    vaultClass: "EMPLOYER_RECORD",
    digitalBehavior: "STATIC_TEMPLATE",
    workflow: "Not a production workflow",
    user: "Document control",
    aliases: [],
    related: {},
  },
];

export const PHASE2_DELTA_INSTANCES: readonly CarrierInstance[] = [
  {
    instanceId: "BOF-OPS-006::delta-advanced-trucking",
    familyKey: "BOF-OPS-006",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "Settlement Hold Notice",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-OPS-006 Settlement Hold Notice.docx",
          "BOF-OPS-006",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
  {
    instanceId: "BOF-OPS-007::delta-advanced-trucking",
    familyKey: "BOF-OPS-007",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "Factoring Notice",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-OPS-007 Factoring Notice.docx",
          "BOF-OPS-007",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
  {
    instanceId: "BOF-OPS-008::delta-advanced-trucking",
    familyKey: "BOF-OPS-008",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "IFTA Quarterly Mileage and Fuel Log",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-OPS-008 IFTA Quarterly Mileage and Fuel Log.docx",
          "BOF-OPS-008",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
  {
    instanceId: "BOF-OPS-009::delta-advanced-trucking",
    familyKey: "BOF-OPS-009",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "Incident Report",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-OPS-009 Incident Report.docx",
          "BOF-OPS-009",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
  {
    instanceId: "BOF-PAY-001::delta-advanced-trucking",
    familyKey: "BOF-PAY-001",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "Payroll Flexibility Policy",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-PAY-001 Payroll Flexibility Policy.docx",
          "BOF-PAY-001",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
  {
    instanceId: "BOF-PAY-002::delta-advanced-trucking",
    familyKey: "BOF-PAY-002",
    carrierId: CARRIER_ID,
    masterId: null,
    instanceVersion: "1.0",
    localCode: null,
    localTitle: "Payroll Flexibility Operating SOP",
    lifecycle: "INTERNAL_REVIEW",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: CARRIER_ID,
      status: "NOT_ADOPTED",
      adoptedByName: null,
      adoptedByTitle: null,
      adoptedAt: null,
      evidenceRef: null,
    },
    overrides: [],
    provenance: {
      origin: "CARRIER_ORIGINATED",
      sourceRefs: [
        docxRef(
          "source-assets/policies/BOF-PAY-002 Payroll Flexibility Operating SOP.docx",
          "BOF-PAY-002",
        ),
      ],
      note: PROVENANCE_NOTE,
    },
    stableAppIds: [],
  },
];
