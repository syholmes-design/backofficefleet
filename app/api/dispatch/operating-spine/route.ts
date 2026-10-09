import { auth } from "@/auth";
import { listAccessibleEquipment } from "@/lib/services/equipmentService";
import { listAccessibleLoads } from "@/lib/services/loadService";
import { listPickupAuthorizationsForSpine } from "@/lib/services/pickupAuthorizationService";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function spineLoad(load: {
  id: string;
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  commodityClass: string | null;
  pickupWindowStart: Date | null;
  pickupWindowEnd: Date | null;
  deliveryWindowStart: Date | null;
  deliveryWindowEnd: Date | null;
  referenceNumber: string | null;
  secondaryReferenceNumber: string | null;
  status: string;
  sourceRecordId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: load.id,
    fleetId: load.fleetId,
    customerName: load.customerName,
    origin: load.origin,
    destination: load.destination,
    commodityClass: load.commodityClass,
    pickupWindowStart: load.pickupWindowStart,
    pickupWindowEnd: load.pickupWindowEnd,
    deliveryWindowStart: load.deliveryWindowStart,
    deliveryWindowEnd: load.deliveryWindowEnd,
    referenceNumber: load.referenceNumber,
    secondaryReferenceNumber: load.secondaryReferenceNumber,
    status: load.status,
    sourceRecordId: load.sourceRecordId,
    createdAt: load.createdAt,
    updatedAt: load.updatedAt,
  };
}

function spineEquipment(unit: {
  id: string;
  fleetId: string;
  equipmentType: string;
  unitNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: unit.id,
    fleetId: unit.fleetId,
    equipmentType: unit.equipmentType,
    unitNumber: unit.unitNumber,
    status: unit.status,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const [loads, equipment, pickupAuthorizations] = await Promise.all([
      listAccessibleLoads(session.user),
      listAccessibleEquipment(session.user),
      listPickupAuthorizationsForSpine(session.user),
    ]);
    const loadIds = loads.map((load) => load.id);
    const fleetIds = [...new Set(loads.map((load) => load.fleetId))];
    const heldSettlements =
      loadIds.length === 0
        ? []
        : await prisma.settlement.findMany({
            where: { status: "HELD", loadId: { in: loadIds } },
            orderBy: { updatedAt: "desc" },
            take: 25,
            select: {
              id: true,
              loadId: true,
              fleetId: true,
              status: true,
              holdReason: true,
              updatedAt: true,
            },
          });
    const proofsRequiringReview =
      loadIds.length === 0
        ? []
        : await prisma.loadProofOfDelivery.findMany({
            where: {
              fleetId: { in: fleetIds },
              loadId: { in: loadIds },
              lifecycleClass: "LIVE",
              status: { in: ["REJECTED", "MISSING", "EXCEPTION"] },
            },
            orderBy: { updatedAt: "desc" },
            take: 25,
            select: {
              id: true,
              loadId: true,
              proofType: true,
              status: true,
              exceptionStatus: true,
              verifiedAt: true,
              updatedAt: true,
            },
          });
    const proofLoadIds = [...new Set(proofsRequiringReview.map((proof) => proof.loadId))];
    const proofSettlements =
      proofLoadIds.length === 0
        ? []
        : await prisma.settlement.findMany({
            where: { loadId: { in: proofLoadIds }, fleetId: { in: fleetIds } },
            orderBy: { updatedAt: "desc" },
            select: { loadId: true, status: true },
          });
    const settlementStatusByLoadId = new Map<string, string>();
    for (const settlement of proofSettlements) {
      if (!settlementStatusByLoadId.has(settlement.loadId)) {
        settlementStatusByLoadId.set(settlement.loadId, settlement.status);
      }
    }

    return NextResponse.json({
      authority: "LIVE",
      loads: loads.map(spineLoad),
      equipment: equipment.map(spineEquipment),
      heldSettlements,
      pickupAuthorizations,
      proofsRequiringReview: proofsRequiringReview.map((proof) => ({
        ...proof,
        settlementStatus: settlementStatusByLoadId.get(proof.loadId) ?? null,
      })),
    });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    return NextResponse.json(
      { error: statusCode === 401 || statusCode === 403 ? (error as Error).message : "Internal server error" },
      { status: statusCode },
    );
  }
}
