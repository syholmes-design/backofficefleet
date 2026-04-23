import { NextRequest, NextResponse } from "next/server";
import { parseGooglePlaceDetailsResult } from "@/lib/google-places-address";

/**
 * Server-side Google Place Details proxy for resolving autocomplete selections.
 * @see https://developers.google.com/maps/documentation/places/web-service/details
 */
export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ ok: false, error: "Places API not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  if (!placeId) {
    return NextResponse.json({ ok: false, error: "placeId is required" }, { status: 400 });
  }

  const sessionToken =
    typeof body.sessionToken === "string" && body.sessionToken.trim()
      ? body.sessionToken.trim().slice(0, 120)
      : "";

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "address_component,formatted_address,name",
    key,
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `Place details failed (${res.status})` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    status: string;
    result?: {
      name?: string;
      formatted_address?: string;
      address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    };
    error_message?: string;
  };

  if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    return NextResponse.json({ ok: false, error: "Places API rejected request" }, { status: 503 });
  }

  if (data.status !== "OK" || !data.result) {
    return NextResponse.json(
      {
        ok: false,
        error: data.error_message || `Place details status: ${data.status}`,
      },
      { status: 502 }
    );
  }

  const parsed = parseGooglePlaceDetailsResult(data.result);
  return NextResponse.json({ ok: true, ...parsed });
}
