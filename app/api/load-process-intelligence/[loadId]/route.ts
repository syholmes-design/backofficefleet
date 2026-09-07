import { NextResponse } from "next/server";
import { getLoadProcessIntelligence } from "@/lib/load-process-intelligence";
import { isDatabaseUrlNotConfiguredError, prismaUnavailablePayload } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ loadId: string }> }) {
  const { loadId } = await context.params;
  try {
    const processIntelligence = await getLoadProcessIntelligence(loadId);
    if (!processIntelligence) return NextResponse.json({ error: "Load not found" }, { status: 404 });
    return NextResponse.json(processIntelligence);
  } catch (error) {
    if (isDatabaseUrlNotConfiguredError(error)) {
      return NextResponse.json(prismaUnavailablePayload(), { status: 503 });
    }
    throw error;
  }
}