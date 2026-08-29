import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { affirmMedicalRenewalAppointment } from "@/lib/services/requirementService";

export async function POST(
  _request: Request,
  context: { params: Promise<{ driverId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { driverId } = await context.params;
    const requirement = await affirmMedicalRenewalAppointment({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      driverId,
    });
    return NextResponse.json(requirement);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}