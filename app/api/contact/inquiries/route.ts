import { auth } from "@/auth";
import { isBofStaff } from "@/lib/contact/bofStaffAccess";
import { ContactInquiryError } from "@/lib/contact/contactInquiry";
import { acceptContactInquiry, isContactInquiryStorageUnavailable } from "@/lib/contact/contactInquiryStore";
import type { SessionUserLike } from "@/lib/authorization";
import {
  getInquirySummary,
  InquiryManagementError,
  listInquiryReviewStaff,
  parseInquiryListQuery,
  searchContactInquiries,
} from "@/lib/contact/inquiryManagement";
import { NextRequest, NextResponse } from "next/server";

function publicError(error: unknown) {
  if (error instanceof ContactInquiryError) {
    return NextResponse.json(
      { accepted: false, saved: false, emailed: false, error: error.message, fields: error.fields },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { accepted: false, saved: false, emailed: false, error: "We could not save your inquiry. Nothing was sent." },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await acceptContactInquiry(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return publicError(error);
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = session?.user as SessionUserLike | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBofStaff(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const query = parseInquiryListQuery(request.nextUrl.searchParams);
    const [summary, staff, list] = await Promise.all([
      getInquirySummary(),
      listInquiryReviewStaff(),
      searchContactInquiries(query),
    ]);
    return NextResponse.json({
      notification: "saved",
      emailed: false,
      summary,
      staff,
      ...list,
    });
  } catch (error) {
    if (error instanceof InquiryManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (isContactInquiryStorageUnavailable(error)) {
      return NextResponse.json({ error: "Inquiry storage is not available yet." }, { status: 503 });
    }
    return NextResponse.json({ error: "Inquiry storage is not available yet." }, { status: 500 });
  }
}
