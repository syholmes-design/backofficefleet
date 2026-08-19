import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { resolveAuthenticatedDriverVaultDocumentDownload } from "@/lib/services/driverDocumentVersioningService";

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const result = await resolveAuthenticatedDriverVaultDocumentDownload(session.user, documentId);
    return new NextResponse(Buffer.from(result.file), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.downloadName.replace(/"/g, '\\"')}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
