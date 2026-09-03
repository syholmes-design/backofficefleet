import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  RECRUITING_V2_DOCUMENT_TYPES,
  evaluateRecruitingV2DocumentGates,
  type RecruitingV2DocumentGateEvaluation,
} from "@/lib/recruiting-v2/document-gate-engine";
import { serializeRecruitingV2DocumentRecord } from "@/lib/recruiting-v2/serialize-document-record";

type RouteContext = { params: Promise<{ candidateId: string }> };

const DOCUMENT_STATUSES = ["RECEIVED", "PENDING_REVIEW", "VERIFIED", "REJECTED"] as const satisfies RecruitingV2DocumentStatus[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDocumentType(value: string): value is RecruitingV2DocumentType {
  return RECRUITING_V2_DOCUMENT_TYPES.includes(value as RecruitingV2DocumentType);
}

function isDocumentStatus(value: string): value is RecruitingV2DocumentStatus {
  return DOCUMENT_STATUSES.includes(value as RecruitingV2DocumentStatus);
}

function parseExpirationDate(value: unknown): Date | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  const raw = normalizeString(value);
  if (!raw) return "INVALID";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "INVALID" : parsed;
}

async function findCandidate(candidateId: string) {
  return prisma.candidate.findUnique({
    where: { candidateCode: candidateId },
    include: { documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] } },
  });
}

async function syncComplianceGates(candidateId: string, evaluations: RecruitingV2DocumentGateEvaluation[]) {
  await Promise.all(evaluations.map((gate) =>
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
  ));
}

function candidatePayload(candidate: Awaited<ReturnType<typeof findCandidate>>) {
  if (!candidate) return null;
  return {
    id: candidate.id,
    candidateId: candidate.candidateCode,
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    homeLocation: candidate.homeLocation,
    activationStage: candidate.activationStage,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const candidate = await findCandidate(candidateId);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const documentRecords = candidate.documentRecords.map((record) =>
    serializeRecruitingV2DocumentRecord(record, candidate.candidateCode),
  );
  const gates = evaluateRecruitingV2DocumentGates(documentRecords);

  return NextResponse.json({
    candidate: candidatePayload(candidate),
    documentRecords,
    gates,
    summary: {
      totalDocumentTypes: gates.length,
      satisfied: gates.filter((gate) => gate.gateState === "SATISFIED").length,
      open: gates.filter((gate) => gate.gateState === "OPEN").length,
      blocked: gates.filter((gate) => gate.gateState === "BLOCKED").length,
      currentDecision: gates.every((gate) => gate.gateState === "SATISFIED") ? "Document gates satisfied" : "Document gates remain open",
      nextRequiredAction: gates.find((gate) => gate.gateState === "BLOCKED")?.requiredAction ?? gates.find((gate) => gate.gateState === "OPEN")?.requiredAction ?? "Advance to qualification decision review.",
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;
  const candidate = await findCandidate(candidateId);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
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

  const documentTypeRaw = normalizeString(body.documentType);
  const statusRaw = normalizeString(body.status);
  const expirationDate = parseExpirationDate(body.expirationDate);

  if (!documentTypeRaw) return NextResponse.json({ error: "documentType is required" }, { status: 400 });
  if (!isDocumentType(documentTypeRaw)) return NextResponse.json({ error: "documentType is invalid" }, { status: 400 });
  if (!statusRaw) return NextResponse.json({ error: "status is required" }, { status: 400 });
  if (!isDocumentStatus(statusRaw)) return NextResponse.json({ error: "status is invalid" }, { status: 400 });
  if (expirationDate === "INVALID") return NextResponse.json({ error: "expirationDate must be a valid date" }, { status: 400 });
  if (body.metadata !== undefined && body.metadata !== null && !isRecord(body.metadata)) {
    return NextResponse.json({ error: "metadata must be an object when provided" }, { status: 400 });
  }

  const document = await prisma.documentRecord.create({
    data: {
      documentCode: `DOCV2-${candidate.candidateCode}-${documentTypeRaw}-${Date.now()}`,
      candidateId: candidate.id,
      documentType: documentTypeRaw,
      status: statusRaw,
      expirationDate,
      uploadedBy: normalizeString(body.uploadedBy) || null,
      verifiedBy: normalizeString(body.verifiedBy) || null,
      verificationNotes: normalizeString(body.verificationNotes) || null,
      metadata: (body.metadata ?? null) as Prisma.InputJsonValue,
    },
  });

  const records = [
    serializeRecruitingV2DocumentRecord(document, candidate.candidateCode),
    ...candidate.documentRecords.map((record) => serializeRecruitingV2DocumentRecord(record, candidate.candidateCode)),
  ];
  const gates = evaluateRecruitingV2DocumentGates(records);
  await syncComplianceGates(candidate.id, gates);
  const gate = gates.find((item) => item.documentType === document.documentType) ?? null;

  return NextResponse.json(
    {
      operation: "Create Document Record",
      candidate: candidatePayload(candidate),
      documentRecord: serializeRecruitingV2DocumentRecord(document, candidate.candidateCode),
      gate,
    },
    { status: 201 },
  );
}