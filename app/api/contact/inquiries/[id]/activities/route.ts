import { ContactInquiryActivityType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isContactInquiryStorageUnavailable } from "@/lib/contact/contactInquiryStore";
import { requireInquiryStaff } from "@/lib/contact/inquiryApiAuth";
import { addContactInquiryActivity, InquiryManagementError } from "@/lib/contact/inquiryManagement";

type RouteContext = { params: Promise<{ id: string }> };

function managementError(error: unknown) {
  if (error instanceof InquiryManagementError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  if (isContactInquiryStorageUnavailable(error)) {
    return NextResponse.json({ error: "Inquiry storage is not available yet." }, { status: 503 });
  }
  return NextResponse.json({ error: "Inquiry storage is not available yet." }, { status: 500 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireInquiryStaff();
  if (authResult.error) return authResult.error;
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const activity = await addContactInquiryActivity(id, authResult.user.id, {
      description: typeof body.description === "string" ? body.description : undefined,
      activityType:
        typeof body.activityType === "string"
          ? (body.activityType as ContactInquiryActivityType)
          : undefined,
    });
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return managementError(error);
  }
}
