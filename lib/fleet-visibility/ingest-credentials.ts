import { createHmac, timingSafeEqual } from "node:crypto";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  hash: (value: string, rounds: number) => Promise<string>;
  compare: (value: string, hash: string) => Promise<boolean>;
};

const BCRYPT_ROUNDS = 12;

export type ParsedIngestAuthorization = {
  credentialId: string;
  secret: string;
};

/** Bearer token: `<credentialId>.<secret>` — never log the secret. */
export function parseIngestAuthorizationHeader(header: string | null): ParsedIngestAuthorization | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  const dot = token.indexOf(".");
  if (dot <= 0 || dot >= token.length - 1) return null;
  const credentialId = token.slice(0, dot).trim();
  const secret = token.slice(dot + 1);
  if (!credentialId || !secret) return null;
  return { credentialId, secret };
}

export async function hashIngestSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, BCRYPT_ROUNDS);
}

export async function verifyIngestSecret(secret: string, secretHash: string): Promise<boolean> {
  if (!secret || !secretHash) return false;
  return bcrypt.compare(secret, secretHash);
}

export async function hashWebhookSigningSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, BCRYPT_ROUNDS);
}

export async function verifyWebhookSigningSecret(secret: string, secretHash: string | null | undefined): Promise<boolean> {
  if (!secretHash) return true;
  return verifyIngestSecret(secret, secretHash);
}

/** Optional HMAC: header `x-bof-telematics-signature` = hex(hmac-sha256(rawBody, signingSecret)). */
export function verifySignedWebhookBody(rawBody: string, signatureHeader: string | null, signingSecret: string): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", signingSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.trim().toLowerCase();
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
  } catch {
    return false;
  }
}
