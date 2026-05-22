"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BofDocumentStakeholder } from "@/lib/bof-document-audience";

export type BofTemplateDraft = {
  draftKey: string;
  templateId: string;
  entityId: string;
  updatedAt: string;
  body: string;
};

export type BofTemplateArtifact = {
  artifactKey: string;
  templateId: string;
  entityId: string;
  generatedAt: string;
  artifactUrl: string;
  artifactFileName: string;
  html: string;
};

/** Per-document (draftKey) demo metadata: review + stakeholder visibility selection. */
export type BofDocumentViewerMeta = {
  docKey: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  /** When null, UI uses template-derived defaults until user saves audience. */
  visibleTo: BofDocumentStakeholder[] | null;
};

type BofTemplateWorkspaceState = {
  drafts: Record<string, BofTemplateDraft>;
  artifacts: Record<string, BofTemplateArtifact>;
  /** Same key as draftKey / artifactKey: `${templateId}::${entityId}` */
  documentMeta: Record<string, BofDocumentViewerMeta>;
  upsertDraft: (draftKey: string, templateId: string, entityId: string, body: string) => void;
  getDraft: (draftKey: string) => BofTemplateDraft | null;
  saveArtifact: (
    artifactKey: string,
    templateId: string,
    entityId: string,
    artifactFileName: string,
    html: string
  ) => BofTemplateArtifact;
  getArtifact: (artifactKey: string) => BofTemplateArtifact | null;
  getDocumentMeta: (docKey: string) => BofDocumentViewerMeta | null;
  markDocumentReviewed: (docKey: string, reviewerLabel: string) => void;
  setDocumentVisibleStakeholders: (docKey: string, visibleTo: BofDocumentStakeholder[]) => void;
};

function nowIso() {
  return new Date().toISOString();
}

function artifactUrl(artifactKey: string) {
  return `/documents/template-packs/artifact?artifactKey=${encodeURIComponent(artifactKey)}`;
}

function ensureMeta(
  documentMeta: Record<string, BofDocumentViewerMeta>,
  docKey: string
): BofDocumentViewerMeta {
  return (
    documentMeta[docKey] ?? {
      docKey,
      reviewedAt: null,
      reviewedBy: null,
      visibleTo: null,
    }
  );
}

export const useBofTemplateWorkspaceStore = create<BofTemplateWorkspaceState>()(
  persist(
    (set, get) => ({
      drafts: {},
      artifacts: {},
      documentMeta: {},
      upsertDraft: (draftKey, templateId, entityId, body) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [draftKey]: {
              draftKey,
              templateId,
              entityId,
              updatedAt: nowIso(),
              body,
            },
          },
        })),
      getDraft: (draftKey) => get().drafts[draftKey] ?? null,
      saveArtifact: (artifactKey, templateId, entityId, artifactFileName, html) => {
        const row: BofTemplateArtifact = {
          artifactKey,
          templateId,
          entityId,
          generatedAt: nowIso(),
          artifactUrl: artifactUrl(artifactKey),
          artifactFileName,
          html,
        };
        set((s) => ({
          artifacts: {
            ...s.artifacts,
            [artifactKey]: row,
          },
        }));
        return row;
      },
      getArtifact: (artifactKey) => get().artifacts[artifactKey] ?? null,
      getDocumentMeta: (docKey) => get().documentMeta[docKey] ?? null,
      markDocumentReviewed: (docKey, reviewerLabel) =>
        set((s) => {
          const cur = ensureMeta(s.documentMeta, docKey);
          return {
            documentMeta: {
              ...s.documentMeta,
              [docKey]: {
                ...cur,
                reviewedAt: nowIso(),
                reviewedBy: reviewerLabel.trim() || "BOF reviewer",
              },
            },
          };
        }),
      setDocumentVisibleStakeholders: (docKey, visibleTo) =>
        set((s) => {
          const cur = ensureMeta(s.documentMeta, docKey);
          return {
            documentMeta: {
              ...s.documentMeta,
              [docKey]: {
                ...cur,
                visibleTo,
              },
            },
          };
        }),
    }),
    {
      name: "bof:template-workspace:v2",
      partialize: (s) => ({
        drafts: s.drafts,
        artifacts: s.artifacts,
        documentMeta: s.documentMeta,
      }),
    }
  )
);
