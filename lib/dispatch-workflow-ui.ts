export type DispatchDriverOption = {
  id: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

export type DispatchLoadRecord = {
  id: string;
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  referenceNumber: string | null;
  secondaryReferenceNumber: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DispatchEquipmentRecord = {
  id: string;
  fleetId: string;
  equipmentType: "TRACTOR" | "TRAILER";
  unitNumber: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_SERVICE";
  createdAt: string;
  updatedAt: string;
};

export type DispatchAssignmentRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  driverId: string;
  tractorEquipmentId: string;
  trailerEquipmentId: string | null;
  status: "ACTIVE" | "SUPERSEDED" | "COMPLETED" | "CANCELLED";
  assignedAt: string;
  assignedByUserId: string | null;
  unassignedAt: string | null;
  unassignedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  load?: DispatchLoadRecord;
  driver?: {
    id: string;
    fleetId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  tractorEquipment?: DispatchEquipmentRecord | null;
  trailerEquipment?: DispatchEquipmentRecord | null;
};

export type DispatchReadinessRecord = {
  id: string;
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  status: "READY" | "CONDITIONAL" | "NOT_READY";
  score: number;
  reasonCodes: unknown;
  summary: string;
  policyVersion: string;
  evaluatedAt: string;
  evaluatedByUserId: string | null;
};

export type DispatchPreTripItemRecord = {
  id: string;
  preTripHeaderId: string;
  sectionCode: string;
  itemCode: string;
  isCritical: boolean;
  status: "PENDING" | "PASS" | "WARNING" | "FAIL" | "NOT_APPLICABLE";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DispatchPreTripDefectRecord = {
  id: string;
  preTripHeaderId: string;
  preTripItemId: string | null;
  itemCode: string;
  severity: "WARNING" | "BLOCKING";
  description: string;
  requiresRepair: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DispatchPreTripRecord = {
  id: string;
  fleetId: string;
  assignmentId: string;
  status: "OPEN" | "COMPLETED" | "BLOCKED" | "VOIDED";
  completedAt: string | null;
  completedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  assignment: DispatchAssignmentRecord;
  items: DispatchPreTripItemRecord[];
  defects: DispatchPreTripDefectRecord[];
};

export type DispatchReleaseRecord = {
  id: string;
  fleetId: string;
  loadId: string;
  assignmentId: string;
  driverId: string;
  tractorEquipmentId: string;
  trailerEquipmentId: string | null;
  preTripHeaderId: string | null;
  driverReadinessScoreId: string;
  disposition: "RELEASED" | "CONDITIONALLY_RELEASED" | "HOLD" | "BLOCKED";
  reasonCodes: unknown;
  summary: string;
  policyVersion: string;
  evaluatedAt: string;
  evaluatedByUserId: string | null;
  createdAt: string;
};

export type DispatchLoadWorkflowSnapshot = {
  assignment: DispatchAssignmentRecord | null;
  readiness: DispatchReadinessRecord | null;
  readinessError: string | null;
  preTrip: DispatchPreTripRecord | null;
  latestRelease: DispatchReleaseRecord | null;
};

export type ConditionBaselineCondition = {
  conditionThreadId: string;
  title: string;
  category: string;
  severity: string;
  impact: string | null;
  lifecycleState: string;
  verificationState: string;
  evidenceCompleteness: string;
  firstIdentifiedAt: string;
  lastConfirmedAt: string | null;
  repairReportedAt: string | null;
  resolutionVerifiedAt: string | null;
  latestEvent: {
    id: string;
    eventType: string;
    observedAt: string;
    notes: string | null;
  } | null;
  latestEvidence: {
    id: string;
    capturedAt: string;
    originalFileName: string;
    evidenceKind: string;
    mimeType: string | null;
  } | null;
  driverPrompt: string;
  evidencePrompt: string;
};

export type ConditionBaselineEquipment = {
  kind: "TRACTOR" | "TRAILER";
  equipmentId: string;
  unitNumber: string;
  conditions: ConditionBaselineCondition[];
};

export type PreTripConditionBaseline = {
  assignment: {
    id: string;
    fleetId: string;
    loadId: string;
    driverId: string;
    tractorEquipmentId: string;
    trailerEquipmentId: string | null;
  };
  actorContext: {
    actorUserId: string;
    linkedDriverId: string | null;
    isOperator: boolean;
  };
  equipments: ConditionBaselineEquipment[];
};

export const PRETRIP_ITEM_CATALOG = [
  { itemCode: "rate-con", label: "Rate Confirmation", sectionCode: "LOAD_DOCS", isCritical: true },
  { itemCode: "bol", label: "BOL", sectionCode: "LOAD_DOCS", isCritical: true },
  { itemCode: "dispatch-instructions", label: "Dispatch instructions", sectionCode: "LOAD_DOCS", isCritical: true },
  { itemCode: "pretrip-cargo", label: "Pre-trip cargo photo", sectionCode: "PROOF_REQUIREMENTS", isCritical: true },
  { itemCode: "seal-verify", label: "Seal verification", sectionCode: "PROOF_REQUIREMENTS", isCritical: true },
  { itemCode: "pod-pretrip", label: "POD stack (readiness)", sectionCode: "PROOF_REQUIREMENTS", isCritical: false },
  { itemCode: "trailer-condition", label: "Trailer condition", sectionCode: "PROOF_REQUIREMENTS", isCritical: false },
  { itemCode: "maint-report", label: "Maintenance report", sectionCode: "VEHICLE_READINESS", isCritical: false },
  { itemCode: "tire-check", label: "Tire check", sectionCode: "VEHICLE_READINESS", isCritical: false },
  { itemCode: "fuel-check", label: "Fuel check", sectionCode: "VEHICLE_READINESS", isCritical: false },
  { itemCode: "hos", label: "HOS / open compliance", sectionCode: "COMPLIANCE_SAFETY", isCritical: false },
  { itemCode: "camera", label: "Camera status", sectionCode: "COMPLIANCE_SAFETY", isCritical: false },
  { itemCode: "cdl", label: "CDL", sectionCode: "COMPLIANCE_SAFETY", isCritical: true },
  { itemCode: "med", label: "Medical Card", sectionCode: "COMPLIANCE_SAFETY", isCritical: true },
  { itemCode: "mvr", label: "MVR", sectionCode: "COMPLIANCE_SAFETY", isCritical: true },
  { itemCode: "lumper-setup", label: "QR lumper closeout", sectionCode: "FINANCIAL_OPS", isCritical: false },
  { itemCode: "payment-flags", label: "Payment proof packet", sectionCode: "FINANCIAL_OPS", isCritical: false },
  { itemCode: "rf-actions", label: "RFID / proof chain", sectionCode: "FINANCIAL_OPS", isCritical: false },
  { itemCode: "settlements", label: "Settlements / payroll", sectionCode: "FINANCIAL_OPS", isCritical: false },
  { itemCode: "weather", label: "Weather along lane", sectionCode: "ROUTE_INTELLIGENCE", isCritical: false },
  { itemCode: "traffic", label: "Traffic / ETA risk", sectionCode: "ROUTE_INTELLIGENCE", isCritical: false },
] as const;

export const PRETRIP_SECTION_LABELS: Record<string, string> = {
  LOAD_DOCS: "Load Documents",
  PROOF_REQUIREMENTS: "Proof Requirements",
  VEHICLE_READINESS: "Vehicle Readiness",
  COMPLIANCE_SAFETY: "Compliance & Safety",
  FINANCIAL_OPS: "Financial Ops",
  ROUTE_INTELLIGENCE: "Route Intelligence",
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : response.statusText || "Request failed";
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Session expired. Sign in again to continue.";
    if (error.status === 403) return "You are not authorized for this fleet resource.";
    if (error.status === 404) return error.message || "Resource not found.";
    if (error.status === 409 || error.status === 422) return error.message;
    return "Operational error. Please retry.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Operational error. Please retry.";
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function formatShortDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function driverDisplayName(driver: Pick<DispatchDriverOption, "firstName" | "lastName">) {
  return `${driver.firstName} ${driver.lastName}`.trim();
}

export function assignmentDisplayName(
  assignment: Pick<DispatchAssignmentRecord, "driverId"> & {
    driver?: { firstName: string; lastName: string } | null;
  },
) {
  if (!assignment.driver) {
    return assignment.driverId;
  }
  return `${assignment.driver.firstName} ${assignment.driver.lastName}`.trim();
}

export function getJsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function getReleaseReasonSource(reasonCode: string) {
  if (reasonCode.startsWith("DRIVER_")) {
    return "Driver";
  }
  if (reasonCode.startsWith("TRUCK_") || reasonCode === "EQUIPMENT_INCOMPATIBLE") {
    return "Equipment";
  }
  if (reasonCode.startsWith("PRETRIP_")) {
    return "Pre-Trip";
  }
  return "Load";
}

export function statusTone(
  status: string | null | undefined,
  kind: "readiness" | "pretrip" | "release" | "equipment" = "release",
) {
  if (!status) {
    return "border-slate-700 bg-slate-900/70 text-slate-200";
  }

  if (kind === "readiness") {
    if (status === "READY") return "border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    if (status === "CONDITIONAL") return "border-amber-700/50 bg-amber-950/40 text-amber-100";
    return "border-rose-700/50 bg-rose-950/40 text-rose-100";
  }

  if (kind === "pretrip") {
    if (status === "COMPLETED") return "border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    if (status === "OPEN") return "border-cyan-700/50 bg-cyan-950/30 text-cyan-100";
    if (status === "BLOCKED") return "border-rose-700/50 bg-rose-950/40 text-rose-100";
    if (status === "VOIDED") return "border-slate-700 bg-slate-900/70 text-slate-300";
    return "border-amber-700/50 bg-amber-950/40 text-amber-100";
  }

  if (kind === "equipment") {
    if (status === "AVAILABLE") return "border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    if (status === "UNAVAILABLE") return "border-amber-700/50 bg-amber-950/40 text-amber-100";
    return "border-rose-700/50 bg-rose-950/40 text-rose-100";
  }

  if (status === "RELEASED") return "border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
  if (status === "CONDITIONALLY_RELEASED") return "border-amber-700/50 bg-amber-950/40 text-amber-100";
  if (status === "HOLD") return "border-amber-700/60 bg-amber-950/25 text-amber-50";
  if (status === "BLOCKED") return "border-rose-700/50 bg-rose-950/40 text-rose-100";
  return "border-slate-700 bg-slate-900/70 text-slate-200";
}

export async function fetchAssignmentDetailsForLoad(loadId: string) {
  const assignment = await requestJson<DispatchAssignmentRecord | null>(`/api/dispatch/load/${loadId}/assignment`);
  if (!assignment) {
    return null;
  }

  return requestJson<DispatchAssignmentRecord>(`/api/dispatch/assignment/${assignment.id}`);
}

export async function fetchLoadWorkflowSnapshot(loadId: string): Promise<DispatchLoadWorkflowSnapshot> {
  const assignment = await fetchAssignmentDetailsForLoad(loadId);
  const resolvedAssignment = assignment ?? (await fetchAssignmentDetailsForLoad(loadId));

  const [readinessResult, latestReleaseResult, preTripResult] = await Promise.all([
    requestJson<DispatchReadinessRecord>(`/api/dispatch/load/${loadId}/readiness`)
      .then((readiness) => ({ readiness, readinessError: null }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          return { readiness: null, readinessError: error.message };
        }
        throw error;
      }),
    requestJson<DispatchReleaseRecord | null>(`/api/dispatch/release/${loadId}/latest`),
    resolvedAssignment
      ? requestJson<DispatchPreTripRecord | null>(`/api/dispatch/pretrip/${resolvedAssignment.id}`)
      : Promise.resolve(null),
  ]);

  return {
    assignment: resolvedAssignment,
    readiness: readinessResult.readiness,
    readinessError: readinessResult.readinessError,
    preTrip: preTripResult,
    latestRelease: latestReleaseResult,
  };
}

export async function fetchPreTripConditionBaseline(assignmentId: string): Promise<PreTripConditionBaseline> {
  return requestJson<PreTripConditionBaseline>(`/api/dispatch/assignment/${assignmentId}/conditions`);
}

export async function applyPreTripConditionAction(input: {
  assignmentId: string;
  conditionThreadId: string;
  action: "NO_CHANGE" | "CHANGED" | "REPAIRED_REMOVED" | "VERIFY_RESOLUTION" | "UNSURE";
  notes?: string;
  preTripHeaderId?: string;
  preTripItemCode?: string;
}) {
  return requestJson<unknown>(`/api/dispatch/assignment/${input.assignmentId}/conditions`, {
    method: "POST",
    body: JSON.stringify({
      operation: "APPLY_ACTION",
      conditionThreadId: input.conditionThreadId,
      action: input.action,
      notes: input.notes ?? null,
      preTripHeaderId: input.preTripHeaderId ?? null,
      preTripItemCode: input.preTripItemCode ?? null,
    }),
  });
}

export async function createPreTripCondition(input: {
  assignmentId: string;
  equipmentId: string;
  title: string;
  category: string;
  severity: string;
  impact?: string | null;
  notes?: string;
  preTripHeaderId?: string;
  preTripItemId?: string;
}) {
  return requestJson<unknown>(`/api/dispatch/assignment/${input.assignmentId}/conditions`, {
    method: "POST",
    body: JSON.stringify({
      operation: "CREATE_CONDITION",
      equipmentId: input.equipmentId,
      title: input.title,
      category: input.category,
      severity: input.severity,
      impact: input.impact ?? null,
      notes: input.notes ?? null,
      preTripHeaderId: input.preTripHeaderId ?? null,
      preTripItemId: input.preTripItemId ?? null,
    }),
  });
}

export async function uploadPreTripConditionEvidence(input: {
  assignmentId: string;
  conditionThreadId: string;
  conditionEventId?: string;
  equipmentId?: string;
  preTripHeaderId?: string;
  preTripItemId?: string;
  notes?: string;
  evidenceKind?: string;
  observationSource?: string;
  file: File;
}) {
  const formData = new FormData();
  formData.set("conditionThreadId", input.conditionThreadId);
  formData.set("file", input.file);
  if (input.conditionEventId) formData.set("conditionEventId", input.conditionEventId);
  if (input.equipmentId) formData.set("equipmentId", input.equipmentId);
  if (input.preTripHeaderId) formData.set("preTripHeaderId", input.preTripHeaderId);
  if (input.preTripItemId) formData.set("preTripItemId", input.preTripItemId);
  if (input.notes) formData.set("notes", input.notes);
  if (input.evidenceKind) formData.set("evidenceKind", input.evidenceKind);
  if (input.observationSource) formData.set("observationSource", input.observationSource);

  const response = await fetch(`/api/dispatch/assignment/${input.assignmentId}/conditions/evidence`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : response.statusText || "Request failed";
    throw new ApiError(message, response.status, body);
  }
  return body;
}
