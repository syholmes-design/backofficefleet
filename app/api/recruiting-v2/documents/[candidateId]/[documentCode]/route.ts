import { NextRequest, NextResponse } from "next/server";
import type { RecruitingV2DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGate, evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { serializeRecruitingV2DocumentRecord } from "@/lib/recruiting-v2/serialize-document-record";

type RouteContext = { params: Promise<{ candidateId: string; documentCode: string }> };

const REVIEW_ACTIONS = ["REVIEW", "VERIFY", "REJECT"] as const;
type ReviewAction = (typeof REVIEW_ACTIONS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isReviewAction(value: string): value is ReviewAction {
  return REVIEW_ACTIONS.includes(value as ReviewAction);
}

async function syncGates(
  candidateId: string,
  records: Array<Parameters<typeof evaluateRecruitingV2DocumentGates>[0][number]>,
) {
  const gates = evaluateRecruitingV2DocumentGates(records);
  await Promise.all(
    gates.map((gate) =>
      prisma.complianceGate.upsert({
        where: { candidateId_documentType: { candidateId, documentType: gate.documentType } },
        create: {
          candidateId,
          documentType: gate.documentType,
          state: gate.gateState,
          reason: gate.reason,
          requiredAction: gate.requiredAction,
        },
        update: {
          state: gate.gateState,
          reason: gate.reason,
          requiredAction: gate.requiredAction,
        },
      }),
    ),
  );
  return gates;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId, documentCode } = await context.params;
  const candidate = await prisma.candidate.findUnique({ where: { candidateCode: candidateId } });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const documentRecord = await prisma.documentRecord.findFirst({
    where: { candidateId: candidate.id, documentCode },
  });

  if (!documentRecord) {
    return NextResponse.json({ error: "Document record not found" }, { status: 404 });
  }

  const serialized = serializeRecruitingV2DocumentRecord(documentRecord, candidate.candidateCode);
  const gate = evaluateRecruitingV2DocumentGate({ documentType: documentRecord.documentType, latestDocument: serialized });

  await prisma.complianceGate.upsert({
    where: { candidateId_documentType: { candidateId: candidate.id, documentType: gate.documentType } },
    create: {
      candidateId: candidate.id,
      documentType: gate.documentType,
      state: gate.gateState,
      reason: gate.reason,
      requiredAction: gate.requiredAction,
    },
    update: {
      state: gate.gateState,
      reason: gate.reason,
      requiredAction: gate.requiredAction,
    },
  });

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      candidateId: candidate.candidateCode,
      fullName: candidate.fullName,
    },
    documentRecord: serialized,
    gate,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { candidateId, documentCode } = await context.params;
  const candidate = await prisma.candidate.findUnique({
    where: { candidateCode: candidateId },
    include: { documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] } },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const current = candidate.documentRecords.find((row) => row.documentCode === documentCode);
  if (!current) {
    return NextResponse.json({ error: "Document record not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const actionRaw = normalizeString(body.action);
  if (!actionRaw) return NextResponse.json({ error: "action is required" }, { status: 400 });
  if (!isReviewAction(actionRaw)) return NextResponse.json({ error: "action is invalid" }, { status: 400 });

  const verifiedBy = normalizeString(body.verifiedBy);
  const verificationNotes = normalizeString(body.verificationNotes);
  if (actionRaw === "VERIFY" && !verifiedBy) {
    return NextResponse.json({ error: "verifiedBy is required to verify a document" }, { status: 400 });
  }

  const status: RecruitingV2DocumentStatus =
    actionRaw === "VERIFY" ? "VERIFIED" : actionRaw === "REJECT" ? "REJECTED" : "PENDING_REVIEW";

  const updated = await prisma.documentRecord.update({
    where: { id: current.id },
    data: {
      status,
      verifiedBy: actionRaw === "REVIEW" ? current.verifiedBy : verifiedBy || current.verifiedBy,
      verificationNotes: verificationNotes || current.verificationNotes,
    },
  });

  const records = candidate.documentRecords.map((row) =>
    serializeRecruitingV2DocumentRecord(row.id === updated.id ? updated : row, candidate.candidateCode),
  );
  const gates = await syncGates(candidate.id, records);

  return NextResponse.json({
    operation: actionRaw,
    candidate: {
      id: candidate.id,
      candidateId: candidate.candidateCode,
      fullName: candidate.fullName,
    },
    documentRecord: serializeRecruitingV2DocumentRecord(updated, candidate.candidateCode),
    gate: gates.find((item) => item.documentType === updated.documentType) ?? null,
  });
}
