"use client";

import { evaluateRecruitingV2ActivationReadiness, normalizeRecruitingV2OnboardingSummary } from "@/lib/recruiting-v2/activation-engine";
import { evaluateRecruitingV2DocumentGates, type RecruitingV2DocumentRecordForGate } from "@/lib/recruiting-v2/document-gate-engine";
import { allowedRecruitingV2OfferTransition, isRecruitingV2OfferStatus, normalizeRecruitingV2OfferSummary } from "@/lib/recruiting-v2/offer-engine";
import {
  buildRecruitingV2OnboardingChecklist,
  canCompleteRecruitingV2Onboarding,
  evaluateRecruitingV2Onboarding,
  isRecruitingV2OnboardingStatus,
  mapRecruitingV2OnboardingStatusToCandidateStatus,
  normalizeRecruitingV2OnboardingMetadata,
  type RecruitingV2OnboardingChecklistItem,
} from "@/lib/recruiting-v2/onboarding-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";
import {
  getSubmitFieldErrors,
  missingApprovalsForApprove,
  nextRequisitionStatus,
  REQUISITION_APPROVAL_ROLES,
  type RequisitionAction,
  type RequisitionStatusValue,
} from "@/lib/recruiting/requisition-transitions";
import { recruitingPipelineState, requisitionPipelineCounts } from "@/lib/recruiting/requisition-pipeline";
import { applicationScreenPasses, CONFIRMATION_REQUIREMENTS, evaluateRequisitionScreening } from "@/lib/recruiting/requisition-screening";
import { emptyInterviewResponses, INTERVIEW_RECOMMENDATIONS, recommendationLabel, validateStructuredInterview, type InterviewCategoryResponse } from "@/lib/recruiting/structured-interview";
import {
  buildRecruitingWorkspaceModel,
  positionFieldsFromRequisition,
  type RecruitingWorkspaceModel,
  type WorkspaceActivationFacts,
  type WorkspaceCandidateRow,
  type WorkspacePositionRow,
  type WorkspaceRequisition,
} from "@/lib/recruiting/workspace-model";
import type { RecruitingTransport, RecruitingTransportResponse } from "@/lib/recruiting/workspace-transport";

/**
 * Public demonstration backend for Recruiting & Onboarding. It answers the same requests as the
 * signed-in recruiting APIs, in the visitor's browser, using the same rule modules (requisition
 * transitions and approvals, document gates, qualification, screening, structured interview, offer,
 * onboarding and activation readiness). All records are fictional and live only in this browser;
 * nothing is sent to BOF systems. Activation is the one simulated step: it shows the records the
 * Oct-17 activation creates in the platform, without creating them.
 */

// v2: seeds the historical Recruiting V2 candidates (Michael Anderson CAND-001, Sarah Mitchell CAND-002).
const STORAGE_KEY = "bof-recruiting-demo-v2";
const FLEET = { id: "demo-fleet-lakeshore", name: "Lakeshore Regional Carriers (fictional)" };

type DemoApproval = {
  id: string;
  approvalRole: string;
  decision: string;
  reviewerName: string | null;
  notes: string | null;
  signatureName: string | null;
  signatureCaptureKind: string;
  decidedAt: string | null;
};
type DemoRequisition = Record<string, unknown> & {
  id: string;
  publicNumber: string;
  status: string;
  recruitingPipelineState: string;
  numberOfPositions: number;
  approvals: DemoApproval[];
};
type DemoState = {
  seq: number;
  requisitions: DemoRequisition[];
  positions: WorkspacePositionRow[];
  candidates: WorkspaceCandidateRow[];
  activations: Record<string, WorkspaceActivationFacts>;
};

const now = () => new Date().toISOString();

function approvals(decided: boolean): DemoApproval[] {
  return REQUISITION_APPROVAL_ROLES.map((role, i) => ({
    id: `demo-approval-${role}`,
    approvalRole: role,
    decision: decided ? "APPROVED" : "PENDING",
    reviewerName: decided ? ["Fleet manager", "Fleet safety director", "Fleet owner / GM", "BOF account manager", "BOF HR"][i] + " (fictional)" : null,
    notes: decided ? "Approved for the demonstration requisition." : null,
    signatureName: decided ? ["Fleet manager", "Fleet safety director", "Fleet owner / GM", "BOF account manager", "BOF HR"][i] + " (fictional)" : null,
    signatureCaptureKind: decided ? "TYPED" : "NOT_CAPTURED",
    decidedAt: decided ? "2026-10-12T15:00:00.000Z" : null,
  }));
}

function blankRequisition(id: string, publicNumber: string): DemoRequisition {
  return {
    id,
    publicNumber,
    fleetId: FLEET.id,
    fleet: FLEET,
    createdBy: { email: "recruiter@demo.bof.example", name: "BOF recruiter (fictional)" },
    status: "DRAFT",
    recruitingPipelineState: "NOT_OPEN",
    recruitingOpenedAt: null,
    dateSubmitted: null,
    targetStartDate: null,
    numberOfPositions: 1,
    minimumAge: null,
    cdlClass: null,
    approvals: approvals(false),
    createdAt: now(),
  };
}

/** The seeded, already-approved requisition the visitor starts from. Fictional carrier and people. */
function seedRequisition(): DemoRequisition {
  return {
    ...blankRequisition("demo-req-001", "BOF-HR-DRV-001"),
    status: "APPROVED",
    recruitingPipelineState: "READY_FOR_RECRUITING",
    recruitingOpenedAt: "2026-10-12T15:30:00.000Z",
    approvedAt: "2026-10-12T15:30:00.000Z",
    dateSubmitted: "2026-10-09T14:00:00.000Z",
    targetStartDate: "2026-11-16T00:00:00.000Z",
    numberOfPositions: 2,
    requestingCarrierName: FLEET.name,
    usdot: "0000000",
    mcNumber: "MC-000000",
    terminalDomicile: "Cleveland, OH",
    statesOfOperation: "OH, IN, IL, GA, TN",
    requestingManagerName: "Fleet manager (fictional)",
    department: "Linehaul operations",
    supervisor: "Cleveland terminal manager",
    positionClassification: "CDL-A company driver",
    employmentClassification: "Full-time W-2",
    flsaClassification: "Non-exempt (MCA exemption review)",
    urgency: "High: new dedicated lane",
    positionTitle: "CDL-A Regional Reefer Driver",
    reportingStructure: "Reports to the Cleveland terminal manager",
    workLocation: "Cleveland terminal",
    homeTimePattern: "Home weekly (34-hour restart at home)",
    routeLane: "Cleveland, OH to Atlanta, GA regional reefer lane",
    borderCrossings: false,
    typicalNightsAway: "4",
    equipmentType: "53' refrigerated trailer, Freightliner Cascadia",
    soloTeamOperation: "Solo",
    cdlClass: "A",
    endorsements: "None required (Tanker preferred)",
    experienceRequirements: "2 years verifiable tractor-trailer experience",
    mvrSafetyRequirements: "No major violations or preventable accidents in 3 years",
    pspRequired: true,
    clearinghouseRequired: true,
    medicalRequired: true,
    drugTestingRequired: true,
    backgroundCheckRequired: true,
    tsaRequired: false,
    compensationStructure: "Cents per mile with weekly guarantee",
    payRange: "$0.62–$0.68 CPM, $1,250 weekly guarantee",
    accessorialPay: "Detention after 2 hours; stop pay",
    signOnBonus: "$1,500 after 90 days",
    performanceBonus: "Quarterly safety bonus",
    benefits: "Medical, dental, vision, 401(k) match",
    positionSummary: "Regional reefer driver for the new Cleveland–Atlanta dedicated lane.",
    essentialFunctions: "Pre-trip inspections, reefer temperature checks, HOS compliance, POD capture.",
    physicalRequirements: "DOT physical; secure seals and open trailer doors",
    schedule: "5 days on, 34-hour restart at home",
    hosCycle: "70-hour / 8-day",
    recruitingInstructions: "BOF HR sources and screens; fleet interviews finalists.",
    sourcingChannels: "Job boards, referrals, driving schools",
    screeningRequirements: "MVR, PSP, Clearinghouse, drug test, employment verification",
    applicationRouting: "BOF HR review queue",
    targetFillMetrics: "Fill both seats within 21 days",
    budgetStatus: "Approved in operating budget",
    headcount: "2 new seats",
    financialJustification: "New dedicated lane volume",
    estimatedRecruitingCost: "$3,500 per hire",
    exceptions: "None",
    approvals: approvals(true),
  };
}

/**
 * Sarah Mitchell's original position (Recruiting V2 POSITION-CLASS-A-DAL, local shuttle), as an
 * approved requisition so she belongs to it like every other candidate.
 */
function seedDallasRequisition(): DemoRequisition {
  return {
    ...seedRequisition(),
    id: "demo-req-002",
    publicNumber: "BOF-HR-DRV-002",
    terminalDomicile: "Dallas, TX",
    statesOfOperation: "TX",
    supervisor: "Dallas terminal manager",
    urgency: "Standard: backfill",
    positionTitle: "CDL-A Local Shuttle Driver",
    reportingStructure: "Reports to the Dallas terminal manager",
    workLocation: "Dallas terminal",
    homeTimePattern: "Home daily",
    routeLane: "Dallas–Fort Worth yard and rail-ramp shuttles",
    typicalNightsAway: "0",
    equipmentType: "Day cab tractor, 53' dry van",
    endorsements: "None required",
    experienceRequirements: "1 year verifiable tractor-trailer experience",
    compensationStructure: "Hourly with overtime",
    payRange: "$27–$30 per hour",
    signOnBonus: "$1,000 after 60 days",
    positionSummary: "Local shuttle driver for Dallas–Fort Worth yard and rail-ramp moves.",
    essentialFunctions: "Pre-trip inspections, yard moves, rail-ramp drop and hook, HOS compliance.",
    schedule: "5 days, home daily",
    numberOfPositions: 1,
    headcount: "1 backfill seat",
    financialJustification: "Backfill of a departing driver",
    targetFillMetrics: "Fill within 30 days",
    dateSubmitted: "2026-10-10T14:00:00.000Z",
    approvedAt: "2026-10-13T15:30:00.000Z",
    recruitingOpenedAt: "2026-10-13T15:30:00.000Z",
    targetStartDate: "2026-11-30T00:00:00.000Z",
  };
}

function openPosition(state: DemoState, req: DemoRequisition) {
  if (state.positions.some((p) => p.requisitionId === req.id)) return;
  const fields = positionFieldsFromRequisition({
    publicNumber: req.publicNumber,
    fleetId: FLEET.id,
    positionTitle: (req.positionTitle as string) ?? null,
    terminalDomicile: (req.terminalDomicile as string) ?? null,
    workLocation: (req.workLocation as string) ?? null,
    equipmentType: (req.equipmentType as string) ?? null,
    positionClassification: (req.positionClassification as string) ?? null,
    routeLane: (req.routeLane as string) ?? null,
    statesOfOperation: (req.statesOfOperation as string) ?? null,
    compensationStructure: (req.compensationStructure as string) ?? null,
    payRange: (req.payRange as string) ?? null,
    positionSummary: (req.positionSummary as string) ?? null,
    numberOfPositions: req.numberOfPositions,
  });
  state.positions.push({ id: `demo-pos-${req.id}`, ...fields, status: "OPEN", requisitionId: req.id, fleetId: FLEET.id, createdAt: now() });
}

/** Stages the demonstration can start Michael Anderson at (the historical default is "activation"). */
export type DemoMichaelStage = "screen" | "interview" | "offer" | "onboarding" | "activation";

/** The two original Recruiting V2 demonstration candidates (fictional people; never written to a database). */
const MICHAEL = {
  fullName: "Michael Anderson",
  email: "michael.anderson@demo-candidate.bof.example",
  phone: "(216) 555-0182",
  homeLocation: "Cleveland, OH",
  cdlClass: "A",
  cdlState: "OH",
  cdlNumber: "OH00008821",
  experienceYears: 4,
  endorsements: ["N"],
  equipmentExperience: "4 years 53' refrigerated and dry van, Freightliner Cascadia",
};
const SARAH = {
  fullName: "Sarah Mitchell",
  email: "sarah.mitchell@demo-candidate.bof.example",
  phone: "(214) 555-0194",
  homeLocation: "Dallas, TX",
  cdlClass: "A",
  cdlState: "TX",
  cdlNumber: "TX00004491",
  experienceYears: 3,
  endorsements: [] as string[],
  equipmentExperience: "3 years local shuttle, day cab",
};

/** Runs one demonstration request during seeding; any rejection is a seed defect, so it throws. */
function seedCall(state: DemoState, method: string, path: string, body: Record<string, unknown> = {}) {
  const result = handle(state, method, path, body);
  if (!result.ok) throw new Error(`Demo seed: ${method} ${path} failed (${result.status}): ${result.data.error ?? ""}`);
  return result;
}

function seedCandidate(state: DemoState, name: string) {
  const model = handle(state, "GET", "/api/recruiting/workspace", {}).data as unknown as RecruitingWorkspaceModel;
  const candidate = model.candidates.find((c) => c.name === name);
  if (!candidate) throw new Error(`Demo seed: ${name} missing`);
  return candidate;
}

/**
 * Seeds the two historical Recruiting V2 candidates by replaying the same requests (and rules) a
 * recruiter's clicks send, so their states are earned, not set:
 * - Michael Anderson, CAND-001, BOF-HR-DRV-001 (Cleveland): application, screening, all documents
 *   verified, structured interview "Proceed", offer accepted, onboarding complete, ready to activate
 *   (Recruiting V2: qualification READY, offer COMPLETE, onboarding COMPLETE). `michaelStage` stops
 *   earlier for the stage links on /recruiting-onboarding.
 * - Sarah Mitchell, CAND-002, BOF-HR-DRV-002 (Dallas): application complete, no documents, so
 *   qualification, document review and compliance are blocked; interview not scheduled; no offer;
 *   onboarding pending (Recruiting V2: BLOCKED / NOT_PROVIDED / PENDING).
 */
function seedHistoricalCandidates(state: DemoState, michaelStage: DemoMichaelStage) {
  const [cleveland, dallas] = state.positions;
  seedCall(state, "POST", `/api/recruiting/positions/${cleveland.id}/candidates`, { ...MICHAEL, source: "BOF synthetic applicant intake" });
  seedCall(state, "POST", `/api/recruiting/positions/${dallas.id}/candidates`, { ...SARAH, source: "BOF synthetic applicant intake" });
  seedCall(state, "POST", "/api/recruiting/candidates/CAND-002/screening", { action: "screen" });

  const code = "CAND-001";
  if (michaelStage === "screen") return;
  seedCall(state, "POST", `/api/recruiting/candidates/${code}/screening`, { action: "screen" });
  let michael = seedCandidate(state, MICHAEL.fullName);
  for (const item of michael.screening.results.filter((r) => r.status === "RECRUITER_CONFIRMATION")) {
    seedCall(state, "POST", `/api/recruiting/candidates/${code}/screening`, { action: "confirm", key: item.key });
  }
  for (const gate of michael.documentGates.filter((g) => !g.latestDocument)) {
    seedCall(state, "POST", `/api/recruiting-v2/documents/${code}`, { documentType: gate.documentType, status: "RECEIVED", uploadedBy: "Recruiting & Onboarding workspace" });
  }
  michael = seedCandidate(state, MICHAEL.fullName);
  for (const gate of michael.documentGates.filter((g) => g.latestDocument && g.gateState !== "SATISFIED")) {
    seedCall(state, "PATCH", `/api/recruiting-v2/documents/${code}/${encodeURIComponent(gate.latestDocument!.documentCode)}`, {
      action: "VERIFY",
      verifiedBy: "BOF compliance review",
      verificationNotes: "Verified (demonstration).",
    });
  }
  if (michaelStage === "interview") return;
  const categories = emptyInterviewResponses().map((row) => ({ ...row, evaluation: "MEETS", responses: row.responses.map(() => "Fictional response recorded for the demonstration."), notes: "" }));
  seedCall(state, "PATCH", `/api/recruiting-v2/interviews/${code}`, {
    questionnaire: { categories, recommendation: "ADVANCE", conditions: "", decisionNotes: "Meets every requisition requirement; strong lane fit.", interviewer: "BOF recruiter (demo)" },
  });
  if (michaelStage === "offer") return;
  const offer = { compensation: cleveland.compensation, startDate: "2026-11-16", orientationDate: "2026-11-12" };
  seedCall(state, "POST", `/api/recruiting-v2/offer/${code}`, { offerStatus: "DRAFT", ...offer });
  seedCall(state, "POST", `/api/recruiting-v2/offer/${code}`, { offerStatus: "SENT", ...offer });
  seedCall(state, "POST", `/api/recruiting-v2/offer/${code}`, { offerStatus: "ACCEPTED" });
  if (michaelStage === "onboarding") return;
  seedCall(state, "POST", `/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "IN_PROGRESS", orientationDate: "2026-11-12", orientationLocation: "Cleveland terminal training room" });
  for (const key of ["training", "equipment-assignment"]) {
    michael = seedCandidate(state, MICHAEL.fullName);
    const onboardingChecklist = michael.onboardingItems.map((item) => ({ key: item.key, label: item.label, status: item.key === key ? "COMPLETE" : item.status, source: item.source, reason: item.reason }));
    seedCall(state, "POST", `/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "IN_PROGRESS", onboardingChecklist });
  }
  seedCall(state, "POST", `/api/recruiting-v2/onboarding/${code}`, { onboardingStatus: "COMPLETE" });
}

function seed(michaelStage: DemoMichaelStage = "activation"): DemoState {
  const state: DemoState = { seq: 1, requisitions: [seedRequisition(), seedDallasRequisition()], positions: [], candidates: [], activations: {} };
  for (const requisition of state.requisitions) openPosition(state, requisition);
  seedHistoricalCandidates(state, michaelStage);
  return state;
}

let memory: DemoState | null = null;

function load(): DemoState {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    memory = raw ? (JSON.parse(raw) as DemoState) : seed();
  } catch {
    memory = seed();
  }
  return memory;
}

function save(state: DemoState) {
  memory = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private window): the demonstration keeps working in memory.
  }
}

/** Restores the original demonstration: both historical candidates, Michael at `michaelStage`. */
export function resetRecruitingDemo(michaelStage: DemoMichaelStage = "activation") {
  memory = seed(michaelStage);
  save(memory);
}

const ok = (data: unknown, status = 200): RecruitingTransportResponse => ({ ok: true, status, data: data as RecruitingTransportResponse["data"] });
const fail = (error: string, status = 400): RecruitingTransportResponse => ({ ok: false, status, data: { error } });

function syncPipeline(state: DemoState, positionId: string) {
  const pos = state.positions.find((p) => p.id === positionId);
  const req = pos?.requisitionId ? state.requisitions.find((r) => r.id === pos.requisitionId) : null;
  if (!req) return;
  const own = state.candidates.filter((c) => c.positionId === positionId);
  const counts = requisitionPipelineCounts(
    req.numberOfPositions,
    own.map((c) => ({
      dispositionStatus: c.dispositionStatus,
      applicationStatus: c.applicationStatus,
      interviewCompleted: c.interviews.some((i) => i.status === "COMPLETED"),
      offerStatus: normalizeRecruitingV2OfferSummary(c.offerSummary).offerStatus,
      activationStatus: c.activationStatus,
    })),
  );
  const pipeline = recruitingPipelineState(req.status === "APPROVED" || req.status === "FILLED", counts);
  req.recruitingPipelineState = pipeline;
  if (pipeline === "FILLED" && req.status === "APPROVED") {
    req.status = "FILLED";
    req.filledAt = now();
  }
}

function candidateContext(c: WorkspaceCandidateRow) {
  const documentGates = evaluateRecruitingV2DocumentGates(c.documents);
  const latestInterview = getLatestRecruitingV2Interview(c.interviews);
  const qualification = aggregateRecruitingV2Qualification({
    candidate: {
      candidateCode: c.candidateCode,
      fullName: c.fullName,
      applicationStatus: c.applicationStatus as never,
      qualificationStatus: c.qualificationStatus as never,
      documentReviewStatus: c.documentReviewStatus as never,
      complianceStatus: c.complianceStatus as never,
      activationStage: c.activationStage as never,
    },
    documentGates,
    latestInterview,
  });
  return { documentGates, qualification };
}

function screening(state: DemoState, c: WorkspaceCandidateRow) {
  const pos = state.positions.find((p) => p.id === c.positionId);
  const req = state.requisitions.find((r) => r.id === pos?.requisitionId);
  const summary = (c.applicationSummary ?? {}) as Record<string, unknown>;
  const conf = ((summary.screening ?? {}) as { confirmations?: Record<string, { confirmedBy: string; confirmedAt: string }> }).confirmations ?? {};
  return {
    req,
    evaluation: evaluateRequisitionScreening({
      requisition: (req ?? {}) as never,
      candidate: {
        cdlClass: c.cdlClass,
        experienceYears: typeof summary.experienceYears === "number" ? summary.experienceYears : null,
        endorsements: Array.isArray(summary.endorsements) ? (summary.endorsements as string[]) : [],
        equipmentExperience: typeof summary.equipmentExperience === "string" ? summary.equipmentExperience : null,
        confirmations: conf,
      },
      documentGates: evaluateRecruitingV2DocumentGates(c.documents),
    }),
  };
}

function audit(c: WorkspaceCandidateRow, line: string) {
  c.auditTrail = [...(Array.isArray(c.auditTrail) ? (c.auditTrail as string[]) : []), `${line} (${now()})`];
}

function handle(state: DemoState, method: string, path: string, body: Record<string, unknown>): RecruitingTransportResponse {
  const parts = path.split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
  // ["api","recruiting",...] or ["api","recruiting-v2",...]
  const [, area, kind, id, sub] = parts;

  if (area === "recruiting" && kind === "workspace" && method === "GET") {
    const requisitions: WorkspaceRequisition[] = state.requisitions
      .filter((r) => r.status === "APPROVED" || r.status === "FILLED")
      .map((r) => ({ ...(r as unknown as WorkspaceRequisition), fleetName: FLEET.name, approvals: r.approvals.map((a) => ({ approvalRole: a.approvalRole, decision: a.decision })) }));
    return ok(
      buildRecruitingWorkspaceModel({
        mode: "demo",
        requisitions,
        positions: state.positions,
        candidates: state.candidates,
        activations: state.activations,
        requisitionHref: (rid) => `/demo/recruiting/requisitions/${rid}`,
        requisitionsHref: "/demo/recruiting",
      }),
    );
  }

  if (area === "recruiting" && kind === "requisitions") {
    if (!id) {
      if (method === "GET") return ok(state.requisitions);
      const n = state.requisitions.length + 1;
      const req = blankRequisition(`demo-req-${String(Date.now()).slice(-6)}`, `BOF-HR-DRV-${String(n).padStart(3, "0")}`);
      state.requisitions.unshift(req);
      return ok(req, 201);
    }
    const req = state.requisitions.find((r) => r.id === id);
    if (!req) return fail("Requisition not found", 404);
    if (!sub && method === "GET") return ok(req);
    if (!sub && method === "PATCH") {
      if (req.status !== "DRAFT") return fail("Only a draft requisition can be edited", 422);
      for (const [key, value] of Object.entries(body)) if (key !== "id" && key !== "status" && key !== "approvals") req[key] = value;
      return ok(req);
    }
    if (sub === "approvals") {
      if (req.status === "DRAFT") return fail("Submit the requisition before recording approvals", 422);
      const approval = req.approvals.find((a) => a.approvalRole === body.approvalRole);
      if (!approval) return fail("Unknown approval role", 422);
      Object.assign(approval, {
        decision: body.decision,
        reviewerName: (body.reviewerName as string) || null,
        signatureName: (body.signatureName as string) || null,
        notes: (body.notes as string) || null,
        signatureCaptureKind: body.signatureName ? "TYPED" : "NOT_CAPTURED",
        decidedAt: now(),
      });
      return ok(req);
    }
    if (sub === "position") {
      openPosition(state, req);
      return ok({ positionId: `demo-pos-${req.id}` }, 201);
    }
    const action = sub as RequisitionAction;
    try {
      if (action === "submit") {
        const errors = getSubmitFieldErrors({ positionTitle: req.positionTitle as string, numberOfPositions: req.numberOfPositions, targetStartDate: req.targetStartDate as string });
        if (errors.length) return fail(errors.join("; "), 422);
      }
      if (action === "approve") {
        const missing = missingApprovalsForApprove(req.cdlClass as string, req.approvals);
        if (missing.length) return fail(`CDL/approval requirements incomplete: ${missing.join(", ")} must approve before the requisition can be APPROVED`, 422);
      }
      req.status = nextRequisitionStatus(req.status as RequisitionStatusValue, action);
      if (action === "submit") req.dateSubmitted = now();
      if (action === "approve") {
        req.recruitingPipelineState = "READY_FOR_RECRUITING";
        req.recruitingOpenedAt = now();
        req.approvedAt = now();
        openPosition(state, req);
      }
      if (action === "hold" || action === "cancel") req.recruitingPipelineState = "NOT_OPEN";
      return ok(req);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Transition failed", 422);
    }
  }

  if (area === "recruiting" && kind === "positions" && sub === "candidates") {
    const pos = state.positions.find((p) => p.id === id);
    if (!pos) return fail("Position not found", 404);
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!String(body.fullName ?? "").trim()) return fail("fullName is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("A valid email is required");
    if (state.candidates.some((c) => c.positionId === id && c.email === email)) return fail("This candidate is already attached", 409);
    const req = state.requisitions.find((r) => r.id === pos.requisitionId);
    const code = `CAND-${String(state.seq++).padStart(3, "0")}`;
    const state2 = String(body.cdlState ?? "").toUpperCase().slice(0, 2);
    const digits = String(body.cdlNumber ?? "").replace(/[^0-9A-Za-z]/g, "");
    const row: WorkspaceCandidateRow = {
      id: `demo-${code}`,
      candidateCode: code,
      fullName: String(body.fullName).trim(),
      email,
      phone: String(body.phone ?? ""),
      homeLocation: String(body.homeLocation ?? ""),
      cdlClass: String(body.cdlClass ?? ""),
      cdlState: state2,
      cdlNumberMasked: digits ? `${state2 || "XX"}••••${digits.slice(-4)}` : "",
      applicationStatus: "PENDING",
      qualificationStatus: "PENDING",
      documentReviewStatus: "PENDING",
      complianceStatus: "PENDING",
      onboardingStatus: "PENDING",
      activationStage: "APPLICANT",
      activationStatus: "PENDING",
      applicationSummary: {
        appliedDate: now().slice(0, 10),
        experienceYears: Number.isFinite(Number(body.experienceYears)) ? Number(body.experienceYears) : null,
        endorsements: Array.isArray(body.endorsements) ? body.endorsements : [],
        equipmentExperience: body.equipmentExperience || null,
        requisitionId: pos.requisitionId,
        requisitionNumber: req?.publicNumber ?? null,
        screening: { confirmations: {} },
      },
      offerSummary: null,
      onboardingSummary: {},
      auditTrail: [`Attached to ${req?.publicNumber ?? pos.positionCode} (${pos.title}) (${now()})`],
      positionId: pos.id,
      dispositionStatus: "ACTIVE",
      dispositionReason: null,
      dispositionNotes: null,
      dispositionAt: null,
      createdAt: now(),
      documents: [],
      interviews: [],
    };
    state.candidates.push(row);
    syncPipeline(state, pos.id);
    return ok({ candidateCode: code }, 201);
  }

  const candidate = state.candidates.find((c) => c.candidateCode === id);

  if (area === "recruiting" && kind === "candidates" && candidate) {
    if (sub === "disposition") {
      const status = String(body.status ?? "");
      if (!["REJECTED", "WITHDRAWN", "ACTIVE"].includes(status)) return fail("status must be REJECTED, WITHDRAWN or ACTIVE");
      if (status !== "ACTIVE" && !body.reason) return fail("A reason is required");
      if (candidate.activationStatus === "ACTIVE") return fail("An activated driver cannot be rejected here.");
      candidate.dispositionStatus = status as WorkspaceCandidateRow["dispositionStatus"];
      candidate.dispositionReason = status === "ACTIVE" ? null : String(body.reason);
      candidate.dispositionNotes = status === "ACTIVE" ? null : String(body.notes ?? "") || null;
      candidate.dispositionAt = now();
      audit(candidate, status === "ACTIVE" ? "Candidate reopened" : `Candidate ${status.toLowerCase()}: ${body.reason}${body.notes ? ` (${body.notes})` : ""}`);
      syncPipeline(state, candidate.positionId);
      return ok({ ok: true });
    }
    if (sub === "screening") {
      if (candidate.dispositionStatus !== "ACTIVE") return fail(`Candidate is ${candidate.dispositionStatus.toLowerCase()}`);
      const { req, evaluation } = screening(state, candidate);
      if (!req) return fail("Candidate is not attached to a requisition", 422);
      if (body.action === "confirm") {
        const key = String(body.key);
        if (!(CONFIRMATION_REQUIREMENTS as readonly string[]).includes(key)) return fail("Unknown confirmation requirement");
        const summary = candidate.applicationSummary as Record<string, unknown>;
        const sc = (summary.screening ?? {}) as { confirmations?: Record<string, unknown> };
        summary.screening = { ...sc, confirmations: { ...(sc.confirmations ?? {}), [key]: { confirmedBy: "BOF recruiter (demo)", confirmedAt: now(), notes: null } } };
        audit(candidate, `Screening confirmation "${key}" recorded`);
        return ok({ evaluation: screening(state, candidate).evaluation });
      }
      const passes = applicationScreenPasses(evaluation);
      audit(candidate, `Screened against ${req.publicNumber}: ${passes ? "application review passed" : `failed (${evaluation.blocking.join("; ")})`}`);
      if (passes) candidate.applicationStatus = "COMPLETE";
      syncPipeline(state, candidate.positionId);
      return passes ? ok({ evaluation }) : { ok: false, status: 422, data: { error: `Screening failed: ${evaluation.blocking[0]}`, evaluation } as never };
    }
  }

  if (area === "recruiting-v2" && candidate) {
    if (kind === "documents") {
      if (!id) return fail("Candidate not found", 404);
      if (!sub && method === "POST") {
        const doc: RecruitingV2DocumentRecordForGate = {
          documentCode: `DOCV2-${candidate.candidateCode}-${String(body.documentType)}-${Date.now()}`,
          documentType: body.documentType as never,
          status: (body.status as never) ?? "RECEIVED",
          expirationDate: null,
          uploadedBy: (body.uploadedBy as string) ?? null,
          verifiedBy: null,
          verificationNotes: null,
          metadata: { demonstration: true },
          createdAt: now(),
          updatedAt: now(),
        };
        candidate.documents.unshift(doc);
        return ok({ documentRecord: doc }, 201);
      }
      if (sub && method === "PATCH") {
        const doc = candidate.documents.find((d) => d.documentCode === sub);
        if (!doc) return fail("Document record not found", 404);
        if (body.action === "VERIFY" && !body.verifiedBy) return fail("verifiedBy is required to verify a document");
        doc.status = (body.action === "VERIFY" ? "VERIFIED" : body.action === "REJECT" ? "REJECTED" : "PENDING_REVIEW") as never;
        doc.verifiedBy = (body.verifiedBy as string) ?? doc.verifiedBy;
        doc.verificationNotes = (body.verificationNotes as string) ?? doc.verificationNotes;
        doc.updatedAt = now();
        return ok({ documentRecord: doc });
      }
    }
    if (kind === "interviews" && method === "PATCH") {
      if (candidate.dispositionStatus !== "ACTIVE") return fail(`Candidate is ${candidate.dispositionStatus.toLowerCase()}; reopen the candidate before interviewing.`);
      const q = (body.questionnaire ?? {}) as Record<string, unknown>;
      const categories = (Array.isArray(q.categories) ? q.categories : []) as InterviewCategoryResponse[];
      const recommendation = INTERVIEW_RECOMMENDATIONS.find((r) => r.value === q.recommendation)?.value ?? null;
      const input = { categories, recommendation, conditions: String(q.conditions ?? ""), decisionNotes: String(q.decisionNotes ?? ""), interviewer: String(q.interviewer ?? "") };
      const errors = validateStructuredInterview(input);
      if (errors.length || !recommendation) return fail(errors[0] ?? "Choose a recommendation.");
      const completedAt = now();
      candidate.interviews.unshift({
        id: `demo-int-${Date.now()}`,
        interviewCode: `INTV2-${candidate.candidateCode}-${Date.now()}`,
        interviewDate: completedAt,
        interviewType: "Structured driver interview",
        location: "Recorded in Recruiting & Onboarding",
        status: "COMPLETED",
        score: null,
        recommendation,
        interviewers: [input.interviewer],
        notes: input.decisionNotes || input.conditions || null,
        questionnaire: { version: "bof-structured-interview-v1", ...input, recommendation, completedAt },
        createdAt: completedAt,
        updatedAt: completedAt,
      });
      audit(candidate, `Structured interview recorded by ${input.interviewer}: ${recommendationLabel(recommendation)}`);
      syncPipeline(state, candidate.positionId);
      return ok({ ok: true });
    }
    if (kind === "offer" && method === "POST") {
      const target = String(body.offerStatus ?? "");
      if (!isRecruitingV2OfferStatus(target) || target === "NOT_PROVIDED") return fail("offerStatus is invalid");
      if (candidate.dispositionStatus !== "ACTIVE" && target !== "DECLINED") return fail(`Candidate is ${candidate.dispositionStatus.toLowerCase()}; no offer can be made.`);
      const current = normalizeRecruitingV2OfferSummary(candidate.offerSummary);
      if (!allowedRecruitingV2OfferTransition(current.offerStatus, target)) return fail(`Invalid offer transition: ${current.offerStatus} to ${target}`);
      if (target === "DRAFT" || target === "SENT") {
        if (!body.compensation && !current.compensation) return fail("compensation is required");
        if (!body.startDate && !current.startDate) return fail("startDate is required");
        if (!body.orientationDate && !current.orientationDate) return fail("orientationDate is required");
        const sc = screening(state, candidate);
        if (sc.evaluation.status === "FAIL") return fail(`Screening against ${sc.req?.publicNumber} failed: ${sc.evaluation.blocking[0]}`);
        if (candidateContext(candidate).qualification.qualificationSummary.status !== "READY") return fail("Qualification must be READY before an offer can be prepared.");
      }
      if (target === "DECLINED" && !body.declineReason) return fail("declineReason is required");
      candidate.offerSummary = {
        ...current,
        offerCode: current.offerCode ?? `OFFV2-${candidate.candidateCode}`,
        offerStatus: target,
        compensation: (body.compensation as string) || current.compensation,
        startDate: (body.startDate as string) || current.startDate,
        orientationDate: (body.orientationDate as string) || current.orientationDate,
        notes: (body.notes as string) ?? current.notes,
        createdAt: current.createdAt ?? now(),
        updatedAt: now(),
        sentAt: target === "SENT" ? now() : current.sentAt,
        acceptedAt: target === "ACCEPTED" ? now() : current.acceptedAt,
        declinedAt: target === "DECLINED" ? now() : current.declinedAt,
        declineReason: target === "DECLINED" ? String(body.declineReason) : current.declineReason,
      };
      syncPipeline(state, candidate.positionId);
      return ok({ ok: true });
    }
    if (kind === "onboarding" && method === "POST") {
      const { documentGates, qualification } = candidateContext(candidate);
      const offer = normalizeRecruitingV2OfferSummary(candidate.offerSummary);
      const onboarding = normalizeRecruitingV2OnboardingMetadata(candidate.onboardingSummary, candidate.onboardingStatus);
      const checklist = buildRecruitingV2OnboardingChecklist({ qualificationSummary: qualification.qualificationSummary, offer, documentGates, onboarding });
      const decision = evaluateRecruitingV2Onboarding({ qualificationSummary: qualification.qualificationSummary, offer, onboarding, checklist });
      const target = String(body.onboardingStatus ?? onboarding.onboardingStatus);
      if (!isRecruitingV2OnboardingStatus(target)) return fail("onboardingStatus is invalid");
      if (!decision.onboardingEligible && target !== "PENDING") return fail(decision.blockingItems[0]?.requiredAction ?? "Onboarding is not eligible");
      const current = onboarding.onboardingStatus;
      if (current === "PENDING" && target === "COMPLETE") return fail("Invalid onboarding transition: PENDING to COMPLETE");
      if (current === "COMPLETE" && target !== "COMPLETE") return fail(`Invalid onboarding transition: COMPLETE to ${target}`);
      const next = {
        ...onboarding,
        onboardingStatus: target,
        orientationDate: body.orientationDate === undefined ? onboarding.orientationDate : String(body.orientationDate),
        orientationLocation: body.orientationLocation === undefined ? onboarding.orientationLocation : String(body.orientationLocation),
        onboardingChecklist: (Array.isArray(body.onboardingChecklist) ? body.onboardingChecklist : checklist) as RecruitingV2OnboardingChecklistItem[],
        createdAt: onboarding.createdAt ?? now(),
        updatedAt: now(),
      };
      const nextChecklist = buildRecruitingV2OnboardingChecklist({ qualificationSummary: qualification.qualificationSummary, offer, documentGates, onboarding: next });
      const nextDecision = evaluateRecruitingV2Onboarding({ qualificationSummary: qualification.qualificationSummary, offer, onboarding: next, checklist: nextChecklist });
      if (target === "COMPLETE" && !canCompleteRecruitingV2Onboarding(nextDecision)) {
        return fail(nextDecision.blockingItems[0]?.requiredAction ?? nextDecision.pendingItems[0]?.requiredAction ?? "Required onboarding checklist is incomplete");
      }
      candidate.onboardingSummary = { ...next, onboardingChecklist: nextChecklist };
      candidate.onboardingStatus = mapRecruitingV2OnboardingStatusToCandidateStatus(target);
      return ok({ ok: true });
    }
    if (kind === "activation" && method === "POST") {
      if (candidate.dispositionStatus !== "ACTIVE") return fail(`Candidate is ${candidate.dispositionStatus.toLowerCase()} and cannot be activated.`);
      const { qualification } = candidateContext(candidate);
      const readiness = evaluateRecruitingV2ActivationReadiness({
        qualificationSummary: qualification.qualificationSummary,
        qualificationRisks: qualification.operationalRisks,
        offer: normalizeRecruitingV2OfferSummary(candidate.offerSummary),
        onboarding: normalizeRecruitingV2OnboardingSummary(candidate.onboardingSummary, candidate.onboardingStatus),
      });
      if (!readiness.ready) return fail("Activation prerequisites are incomplete; ACTIVE cannot be persisted.");
      const driverId = `DRV-DEMO-${candidate.candidateCode.slice(5)}`;
      candidate.activationStatus = "ACTIVE";
      candidate.activationStage = "ACTIVATED";
      state.activations[candidate.candidateCode] = {
        simulated: true,
        driverId,
        driverIntakeId: `INTAKE-DEMO-${candidate.candidateCode.slice(5)}`,
        fleetId: FLEET.id,
        activatedAt: now(),
        driverHref: null,
        readinessHref: null,
        qualification: {
          status: "QUALIFICATION REVIEW OPENED",
          reasons: [
            "The platform opens a driver intake in qualification review and re-evaluates the driver qualification file (employment history, MVR, medical, Clearinghouse).",
            "This demonstration does not run that evaluation, so no qualification result is shown as final.",
          ],
        },
        readiness: {
          status: "NOT_READY",
          score: null,
          blockers: [
            "Assignment readiness requires a qualified driver file; readiness gates are evaluated after qualification review.",
            "In the signed-in platform the actual qualification and readiness reasons appear here (for example WORK_HISTORY_INCOMPLETE).",
          ],
          dispatchEligible: false,
        },
        records: [
          `Driver ${driverId} (ACTIVE) — created in the platform, simulated here`,
          `Driver intake in QUALIFICATION_REVIEW — created in the platform, simulated here`,
          `${candidate.documents.length} driver document records carried over from recruiting — created in the platform, simulated here`,
          "Qualification snapshot and readiness score — written in the platform at activation",
        ],
      };
      audit(candidate, `Driver activated (demonstration) as ${driverId}`);
      syncPipeline(state, candidate.positionId);
      return ok({ ok: true }, 201);
    }
  }
  return fail(`Not available in the demonstration: ${method} ${path}`, 404);
}

export const demoRecruitingTransport: RecruitingTransport = async (path, init) => {
  const state = load();
  const method = init?.method ?? (init?.body === undefined ? "GET" : "POST");
  const result = handle(state, method, path, (init?.body ?? {}) as Record<string, unknown>);
  if (method !== "GET") save(state);
  return JSON.parse(JSON.stringify(result)) as RecruitingTransportResponse;
};
