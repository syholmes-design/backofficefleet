/**
 * Creates a fleet-scoped telematics ingest credential. Prints the Bearer token once (credentialId.secret).
 * Requires DATABASE_URL. Never log the generated secret after this script exits.
 */
import { randomBytes } from "node:crypto";

import { hashIngestSecret } from "@/lib/fleet-visibility/ingest-credentials";
import { prisma } from "@/lib/prisma";
import type { TelematicsProvider } from "@prisma/client";

async function main() {
  const fleetId = process.argv[2]?.trim();
  const provider = (process.argv[3]?.trim() ?? "GENERIC_WEBHOOK") as TelematicsProvider;
  const label = process.argv[4]?.trim() ?? "primary";
  if (!fleetId) {
    console.error("Usage: npx tsx scripts/provision-telematics-ingest-credential.ts <fleetId> [provider] [label]");
    process.exit(1);
  }

  const fleet = await prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true, name: true } });
  if (!fleet) {
    console.error("Fleet not found");
    process.exit(1);
  }

  const secret = randomBytes(32).toString("base64url");
  const secretHash = await hashIngestSecret(secret);
  const credential = await prisma.telematicsIngestCredential.create({
    data: { fleetId, provider, label, secretHash },
    select: { id: true, fleetId: true, provider: true, label: true },
  });

  console.log(
    JSON.stringify({
      credentialId: credential.id,
      fleetId: credential.fleetId,
      provider: credential.provider,
      label: credential.label,
      authorizationHeader: `Bearer ${credential.id}.${secret}`,
      note: "Store the authorization header securely. BOF cannot recover the secret.",
    }),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
