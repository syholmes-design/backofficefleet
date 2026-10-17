import { FleetVisibilityError } from "@/lib/fleet-visibility/errors";
import {
  parseIngestAuthorizationHeader,
  verifyIngestSecret,
  verifySignedWebhookBody,
} from "@/lib/fleet-visibility/ingest-credentials";
import { prisma } from "@/lib/prisma";
import type { TelematicsProvider } from "@prisma/client";

export type VerifiedTelematicsIngestCredential = {
  credentialId: string;
  fleetId: string;
  provider: TelematicsProvider;
};

/**
 * Validates fleet + integration credential. Route fleetId must match credential fleetId (never trust query alone).
 */
export async function verifyTelematicsIngestRequest(input: {
  authorizationHeader: string | null;
  routeFleetId: string;
  declaredProvider: TelematicsProvider;
  rawBody: string;
  signatureHeader: string | null;
}): Promise<VerifiedTelematicsIngestCredential> {
  const parsed = parseIngestAuthorizationHeader(input.authorizationHeader);
  if (!parsed) {
    throw new FleetVisibilityError("INTEGRATION_CREDENTIAL_REQUIRED", 401);
  }

  const credential = await prisma.telematicsIngestCredential.findFirst({
    where: { id: parsed.credentialId, revokedAt: null },
    select: {
      id: true,
      fleetId: true,
      provider: true,
      secretHash: true,
      webhookSigningSecretHash: true,
    },
  });

  if (!credential) {
    throw new FleetVisibilityError("INTEGRATION_CREDENTIAL_INVALID", 401);
  }

  const secretOk = await verifyIngestSecret(parsed.secret, credential.secretHash);
  if (!secretOk) {
    throw new FleetVisibilityError("INTEGRATION_CREDENTIAL_INVALID", 401);
  }

  if (credential.fleetId !== input.routeFleetId) {
    throw new FleetVisibilityError("INTEGRATION_FLEET_MISMATCH", 403);
  }

  if (credential.provider !== input.declaredProvider) {
    throw new FleetVisibilityError("PROVIDER_MISMATCH", 403);
  }

  if (credential.webhookSigningSecretHash) {
    if (!input.signatureHeader) {
      throw new FleetVisibilityError("WEBHOOK_SIGNATURE_REQUIRED", 401);
    }
    const signed = verifySignedWebhookBody(input.rawBody, input.signatureHeader, parsed.secret);
    if (!signed) {
      throw new FleetVisibilityError("WEBHOOK_SIGNATURE_INVALID", 401);
    }
  }

  await prisma.telematicsIngestCredential.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    credentialId: credential.id,
    fleetId: credential.fleetId,
    provider: credential.provider,
  };
}
