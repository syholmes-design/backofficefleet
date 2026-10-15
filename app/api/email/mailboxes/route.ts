import { NextResponse } from "next/server";

import { emailErrorResponse, emailServices, requireEmailUser } from "@/lib/email-service/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mailboxes the signed-in user can access, with their capabilities. */
export async function GET() {
  const auth = await requireEmailUser();
  if (!auth.user) return auth.response;
  try {
    const rows = await emailServices().service.listMailboxes(auth.user);
    return NextResponse.json({
      mailboxes: rows.map(({ mailbox, capabilities }) => ({
        id: mailbox.id,
        address: mailbox.address,
        displayName: mailbox.displayName,
        scope: mailbox.scope,
        status: mailbox.status,
        capabilities,
      })),
    });
  } catch (error) {
    return emailErrorResponse(error);
  }
}
