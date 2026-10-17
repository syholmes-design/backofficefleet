import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reads DATABASE_URL from process.env or a local gitignored env file.
 * Never logs the connection string.
 */
export function resolveDatabaseUrl(options = {}) {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv && !options.preferEnvFile) {
    return sanitizeUrl(fromEnv);
  }

  const envFile = options.envFile?.trim();
  if (envFile && existsSync(resolve(envFile))) {
    const fromFile = readDatabaseUrlFromFile(envFile);
    if (fromFile) return sanitizeUrl(fromFile);
  }

  if (fromEnv) return sanitizeUrl(fromEnv);
  return null;
}

function sanitizeUrl(raw) {
  if (!raw || raw === "[SENSITIVE]" || !raw.includes("://")) return null;
  return raw;
}

export function readDatabaseUrlFromFile(envFilePath) {
  const lines = readFileSync(resolve(envFilePath), "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq).trim() !== "DATABASE_URL") continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return null;
}

export function databaseConnectionMetadata(connectionString) {
  const parsed = new URL(connectionString);
  return {
    host: parsed.hostname,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "").split("?")[0]),
    protocol: parsed.protocol.replace(":", ""),
  };
}
