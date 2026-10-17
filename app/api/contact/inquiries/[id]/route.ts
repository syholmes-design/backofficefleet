import { ContactInquiryStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isContactInquiryStorageUnavailable } from "@/lib/contact/contactInquiryStore";
import { requireInquiryStaff } from "@/lib/contact/inquiryApiAuth";
import {
  getContactInquiryById,
  InquiryManagementError,
  patchContactInquiry,
} from "@/lib/contact/inquiryManagement";

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

export async function GET(_request: NextRequest, context: RouteContext) {
  const authResult = await requireInquiryStaff();
  if (authResult.error) return authResult.error;
  try {
    const { id } = await context.params;
    const payload = await getContactInquiryById(id);
    return NextResponse.json(payload);
  } catch (error) {
    return managementError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireInquiryStaff();
  if (authResult.error) return authResult.error;
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch = {
      status: typeof body.status === "string" ? (body.status as ContactInquiryStatus) : undefined,
      assignedToUserId:
        body.assignedToUserId === null
          ? null
          : typeof body.assignedToUserId === "string"
            ? body.assignedToUserId
            : undefined,
      department:
        body.department === null ? null : typeof body.department === "string" ? body.department : undefined,
      nextFollowUpAt:
        body.nextFollowUpAt === null
          ? null
          : typeof body.nextFollowUpAt === "string"
            ? body.nextFollowUpAt
            : undefined,
    };
    const inquiry = await patchContactInquiry(id, authResult.user.id, patch);
    return NextResponse.json({ inquiry });
  } catch (error) {
    return managementError(error);
  }
}
