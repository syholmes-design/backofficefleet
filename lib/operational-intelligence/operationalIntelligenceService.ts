import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { classifyOperationalIntent, extractLoadReference } from "@/lib/operational-intelligence/intent";
import type {
  OperationalIntelligenceAnswer,
  OperationalIntelligenceContext,
  OperationalIntelligenceCitation,
} from "@/lib/operational-intelligence/types";
import { getTenantLoadProcess } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";
import { prisma } from "@/lib/prisma";
import { getAuthorizedOperatingRecord } from "@/lib/services/operatingRecordService";
import { listDriverOperationalSummaries } from "@/lib/services/driverOperationalReadModelService";
import { listAccessibleLiveSettlements } from "@/lib/services/settlementReadService";
import { buildLoadFinanceHandoff } from "@/lib/load-finance-handoff";
import { isDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export class OperationalIntelligenceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "OperationalIntelligenceError";
    this.statusCode = statusCode;
  }
}

function accessOrThrow(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw new OperationalIntelligenceError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  }
}

function rec(recordType: OperationalIntelligenceCitation["recordType"], recordId: string, title: string, route: string): OperationalIntelligenceCitation {
  return { recordType, recordId, title, route };
}

async function answerSettlementHolds(user: SessionUserLike, fleetId: string): Promise<OperationalIntelligenceAnswer> {
  const settlements = (await listAccessibleLiveSettlements(user)).filter((row) => row.status === "HELD");
  const fleetHeld = await prisma.settlement.findMany({
    where: { fleetId, status: "HELD", lifecycleClass: "LIVE" },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, loadId: true, holdReason: true, status: true, netAmount: true },
  });

  const held = fleetHeld.filter((row) => !isDemoOperationalKey(row.loadId));
  const citations = held.map((row) => rec("SETTLEMENT", row.id, `Settlement hold · load ${row.loadId}`, `/settlements?loadId=${encodeURIComponent(row.loadId)}`));

  if (held.length === 0 && settlements.length === 0) {
    return {
      intent: "SETTLEMENT_HOLDS",
      question: "",
      dataAuthority: "LIVE",
      answer: "No LIVE settlement holds are recorded for fleets you can access. If finance expects a hold, it may exist only in workbook/demo surfaces or has not been written to Prisma Settlement yet.",
      citations: [],
      recommendations: [{ label: "Open settlements workspace", href: "/settlements", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["Payroll workbook rows (STL-*) are not authoritative; Prisma Settlement is the LIVE hold source."],
    };
  }

  const lines = held.map((row) => {
    const reason = row.holdReason?.trim() || "No hold reason recorded on the settlement row.";
    return `Load ${row.loadId}: status HELD — ${reason} (net ${row.netAmount.toString()}).`;
  });

  return {
    intent: "SETTLEMENT_HOLDS",
    question: "",
    dataAuthority: "LIVE",
    answer: `There ${held.length === 1 ? "is" : "are"} ${held.length} LIVE settlement hold(s) in fleet ${fleetId}:\n${lines.join("\n")}`,
    citations,
    recommendations: held.slice(0, 3).map((row) => ({
      label: `Review hold on load ${row.loadId}`,
      href: `/loads/${row.loadId}`,
      claimClass: "RECOMMENDATION" as const,
      executable: false as const,
    })),
    limitations: [],
  };
}

async function answerDriverReadiness(user: SessionUserLike, fleetId: string): Promise<OperationalIntelligenceAnswer> {
  const summaries = await listDriverOperationalSummaries(user, fleetId);
  const notReady = summaries.filter((row) => row.readiness?.readinessStatus === "NOT_READY" || row.readiness?.readinessStatus === "CONDITIONAL");
  const citations = notReady.slice(0, 10).map((row) =>
    rec("DRIVER", row.driverId, `${row.driverName} · ${row.readiness?.readinessStatus ?? "UNKNOWN"}`, `/drivers/${row.driverId}`),
  );

  if (summaries.length === 0) {
    return {
      intent: "DRIVER_READINESS",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: "No Prisma driver roster exists for this fleet. Dispatch readiness cannot be summarized from LIVE data until drivers are provisioned in this tenant.",
      citations: [],
      recommendations: [{ label: "Open driver roster", href: "/drivers", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["Demo roster eligibility (BofData) is intentionally not used for this answer."],
    };
  }

  const lines = notReady.length
    ? notReady.map((row) => {
        const codes = row.readiness?.reasonCodes?.join(", ") || "no reason codes recorded";
        return `${row.driverName}: ${row.readiness?.readinessStatus} — ${codes}`;
      })
    : ["All evaluated drivers on this roster show READY in the latest stored readiness projection."];

  return {
    intent: "DRIVER_READINESS",
    question: "",
    dataAuthority: "LIVE",
    answer: `Dispatch readiness for fleet ${fleetId} (Prisma projections):\n${lines.join("\n")}`,
    citations,
    recommendations: notReady.slice(0, 3).map((row) => ({
      label: `Open ${row.driverName}`,
      href: `/drivers/${row.driverId}/safety`,
      claimClass: "RECOMMENDATION" as const,
      executable: false as const,
    })),
    limitations: ["Assignment-time gates may differ until dispatch assignment re-evaluates readiness."],
  };
}

async function answerLoadsAtRisk(user: SessionUserLike, fleetId: string): Promise<OperationalIntelligenceAnswer> {
  const loads = await prisma.load.findMany({
    where: { fleetId, status: "EXCEPTION" },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, referenceNumber: true, status: true, origin: true, destination: true, deliveryWindowEnd: true },
  });

  const citations = loads.map((load) =>
    rec("LOAD", load.id, `Load ${load.referenceNumber ?? load.id} · ${load.status}`, `/loads/${load.id}`),
  );

  if (loads.length === 0) {
    return {
      intent: "LOADS_AT_RISK",
      question: "",
      dataAuthority: "LIVE",
      answer: `No loads in fleet ${fleetId} currently carry status EXCEPTION in Prisma. Delivery risk may still exist in dispatch review queues not reflected in Load.status.`,
      citations: [],
      recommendations: [{ label: "Open dispatch board", href: "/dispatch", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["GPS/telematics-based lateness is not connected; this uses Load.status only."],
    };
  }

  const lines = loads.map((load) => {
    const ref = load.referenceNumber ?? load.id;
    const dest = load.destination ?? "unknown destination";
    return `${ref} (${load.status}): ${load.origin ?? "?"} → ${dest}`;
  });

  return {
    intent: "LOADS_AT_RISK",
    question: "",
    dataAuthority: "LIVE",
    answer: `Loads flagged at risk in fleet ${fleetId}:\n${lines.join("\n")}`,
    citations,
    recommendations: loads.slice(0, 3).map((load) => ({
      label: `Open load ${load.referenceNumber ?? load.id}`,
      href: `/loads/${load.id}`,
      claimClass: "RECOMMENDATION" as const,
      executable: false as const,
    })),
    limitations: [],
  };
}

async function answerOpenExceptions(user: SessionUserLike, fleetId: string): Promise<OperationalIntelligenceAnswer> {
  const threads = await prisma.conditionThread.findMany({
    where: { fleetId, lifecycleState: { not: "RESOLVED" } },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, title: true, severity: true, category: true, equipmentId: true, lifecycleState: true },
  });

  const citations = threads.map((row) =>
    rec("EXCEPTION", row.id, row.title, `/maintenance/${row.equipmentId}`),
  );

  if (threads.length === 0) {
    return {
      intent: "OPEN_EXCEPTIONS",
      question: "",
      dataAuthority: "LIVE",
      answer: `No open ConditionThread exceptions are recorded for fleet ${fleetId}. Load-level process exceptions may still exist under operating process intelligence.`,
      citations: [],
      recommendations: [{ label: "Open maintenance desk", href: "/maintenance", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["OperatingException (load-to-cash PI) is a separate store from equipment ConditionThread."],
    };
  }

  const lines = threads.map((row) => `${row.title} (${row.severity} · ${row.lifecycleState}) — equipment ${row.equipmentId}`);

  return {
    intent: "OPEN_EXCEPTIONS",
    question: "",
    dataAuthority: "LIVE",
    answer: `Open equipment/condition exceptions in fleet ${fleetId}:\n${lines.join("\n")}`,
    citations,
    recommendations: threads.slice(0, 3).map((row) => ({
      label: `Review ${row.title}`,
      href: `/maintenance/${row.equipmentId}`,
      claimClass: "RECOMMENDATION" as const,
      executable: false as const,
    })),
    limitations: [],
  };
}

async function answerMissingDocuments(user: SessionUserLike, fleetId: string, driverId?: string | null): Promise<OperationalIntelligenceAnswer> {
  const drivers = driverId
    ? await prisma.driver.findMany({ where: { fleetId, id: driverId }, select: { id: true, firstName: true, lastName: true } })
    : await prisma.driver.findMany({ where: { fleetId }, take: 8, orderBy: { updatedAt: "desc" }, select: { id: true, firstName: true, lastName: true } });

  if (drivers.length === 0) {
    return {
      intent: "MISSING_DOCUMENTS",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: "No drivers found in this fleet to evaluate document gaps.",
      citations: [],
      recommendations: [{ label: "Open documents vault", href: "/documents/vault", claimClass: "RECOMMENDATION", executable: false }],
      limitations: [],
    };
  }

  const citations: OperationalIntelligenceCitation[] = [];
  const lines: string[] = [];

  for (const driver of drivers) {
    const missing = await prisma.driverDocument.findMany({
      where: { fleetId, driverId: driver.id, status: { in: ["REJECTED", "EXPIRED", "PENDING_VERIFICATION"] } },
      take: 8,
      select: { id: true, type: true, status: true, originalFileName: true },
    });
    const openReqs = await prisma.driverIntakeRequirement.findMany({
      where: {
        driverIntake: { driverId: driver.id, fleetId },
        status: { in: ["REQUIRED", "PENDING", "REJECTED", "EXPIRED", "EXCEPTION"] },
      },
      take: 8,
      select: { id: true, requirementType: true, label: true, status: true },
    });

    if (missing.length === 0 && openReqs.length === 0) continue;
    const name = `${driver.firstName} ${driver.lastName}`.trim();
    lines.push(`${name}:`);
    for (const doc of missing) {
      lines.push(`  · Document ${doc.type} — ${doc.status}`);
      citations.push(rec("DOCUMENT_REQUEST", doc.id, `${name}: ${doc.type}`, `/drivers/${driver.id}/vault`));
    }
    for (const req of openReqs) {
      lines.push(`  · Intake requirement ${req.label || req.requirementType} — ${req.status}`);
    }
  }

  if (lines.length === 0) {
    return {
      intent: "MISSING_DOCUMENTS",
      question: "",
      dataAuthority: "LIVE",
      answer: driverId
        ? "No missing/rejected/expired driver documents or open intake requirements were found for the scoped driver."
        : `No obvious document gaps in the most recently updated drivers for fleet ${fleetId}. Run a driver-specific query with driver context for deeper review.`,
      citations: [],
      recommendations: [{ label: "Open driver vault", href: "/documents/vault", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["Load proof/POD gaps are not included in this driver-document scan."],
    };
  }

  return {
    intent: "MISSING_DOCUMENTS",
    question: "",
    dataAuthority: "LIVE",
    answer: `Document and intake gaps (Prisma):\n${lines.join("\n")}`,
    citations: citations.slice(0, 12),
    recommendations: [{ label: "Open documents", href: "/documents", claimClass: "RECOMMENDATION", executable: false }],
    limitations: [],
  };
}

async function answerLoadLifecycle(
  user: SessionUserLike,
  fleetId: string,
  loadRef: string | null,
): Promise<OperationalIntelligenceAnswer> {
  if (!loadRef) {
    return {
      intent: "LOAD_LIFECYCLE",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: "Specify a load reference (for example L001) or open Conversations from a load detail page so BOF can scope lifecycle reconstruction.",
      citations: [],
      recommendations: [{ label: "Browse loads", href: "/loads", claimClass: "RECOMMENDATION", executable: false }],
      limitations: [],
    };
  }

  const load = await prisma.load.findFirst({
    where: { fleetId, OR: [{ id: loadRef }, { referenceNumber: loadRef }] },
    select: { id: true, referenceNumber: true, status: true },
  });

  if (!load) {
    return {
      intent: "LOAD_LIFECYCLE",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: `Load ${loadRef} was not found in fleet ${fleetId} LIVE data. It may be demo-only or belong to another tenant.`,
      citations: [],
      recommendations: [],
      limitations: [],
    };
  }

  let timeline = "";
  const limitations: string[] = [];
  try {
    const process = await getTenantLoadProcess(getOperatingProcessStore(), user, fleetId, load.id);
    const events = process.events ?? [];
    if (events.length === 0) {
      timeline = "No operating process events are recorded for this load yet.";
      limitations.push("Process intelligence requires OperatingProcessEvent rows emitted by dispatch/settlement services.");
    } else {
      timeline = events
        .slice(-12)
        .map((event) => {
          const when = event.eventTimestamp?.toISOString?.() ?? event.recordedAt?.toISOString?.() ?? "unknown time";
          return `${when}: ${event.eventType} (${event.processStage ?? "stage n/a"})`;
        })
        .join("\n");
    }
  } catch (error) {
    if (error instanceof ProcessIntelligenceError && error.statusCode === 404) {
      timeline = "No operating process timeline exists for this load in the durable event store.";
      limitations.push("Emit events from dispatch, proof, or settlement services to build lifecycle history.");
    } else {
      timeline = "Process reconstruction is unavailable (database or authorization).";
      limitations.push("Could not call getTenantLoadProcess.");
    }
  }

  const record = await getAuthorizedOperatingRecord(user, fleetId, "LOAD", load.id);

  return {
    intent: "LOAD_LIFECYCLE",
    question: "",
    dataAuthority: "PARTIAL",
    answer: `Load ${load.referenceNumber ?? load.id} status: ${load.status}.\nRecent operating process timeline:\n${timeline}`,
    citations: [rec("LOAD", load.id, record.title, record.route)],
    recommendations: [
      { label: "Open load file", href: `/loads/${load.id}`, claimClass: "RECOMMENDATION", executable: false },
      { label: "Start conversation on this load", href: `/operational-chat?fleetId=${encodeURIComponent(fleetId)}&recordType=LOAD&recordId=${encodeURIComponent(load.id)}`, claimClass: "RECOMMENDATION", executable: false },
    ],
    limitations,
  };
}

async function answerLoadFinance(user: SessionUserLike, fleetId: string, loadRef: string | null): Promise<OperationalIntelligenceAnswer> {
  if (!loadRef) {
    return {
      intent: "LOAD_FINANCE",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: "Specify a load reference (for example L001) to review POD, invoice, settlement, and exception handoffs from LIVE Prisma rows.",
      citations: [],
      recommendations: [{ label: "Browse loads", href: "/loads", claimClass: "RECOMMENDATION", executable: false }],
      limitations: [],
    };
  }

  const load = await prisma.load.findFirst({
    where: { fleetId, OR: [{ id: loadRef }, { referenceNumber: loadRef }] },
    include: {
      proofsOfDelivery: true,
      invoices: true,
      settlements: true,
      operatingExceptions: true,
    },
  });

  if (!load) {
    return {
      intent: "LOAD_FINANCE",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: `Load ${loadRef} was not found in fleet ${fleetId} LIVE data.`,
      citations: [],
      recommendations: [],
      limitations: [],
    };
  }

  const handoff = buildLoadFinanceHandoff(load);
  const record = await getAuthorizedOperatingRecord(user, fleetId, "LOAD", load.id);
  const lines = [
    handoff.deliveryEvidence.summary,
    handoff.invoicing.summary,
    handoff.settlement.summary,
    handoff.exceptions.summary,
    `Next action: ${handoff.nextRequiredAction}`,
  ];
  if (handoff.brokenHandoffs.length > 0) {
    lines.push(`Broken handoffs: ${handoff.brokenHandoffs.join(" ")}`);
  }

  return {
    intent: "LOAD_FINANCE",
    question: "",
    dataAuthority: "LIVE",
    answer: `Load-to-finance handoff for ${load.referenceNumber ?? load.id} (${handoff.loadStatus}):\n${lines.join("\n")}`,
    citations: [rec("LOAD", load.id, record.title, record.route)],
    recommendations: [
      { label: "Open process intelligence", href: `/loads/${load.id}#process-intelligence`, claimClass: "RECOMMENDATION", executable: false },
      { label: "Open settlements", href: "/settlements", claimClass: "RECOMMENDATION", executable: false },
    ],
    limitations: ["Uses the same financeHandoff projection as GET /api/load-process-intelligence/{loadId}."],
  };
}

async function answerLoadStatus(user: SessionUserLike, fleetId: string, loadRef: string | null): Promise<OperationalIntelligenceAnswer> {
  if (!loadRef) {
    return {
      intent: "LOAD_STATUS",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: "Provide a load reference to look up status from LIVE Prisma Load records.",
      citations: [],
      recommendations: [],
      limitations: ["Live GPS position is not available."],
    };
  }

  const load = await prisma.load.findFirst({
    where: { fleetId, OR: [{ id: loadRef }, { referenceNumber: loadRef }] },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      origin: true,
      destination: true,
      pickupWindowStart: true,
      deliveryWindowEnd: true,
    },
  });

  if (!load) {
    return {
      intent: "LOAD_STATUS",
      question: "",
      dataAuthority: "UNAVAILABLE",
      answer: `Load ${loadRef} is not in fleet ${fleetId} LIVE records.`,
      citations: [],
      recommendations: [],
      limitations: [],
    };
  }

  const record = await getAuthorizedOperatingRecord(user, fleetId, "LOAD", load.id);
  return {
    intent: "LOAD_STATUS",
    question: "",
    dataAuthority: "LIVE",
    answer: `Load ${load.referenceNumber ?? load.id} is ${load.status}. Lane: ${load.origin ?? "?"} → ${load.destination ?? "?"}. Pickup window starts ${load.pickupWindowStart?.toISOString() ?? "n/a"}; delivery window ends ${load.deliveryWindowEnd?.toISOString() ?? "n/a"}. Telematics position is not connected—use dispatch assignments and process events for operational visibility.`,
    citations: [rec("LOAD", load.id, record.title, record.route)],
    recommendations: [{ label: "Open load", href: `/loads/${load.id}`, claimClass: "RECOMMENDATION", executable: false }],
    limitations: ["GPS/telematics feed not integrated."],
  };
}

function answerPayroll(): OperationalIntelligenceAnswer {
  return {
    intent: "PAYROLL_STATUS",
    question: "",
    dataAuthority: "UNAVAILABLE",
    answer: "Payroll processing status is not available as a single authoritative LIVE feed in BOF yet. Prisma Settlement rows cover load-linked settlement holds; payroll week processing may still live in workbook/demo surfaces until an authoritative payroll service is wired.",
    citations: [],
    recommendations: [{ label: "Open settlements", href: "/settlements", claimClass: "RECOMMENDATION", executable: false }],
    limitations: ["Do not infer payroll completion from demo workbook or Copilot panels."],
  };
}

function answerTelematics(): OperationalIntelligenceAnswer {
  return {
    intent: "TELEMATICS",
    question: "",
    dataAuthority: "UNAVAILABLE",
    answer: "Live GPS/telematics is not connected to BOF operational intelligence. Use load status, dispatch assignment, and delivery/proof records instead.",
    citations: [],
    recommendations: [{ label: "Open dispatch", href: "/dispatch", claimClass: "RECOMMENDATION", executable: false }],
    limitations: ["Marketing and customer portal map views may show DEMO/simulated tracking."],
  };
}

function answerGeneralHelp(): OperationalIntelligenceAnswer {
  return {
    intent: "GENERAL_HELP",
    question: "",
    dataAuthority: "PARTIAL",
    answer:
      "Ask about settlement holds, drivers not dispatch-ready, loads at risk, missing documents, open exceptions, or a specific load lifecycle. Answers use authorized Prisma LIVE data for this fleet—not demo JSON.",
    citations: [],
    recommendations: [{ label: "Operating records API", href: "/operational-chat", claimClass: "RECOMMENDATION", executable: false }],
    limitations: [],
  };
}

export async function answerOperationalQuestion(
  user: SessionUserLike,
  fleetId: string,
  question: string,
  context?: OperationalIntelligenceContext,
): Promise<OperationalIntelligenceAnswer> {
  accessOrThrow(user, fleetId);
  const intent = classifyOperationalIntent(question);
  const loadRef = extractLoadReference(question, context);

  let base: OperationalIntelligenceAnswer;
  switch (intent) {
    case "SETTLEMENT_HOLDS":
      base = await answerSettlementHolds(user, fleetId);
      break;
    case "DRIVER_READINESS":
      base = await answerDriverReadiness(user, fleetId);
      break;
    case "LOADS_AT_RISK":
      base = await answerLoadsAtRisk(user, fleetId);
      break;
    case "MISSING_DOCUMENTS":
      base = await answerMissingDocuments(user, fleetId, context?.driverId);
      break;
    case "OPEN_EXCEPTIONS":
      base = await answerOpenExceptions(user, fleetId);
      break;
    case "LOAD_LIFECYCLE":
      base = await answerLoadLifecycle(user, fleetId, loadRef);
      break;
    case "LOAD_FINANCE":
      base = await answerLoadFinance(user, fleetId, loadRef);
      break;
    case "LOAD_STATUS":
      base = await answerLoadStatus(user, fleetId, loadRef);
      break;
    case "PAYROLL_STATUS":
      base = answerPayroll();
      break;
    case "TELEMATICS":
      base = answerTelematics();
      break;
    default:
      base = answerGeneralHelp();
  }

  return { ...base, question: question.trim() };
}
