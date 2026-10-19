import { NextResponse } from "next/server";

import { recruitingErrorResponse, recruitingSessionUser } from "@/lib/recruiting/api-helpers";
import { loadRecruitingWorkspace } from "@/lib/services/requisitionRecruitingBridge";

/** Recruiting & Onboarding workspace data: approved requisitions, their positions and candidates (tenant-scoped). */
export async function GET() {
  const session = await recruitingSessionUser();
  if (session.response) return session.response;
  try {
    return NextResponse.json(await loadRecruitingWorkspace(session.user));
  } catch (error) {
    return recruitingErrorResponse(error);
  }
}
