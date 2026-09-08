import { NextResponse } from "next/server";
import { getLoadProcessIntelligence } from "@/lib/load-process-intelligence";
import { isDatabaseUrlNotConfiguredError, prismaUnavailablePayload } from "@/lib/prisma";
import { operatorUnauthorizedResponse } from "@/lib/require-operator-session";

export async function GET(_request: Request, context: { params: Promise<{ loadId: string }> }) {
  const unauthorized = await operatorUnauthorizedResponse();
  if (unauthorized) return unauthorized;
  const { loadId } = await context.params;
  try {
    const processIntelligence = await getLoadProcessIntelligence(loadId);
    if (!processIntelligence) return NextResponse.json({ error: "Load not found" }, { status: 404 });
    return NextResponse.json(processIntelligence);
  } catch (error) {
    if (isDatabaseUrlNotConfiguredError(error)) {
      return NextResponse.json(prismaUnavailablePayload(), { status: 503 });
    }
    const message = error instanceof Error ? error.message : "";
    if (/SASL|password authentication|ECONNREFUSED|Can't reach database|PrismaClient/i.test(message)) {
      return NextResponse.json(
        { error: "Process intelligence store is unavailable", code: "PRISMA_UNAVAILABLE" },
        { status: 503 },
      );
    }
    throw error;
  }
}