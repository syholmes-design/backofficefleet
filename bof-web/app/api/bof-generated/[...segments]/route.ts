import { NextResponse } from "next/server";
import { getBofData } from "@/lib/load-bof-data";
import {
  buildLoadGeneratedSvg,
  buildDriverGeneratedSvg,
  buildClaimGeneratedSvg,
  buildExceptionGeneratedSvg,
  buildSettlementGeneratedSvg,
} from "@/lib/bof-generated-svgs";

type Ctx = { params: Promise<{ segments: string[] }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { segments } = await ctx.params;
  if (!segments || segments.length < 3) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [scope, id, ...rest] = segments;
  const file = rest.join("/");
  if (!file.endsWith(".svg")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const data = getBofData();
  let body: string | null = null;

  switch (scope) {
    case "loads":
      body = buildLoadGeneratedSvg(data, id, file);
      break;
    case "drivers":
      body = buildDriverGeneratedSvg(data, id, file);
      break;
    case "claims":
      body = buildClaimGeneratedSvg(data, id, file);
      break;
    case "exceptions":
      body = buildExceptionGeneratedSvg(data, id, file);
      break;
    case "settlements":
      body = buildSettlementGeneratedSvg(data, id, file);
      break;
    default:
      return new NextResponse("Not found", { status: 404 });
  }

  if (!body) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
