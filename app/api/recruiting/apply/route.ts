import { NextResponse } from "next/server";
import { validateApplicantSubmission } from "@/lib/validations/applicant";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Server-side validation
    const result = validateApplicantSubmission(body);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: result.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // 2. Application Data Sanitization & Normalization
    const sanitizedEmail = data.email.toLowerCase();
    const maskedCdl = `${data.cdlState}••••${data.cdlNumber.slice(-4)}`;
    const applicationId = `CAND-${Date.now().toString(36).toUpperCase().slice(-5)}`;

    // 3. Return validated & normalized candidate payload for client persistence
    const newCandidate = {
      id: applicationId,
      name: data.name,
      email: sanitizedEmail,
      phone: data.phone,
      homeLocation: data.homeLocation,
      positionId: data.positionId,
      positionTitle: data.positionId === "POS-002" ? "CDL-A Local Shuttle Driver" : "CDL-A OTR Regional Driver",
      appliedDate: new Date().toISOString().slice(0, 10),
      experienceYears: data.experienceYears,
      cdlClass: data.cdlClass,
      cdlState: data.cdlState,
      cdlNumberMasked: maskedCdl,
      medCardStatus: "VALID" as const,
      mvrStatus: "PENDING_VERIFICATION" as const,
      backgroundStatus: "PENDING_VERIFICATION" as const,
      pipelineStage: "APPLICATION_RECEIVED" as const,
      source: "BOF Careers Page" as const,
      onboardingChecklist: [
        { id: "ob-1", label: "Employment Application & I-9 Verification", completed: false, requiredDocType: "I-9" },
        { id: "ob-2", label: "CDL License Verification", completed: false, requiredDocType: "CDL" },
        { id: "ob-3", label: "Medical Examiner's Certificate (MCSA-5876)", completed: false, requiredDocType: "Medical Card" },
        { id: "ob-4", label: "MVR Driving History Record", completed: false, requiredDocType: "MVR" },
        { id: "ob-5", label: "FMCSA Drug & Alcohol Clearinghouse Consent", completed: false, requiredDocType: "FMCSA" },
        { id: "ob-6", label: "W-9 Tax Form Submission", completed: false, requiredDocType: "W-9" },
        { id: "ob-7", label: "Direct Deposit / Bank Account Setup", completed: false, requiredDocType: "Bank Info" },
        { id: "ob-8", label: "BOF Fleet Safety Policy Acknowledgment", completed: false },
        { id: "ob-9", label: "Pre-Trip Inspection & ELD Training", completed: false },
        { id: "ob-10", label: "Power Unit Equipment Orientation", completed: false },
      ],
    };

    return NextResponse.json({
      success: true,
      applicationId,
      message: "Application submitted successfully and validated on server",
      candidate: newCandidate,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error processing application" },
      { status: 500 }
    );
  }
}
