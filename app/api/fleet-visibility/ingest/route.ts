import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import {
  ingestFromProviderPayload,
  ingestLocationObservation,
} from "@/lib/fleet-visibility/fleet-visibility-service";
import { fleetVisibilityErrorResponse } from "@/lib/fleet-visibility/fleet-api-response";
import { verifyTelematicsIngestRequest } from "@/lib/fleet-visibility/ingest-auth";
import type { ProviderPayload } from "@/lib/fleet-visibility/providers/normalize";
import type { TelematicsProvider } from "@prisma/client";

export async function POST(request: Request) {
  const routeFleetId = new URL(request.url).searchParams.get("fleetId")?.trim() ?? "";
  if (!routeFleetId) return NextResponse.json({ error: "fleetId is required", code: "VALIDATION" }, { status: 422 });

  const rawBody = await request.text();
  let body: ProviderPayload;
  try {
    body = JSON.parse(rawBody) as ProviderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "VALIDATION" }, { status: 400 });
  }

  const declaredProvider = (new URL(request.url).searchParams.get("provider") ??
    body.provider ??
    "GENERIC_WEBHOOK") as TelematicsProvider;

  try {
    const authorizationHeader = request.headers.get("authorization");
    const integrationAttempt = authorizationHeader?.startsWith("Bearer ");

    if (integrationAttempt) {
      const verified = await verifyTelematicsIngestRequest({
        authorizationHeader,
        routeFleetId,
        declaredProvider,
        rawBody,
        signatureHeader: request.headers.get("x-bof-telematics-signature"),
      });
      const result = await ingestFromProviderPayload(null, verified.fleetId, verified.provider, body, {
        channel: "integration",
        integrationFleetId: verified.fleetId,
      });
      return NextResponse.json({
        ok: true,
        duplicate: result.duplicate,
        observationId: result.observation.id,
        equipmentId: result.observation.equipmentId,
        loadId: result.observation.loadId,
        observationKind: result.observation.observationKind,
      });
    }

    const session = await auth();
    const user = session?.user as SessionUserLike | undefined;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const result =
      body.latitude != null && body.providerDeviceId != null
        ? await ingestLocationObservation(
            user,
            {
              fleetId: routeFleetId,
              provider: declaredProvider,
              providerDeviceId: String(body.providerDeviceId),
              latitude: Number(body.latitude),
              longitude: Number(body.longitude ?? body.lng),
              observedAt: new Date(String(body.observedAt ?? new Date().toISOString())),
              idempotencyKey: String(body.idempotencyKey ?? `manual-${Date.now()}`),
              observationKind: body.observationKind === "SYNTHETIC_TEST" ? "SYNTHETIC_TEST" : "LIVE",
              equipmentId: typeof body.equipmentId === "string" ? body.equipmentId : null,
              loadId: typeof body.loadId === "string" ? body.loadId : null,
              driverId: typeof body.driverId === "string" ? body.driverId : null,
            },
            { channel: "operator_session" },
          )
        : await ingestFromProviderPayload(user, routeFleetId, declaredProvider, body, {
            channel: "operator_session",
          });

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      observationId: result.observation.id,
      equipmentId: result.observation.equipmentId,
      loadId: result.observation.loadId,
      observationKind: result.observation.observationKind,
    });
  } catch (error) {
    const mapped = fleetVisibilityErrorResponse(error);
    if (mapped) return mapped;
    if (error instanceof Error && /Invalid/.test(error.message)) {
      return NextResponse.json({ error: error.message, code: "VALIDATION" }, { status: 422 });
    }
    throw error;
  }
}
