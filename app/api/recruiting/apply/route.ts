import { NextResponse } from "next/server";

import { validateApplicantSubmission } from "@/lib/validations/applicant";
import { attachCandidateToPosition, findOpenPositionByOpeningId } from "@/lib/services/requisitionRecruitingBridge";

/**
 * Public driver application (careers page). The application becomes a Candidate on the recruiting
 * position of the approved requisition it was submitted for, through the same intake as recruiter
 * attachment. Nothing about the candidate or the carrier is returned.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = validateApplicantSubmission(body);
  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: "Validation failed", details: result.errors }, { status: 400 });
  }
  const data = result.data;

  try {
    const position = await findOpenPositionByOpeningId(data.positionId);
    if (!position) {
      return NextResponse.json({ success: false, error: "This opening is no longer accepting applications." }, { status: 404 });
    }
    const candidate = await attachCandidateToPosition(position, {
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      homeLocation: data.homeLocation,
      cdlClass: data.cdlClass,
      cdlState: data.cdlState,
      cdlNumber: data.cdlNumber,
      experienceYears: data.experienceYears,
      endorsements: data.endorsements ?? [],
      source: "BOF Careers Page",
      attachedBy: "public application",
    });
    return NextResponse.json(
      { success: true, applicationId: candidate.candidateCode, openingId: data.positionId, message: "Application received for BOF recruiter review." },
      { status: 201 },
    );
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 500;
    if (statusCode === 409) {
      return NextResponse.json({ success: false, error: "An application with this email is already on file for this opening." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "We could not save your application. Please try again." }, { status: 500 });
  }
}
