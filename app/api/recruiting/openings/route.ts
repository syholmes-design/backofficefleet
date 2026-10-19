import { NextResponse } from "next/server";

import { listPublicOpenings } from "@/lib/services/requisitionRecruitingBridge";

export const dynamic = "force-dynamic";

/** Public, blind job postings for approved requisitions with seats remaining (careers page). */
export async function GET() {
  try {
    return NextResponse.json({ openings: await listPublicOpenings() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Openings are temporarily unavailable." }, { status: 503 });
  }
}
