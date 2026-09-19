import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const REFUSING_UNSAFE_TEST_DATABASE = "REFUSING_UNSAFE_TEST_DATABASE" as const;

/**
 * Known LIVE Neon hostname from the production bof-web / backofficefleet.com environment.
 * The harness must never accept these targets.
 */
export const BLOCKED_PRODUCTION_DATABASE_HOST_MARKERS = [
  "ep-young-sound-axayjjna",
  "ep-young-sound-axayjjna-pooler.c-4.us-east-2.aws.neon.tech",
  ".neon.tech",
  "neon.tech",
] as const;

const ALLOWED_LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);
const ALLOWED_LOCAL_DATABASE_NAME = "bof_dev";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const parsed: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function databaseNameFromUrl(url: URL): string {
  return decodeURIComponent(url.pathname || "")
    .replace(/^\//, "")
    .split("/")[0]
    .split("?")[0];
}

export function assertTestDatabaseTarget(connectionString: string | undefined | null): string {
  if (!connectionString || connectionString === "[SENSITIVE]" || !connectionString.includes("://")) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }

  const host = parsed.hostname.toLowerCase();
  const dbName = databaseNameFromUrl(parsed);

  if (BLOCKED_PRODUCTION_DATABASE_HOST_MARKERS.some((marker) => host.includes(marker.replace(/^\./, "") || marker))) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }
  if (host.includes("neon") || host.endsWith("aws.neon.tech")) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }
  if (!ALLOWED_LOOPBACK_HOSTS.has(host)) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }
  if (dbName !== ALLOWED_LOCAL_DATABASE_NAME) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }
  if (!/^postgres(ql)?:$/i.test(parsed.protocol)) {
    throw new Error(REFUSING_UNSAFE_TEST_DATABASE);
  }

  return connectionString;
}

export function resolveSecurePickupTestDatabaseUrl(cwd = process.cwd()): string {
  const fromExplicit = process.env.BOF_TEST_DATABASE_URL?.trim();
  if (fromExplicit) {
    return assertTestDatabaseTarget(fromExplicit);
  }

  const envTestLocal = parseEnvFile(resolve(cwd, ".env.test.local")).DATABASE_URL;
  if (envTestLocal) {
    return assertTestDatabaseTarget(envTestLocal);
  }

  const envTest = parseEnvFile(resolve(cwd, ".env.test")).DATABASE_URL;
  if (envTest) {
    return assertTestDatabaseTarget(envTest);
  }

  if (process.env.DATABASE_URL?.trim()) {
    return assertTestDatabaseTarget(process.env.DATABASE_URL.trim());
  }

  const envLocal = parseEnvFile(resolve(cwd, ".env.local")).DATABASE_URL;
  return assertTestDatabaseTarget(envLocal);
}
