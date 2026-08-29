import { NextResponse } from "next/server";
import { listTrainingModules } from "@/lib/services/regulatoryKnowledgeService";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return NextResponse.json(await listTrainingModules({ query: params.get("query") ?? undefined, category: params.get("category") ?? undefined, audience: params.get("audience") ?? undefined }));
  } catch {
    return NextResponse.json({ error: "Unable to load training modules" }, { status: 500 });
  }
}
