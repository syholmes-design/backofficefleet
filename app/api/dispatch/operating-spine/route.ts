import { auth } from "@/auth";
import { listAccessibleEquipment } from "@/lib/services/equipmentService";
import { listAccessibleLoads } from "@/lib/services/loadService";
import { listPickupAuthorizationsForSpine } from "@/lib/services/pickupAuthorizationService";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    return NextResponse.json({
      authority: "LIVE",
      loads,
      equipment,
      heldSettlements,
      pickupAuthorizations,
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
