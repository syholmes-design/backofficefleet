import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { getAuthorizedOperatingRecord, listAuthorizedOperatingRecords, OperatingRecordError, type OperatingRecordType } from "@/lib/services/operatingRecordService";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const fleetId = params.get("fleetId") ?? "";
  const recordType = params.get("recordType") as OperatingRecordType | null;
  const recordId = params.get("recordId");
  if (!recordType) return NextResponse.json({ error: "recordType is required" }, { status: 422 });

  try {
    const user = session.user as SessionUserLike;
    if (recordId) return NextResponse.json(await getAuthorizedOperatingRecord(user, fleetId, recordType, recordId));
    return NextResponse.json(await listAuthorizedOperatingRecords(user, fleetId, recordType, { limit: Number(params.get("limit") ?? 25) }));
  } catch (error) {
    if (error instanceof OperatingRecordError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
