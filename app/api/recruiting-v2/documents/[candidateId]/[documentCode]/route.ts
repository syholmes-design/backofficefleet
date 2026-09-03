import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGate } from "@/lib/recruiting-v2/document-gate-engine";

type RouteContext = { params: Promise<{ candidateId: string; documentCode: string }> };

function serializeDocumentRecord(record: {
  id: string;
  documentCode: string;
  candidateId: string;
  documentType: RecruitingV2DocumentType;
  status: RecruitingV2DocumentStatus;
  expirationDate: Date | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    documentCode: record.documentCode,
    candidateId: record.candidateId,
    documentType: record.documentType,
    status: record.status,
    expirationDate: record.expirationDate?.toISOString() ?? null,
    uploadedBy: record.uploadedBy,
    verifiedBy: record.verifiedBy,
    verificationNotes: record.verificationNotes,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
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

  const serialized = serializeDocumentRecord(documentRecord);
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