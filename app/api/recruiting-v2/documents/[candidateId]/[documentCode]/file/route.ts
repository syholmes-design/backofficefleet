import { requireRecruitingCandidateAccess } from "@/lib/recruiting-v2/candidate-access";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  RECRUITING_V2_MAX_UPLOAD_BYTES,
  buildUploadedArtifact,
  isAllowedRecruitingV2Upload,
  mergeMetadataArtifact,
  parseStoredArtifact,
  readBundledSyntheticFile,
} from "@/lib/recruiting-v2/document-artifact";
import { serializeRecruitingV2DocumentRecord } from "@/lib/recruiting-v2/serialize-document-record";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";

type RouteContext = { params: Promise<{ candidateId: string; documentCode: string }> };

async function loadScopedDocument(candidateWhere: Prisma.CandidateWhereUniqueInput, documentCode: string) {
  const candidate = await prisma.candidate.findUnique({
    where: candidateWhere,
    include: { documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] } },
  });
  if (!candidate) return { candidate: null, documentRecord: null };
  const documentRecord = candidate.documentRecords.find((row) => row.documentCode === documentCode) ?? null;
  return { candidate, documentRecord };
}

async function syncGatesForCandidate(
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

export async function GET(request: NextRequest, context: RouteContext) {
  const { candidateId, documentCode } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const { candidate, documentRecord } = await loadScopedDocument(candidateWhere, documentCode);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  if (!documentRecord) {
    return NextResponse.json({ error: "Document record not found" }, { status: 404 });
  }

  const stored = parseStoredArtifact(documentRecord.metadata);
  let fileName = stored?.fileName ?? null;
  let mimeType = stored?.mimeType ?? "application/octet-stream";
  let bytes: Buffer | null = null;

  if (stored?.storage === "document-record-metadata" && stored.contentBase64) {
    bytes = Buffer.from(stored.contentBase64, "base64");
  } else if (stored?.storage === "bundled-synthetic") {
    // Only a synthetic file explicitly attached to this record; never a fallback for real candidates.
    const bundled = await readBundledSyntheticFile(candidate.candidateCode, documentRecord.documentType);
    if (bundled) {
      fileName = bundled.fileName;
      mimeType = bundled.mimeType;
      bytes = bundled.bytes;
    }
  }

  if (!bytes || !fileName) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Synthetic-Document": stored?.synthetic ? "true" : "false",
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { candidateId, documentCode } = await context.params;
  const access = await requireRecruitingCandidateAccess(candidateId);
  if (access.response) return access.response;
  const candidateWhere = access.access.where;
  const { candidate, documentRecord } = await loadScopedDocument(candidateWhere, documentCode);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  if (!documentRecord) {
    return NextResponse.json({ error: "Document record not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Upload must be multipart/form-data with a file field" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > RECRUITING_V2_MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `File exceeds ${RECRUITING_V2_MAX_UPLOAD_BYTES} byte limit` }, { status: 400 });
  }
  if (!isAllowedRecruitingV2Upload(file.type || "", file.name)) {
    return NextResponse.json({ error: "Unsupported file type. Upload PDF, JPG, JPEG, or PNG." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const artifact = buildUploadedArtifact(file.name, file.type || "application/octet-stream", bytes);
  const uploadedByRaw = form.get("uploadedBy");
  const uploadedBy = typeof uploadedByRaw === "string" && uploadedByRaw.trim() ? uploadedByRaw.trim() : documentRecord.uploadedBy;

  const updated = await prisma.documentRecord.update({
    where: { id: documentRecord.id },
    data: {
      uploadedBy,
      metadata: mergeMetadataArtifact(documentRecord.metadata, artifact) as Prisma.InputJsonValue,
    },
  });

  const records = candidate.documentRecords.map((row) =>
    serializeRecruitingV2DocumentRecord(row.id === updated.id ? updated : row, candidate.candidateCode),
  );
  const gates = await syncGatesForCandidate(candidate.id, records);

  return NextResponse.json({
    operation: "Upload Document Artifact",
    documentRecord: serializeRecruitingV2DocumentRecord(updated, candidate.candidateCode),
    gate: gates.find((item) => item.documentType === updated.documentType) ?? null,
  });
}
