import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

import { createEmailServices } from "./server";
import { EmailServiceError } from "./service";
import type { DraftStatus } from "./types";

/** Server-only helpers shared by /api/email/* route handlers. */

export function emailServices() {
  return createEmailServices(prisma);
}

export async function requireEmailUser(): Promise<{ user: SessionUserLike; response: null } | { user: null; response: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user: session.user as SessionUserLike, response: null };
}

export function emailErrorResponse(error: unknown) {
  if (error instanceof EmailServiceError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
  if (error && typeof error === "object" && (error as { code?: string }).code === "DATABASE_URL_REQUIRED") {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  console.error("[email] request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new EmailServiceError("Invalid JSON body", 422);
}

export function stringField(body: Record<string, unknown>, name: string, opts: { required?: boolean; max?: number } = {}): string | undefined {
  const v = body[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new EmailServiceError(`${name} is required`, 422);
    return undefined;
  }
  if (typeof v !== "string") throw new EmailServiceError(`${name} must be a string`, 422);
  if (opts.max && v.length > opts.max) throw new EmailServiceError(`${name} is too long`, 422);
  return v;
}

const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/;

export function addressListField(body: Record<string, unknown>, name: string, opts: { required?: boolean } = {}): string[] | undefined {
  const v = body[name];
  if (v === undefined) {
    if (opts.required) throw new EmailServiceError(`${name} is required`, 422);
    return undefined;
  }
  const list = typeof v === "string" ? v.split(/[,;\s]+/) : Array.isArray(v) ? v : null;
  if (!list) throw new EmailServiceError(`${name} must be a list of addresses`, 422);
  const cleaned = list.map((a) => String(a).trim()).filter(Boolean);
  if (cleaned.length > 20) throw new EmailServiceError(`${name} has too many addresses`, 422);
  for (const a of cleaned) if (!EMAIL.test(a)) throw new EmailServiceError(`Invalid address: ${a}`, 422);
  if (opts.required && cleaned.length === 0) throw new EmailServiceError(`${name} is required`, 422);
  return cleaned;
}

const DRAFT_STATUSES: ReadonlySet<string> = new Set(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SENDING", "SENT", "FAILED", "CANCELLED"]);

export function draftStatusesParam(value: string | null): DraftStatus[] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  for (const p of parts) if (!DRAFT_STATUSES.has(p)) throw new EmailServiceError(`Unknown status: ${p}`, 422);
  return parts as DraftStatus[];
}
