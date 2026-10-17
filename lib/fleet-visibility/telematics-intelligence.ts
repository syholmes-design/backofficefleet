import type { SessionUserLike } from "@/lib/authorization";
import { requireFleetAccess } from "@/lib/authorization";
import { GpsStorageUnavailableError, withGpsStorage } from "@/lib/fleet-visibility/gps-storage";
import { locationFreshnessLabel } from "@/lib/fleet-visibility/staleness";
import { extractNearCity, extractUnitNumber } from "@/lib/fleet-visibility/query-parse";
import type { OperationalIntelligenceAnswer, OperationalIntelligenceCitation } from "@/lib/operational-intelligence/types";
import { prisma } from "@/lib/prisma";

function rec(recordType: OperationalIntelligenceCitation["recordType"], recordId: string, title: string, route: string): OperationalIntelligenceCitation {
  return { recordType, recordId, title, route };
}

export async function answerTelematicsQuestion(
  user: SessionUserLike,
  fleetId: string,
  question: string,
): Promise<OperationalIntelligenceAnswer> {
  try {
    return await withGpsStorage(() => answerTelematicsQuestionInner(user, fleetId, question));
  } catch (error) {
    if (error instanceof GpsStorageUnavailableError) {
      return {
        intent: "TELEMATICS",
        question,
        dataAuthority: "UNAVAILABLE",
        answer:
          "Fleet GPS storage is not available in this environment. Dispatch, load status, and delivery records remain authoritative until GPS tables are provisioned.",
        citations: [],
        recommendations: [{ label: "Open dispatch", href: "/dispatch", claimClass: "RECOMMENDATION", executable: false }],
        limitations: [error.message],
      };
    }
    throw error;
  }
}

async function answerTelematicsQuestionInner(
  user: SessionUserLike,
  fleetId: string,
  question: string,
): Promise<OperationalIntelligenceAnswer> {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    return {
      intent: "TELEMATICS",
      question,
      dataAuthority: "UNAVAILABLE",
      answer: access.reason ?? "Fleet access denied.",
      citations: [],
      recommendations: [],
      limitations: [],
    };
  }

  const q = question.toLowerCase();
  const now = new Date();

  if (/stopped reporting|stale|no gps|without tracking/.test(q)) {
    const tractors = await prisma.equipment.findMany({
      where: { fleetId, equipmentType: "TRACTOR" },
      select: { id: true, unitNumber: true },
    });
    const stale: string[] = [];
    const missing: string[] = [];
    for (const row of tractors) {
      const obs = await prisma.vehicleLocationObservation.findFirst({
        where: { fleetId, equipmentId: row.id },
        orderBy: { observedAt: "desc" },
      });
      if (!obs) {
        missing.push(row.unitNumber);
        continue;
      }
      const label = locationFreshnessLabel(obs.observedAt, obs.observationKind, now);
      if (label === "STALE" || label === "UNAVAILABLE") stale.push(`${row.unitNumber} (last ${obs.observedAt.toISOString()})`);
    }
    return {
      intent: "TELEMATICS",
      question,
      dataAuthority: "LIVE",
      answer: [
        missing.length ? `Units with no GPS observations: ${missing.join(", ")}.` : "All tractors have at least one stored observation.",
        stale.length ? `Stale or aged observations: ${stale.join("; ")}.` : "No tractors are flagged stale from the latest observation timestamps.",
      ].join("\n"),
      citations: [{ recordType: "FLEET_SUMMARY", recordId: fleetId, title: "Fleet map", route: "/fleet-map" }],
      recommendations: [{ label: "Open fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
      limitations: ["Answers use VehicleLocationObservation only — not demo dispatch map interpolation."],
    };
  }

  if (/miss.*appointment|delivery.at.risk|likely to miss|need immediate operational attention/.test(q)) {
    const atRisk = await prisma.loadMovementAssessment.findMany({
      where: {
        fleetId,
        progressStatus: { in: ["DELIVERY_AT_RISK", "POTENTIALLY_DELAYED", "APPOINTMENT_MISSED"] },
      },
      include: { load: { select: { referenceNumber: true, destination: true } } },
      take: 15,
    });
    if (!atRisk.length) {
      return {
        intent: "TELEMATICS",
        question,
        dataAuthority: "LIVE",
        answer: "No loads in this fleet currently have a persisted DELIVERY_AT_RISK, POTENTIALLY_DELAYED, or APPOINTMENT_MISSED assessment from GPS.",
        citations: [],
        recommendations: [{ label: "Fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
        limitations: ["Assessments require load stop geography and fresh GPS observations."],
      };
    }
    const lines = atRisk.map(
      (row) =>
        `Load ${row.load.referenceNumber ?? row.loadId} → ${row.load.destination}: ${row.progressStatus}${row.estimatedArrivalAt ? ` (ETA ${row.estimatedArrivalAt.toISOString()})` : ""}`,
    );
    return {
      intent: "TELEMATICS",
      question,
      dataAuthority: "LIVE",
      answer: lines.join("\n"),
      citations: atRisk.map((row) => rec("LOAD", row.loadId, `Load ${row.loadId}`, `/loads/${row.loadId}`)),
      recommendations: atRisk.slice(0, 3).map((row) => ({
        label: `Open load ${row.load.referenceNumber ?? row.loadId}`,
        href: `/loads/${row.loadId}`,
        claimClass: "RECOMMENDATION" as const,
        executable: false as const,
      })),
      limitations: ["ETA uses straight-line distance when traffic and HOS are unavailable."],
    };
  }

  const unitNumber = extractUnitNumber(question);
  if (unitNumber) {
    const equipment = await prisma.equipment.findFirst({
      where: { fleetId, unitNumber: { equals: unitNumber, mode: "insensitive" } },
      select: { id: true, unitNumber: true },
    });
    if (!equipment) {
      return {
        intent: "TELEMATICS",
        question,
        dataAuthority: "LIVE",
        answer: `No tractor with unit number ${unitNumber} exists in fleet ${fleetId}.`,
        citations: [],
        recommendations: [],
        limitations: [],
      };
    }
    const obs = await prisma.vehicleLocationObservation.findFirst({
      where: { fleetId, equipmentId: equipment.id },
      orderBy: { observedAt: "desc" },
    });
    if (!obs) {
      return {
        intent: "TELEMATICS",
        question,
        dataAuthority: "LIVE",
        answer: `Truck ${equipment.unitNumber} has no persisted GPS observations. BOF will not invent a current location.`,
        citations: [rec("LOAD", equipment.id, equipment.unitNumber, `/fleet-map`)],
        recommendations: [{ label: "Fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
        limitations: [],
      };
    }
    const label = locationFreshnessLabel(obs.observedAt, obs.observationKind, now);
    const freshness =
      label === "LIVE"
        ? "Live GPS (observation within 5 minutes)"
        : label === "LAST_KNOWN"
          ? "Last known location (not asserted as live)"
          : label === "STALE"
            ? "Stale last known location"
            : label === "SYNTHETIC_TEST"
              ? "Synthetic test observation"
              : "Unavailable";
    return {
      intent: "TELEMATICS",
      question,
      dataAuthority: obs.observationKind === "SYNTHETIC_TEST" ? "PARTIAL" : "LIVE",
      answer: `Truck ${equipment.unitNumber}: ${freshness} at ${obs.latitude.toFixed(5)}, ${obs.longitude.toFixed(5)} (observed ${obs.observedAt.toISOString()}, provider ${obs.provider}).`,
      citations: [rec("LOAD", obs.id, `Observation ${obs.id}`, `/fleet-map`)],
      recommendations: [{ label: "Open fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
      limitations: label === "STALE" ? ["Do not treat stale coordinates as the truck's current position."] : [],
    };
  }

  const nearCity = extractNearCity(question);
  if (nearCity) {
    return {
      intent: "TELEMATICS",
      question,
      dataAuthority: "UNAVAILABLE",
      answer: `Proximity search near "${nearCity}" requires geocoded city boundaries or reverse geocoding, which is not wired in Increment 5. Use the fleet map filtered by load lane or ask for a specific unit number.`,
      citations: [],
      recommendations: [{ label: "Fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
      limitations: [],
    };
  }

  return {
    intent: "TELEMATICS",
    question,
    dataAuthority: "PARTIAL",
    answer:
      "Fleet GPS is available through persisted VehicleLocationObservation rows. Ask for a truck unit number, loads at delivery risk, or units with stale/missing GPS. Demo dispatch map positions are not used.",
    citations: [],
    recommendations: [{ label: "Fleet map", href: "/fleet-map", claimClass: "RECOMMENDATION", executable: false }],
    limitations: ["Marketing/demo map ETAs remain simulated until a live observation exists."],
  };
}
