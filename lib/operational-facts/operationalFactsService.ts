import { prisma } from "@/lib/prisma";
import { buildLoadFinanceHandoff } from "@/lib/load-finance-handoff";
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
  return {
    dataAuthority: "LIVE",
    loadId: load.id,
    referenceNumber: load.referenceNumber,
    loadStatus: load.status,
    financeHandoff,
  };
}
