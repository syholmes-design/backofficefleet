import { NextRequest, NextResponse } from "next/server";

type AutocompletePrediction = {
  place_id: string;
  description: string;
};

/**
 * Server-side Google Places Autocomplete proxy (keeps API key off the client).
 * @see https://developers.google.com/maps/documentation/places/web-service/autocomplete
 */
export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({
      ok: true,
      externalAvailable: false,
      predictions: [] as { placeId: string; description: string }[],
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (input.length < 3) {
    return NextResponse.json({
      ok: true,
      externalAvailable: true,
      predictions: [] as { placeId: string; description: string }[],
    });
  }

  const sessionToken =
    typeof body.sessionToken === "string" && body.sessionToken.trim()
      ? body.sessionToken.trim().slice(0, 120)
      : "";

  const params = new URLSearchParams({
    input,
    key,
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `Places autocomplete failed (${res.status})` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    status: string;
    predictions?: AutocompletePrediction[];
    error_message?: string;
  };

  if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    return NextResponse.json({
      ok: true,
      externalAvailable: false,
      predictions: [] as { placeId: string; description: string }[],
    });
  }

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      {
        ok: false,
        error: data.error_message || `Places autocomplete status: ${data.status}`,
      },
      { status: 502 }
    );
  }

  const predictions = (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
  }));

  return NextResponse.json({ ok: true, externalAvailable: true, predictions });
}
