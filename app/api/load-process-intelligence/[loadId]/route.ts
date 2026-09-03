import { NextResponse } from "next/server";
import { getLoadProcessIntelligence } from "@/lib/load-process-intelligence";

export async function GET(_request: Request, context: { params: Promise<{ loadId: string }> }) {
  const { loadId } = await context.params;
  const processIntelligence = await getLoadProcessIntelligence(loadId);
  if (!processIntelligence) return NextResponse.json({ error: "Load not found" }, { status: 404 });
  return NextResponse.json(processIntelligence);
}