import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generatePickupAuthorizationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPickupAuthorizationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function pickupAuthorizationTokensMatch(presentedToken: string, storedHash: string): boolean {
  const presentedHash = hashPickupAuthorizationToken(presentedToken);
  const presented = Buffer.from(presentedHash, "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (presented.length !== stored.length || presented.length === 0) {
    return false;
  }
  return timingSafeEqual(presented, stored);
}
