import type { Prisma, RecruitingV2DocumentStatus, RecruitingV2DocumentType } from "@prisma/client";
import { artifactSummaryForRecord, metadataWithoutArtifactBytes } from "@/lib/recruiting-v2/document-artifact";

export type RecruitingV2DocumentRecordRow = {
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
};

export function serializeRecruitingV2DocumentRecord(record: RecruitingV2DocumentRecordRow, candidateCode: string) {
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
    metadata: metadataWithoutArtifactBytes(record.metadata),
    artifact: artifactSummaryForRecord({
      candidateCode,
      documentCode: record.documentCode,
      documentType: record.documentType,
      metadata: record.metadata,
    }),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
