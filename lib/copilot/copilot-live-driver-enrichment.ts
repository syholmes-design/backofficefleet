import type { CopilotAdvocateView, CopilotFact } from "@/lib/copilot/copilot-shared";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

export function enrichDriverCopilotWithLiveSummary(
  view: CopilotAdvocateView,
  live: DriverOperationalSummary | null | undefined,
): CopilotAdvocateView {
  if (!live) return view;

  const facts: CopilotFact[] = [...view.facts];
  const unsupported = view.unsupported.filter(
    (line) => !line.includes("Live Prisma Driver / DriverDocument snapshots are not called here"),
  );

  if (live.readinessEvaluationState === "AVAILABLE" && live.readiness) {
    facts.unshift({
      id: `live-readiness-${live.driverId}`,
      domain: "Driver readiness (LIVE)",
      source: "driverOperationalReadModelService",
      sourceClass: "AUTHORITATIVE",
      fact: `${live.driverName} readiness is ${live.readiness.readinessStatus} (${live.readiness.reasonCodes.join(", ") || "no reason codes"}).`,
      causeClass: "RECORDED_CAUSE",
      recordedCause: live.readiness.summary ?? "Prisma DriverReadinessScore projection",
    });
  } else {
    facts.unshift({
      id: `live-readiness-missing-${live.driverId}`,
      domain: "Driver readiness (LIVE)",
      source: "driverOperationalReadModelService",
      sourceClass: "AUTHORITATIVE",
      fact: `${live.driverName} has no evaluated readiness projection in Prisma for fleet ${live.fleetId}.`,
      causeClass: "CAUSE_NOT_ESTABLISHED",
      recordedCause: "Readiness not evaluated",
    });
  }

  if (live.qualificationEvaluationState === "AVAILABLE" && live.qualification) {
    facts.unshift({
      id: `live-qualification-${live.driverId}`,
      domain: "Driver qualification (LIVE)",
      source: "driverOperationalReadModelService",
      sourceClass: "AUTHORITATIVE",
      fact: `${live.driverName} qualification is ${live.qualification.qualificationStatus}.`,
      causeClass: "RECORDED_CAUSE",
      recordedCause: live.qualification.summary ?? "Prisma DriverQualificationSnapshot projection",
    });
  }

  return {
    ...view,
    facts,
    unsupported: [
      "Demo BofData driver eligibility remains visible when demo ids are scoped; LIVE facts above come from Prisma read models and do not replace getDriverDispatchEligibility.",
      ...unsupported,
    ],
    overview:
      live.readiness?.readinessStatus === "NOT_READY"
        ? `${view.overview} LIVE readiness projection: NOT_READY.`
        : view.overview,
  };
}
