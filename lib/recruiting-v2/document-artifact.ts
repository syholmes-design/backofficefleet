import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { basename, join, resolve } from "path";
import type { Prisma, RecruitingV2DocumentType } from "@prisma/client";
import { RECRUITING_V2_DOCUMENT_TYPES } from "@/lib/recruiting-v2/document-gate-engine";

export const RECRUITING_V2_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const RECRUITING_V2_ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

export const SYNTHETIC_DOCUMENT_NOTICE =
  "SYNTHETIC DEMONSTRATION DOCUMENT — NOT A REAL CREDENTIAL — FOR BOF PRODUCT DEMONSTRATION ONLY";

export type RecruitingV2ArtifactStorage = "document-record-metadata" | "bundled-synthetic";

export type RecruitingV2StoredArtifact = {
  storage: RecruitingV2ArtifactStorage;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  uploadedAt: string;
  synthetic: boolean;
  contentBase64?: string;
};

export type RecruitingV2ArtifactSummary = {
  attached: boolean;
  storage: RecruitingV2ArtifactStorage | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
  synthetic: boolean;
  viewUrl: string | null;
  downloadUrl: string | null;
};

const BUNDLED_ROOT = resolve(process.cwd(), "lib", "recruiting-v2", "synthetic-documents");

const BUNDLED_SYNTHETIC_FILES: Record<string, Partial<Record<RecruitingV2DocumentType, string>>> = {
  "CAND-001": {
    CDL: "CAND-001_CDL_DEMO.pdf",
    MEDICAL: "CAND-001_MEDICAL_DEMO.pdf",
    MVR: "CAND-001_MVR_DEMO.pdf",
    CLEARINGHOUSE: "CAND-001_CLEARINGHOUSE_DEMO.pdf",
    I9: "CAND-001_I9_DEMO.pdf",
    W9: "CAND-001_W9_DEMO.pdf",
    ROAD_TEST: "CAND-001_ROAD_TEST_DEMO.pdf",
    EMPLOYMENT_VERIFICATION: "CAND-001_EMPLOYMENT_VERIFICATION_DEMO.pdf",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRecruitingV2DocumentType(value: string): value is RecruitingV2DocumentType {
  return RECRUITING_V2_DOCUMENT_TYPES.includes(value as RecruitingV2DocumentType);
}

export function sanitizeRecruitingV2FileName(value: string) {
  return basename(value || "document").replace(/[^A-Za-z0-9._-]+/g, "_");
}

export function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function mimeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

export function isAllowedRecruitingV2Upload(mimeType: string, fileName: string) {
  const mime = mimeType.toLowerCase();
  const inferred = mimeFromFileName(fileName);
  if (!RECRUITING_V2_ALLOWED_UPLOAD_MIME_TYPES.has(mime) && !(inferred && RECRUITING_V2_ALLOWED_UPLOAD_MIME_TYPES.has(inferred))) {
    return false;
  }
  return Boolean(inferred);
}

export function getBundledSyntheticFileName(candidateCode: string, documentType: RecruitingV2DocumentType) {
  return BUNDLED_SYNTHETIC_FILES[candidateCode]?.[documentType] ?? null;
}

export function bundledSyntheticArtifact(candidateCode: string, documentType: RecruitingV2DocumentType): RecruitingV2StoredArtifact | null {
  const fileName = getBundledSyntheticFileName(candidateCode, documentType);
  if (!fileName) return null;
  return {
    storage: "bundled-synthetic",
    fileName,
    mimeType: "application/pdf",
    sizeBytes: 0,
    checksum: null,
    uploadedAt: "2026-08-22T16:00:00.000Z",
    synthetic: true,
  };
}

export async function readBundledSyntheticFile(candidateCode: string, documentType: RecruitingV2DocumentType) {
  const fileName = getBundledSyntheticFileName(candidateCode, documentType);
  if (!fileName) return null;
  const fullPath = join(BUNDLED_ROOT, fileName);
  const bytes = await readFile(fullPath);
  return {
    fileName,
    mimeType: "application/pdf" as const,
    bytes,
  };
}

export function parseStoredArtifact(metadata: Prisma.JsonValue | unknown): RecruitingV2StoredArtifact | null {
  if (!isRecord(metadata) || !isRecord(metadata.artifact)) return null;
  const artifact = metadata.artifact;
  const storage = artifact.storage === "document-record-metadata" || artifact.storage === "bundled-synthetic" ? artifact.storage : null;
  const fileName = typeof artifact.fileName === "string" ? sanitizeRecruitingV2FileName(artifact.fileName) : "";
  const mimeType = typeof artifact.mimeType === "string" ? artifact.mimeType : "";
  if (!storage || !fileName || !mimeType) return null;
  return {
    storage,
    fileName,
    mimeType,
    sizeBytes: typeof artifact.sizeBytes === "number" ? artifact.sizeBytes : 0,
    checksum: typeof artifact.checksum === "string" ? artifact.checksum : null,
    uploadedAt: typeof artifact.uploadedAt === "string" ? artifact.uploadedAt : new Date().toISOString(),
    synthetic: artifact.synthetic === true,
    contentBase64: typeof artifact.contentBase64 === "string" ? artifact.contentBase64 : undefined,
  };
}

export function metadataWithoutArtifactBytes(metadata: Prisma.JsonValue | null): Prisma.JsonValue | null {
  if (!isRecord(metadata)) return metadata;
  if (!isRecord(metadata.artifact)) return metadata;
  const artifact = { ...metadata.artifact };
  delete artifact.contentBase64;
  return { ...metadata, artifact };
}

export function mergeMetadataArtifact(
  metadata: Prisma.JsonValue | null,
  artifact: RecruitingV2StoredArtifact,
): Prisma.InputJsonValue {
  const base = isRecord(metadata) ? { ...metadata } : {};
  return {
    ...base,
    artifact: {
      storage: artifact.storage,
      fileName: artifact.fileName,
      mimeType: artifact.mimeType,
      sizeBytes: artifact.sizeBytes,
      checksum: artifact.checksum,
      uploadedAt: artifact.uploadedAt,
      synthetic: artifact.synthetic,
      notice: SYNTHETIC_DOCUMENT_NOTICE,
      ...(artifact.contentBase64 ? { contentBase64: artifact.contentBase64 } : {}),
    },
  };
}

export function artifactSummaryForRecord(args: {
  candidateCode: string;
  documentCode: string;
  documentType: RecruitingV2DocumentType;
  metadata: Prisma.JsonValue | null;
}): RecruitingV2ArtifactSummary {
  const stored = parseStoredArtifact(args.metadata);
  const bundled = bundledSyntheticArtifact(args.candidateCode, args.documentType);
  const attached = Boolean(stored || bundled);
  const source = stored ?? bundled;
  const fileUrl = attached
    ? `/api/recruiting-v2/documents/${encodeURIComponent(args.candidateCode)}/${encodeURIComponent(args.documentCode)}/file`
    : null;
  return {
    attached,
    storage: source?.storage ?? null,
    fileName: source?.fileName ?? null,
    mimeType: source?.mimeType ?? null,
    sizeBytes: stored?.sizeBytes ?? null,
    uploadedAt: source?.uploadedAt ?? null,
    synthetic: source?.synthetic ?? Boolean(bundled),
    viewUrl: fileUrl,
    downloadUrl: fileUrl ? `${fileUrl}?download=1` : null,
  };
}

export function buildUploadedArtifact(fileName: string, mimeType: string, bytes: Uint8Array): RecruitingV2StoredArtifact {
  return {
    storage: "document-record-metadata",
    fileName: sanitizeRecruitingV2FileName(fileName),
    mimeType,
    sizeBytes: bytes.byteLength,
    checksum: sha256Hex(bytes),
    uploadedAt: new Date().toISOString(),
    synthetic: false,
    contentBase64: Buffer.from(bytes).toString("base64"),
  };
}
