"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

type BofTemplateWorkspaceState = {
  drafts: Record<string, BofTemplateDraft>;
  artifacts: Record<string, BofTemplateArtifact>;
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
};

function nowIso() {
  return new Date().toISOString();
}

function artifactUrl(artifactKey: string) {
  return `/documents/template-packs/artifact?artifactKey=${encodeURIComponent(artifactKey)}`;
}

export const useBofTemplateWorkspaceStore = create<BofTemplateWorkspaceState>()(
  persist(
    (set, get) => ({
      drafts: {},
      artifacts: {},
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
    }),
    {
      name: "bof:template-workspace:v1",
      partialize: (s) => ({ drafts: s.drafts, artifacts: s.artifacts }),
    }
  )
);
