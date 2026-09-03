import { prisma } from "@/lib/prisma";
import demoData from "@/lib/demo-data.json";

type DemoLoad = (typeof demoData.loads)[number];

export const BOF_LOAD_REFERENCE_PROCESS = [
  "LOAD_INTAKE_RECORDED",
  "CANONICAL_LOAD_RECORDED",
  "DISPATCH_ASSIGNED",
  "DRIVER_LINKED",
  "EQUIPMENT_LINKED",
  "PRETRIP_RECORDED",
  "READINESS_EVALUATED",
  "RELEASE_EVALUATED",
  "DELIVERED",
  "POD_RECEIVED",
  "POD_VERIFIED",
  "INVOICE_CREATED",
  "INVOICE_SUBMITTED",
  "PAYMENT_RECORDED",
  "SETTLEMENT_CREATED",
  "SETTLEMENT_APPROVED",
] as const;

export type BofLoadProcessDeviationType =
  | "ACTIVITY_REPEAT"
  | "ACTIVITY_SKIP"
  | "UNEXPECTED_ACTIVITY"
  | "INVALID_START"
  | "INVALID_END"
  | "OUT_OF_ORDER"
  | "UNEXPECTED_TRANSITION"
  | "LOOP_BACK"
  | "INCOMPLETE_SEQUENCE";

export type BofLoadProcessTraceEvent = {
  id: string;
  activity: string;
  timestamp: string;
  actor: string;
  source: string;
  sourceRecordId: string | null;
  processStage: string;
  status: string | null;
  relatedBusinessObject: string;
  provenance: string;
  durationToNextEvent: string | null;
  relatedException: string | null;
  relatedCorrectiveAction: string | null;
};

export type BofLoadProcessDeviation = {
  type: BofLoadProcessDeviationType;
  activity: string | null;
  expectedActivity: string | null;
  actualActivity: string | null;
  reason: string;
  businessImpact: string;
  nextInvestigationAction: string;
};

export type BofProcessDiscoveryFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  customer?: string;
  driver?: string;
  equipment?: string;
  lane?: string;
  loadStatus?: string;
  variant?: string;
  conformance?: string;
  deviationType?: BofLoadProcessDeviationType;
};

type DiscoveryCaseQuality = "SUFFICIENT_HISTORY" | "PARTIAL_HISTORY" | "NO_HISTORY";

type DiscoveryCase = {
  loadId: string;
  referenceNumber: string | null;
  customerName: string;
  origin: string;
  destination: string;
  status: string;
  driverIds: string[];
  equipmentIds: string[];
  firstEventTimestamp: string | null;
  lastEventTimestamp: string | null;
  eventCount: number;
  actualPath: string[];
  normalizedTrace: string;
  caseQuality: DiscoveryCaseQuality;
  conformanceResult: ReturnType<typeof evaluateConformance>;
  throughputTime: string | null;
};

function findDemoLoad(loadId: string): DemoLoad | null {
  return demoData.loads.find((load) => load.id === loadId || load.loadId === loadId || load.number === loadId) ?? null;
}

function formatDuration(ms: number) {
  if (ms < 0) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function eventImpact(activity: string) {
  if (activity.includes("POD")) return "Missing or late POD can delay invoicing.";
  if (activity.includes("INVOICE")) return "Invoice delay can delay cash collection.";
  if (activity.includes("SETTLEMENT")) return "Settlement delay can delay driver payment closeout.";
  if (activity.includes("DISPATCH") || activity.includes("RELEASE")) return "Dispatch/release deviation can create movement risk.";
  if (activity.includes("EXCEPTION")) return "Exception activity requires operational review before closure.";
  return "Process deviation requires review before operational conclusions are drawn.";
}

function buildTraceEvents(events: Array<{
  id: string;
  eventType: string;
  eventTimestamp: Date;
  actorType: string;
  actorId: string | null;
  sourceSystem: string | null;
  sourceRecordId: string | null;
  processStage: string;
  resultingState: string | null;
  verificationClass: string;
  originKind: string;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
  exceptionId: string | null;
  actionId: string | null;
}>) {
  return events.map((event, index): BofLoadProcessTraceEvent => {
    const next = events[index + 1];
    return {
      id: event.id,
      activity: event.eventType,
      timestamp: event.eventTimestamp.toISOString(),
      actor: event.actorId ? `${event.actorType}:${event.actorId}` : event.actorType,
      source: event.sourceSystem ?? event.originKind,
      sourceRecordId: event.sourceRecordId,
      processStage: event.processStage,
      status: event.resultingState,
      relatedBusinessObject: event.relatedRecordType && event.relatedRecordId ? `${event.relatedRecordType}:${event.relatedRecordId}` : event.relatedRecordType ?? event.relatedRecordId ?? "Not linked",
      provenance: event.verificationClass,
      durationToNextEvent: next ? formatDuration(next.eventTimestamp.getTime() - event.eventTimestamp.getTime()) : null,
      relatedException: event.exceptionId,
      relatedCorrectiveAction: event.actionId,
    };
  });
}

function firstTimestamp(events: BofLoadProcessTraceEvent[], activities: string[]) {
  const match = events.find((event) => activities.includes(event.activity));
  return match ? new Date(match.timestamp) : null;
}

function evaluateConformance(actualPath: string[]) {
  if (actualPath.length === 0) {
    return {
      conformanceStatus: "INSUFFICIENT_EVENT_HISTORY" as const,
      deviationCount: 0,
      deviations: [] as BofLoadProcessDeviation[],
      referencePath: [...BOF_LOAD_REFERENCE_PROCESS],
      actualPath,
      variant: "INSUFFICIENT EVENT HISTORY",
      throughputTime: null as string | null,
      nextRequiredAction: "Capture authoritative process events from existing load, dispatch, pre-trip, POD, invoice, and settlement writes.",
    };
  }

  const deviations: BofLoadProcessDeviation[] = [];
  const expectedIndexByActivity = new Map(BOF_LOAD_REFERENCE_PROCESS.map((activity, index) => [activity, index]));
  const seen = new Set<string>();
  let priorIndex = -1;
  let maxObservedIndex = -1;

  for (const activity of actualPath) {
    const expectedIndex = expectedIndexByActivity.get(activity as (typeof BOF_LOAD_REFERENCE_PROCESS)[number]);
    if (seen.has(activity) && expectedIndex !== undefined) {
      deviations.push({
        type: "ACTIVITY_REPEAT",
        activity,
        expectedActivity: activity,
        actualActivity: activity,
        reason: `${activity} appears more than once in the actual trace.`,
        businessImpact: eventImpact(activity),
        nextInvestigationAction: "Review whether this is expected rework or duplicate event capture.",
      });
    }
    seen.add(activity);
    if (expectedIndex === undefined) {
      deviations.push({
        type: "UNEXPECTED_ACTIVITY",
        activity,
        expectedActivity: null,
        actualActivity: activity,
        reason: `${activity} is not part of the initial BOF reference process.`,
        businessImpact: eventImpact(activity),
        nextInvestigationAction: "Classify whether this activity belongs in an alternate reference process.",
      });
    } else if (expectedIndex < priorIndex) {
      deviations.push({
        type: "OUT_OF_ORDER",
        activity,
        expectedActivity: BOF_LOAD_REFERENCE_PROCESS[priorIndex],
        actualActivity: activity,
        reason: `${activity} occurred after a later reference activity.`,
        businessImpact: eventImpact(activity),
        nextInvestigationAction: "Review timestamps and source-system event ordering.",
      });
      maxObservedIndex = Math.max(maxObservedIndex, expectedIndex);
    } else {
      priorIndex = expectedIndex;
      maxObservedIndex = Math.max(maxObservedIndex, expectedIndex);
    }
  }

  for (let index = 0; index < maxObservedIndex; index += 1) {
    const expected = BOF_LOAD_REFERENCE_PROCESS[index];
    if (!seen.has(expected)) {
      deviations.push({
        type: "ACTIVITY_SKIP",
        activity: expected,
        expectedActivity: expected,
        actualActivity: null,
        reason: `${expected} is missing even though a later reference activity was observed.`,
        businessImpact: eventImpact(expected),
        nextInvestigationAction: "Confirm whether the activity was not performed or not captured as an operating event.",
      });
    }
  }

  if (actualPath[0] !== BOF_LOAD_REFERENCE_PROCESS[0] && maxObservedIndex >= 0) {
    deviations.push({
      type: "INVALID_START",
      activity: actualPath[0],
      expectedActivity: BOF_LOAD_REFERENCE_PROCESS[0],
      actualActivity: actualPath[0],
      reason: "Observed trace does not begin with the expected load intake activity.",
      businessImpact: "Upstream process history may be incomplete.",
      nextInvestigationAction: "Review load intake and canonical load event capture.",
    });
  }

  const completeReferenceObserved = BOF_LOAD_REFERENCE_PROCESS.every((activity) => seen.has(activity));
  const conformanceStatus = deviations.length > 0
    ? ("NON_CONFORMING" as const)
    : completeReferenceObserved
      ? ("CONFORMING" as const)
      : ("INSUFFICIENT_EVENT_HISTORY" as const);

  return {
    conformanceStatus,
    deviationCount: deviations.length,
    deviations,
    referencePath: [...BOF_LOAD_REFERENCE_PROCESS],
    actualPath,
    variant: completeReferenceObserved || deviations.length > 0 ? actualPath.join(" -> ") : "INSUFFICIENT EVENT HISTORY",
    throughputTime: null as string | null,
    nextRequiredAction:
      conformanceStatus === "INSUFFICIENT_EVENT_HISTORY"
        ? "Continue recording authoritative events; current history is too incomplete for a conformance claim."
        : deviations[0]?.nextInvestigationAction ?? "Measure additional loads before declaring process variants stable.",
  };
}

function buildEventQuality(events: BofLoadProcessTraceEvent[], actualPath: string[]) {
  const known = new Set<string>([
    ...BOF_LOAD_REFERENCE_PROCESS,
    "DOCUMENT_ATTACHED",
    "EVIDENCE_CAPTURED",
    "DELIVERY_PROOF_RECORDED",
    "DELIVERY_EXCEPTION",
    "SETTLEMENT_RECORDED",
    "INVOICE_RECORDED",
    "EXCEPTION_OPENED",
    "CORRECTIVE_ACTION_RECORDED",
    "EXCEPTION_VERIFIED",
    "SETTLEMENT_HELD",
    "SETTLEMENT_REVIEWED",
    "SETTLEMENT_PAID",
    "SETTLEMENT_CLOSED",
    "INVOICE_EXCEPTION",
    "INVOICE_APPROVED",
    "INVOICE_PAID",
    "INVOICE_CLOSED",
  ]);
  const counts = new Map<string, number>();
  for (const activity of actualPath) counts.set(activity, (counts.get(activity) ?? 0) + 1);
  const duplicateEvents = [...counts.entries()].filter(([, count]) => count > 1).map(([activity, count]) => ({ activity, count }));
  const unknownEventTypes = actualPath.filter((activity) => !known.has(activity));
  const sourceCoverage = events.length === 0 ? 0 : events.filter((event) => event.source && event.source !== "Unknown").length / events.length;
  const provenanceCoverage = events.length === 0 ? 0 : events.filter((event) => Boolean(event.provenance)).length / events.length;
  const timestampGaps = events.flatMap((event, index) => {
    if (index === 0) return [];
    const prior = events[index - 1];
    const gapMs = new Date(event.timestamp).getTime() - new Date(prior.timestamp).getTime();
    return gapMs < 0 ? [{ from: prior.activity, to: event.activity, gap: "negative" }] : [];
  });
  return {
    eventCount: events.length,
    firstEvent: events[0]?.activity ?? null,
    lastEvent: events[events.length - 1]?.activity ?? null,
    missingExpectedEvents: BOF_LOAD_REFERENCE_PROCESS.filter((activity) => !actualPath.includes(activity)),
    duplicateEvents,
    unknownEventTypes,
    timestampGaps,
    sourceCoverage,
    provenanceCompleteness: provenanceCoverage,
  };
}

function buildCoverage(actualPath: string[]) {
  const watched = [
    "LOAD_INTAKE_RECORDED",
    "CANONICAL_LOAD_RECORDED",
    "LOAD_REVIEWED",
    "DRIVER_LINKED",
    "EQUIPMENT_LINKED",
    "PRETRIP_RECORDED",
    "READINESS_EVALUATED",
    "RELEASE_EVALUATED",
    "DELIVERED",
    "POD_RECEIVED",
    "POD_VERIFIED",
    "INVOICE_CREATED",
    "INVOICE_SUBMITTED",
    "PAYMENT_RECORDED",
    "SETTLEMENT_CREATED",
    "SETTLEMENT_APPROVED",
  ] as const;
  return Object.fromEntries(watched.map((activity) => [activity, actualPath.includes(activity) ? "captured" : "not captured"]));
}

function buildThroughput(events: BofLoadProcessTraceEvent[]) {
  const created = firstTimestamp(events, ["LOAD_INTAKE_RECORDED", "CANONICAL_LOAD_RECORDED"]);
  const delivered = firstTimestamp(events, ["DELIVERED"]);
  const pod = firstTimestamp(events, ["POD_RECEIVED", "POD_VERIFIED"]);
  const invoice = firstTimestamp(events, ["INVOICE_CREATED", "INVOICE_SUBMITTED"]);
  const settlement = firstTimestamp(events, ["SETTLEMENT_CREATED", "SETTLEMENT_APPROVED"]);
  const pair = (start: Date | null, end: Date | null) => (start && end ? formatDuration(end.getTime() - start.getTime()) : null);
  const hasPairs = Boolean(pair(created, delivered) || pair(created, pod) || pair(pod, invoice) || pair(invoice, settlement));
  return {
    loadCreatedToDelivery: pair(created, delivered),
    loadCreatedToPod: pair(created, pod),
    podToInvoice: pair(pod, invoice),
    invoiceToSettlement: pair(invoice, settlement),
    reason: events.length === 0
      ? "No event timestamps are available for throughput calculations."
      : hasPairs
        ? "Durations use only persisted operating-event timestamps."
        : "Required stage timestamps are missing; durations remain null.",
  };
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function median(values: number[]) {
  if (values.length < 3) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function durationStats(values: number[]) {
  if (values.length === 0) return { average: null, median: null, minimum: null, maximum: null, caseCount: 0 };
  return {
    average: formatDuration(average(values) ?? 0),
    median: median(values) === null ? null : formatDuration(median(values) ?? 0),
    minimum: formatDuration(Math.min(...values)),
    maximum: formatDuration(Math.max(...values)),
    caseCount: values.length,
  };
}

function timestampFor(events: BofLoadProcessTraceEvent[], activities: string[]) {
  return firstTimestamp(events, activities)?.getTime() ?? null;
}

function intervalMs(events: BofLoadProcessTraceEvent[], startActivities: string[], endActivities: string[]) {
  const start = timestampFor(events, startActivities);
  const end = timestampFor(events, endActivities);
  return start !== null && end !== null && end >= start ? end - start : null;
}

function buildDiscoveryCase(load: {
  id: string;
  referenceNumber: string | null;
  customerName: string;
  origin: string;
  destination: string;
  status: string;
  dispatchAssignments: Array<{ driverId: string; tractorEquipmentId: string; trailerEquipmentId: string | null }>;
  operatingProcessEvents: Array<Parameters<typeof buildTraceEvents>[0][number]>;
}): DiscoveryCase {
  const orderedEvents = buildTraceEvents(load.operatingProcessEvents);
  const actualPath = orderedEvents.map((event) => event.activity);
  const conformanceResult = evaluateConformance(actualPath);
  const first = orderedEvents[0] ?? null;
  const last = orderedEvents[orderedEvents.length - 1] ?? null;
  const quality: DiscoveryCaseQuality = orderedEvents.length === 0
    ? "NO_HISTORY"
    : orderedEvents.length < 3 || conformanceResult.conformanceStatus === "INSUFFICIENT_EVENT_HISTORY"
      ? "PARTIAL_HISTORY"
      : "SUFFICIENT_HISTORY";

  return {
    loadId: load.id,
    referenceNumber: load.referenceNumber,
    customerName: load.customerName,
    origin: load.origin,
    destination: load.destination,
    status: load.status,
    driverIds: [...new Set(load.dispatchAssignments.map((assignment) => assignment.driverId))],
    equipmentIds: [...new Set(load.dispatchAssignments.flatMap((assignment) => [assignment.tractorEquipmentId, assignment.trailerEquipmentId].filter((value): value is string => Boolean(value))))],
    firstEventTimestamp: first?.timestamp ?? null,
    lastEventTimestamp: last?.timestamp ?? null,
    eventCount: orderedEvents.length,
    actualPath,
    normalizedTrace: actualPath.join(" -> "),
    caseQuality: quality,
    conformanceResult,
    throughputTime: first && last ? formatDuration(new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) : null,
  };
}

function filterCases(cases: DiscoveryCase[], filters: BofProcessDiscoveryFilters) {
  return cases.filter((item) => {
    if (filters.customer && !item.customerName.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.driver && !item.driverIds.includes(filters.driver)) return false;
    if (filters.equipment && !item.equipmentIds.includes(filters.equipment)) return false;
    if (filters.loadStatus && item.status !== filters.loadStatus) return false;
    if (filters.lane) {
      const lane = `${item.origin} -> ${item.destination}`.toLowerCase();
      if (!lane.includes(filters.lane.toLowerCase())) return false;
    }
    if (filters.variant && item.normalizedTrace !== filters.variant) return false;
    if (filters.conformance && item.conformanceResult.conformanceStatus !== filters.conformance) return false;
    if (filters.deviationType && !item.conformanceResult.deviations.some((deviation) => deviation.type === filters.deviationType)) return false;
    return true;
  });
}

export async function getLoadProcessDiscovery(filters: BofProcessDiscoveryFilters = {}) {
  const loads = await prisma.load.findMany({
    where: {
      operatingProcessEvents: {
        some: {
          eventTimestamp: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          },
        },
      },
    },
    include: {
      dispatchAssignments: { select: { driverId: true, tractorEquipmentId: true, trailerEquipmentId: true } },
      operatingProcessEvents: { orderBy: [{ eventTimestamp: "asc" }, { id: "asc" }] },
    },
  });

  const allCases = filterCases(loads.map(buildDiscoveryCase), filters);
  const sufficientCases = allCases.filter((item) => item.caseQuality === "SUFFICIENT_HISTORY");
  const partialCases = allCases.filter((item) => item.caseQuality === "PARTIAL_HISTORY");
  const noHistoryCases = allCases.filter((item) => item.caseQuality === "NO_HISTORY");
  const sampleSupportsPercentages = sufficientCases.length >= 3;
  const variantMap = new Map<string, DiscoveryCase[]>();
  for (const item of sufficientCases) {
    const rows = variantMap.get(item.normalizedTrace) ?? [];
    rows.push(item);
    variantMap.set(item.normalizedTrace, rows);
  }
  const variantRows = [...variantMap.entries()].map(([sequence, casesForVariant], index) => {
    const deviationRows = casesForVariant.flatMap((item) => item.conformanceResult.deviations);
    const deviationCounts = new Map<string, number>();
    for (const deviation of deviationRows) deviationCounts.set(deviation.type, (deviationCounts.get(deviation.type) ?? 0) + 1);
    return {
      variantId: `VAR-${String(index + 1).padStart(3, "0")}`,
      activitySequence: sequence.split(" -> ").filter(Boolean),
      caseCount: casesForVariant.length,
      percentageOfCases: sampleSupportsPercentages ? Math.round((casesForVariant.length / sufficientCases.length) * 1000) / 10 : null,
      percentageNote: sampleSupportsPercentages ? null : "INSUFFICIENT SAMPLE",
      averageThroughputTime: durationStats(casesForVariant.flatMap((item) => {
        if (!item.firstEventTimestamp || !item.lastEventTimestamp) return [];
        return [new Date(item.lastEventTimestamp).getTime() - new Date(item.firstEventTimestamp).getTime()];
      })).average,
      conformanceSummary: {
        conformingCases: casesForVariant.filter((item) => item.conformanceResult.conformanceStatus === "CONFORMING").length,
        nonConformingCases: casesForVariant.filter((item) => item.conformanceResult.conformanceStatus === "NON_CONFORMING").length,
      },
      topDeviations: [...deviationCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3).map(([deviationType, count]) => ({ deviationType, count })),
      cases: casesForVariant.map((item) => ({ loadId: item.loadId, referenceNumber: item.referenceNumber, customerName: item.customerName, throughputTime: item.throughputTime, conformanceStatus: item.conformanceResult.conformanceStatus })),
    };
  }).sort((left, right) => right.caseCount - left.caseCount || String(left.averageThroughputTime ?? "").localeCompare(String(right.averageThroughputTime ?? "")));

  const recurringDeviationMap = new Map<string, { affectedCases: Set<string>; associatedVariants: Set<string>; count: number }>();
  for (const item of sufficientCases) {
    const variant = item.normalizedTrace;
    for (const deviation of item.conformanceResult.deviations) {
      const row = recurringDeviationMap.get(deviation.type) ?? { affectedCases: new Set<string>(), associatedVariants: new Set<string>(), count: 0 };
      row.count += 1;
      row.affectedCases.add(item.loadId);
      row.associatedVariants.add(variant);
      recurringDeviationMap.set(deviation.type, row);
    }
  }
  const recurringDeviations = [...recurringDeviationMap.entries()].map(([deviationType, row]) => ({
    deviationType,
    count: row.count,
    affectedCases: [...row.affectedCases],
    affectedPercentage: sampleSupportsPercentages ? Math.round((row.affectedCases.size / sufficientCases.length) * 1000) / 10 : null,
    associatedVariants: [...row.associatedVariants],
  })).sort((left, right) => right.count - left.count);

  const graphNodeCounts = new Map<string, number>();
  const graphEdgeCounts = new Map<string, { from: string; to: string; transitionCount: number; caseIds: Set<string>; variants: Set<string> }>();
  for (const item of sufficientCases) {
    for (const activity of item.actualPath) graphNodeCounts.set(activity, (graphNodeCounts.get(activity) ?? 0) + 1);
    for (let index = 0; index < item.actualPath.length - 1; index += 1) {
      const from = item.actualPath[index];
      const to = item.actualPath[index + 1];
      const key = `${from}->${to}`;
      const row = graphEdgeCounts.get(key) ?? { from, to, transitionCount: 0, caseIds: new Set<string>(), variants: new Set<string>() };
      row.transitionCount += 1;
      row.caseIds.add(item.loadId);
      row.variants.add(item.normalizedTrace);
      graphEdgeCounts.set(key, row);
    }
  }

  const eventsByCase = new Map<string, BofLoadProcessTraceEvent[]>();
  for (const load of loads) eventsByCase.set(load.id, buildTraceEvents(load.operatingProcessEvents));
  const interval = (start: string[], end: string[]) => durationStats(sufficientCases.flatMap((item) => {
    const events = eventsByCase.get(item.loadId) ?? [];
    const value = intervalMs(events, start, end);
    return value === null ? [] : [value];
  }));

  return {
    dataAuthority: "AUTHORITATIVE_OPERATING_PROCESS_EVENT_LOG",
    datasetLabel: sufficientCases.length >= 10 ? "STATISTICALLY MEANINGFUL DATA" : sufficientCases.length > 0 ? "DEMO DATASET / SAMPLE DATA" : "INSUFFICIENT EVENT HISTORY",
    filtersApplied: Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])),
    caseSummary: {
      totalCases: allCases.length,
      sufficientHistoryCases: sufficientCases.length,
      partialHistoryCases: partialCases.length,
      noHistoryCases: noHistoryCases.length,
      eligibleForStatistics: sufficientCases.length,
      sampleSupportsPercentages,
      percentageNote: sampleSupportsPercentages ? null : "INSUFFICIENT SAMPLE",
    },
    cases: allCases,
    variants: {
      status: sufficientCases.length < 2 ? "INSUFFICIENT EVENT HISTORY" : "Observed variants from persisted events only.",
      uniqueVariantCount: variantRows.length,
      rows: variantRows,
      mostCommonVariant: variantRows[0] ?? null,
    },
    recurringDeviations,
    conformanceSummary: {
      conformingCases: sufficientCases.filter((item) => item.conformanceResult.conformanceStatus === "CONFORMING").length,
      nonConformingCases: sufficientCases.filter((item) => item.conformanceResult.conformanceStatus === "NON_CONFORMING").length,
      insufficientCases: partialCases.length + noHistoryCases.length,
      conformingPercentage: sampleSupportsPercentages ? Math.round((sufficientCases.filter((item) => item.conformanceResult.conformanceStatus === "CONFORMING").length / sufficientCases.length) * 1000) / 10 : null,
      percentageNote: sampleSupportsPercentages ? null : "INSUFFICIENT SAMPLE",
    },
    throughputAnalysis: {
      loadCreatedToDelivery: interval(["LOAD_INTAKE_RECORDED", "CANONICAL_LOAD_RECORDED"], ["DELIVERED"]),
      loadCreatedToPod: interval(["LOAD_INTAKE_RECORDED", "CANONICAL_LOAD_RECORDED"], ["POD_RECEIVED", "POD_VERIFIED"]),
      podToInvoice: interval(["POD_RECEIVED", "POD_VERIFIED"], ["INVOICE_CREATED", "INVOICE_SUBMITTED"]),
      invoiceToSettlement: interval(["INVOICE_CREATED", "INVOICE_SUBMITTED"], ["SETTLEMENT_CREATED", "SETTLEMENT_APPROVED"]),
      reviewToDispatch: interval(["CANONICAL_LOAD_RECORDED"], ["DISPATCH_ASSIGNED"]),
      dispatchToPickup: interval(["DISPATCH_ASSIGNED"], ["DELIVERED"]),
      pickupToDelivery: { average: null, median: null, minimum: null, maximum: null, caseCount: 0, note: "No distinct pickup event exists in the current OperatingProcessEvent vocabulary." },
      deliveryToPod: interval(["DELIVERED"], ["POD_RECEIVED", "POD_VERIFIED"]),
    },
    bottlenecks: {
      status: sufficientCases.length < 3 ? "INSUFFICIENT SAMPLE" : "Stages associated with longer cycle time; causation not established.",
      rows: [] as Array<{ stage: string; averageDuration: string; affectedCases: string[]; variantAssociation: string[]; deviationFrequency: number }>,
    },
    processGraph: {
      nodes: [...graphNodeCounts.entries()].map(([activity, frequency]) => ({ id: activity, label: activity.replace(/_/g, " "), activityFrequency: frequency, variantMembership: variantRows.filter((variant) => variant.activitySequence.includes(activity)).map((variant) => variant.variantId) })),
      edges: [...graphEdgeCounts.values()].map((edge) => ({ from: edge.from, to: edge.to, transitionCount: edge.transitionCount, caseCount: edge.caseIds.size, variantCount: edge.variants.size })),
    },
    transitionAnalysis: [...graphEdgeCounts.values()].map((edge) => ({ from: edge.from, to: edge.to, transitionCount: edge.transitionCount, caseCount: edge.caseIds.size, variantCount: edge.variants.size, unexpected: !BOF_LOAD_REFERENCE_PROCESS.some((activity, index) => activity === edge.from && BOF_LOAD_REFERENCE_PROCESS[index + 1] === edge.to) })),
    nextRequiredAction: sufficientCases.length < 2 ? "Add more real operating-event traces before ranking variants or recurring bottlenecks." : "Review non-conforming variants and recurring deviations with operations owners.",
  };
}

export async function getLoadProcessIntelligence(loadId: string) {
  const demoLoad = findDemoLoad(loadId);
  const persistedLoad = await prisma.load.findFirst({
    where: { OR: [{ id: loadId }, { referenceNumber: loadId }, { sourceRecordId: loadId }] },
    include: {
      operatingProcessEvents: { orderBy: [{ eventTimestamp: "asc" }, { id: "asc" }] },
      operatingExceptions: true,
      operatingCorrectiveActions: true,
      dispatchAssignments: { include: { driver: true, tractorEquipment: true, trailerEquipment: true } },
      deliveries: true,
      proofsOfDelivery: true,
      invoices: true,
      invoicePayments: true,
      settlements: true,
    },
  });

  if (!demoLoad && !persistedLoad) return null;

  const events = persistedLoad?.operatingProcessEvents ?? [];
  const orderedEvents = buildTraceEvents(events);
  const actualPath = orderedEvents.map((event) => event.activity);
  const conformance = evaluateConformance(actualPath);
  const first = orderedEvents[0];
  const last = orderedEvents[orderedEvents.length - 1];
  const throughputTime = first && last ? formatDuration(new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) : null;
  const historyStatus = orderedEvents.length === 0 ? ("INSUFFICIENT_EVENT_HISTORY" as const) : ("ACTUAL_EVENT_HISTORY_AVAILABLE" as const);
  const eventQuality = buildEventQuality(orderedEvents, actualPath);
  const coverage = buildCoverage(actualPath);
  const throughput = buildThroughput(orderedEvents);

  const fleetSequences = persistedLoad
    ? await prisma.operatingProcessEvent.findMany({
        where: { fleetId: persistedLoad.fleetId, loadId: { not: null } },
        select: { loadId: true, eventType: true, eventTimestamp: true, id: true },
        orderBy: [{ eventTimestamp: "asc" }, { id: "asc" }],
      })
    : [];
  const sequencesByLoad = new Map<string, string[]>();
  for (const row of fleetSequences) {
    if (!row.loadId) continue;
    const path = sequencesByLoad.get(row.loadId) ?? [];
    path.push(row.eventType);
    sequencesByLoad.set(row.loadId, path);
  }
  const comparableSequences = [...sequencesByLoad.entries()].filter(([, path]) => path.length >= 3);
  const variantCounts = new Map<string, string[]>();
  for (const [id, path] of comparableSequences) {
    const key = path.join(" -> ");
    const loadIds = variantCounts.get(key) ?? [];
    loadIds.push(id);
    variantCounts.set(key, loadIds);
  }
  const variantsInsufficient = comparableSequences.length < 2;

  const bottleneckStages = orderedEvents.slice(0, -1).flatMap((event, index) => {
    const next = orderedEvents[index + 1];
    const duration = event.durationToNextEvent;
    if (!duration) return [];
    return [{
      stage: event.processStage,
      duration,
      affectedLoads: [demoLoad?.id ?? persistedLoad?.id ?? loadId],
      deviationFrequency: "Observed on this load only.",
      businessImpact: eventImpact(event.activity),
      nextInvestigationAction: `Review ${event.activity} to ${next.activity} using persisted timestamps.`,
    }];
  });

  return {
    loadId: demoLoad?.id ?? persistedLoad?.id ?? loadId,
    requestedLoadId: loadId,
    dataAuthority: persistedLoad ? "AUTHORITATIVE_PERSISTED_DATA" : "DEMO_LOAD_IDENTITY_WITHOUT_PERSISTED_EVENT_LOG",
    historyStatus,
    historyStatusLabel: historyStatus === "ACTUAL_EVENT_HISTORY_AVAILABLE" ? "ACTUAL EVENT HISTORY AVAILABLE" : "INSUFFICIENT EVENT HISTORY",
    loadIdentity: {
      id: demoLoad?.id ?? persistedLoad?.id ?? loadId,
      customerName: persistedLoad?.customerName ?? demoLoad?.customerName ?? "Unknown customer",
      origin: persistedLoad?.origin ?? demoLoad?.origin ?? "Unknown origin",
      destination: persistedLoad?.destination ?? demoLoad?.destination ?? "Unknown destination",
      status: persistedLoad?.status ?? demoLoad?.status ?? "Unknown",
      driverId: demoLoad && "driverId" in demoLoad ? demoLoad.driverId : persistedLoad?.dispatchAssignments[0]?.driverId ?? null,
      equipmentId: demoLoad && "assetId" in demoLoad ? demoLoad.assetId : persistedLoad?.dispatchAssignments[0]?.tractorEquipmentId ?? null,
    },
    eventLogSufficiency: {
      sufficientForSingleTrace: orderedEvents.length >= 2,
      sufficientForConformance: conformance.conformanceStatus !== "INSUFFICIENT_EVENT_HISTORY",
      sufficientForVariants: !variantsInsufficient,
      reason: orderedEvents.length === 0
        ? "INSUFFICIENT EVENT HISTORY: no persisted OperatingProcessEvent rows exist for this load."
        : orderedEvents.length === 1
          ? "INSUFFICIENT EVENT HISTORY: only one persisted event exists; durations and variants need more history."
          : "Persisted events can support a single-load trace. Fleet-level variants require more comparable traces.",
    },
    orderedEvents: orderedEvents.map((event, index) => ({ ...event, durationToNextEvent: event.durationToNextEvent ?? (index === orderedEvents.length - 1 ? null : event.durationToNextEvent) })),
    referenceProcess: {
      label: "Initial BOF normal load reference process",
      note: "Expected process model, not historical truth.",
      activities: [...BOF_LOAD_REFERENCE_PROCESS],
    },
    conformance: { ...conformance, throughputTime: throughputTime ?? conformance.throughputTime },
    processDiscovery: {
      status: variantsInsufficient ? "INSUFFICIENT EVENT HISTORY" : "Comparable traces available; treat as observed sequences only.",
      commonPaths: variantsInsufficient ? [] : [...variantCounts.entries()].filter(([, ids]) => ids.length > 1).map(([variant]) => variant),
      uncommonPaths: variantsInsufficient ? [] : [...variantCounts.entries()].filter(([, ids]) => ids.length === 1).map(([variant]) => variant),
      repeatedSteps: conformance.deviations.filter((item) => item.type === "ACTIVITY_REPEAT").map((item) => item.activity).filter(Boolean),
      skippedSteps: conformance.deviations.filter((item) => item.type === "ACTIVITY_SKIP").map((item) => item.expectedActivity).filter(Boolean),
      outOfOrderSteps: conformance.deviations.filter((item) => item.type === "OUT_OF_ORDER").map((item) => item.activity).filter(Boolean),
      loops: conformance.deviations.filter((item) => item.type === "LOOP_BACK").map((item) => item.activity).filter(Boolean),
    },
    variants: {
      status: variantsInsufficient ? "INSUFFICIENT EVENT HISTORY" : "Observed sequences from persisted events only.",
      variants: variantsInsufficient
        ? []
        : [...variantCounts.entries()].map(([variant, loadIds]) => ({ variant, loadCount: loadIds.length, loadIds })),
    },
    throughput,
    bottlenecks: {
      status: bottleneckStages.length === 0 ? "INSUFFICIENT EVENT HISTORY" : "Observed waits between consecutive persisted events.",
      stages: bottleneckStages,
    },
    eventQuality,
    coverage,
    rootCauseContext: {
      driver: demoLoad && "driverId" in demoLoad ? demoLoad.driverId : persistedLoad?.dispatchAssignments[0]?.driverId ?? null,
      equipment: demoLoad && "assetId" in demoLoad ? demoLoad.assetId : persistedLoad?.dispatchAssignments[0]?.tractorEquipmentId ?? null,
      customer: persistedLoad?.customerName ?? demoLoad?.customerName ?? null,
      carrier: demoLoad && "brokerName" in demoLoad ? demoLoad.brokerName : null,
      lane: `${persistedLoad?.origin ?? demoLoad?.origin ?? "Unknown origin"} -> ${persistedLoad?.destination ?? demoLoad?.destination ?? "Unknown destination"}`,
      exceptions: persistedLoad?.operatingExceptions.map((item) => ({ id: item.id, type: item.exceptionType, deviation: item.deviation, status: item.status })) ?? [],
      correctiveActions: persistedLoad?.operatingCorrectiveActions.map((item) => ({ id: item.id, type: item.actionType, status: item.status })) ?? [],
      sourceSystem: persistedLoad?.sourceSystem ?? (demoLoad && "intakeSourceType" in demoLoad ? demoLoad.intakeSourceType : null),
    },
  };
}