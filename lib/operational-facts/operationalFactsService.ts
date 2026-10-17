import { buildLoadFinanceHandoff } from "@/lib/load-finance-handoff";
import { isGpsStorageUnavailable } from "@/lib/fleet-visibility/gps-storage";
import { prisma } from "@/lib/prisma";
export type DriverOperationalFacts = {
  dataAuthority: "LIVE";
  driverId: string;
  fleetId: string;
  readinessStatus: string | null;
  qualificationStatus: string | null;
  dispatchEligibilityNote: string;
};

export type LoadOperationalFacts = {
  dataAuthority: "LIVE";
  loadId: string;
  referenceNumber: string | null;
  loadStatus: string;
  financeHandoff: ReturnType<typeof buildLoadFinanceHandoff>;
  movementAssessment: {
    progressStatus: string;
    estimatedArrivalAt: string | null;
    etaConfidenceNote: string | null;
  } | null;
};

export async function getDriverOperationalFacts(driverId: string, fleetId: string): Promise<DriverOperationalFacts | null> {
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, fleetId },
    select: { id: true, fleetId: true },
  });
  if (!driver) return null;

  const [qualification, readiness] = await Promise.all([
    prisma.driverQualificationSnapshot.findFirst({
      where: { driverId, fleetId },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      select: { status: true },
    }),
    prisma.driverReadinessScore.findFirst({
      where: { driverId, fleetId },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      select: { status: true },
    }),
  ]);

  return {
    dataAuthority: "LIVE",
    driverId,
    fleetId,
    readinessStatus: readiness?.status ?? null,
    qualificationStatus: qualification?.status ?? null,
    dispatchEligibilityNote:
      "Dispatch eligibility requires DriverReadinessScore READY and dispatch assignment gates.",
  };
}

export async function getLoadOperationalFacts(loadId: string, fleetId: string): Promise<LoadOperationalFacts | null> {
  const load = await prisma.load.findFirst({
    where: { id: loadId, fleetId },
    select: {
      id: true,
      status: true,
      referenceNumber: true,
      proofsOfDelivery: { select: { id: true, status: true, verifiedAt: true, lifecycleClass: true } },
      invoices: { select: { id: true, status: true } },
      settlements: { select: { id: true, status: true, holdReason: true, netAmount: true, lifecycleClass: true } },
      operatingExceptions: { select: { id: true, exceptionType: true, status: true, deviation: true } },
    },
  });
  if (!load) return null;

  const financeHandoff = buildLoadFinanceHandoff(load);
  let movement: {
    progressStatus: string;
    estimatedArrivalAt: Date | null;
    etaConfidenceNote: string | null;
  } | null = null;
  try {
    movement = await prisma.loadMovementAssessment.findUnique({
      where: { fleetId_loadId: { fleetId, loadId: load.id } },
      select: { progressStatus: true, estimatedArrivalAt: true, etaConfidenceNote: true },
    });
  } catch (error) {
    if (!isGpsStorageUnavailable(error)) throw error;
  }
  return {
    dataAuthority: "LIVE",
    loadId: load.id,
    referenceNumber: load.referenceNumber,
    loadStatus: load.status,
    financeHandoff,
    movementAssessment: movement
      ? {
          progressStatus: movement.progressStatus,
          estimatedArrivalAt: movement.estimatedArrivalAt?.toISOString() ?? null,
          etaConfidenceNote: movement.etaConfidenceNote,
        }
      : null,
  };
}
