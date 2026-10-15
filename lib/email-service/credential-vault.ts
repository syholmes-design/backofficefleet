import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for mailbox credentials.
 *
 * - Each secret is encrypted with a fresh random 256-bit data key (AES-256-GCM).
 * - The data key is wrapped by a key-encryption key (KEK) identified by version.
 * - KEKs live only in server environment variables (e.g. EMAIL_KEK_V1), never in the
 *   database, the repo, the client bundle, or any AI agent context.
 * - Rotation: add a new KEK version, call `rewrap`, retire the old version.
 *
 * Decrypted secrets are returned only to the transport layer inside the server
 * process; no API route or agent tool returns them.
 */

export interface SealedSecret {
  keyVersion: string;
  wrappedKey: string; // base64: iv(12) | tag(16) | ciphertext(32)
  ciphertext: string; // base64: iv(12) | tag(16) | ciphertext
  /** Associated data binds the secret to its mailbox. */
  aad: string;
}

export type KekProvider = (version: string) => Buffer | undefined;

const IV_BYTES = 12;
const TAG_BYTES = 16;

function seal(key: Buffer, plaintext: Buffer, aad: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

function open(key: Buffer, sealed: string, aad: string): Buffer {
  const raw = Buffer.from(sealed, "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = raw.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

function requireKek(kek: KekProvider, version: string): Buffer {
  const key = kek(version);
  if (!key || key.length !== 32) {
    throw new Error(`Credential KEK version "${version}" is unavailable or not 32 bytes`);
  }
  return key;
}

/** Binds a sealed secret to one mailbox: copying it to another row fails to decrypt. */
export function credentialAad(mailboxId: string, address: string): string {
  return `bof-email-credential:${mailboxId}:${address.trim().toLowerCase()}`;
}

export function sealSecret(
  plaintext: string,
  aad: string,
  kek: KekProvider,
  keyVersion: string,
): SealedSecret {
  const kekKey = requireKek(kek, keyVersion);
  const dataKey = randomBytes(32);
  try {
    return {
      keyVersion,
      wrappedKey: seal(kekKey, dataKey, `${aad}:dek`),
      ciphertext: seal(dataKey, Buffer.from(plaintext, "utf8"), aad),
      aad,
    };
  } finally {
    dataKey.fill(0);
  }
}

export function openSecret(sealed: SealedSecret, kek: KekProvider): string {
  const kekKey = requireKek(kek, sealed.keyVersion);
  const dataKey = open(kekKey, sealed.wrappedKey, `${sealed.aad}:dek`);
  try {
    return open(dataKey, sealed.ciphertext, sealed.aad).toString("utf8");
  } finally {
    dataKey.fill(0);
  }
}

/** Re-wrap the data key under a new KEK version without exposing the secret. */
export function rewrap(sealed: SealedSecret, kek: KekProvider, newVersion: string): SealedSecret {
  const oldKek = requireKek(kek, sealed.keyVersion);
  const newKek = requireKek(kek, newVersion);
  const dataKey = open(oldKek, sealed.wrappedKey, `${sealed.aad}:dek`);
  try {
    return { ...sealed, keyVersion: newVersion, wrappedKey: seal(newKek, dataKey, `${sealed.aad}:dek`) };
  } finally {
    dataKey.fill(0);
  }
}

/** Reads KEKs from env vars named EMAIL_KEK_<VERSION> (base64, 32 bytes). Server-only. */
export function envKekProvider(env: Record<string, string | undefined> = process.env): KekProvider {
  return (version) => {
    const value = env[`EMAIL_KEK_${version.toUpperCase()}`];
    return value ? Buffer.from(value, "base64") : undefined;
  };
}
