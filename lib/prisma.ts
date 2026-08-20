import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
}

const connectionString = process.env.DATABASE_URL;
// If DATABASE_URL points to SQLite file (demo mode), use a dummy PostgreSQL URL for adapter
const adapterConnectionString = connectionString?.startsWith("file:")
  ? "postgres://localhost/bof-demo-build"
  : (connectionString || "postgres://localhost/bof-demo");

const adapter = new PrismaPg({ connectionString: adapterConnectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
