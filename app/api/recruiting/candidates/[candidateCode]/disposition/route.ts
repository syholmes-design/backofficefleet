import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readJsonObject, text } from "@/lib/recruiting/api-helpers";
import { requireRecruitingCandidateAccess } from "@/lib/recruiting-v2/candidate-access";
import { syncPipelineForPosition } from "@/lib/services/requisitionRecruitingBridge";

type RouteContext = { params: Promise<{ candidateCode: string }> };

/** Candidate disposition: REJECTED / WITHDRAWN with a reason, or ACTIVE to reopen. History is kept. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateCode } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateCode);
  if (access.response) return access.response;
  const candidate = await prisma.candidate.findUnique({ where: access.access.where });
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const body = await readJsonObject(request);
  const status = text(body?.status);
  const reason = text(body?.reason);
  if (!["REJECTED", "WITHDRAWN", "ACTIVE"].includes(status)) return NextResponse.json({ error: "status must be REJECTED, WITHDRAWN or ACTIVE" }, { status: 400 });
  if (status !== "ACTIVE" && !reason) return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  if (candidate.activationStatus === "ACTIVE") return NextResponse.json({ error: "An activated driver cannot be rejected here; use driver records." }, { status: 400 });

  const actor = access.access.user.email ?? access.access.user.id ?? "recruiter";
  const now = new Date();
  const audit = Array.isArray(candidate.auditTrail) ? [...candidate.auditTrail] : [];
  audit.push(
    status === "ACTIVE"
      ? `Candidate reopened by ${actor} at ${now.toISOString()}`
      : `Candidate ${status.toLowerCase()} by ${actor} at ${now.toISOString()}: ${reason}${text(body?.notes) ? ` (${text(body?.notes)})` : ""}`,
  );
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      dispositionStatus: status as "REJECTED" | "WITHDRAWN" | "ACTIVE",
      dispositionReason: status === "ACTIVE" ? null : reason,
      dispositionNotes: status === "ACTIVE" ? null : text(body?.notes) || null,
      dispositionAt: now,
      dispositionByUserId: access.access.user.id ?? null,
      auditTrail: audit as Prisma.InputJsonValue,
    },
  });
  await syncPipelineForPosition(candidate.positionId);
  return NextResponse.json({ ok: true });
}
