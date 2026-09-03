import { NextResponse } from "next/server";
import { getLoadProcessDiscovery, type BofLoadProcessDeviationType } from "@/lib/load-process-intelligence";

const ALLOWED_FILTERS = new Set([
  "dateFrom",
  "dateTo",
  "customer",
  "driver",
  "equipment",
  "lane",
  "loadStatus",
  "variant",
  "conformance",
  "deviationType",
]);

const DEVIATION_TYPES = new Set([
  "ACTIVITY_REPEAT",
  "ACTIVITY_SKIP",
  "UNEXPECTED_ACTIVITY",
  "INVALID_START",
  "INVALID_END",
  "OUT_OF_ORDER",
  "UNEXPECTED_TRANSITION",
  "LOOP_BACK",
  "INCOMPLETE_SEQUENCE",
]);

function parseDate(value: string | null, field: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { error: `${field} must be a valid date` };
  return parsed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const unsupported = [...url.searchParams.keys()].filter((key) => !ALLOWED_FILTERS.has(key));
  if (unsupported.length > 0) {
    return NextResponse.json({ error: `Unsupported filter: ${unsupported.join(", ")}` }, { status: 422 });
  }

  if (url.searchParams.has("carrier")) {
    return NextResponse.json({ error: "carrier filter is not supported by the persisted Load schema yet" }, { status: 422 });
  }

  const dateFrom = parseDate(url.searchParams.get("dateFrom"), "dateFrom");
  if (dateFrom && "error" in dateFrom) return NextResponse.json({ error: dateFrom.error }, { status: 422 });
  const dateTo = parseDate(url.searchParams.get("dateTo"), "dateTo");
  if (dateTo && "error" in dateTo) return NextResponse.json({ error: dateTo.error }, { status: 422 });

  const deviationType = url.searchParams.get("deviationType") ?? undefined;
  if (deviationType && !DEVIATION_TYPES.has(deviationType)) {
    return NextResponse.json({ error: "deviationType is invalid" }, { status: 422 });
  }

  const result = await getLoadProcessDiscovery({
    dateFrom: dateFrom instanceof Date ? dateFrom : undefined,
    dateTo: dateTo instanceof Date ? dateTo : undefined,
    customer: url.searchParams.get("customer") ?? undefined,
    driver: url.searchParams.get("driver") ?? undefined,
    equipment: url.searchParams.get("equipment") ?? undefined,
    lane: url.searchParams.get("lane") ?? undefined,
    loadStatus: url.searchParams.get("loadStatus") ?? undefined,
    variant: url.searchParams.get("variant") ?? undefined,
    conformance: url.searchParams.get("conformance") ?? undefined,
    deviationType: deviationType as BofLoadProcessDeviationType | undefined,
  });

  return NextResponse.json(result);
}