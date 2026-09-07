import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
}

export const DATABASE_URL_REQUIRED_CODE = "DATABASE_URL_REQUIRED" as const;

export class DatabaseUrlNotConfiguredError extends Error {
  readonly code = DATABASE_URL_REQUIRED_CODE;
  readonly statusCode = 503;

  constructor() {
    super(
      "DATABASE_URL is not configured. Durable Prisma paths fail closed until an explicit PostgreSQL DATABASE_URL is provided.",
    );
    this.name = "DatabaseUrlNotConfiguredError";
  }
}

export function getConfiguredDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL?.trim() ?? "";
  if (!raw) return null;
  if (raw.startsWith("file:")) return null;
  return raw;
}

export function isDatabaseUrlConfigured(): boolean {
  return getConfiguredDatabaseUrl() !== null;
}

export function isDatabaseUrlNotConfiguredError(error: unknown): error is DatabaseUrlNotConfiguredError {
  if (error instanceof DatabaseUrlNotConfiguredError) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === DATABASE_URL_REQUIRED_CODE
  );
}

export function prismaUnavailablePayload() {
  return {
    error: "DATABASE_URL is not configured",
    code: DATABASE_URL_REQUIRED_CODE,
  };
}

function createFailClosedPrisma(): PrismaClient {
  const fail = (): never => {
    throw new DatabaseUrlNotConfiguredError();
  };
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return new Proxy(fail, handler);
    },
    apply() {
      return fail();
    },
  };
  return new Proxy({} as PrismaClient, handler) as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConfiguredDatabaseUrl();
  if (!connectionString) {
    return createFailClosedPrisma();
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
