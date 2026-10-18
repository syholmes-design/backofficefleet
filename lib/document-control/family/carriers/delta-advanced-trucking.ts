/**
 * Carrier profile data entry: Delta Advanced Trucking (DEMO).
 *
 * This file is DATA ONLY. Every value is cited to a repository source.
 * Nothing here is invented: where sources disagree the fact is CONFLICTING
 * (value null, every candidate listed); where nothing authoritative exists the
 * fact is NOT_RECORDED (value null).
 *
 * Caveat on sources: lib/carrier-registry.ts is a counterparty / partner-carrier
 * registry (CAR-001), not tenant identity. lib/services/fmcsa/fixtureProvider.ts
 * is a test fixture. Generator scripts and templates are demo document
 * generators. None of these is an authoritative carrier identity record.
 */
import type { CarrierProfile, PostalAddress, SourceRef } from "../types";

const SRC_CARRIER_REGISTRY_NAME: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/carrier-registry.ts:78-79",
  note: "CAR-001 in counterparty/partner-carrier registry; not tenant identity.",
};
const SRC_CARRIER_REGISTRY_IDS: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/carrier-registry.ts:81-82",
  note: "CAR-001 dotNumber/mcNumber in counterparty/partner-carrier registry; stored with DOT-/MC- prefixes.",
};
const SRC_CARRIER_REGISTRY_TERMINAL: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/carrier-registry.ts:83",
  note: "homeTerminal \"Richmond, VA\" (city/state only; no street or postal code). Counterparty registry.",
};
const SRC_CARRIER_REGISTRY_CONTACT: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/carrier-registry.ts:84-89",
  note: "CAR-001 primaryContact in counterparty/partner-carrier registry.",
};
const SRC_FMCSA_FIXTURE: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/services/fmcsa/fixtureProvider.ts:6-14",
  note: "FMCSA test fixture MATCH_CARRIER; not a live FMCSA lookup.",
};
const SRC_PACKET_EVIDENCE: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/carrier-packet-evidence.ts:119-120",
  note: "CAR-001 operating-authority snapshot fields (demo packet evidence).",
};
const SRC_ROAD_TEST_IDS: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/generate-road-test-certificates.mjs:114-116",
  note: "carrierDot \"123467\" / carrierMc \"765432\" look like placeholder sequences in a demo generator.",
};
const SRC_ROAD_TEST_REPS: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/generate-road-test-certificates.mjs:15-20",
  note: "CARRIER_REPS rotated across generated road-test certificates (James Wilson, Olivia Turner, Ryan Cooper, Samantha Hughes); demo signatories, not a declared approval authority.",
};
const SRC_EMPLOYMENT_VERIFICATION_TEMPLATE: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/templates/driver-docs/employment-verification.template.html:43",
  note: "Template renders unfilled \"DOT: [DOT Number] · MC: [MC Number]\" placeholders.",
};
const SRC_HR_PAYROLL_CONFIG: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/generate-driver-hr-payroll-docs.mjs:21-24",
  note: "BOF_CONFIG company/address used by the HR/payroll demo document generator.",
};
const SRC_HR_REPRESENTATIVE: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/generate-driver-hr-payroll-docs.mjs:34",
  note: "HR_REPRESENTATIVE \"M. Torres\" in HR/payroll demo generator; initial only, no contact details.",
};
const SRC_DRIVER_DOCS_REQUESTER: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/generate-driver-docs.mjs:140-142",
  note: "W-9 requesterName/requesterAddress in driver-doc demo generator.",
};
const SRC_OO_LEASE_TEMPLATE: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/templates/owner-operator-lease-template.html:139",
  note: "Owner-operator lease template states the Company is located at 810 Demo Street, Dallas, TX 75202.",
};
const SRC_OO_LEASE_SIGNATORY: SourceRef = {
  kind: "REPO_FILE",
  ref: "scripts/templates/owner-operator-lease-template.html:402-406",
  note: "Company signatory is an unfilled {{COMPANY_REP_NAME}} / {{COMPANY_REP_TITLE}} placeholder.",
};
const SRC_FILE_CABINET: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/operations-file-cabinet.ts:103",
  note: "employerName on operations file cabinet entries (repeated throughout the file).",
};
const SRC_FIN_POL_BODY_HEADER: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/document-control/forms/bof-fin-pol-001-body.ts:2-4",
  note: "\"DAT identity HR-PAY-001\": a DAT-local code without a DAT- prefix. Also states DAT signatures are not BOF approval.",
};
const SRC_FIN_POL_BODY_PAYROLL_EMAIL: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/document-control/forms/bof-fin-pol-001-body.ts:87",
  note: "payroll@deltaadvanced.com recovered as written from HR-PAY-001 DOCX; explicitly not a verified live mailbox.",
};
const SRC_PAYROLL_DOCX: SourceRef = {
  kind: "DOCX",
  ref: "source-assets/policies/Payroll Compensation and Deductions Policy.docx",
  note: "Cited by lib/document-control/registry.ts:326 as the HR-PAY-001 source; not read directly for this profile.",
};
const SRC_LEGACY_PAYROLL_HTML: SourceRef = {
  kind: "REPO_FILE",
  ref: "public/generated/company-operations-vault/_historical/legacy-generated/04-payroll-compensation-and-deductions-policy.html:196,465",
  note: "\"Debra Sanders, Director, HR\" signs a legacy historical payroll policy HTML. A document fact only; not a declared carrier approval authority.",
};
const SRC_REGISTRY_DAT_MSA: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/document-control/registry.ts:621-625",
  note: "DAT-MSA-001 identifier preserved (href public/generated/agreements/DAT-MSA-001/...).",
};
const SRC_REGISTRY_DAT_SAF: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/document-control/registry.ts:62,86",
  note: "DAT-SAF-POL-001 and DAT-SAF-FORM-001 cited as source identities in notes.",
};
const SRC_REGISTRY_DAT_IT: SourceRef = {
  kind: "REPO_FILE",
  ref: "lib/document-control/registry.ts:648",
  note: "\"Recovered DAT-IT-003 identity\".",
};
const SRC_ROSTER_DAT_IT: SourceRef = {
  kind: "ROSTER_NOTE",
  ref: "lib/document-control/phase2-roster.ts:549,574,599,649,674",
  note: "Recovered DAT-IT-001, DAT-IT-004, DAT-IT-004-S, DAT-IT-014, DAT-IT-008.",
};

const MANSFIELD_OH: PostalAddress = {
  street: "540 Demo Street",
  city: "Mansfield",
  region: "OH",
  postalCode: "44905",
  country: "US",
};
const CLEVELAND_OH: PostalAddress = {
  street: "190 Demo Street",
  city: "Cleveland",
  region: "OH",
  postalCode: "44113",
  country: "US",
};
const DALLAS_TX: PostalAddress = {
  street: "810 Demo Street",
  city: "Dallas",
  region: "TX",
  postalCode: "75202",
  country: "US",
};
/** City/state only in source; empty street/postalCode mean "not stated", not a value. */
const RICHMOND_VA_TERMINAL: PostalAddress = {
  street: "",
  city: "Richmond",
  region: "VA",
  postalCode: "",
  country: "US",
};

export const DELTA_ADVANCED_TRUCKING_PROFILE: CarrierProfile = {
  carrierId: "delta-advanced-trucking",
  // No Delta fleet in repo: prisma/schema.prisma Fleet has slug/id, but the dev
  // seed (scripts/seed-dev-bof-foundation.mjs:20-22) only creates fleet-a,
  // fleet-b and bof-service, none identified as Delta. No prisma/seed* file.
  fleetRef: { fleetSlug: null, fleetId: null },
  profileStatus: "DEMO",

  legalName: {
    value: "Delta Advanced Trucking, Inc.",
    status: "RECORDED",
    sources: [
      SRC_CARRIER_REGISTRY_NAME,
      SRC_FMCSA_FIXTURE,
      SRC_HR_PAYROLL_CONFIG,
      SRC_FILE_CABINET,
      SRC_ROAD_TEST_IDS,
      SRC_OO_LEASE_TEMPLATE,
    ],
    note: "All repository sources agree on this string. Sources are demo/registry/fixture data, not a verified legal filing.",
  },

  dba: {
    value: "Delta Advanced Trucking",
    status: "RECORDED",
    sources: [SRC_CARRIER_REGISTRY_NAME, SRC_FMCSA_FIXTURE],
    note: "Consistent across the counterparty registry and FMCSA test fixture; neither is a verified DBA filing.",
  },

  logoRef: {
    value: null,
    status: "NOT_RECORDED",
    sources: [],
    note: "No Delta logo asset found under public/. BOF logos (public/logo/boflogo-*, public/approved/bof-logo-approved*.png) are BackOfficeFleet marks, not Delta's.",
  },

  address: {
    value: null,
    status: "CONFLICTING",
    sources: [
      SRC_HR_PAYROLL_CONFIG,
      SRC_DRIVER_DOCS_REQUESTER,
      SRC_OO_LEASE_TEMPLATE,
      SRC_CARRIER_REGISTRY_TERMINAL,
    ],
    conflictingValues: [
      { value: MANSFIELD_OH, source: SRC_HR_PAYROLL_CONFIG },
      { value: CLEVELAND_OH, source: SRC_DRIVER_DOCS_REQUESTER },
      { value: DALLAS_TX, source: SRC_OO_LEASE_TEMPLATE },
      { value: RICHMOND_VA_TERMINAL, source: SRC_CARRIER_REGISTRY_TERMINAL },
    ],
    note: "Four different locations appear across demo generators, a template, and the counterparty registry (Richmond is a home terminal with no street). Country \"US\" is implied by US state/ZIP in each source. No authoritative principal address is recorded.",
  },

  usdot: {
    value: null,
    status: "CONFLICTING",
    sources: [
      SRC_CARRIER_REGISTRY_IDS,
      SRC_PACKET_EVIDENCE,
      SRC_FMCSA_FIXTURE,
      SRC_ROAD_TEST_IDS,
      SRC_EMPLOYMENT_VERIFICATION_TEMPLATE,
    ],
    conflictingValues: [
      { value: "2481936", source: SRC_CARRIER_REGISTRY_IDS },
      { value: "2481936", source: SRC_PACKET_EVIDENCE },
      { value: "2481936", source: SRC_FMCSA_FIXTURE },
      { value: "123467", source: SRC_ROAD_TEST_IDS },
    ],
    note: "\"2481936\" appears in the counterparty registry, demo packet evidence and an FMCSA test fixture; \"123467\" is a placeholder-looking value in the road-test generator; the employment-verification template leaves \"[DOT Number]\" unfilled. None is a verified FMCSA record.",
  },

  mc: {
    value: null,
    status: "CONFLICTING",
    sources: [
      SRC_CARRIER_REGISTRY_IDS,
      SRC_PACKET_EVIDENCE,
      SRC_FMCSA_FIXTURE,
      SRC_ROAD_TEST_IDS,
      SRC_EMPLOYMENT_VERIFICATION_TEMPLATE,
    ],
    conflictingValues: [
      { value: "874201", source: SRC_CARRIER_REGISTRY_IDS },
      { value: "874201", source: SRC_PACKET_EVIDENCE },
      { value: "874201", source: SRC_FMCSA_FIXTURE },
      { value: "765432", source: SRC_ROAD_TEST_IDS },
    ],
    note: "\"874201\" (registry/packet/fixture docket) vs placeholder-looking \"765432\" (road-test generator); template leaves \"[MC Number]\" unfilled.",
  },

  contacts: {
    value: null,
    status: "CONFLICTING",
    sources: [
      SRC_CARRIER_REGISTRY_CONTACT,
      SRC_FIN_POL_BODY_PAYROLL_EMAIL,
      SRC_HR_REPRESENTATIVE,
    ],
    conflictingValues: [
      {
        value: [
          {
            role: "Fleet Operations Manager",
            name: "Renee Collins",
            email: "rcollins@deltaadvancedtransport.com",
            phone: "(804) 555-0148",
          },
        ],
        source: SRC_CARRIER_REGISTRY_CONTACT,
      },
      {
        value: [{ role: "Payroll", name: null, email: "payroll@deltaadvanced.com", phone: null }],
        source: SRC_FIN_POL_BODY_PAYROLL_EMAIL,
      },
      {
        value: [{ role: "HR Representative", name: "M. Torres", email: null, phone: null }],
        source: SRC_HR_REPRESENTATIVE,
      },
    ],
    note: "Sources disagree on the carrier email domain (deltaadvancedtransport.com vs deltaadvanced.com) and none is authoritative: the registry is a counterparty record with a 555 demo phone, the payroll mailbox is explicitly unverified, and M. Torres is a demo generator constant.",
  },

  approvalAuthority: {
    value: null,
    status: "NOT_RECORDED",
    sources: [SRC_LEGACY_PAYROLL_HTML, SRC_FIN_POL_BODY_HEADER, SRC_ROAD_TEST_REPS, SRC_OO_LEASE_SIGNATORY],
    note: "No repository source declares Delta's document approval authority. Debra Sanders (Director, HR) signs a legacy historical payroll HTML only; bof-fin-pol-001-body.ts states DAT signatures are not treated as approval; road-test carrier reps rotate; the lease template signatory is an unfilled placeholder.",
  },

  localCodePrefix: {
    value: null,
    status: "CONFLICTING",
    sources: [
      SRC_REGISTRY_DAT_MSA,
      SRC_REGISTRY_DAT_SAF,
      SRC_REGISTRY_DAT_IT,
      SRC_ROSTER_DAT_IT,
      SRC_FIN_POL_BODY_HEADER,
      SRC_PAYROLL_DOCX,
    ],
    conflictingValues: [
      { value: "DAT", source: SRC_REGISTRY_DAT_MSA },
      { value: "DAT", source: SRC_REGISTRY_DAT_SAF },
      { value: "DAT", source: SRC_REGISTRY_DAT_IT },
      { value: "DAT", source: SRC_ROSTER_DAT_IT },
      { value: "", source: SRC_FIN_POL_BODY_HEADER },
    ],
    note: "No prefix is declared anywhere; this is inferred from usage. Most recovered Delta-local codes use \"DAT-\" (DAT-MSA-001, DAT-SAF-POL-001, DAT-SAF-FORM-001, DAT-IT-00x), but HR-PAY-001 is described as a \"DAT identity\" with no DAT- prefix (empty-string candidate = unprefixed). Mixed usage, so not recorded.",
  },
};
