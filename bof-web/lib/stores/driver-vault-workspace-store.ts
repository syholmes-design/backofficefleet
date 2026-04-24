"use client";

import { create } from "zustand";
import type { BofData } from "@/lib/load-bof-data";
import {
  applySharedFieldAutofill,
  buildDriverVaultWorkspaces,
  type DriverVaultCategory,
  type DriverVaultDriverWorkspace,
  type DriverVaultReviewState,
} from "@/lib/driver-vault-workspace";

type DriverVaultWorkspaceState = {
  initialized: boolean;
  drivers: DriverVaultDriverWorkspace[];
  selectedDriverId: string | null;
  selectedCategory: DriverVaultCategory | null;
  initFromData: (data: BofData) => void;
  selectDriver: (driverId: string) => void;
  selectCategory: (category: DriverVaultCategory) => void;
  updateSharedField: (driverId: string, key: string, value: string) => void;
  updateTemplateField: (
    driverId: string,
    category: DriverVaultCategory,
    key: string,
    value: string
  ) => void;
  regeneratePreview: (driverId: string, category: DriverVaultCategory) => void;
  markReviewed: (driverId: string, category: DriverVaultCategory) => void;
  replaceUpload: (driverId: string, category: DriverVaultCategory) => void;
};

function nowIso() {
  return new Date().toISOString();
}

function toSections(fields: Record<string, string>) {
  return Object.entries(fields).map(([label, value]) => ({
    label: label.replace(/_/g, " "),
    value: value || "—",
  }));
}

export const useDriverVaultWorkspaceStore = create<DriverVaultWorkspaceState>((set, get) => ({
  initialized: false,
  drivers: [],
  selectedDriverId: null,
  selectedCategory: null,

  initFromData: (data) => {
    if (get().initialized) return;
    const drivers = buildDriverVaultWorkspaces(data);
    set({
      initialized: true,
      drivers,
      selectedDriverId: drivers[0]?.driverId ?? null,
      selectedCategory: "Driver Profile",
    });
  },

  selectDriver: (driverId) => set({ selectedDriverId: driverId }),

  selectCategory: (category) => set({ selectedCategory: category }),

  updateSharedField: (driverId, key, value) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.driverId !== driverId) return d;
        const shared = { ...d.sharedProfileFields, [key]: value };
        const categories = { ...d.categories };
        (Object.keys(categories) as DriverVaultCategory[]).forEach((category) => {
          const item = categories[category];
          const merged = applySharedFieldAutofill(category, shared, item.templateFields);
          categories[category] = {
            ...item,
            templateFields: merged,
            generatedPreview: {
              ...item.generatedPreview,
              sections: toSections(merged),
            },
            lastUpdated: nowIso(),
          };
        });
        return { ...d, sharedProfileFields: shared, categories };
      }),
    })),

  updateTemplateField: (driverId, category, key, value) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.driverId !== driverId) return d;
        const current = d.categories[category];
        const nextFields = { ...current.templateFields, [key]: value };
        return {
          ...d,
          categories: {
            ...d.categories,
            [category]: {
              ...current,
              templateFields: nextFields,
              generatedPreview: {
                ...current.generatedPreview,
                sections: toSections(nextFields),
              },
              lastUpdated: nowIso(),
              reviewState: "in_review" as DriverVaultReviewState,
            },
          },
        };
      }),
    })),

  regeneratePreview: (driverId, category) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.driverId !== driverId) return d;
        const current = d.categories[category];
        const merged = applySharedFieldAutofill(category, d.sharedProfileFields, current.templateFields);
        return {
          ...d,
          categories: {
            ...d.categories,
            [category]: {
              ...current,
              templateFields: merged,
              generatedPreview: {
                ...current.generatedPreview,
                sections: toSections(merged),
              },
              lastUpdated: nowIso(),
            },
          },
        };
      }),
    })),

  markReviewed: (driverId, category) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.driverId !== driverId) return d;
        const current = d.categories[category];
        return {
          ...d,
          categories: {
            ...d.categories,
            [category]: {
              ...current,
              reviewState: "reviewed",
              documentStatus: current.sourceUploads.length ? "valid" : current.documentStatus,
              lastUpdated: nowIso(),
            },
          },
        };
      }),
    })),

  replaceUpload: (driverId, category) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.driverId !== driverId) return d;
        const current = d.categories[category];
        const sourceUploads = [
          ...current.sourceUploads,
          {
            source_id: `${driverId}:${category}:${current.sourceUploads.length + 1}`,
            file_name: `${driverId}_${category.replace(/\W+/g, "_").toLowerCase()}_${current.sourceUploads.length + 1}.pdf`,
            source_type: "upload" as const,
            source_url: null,
            uploaded_at: nowIso(),
          },
        ];
        return {
          ...d,
          categories: {
            ...d.categories,
            [category]: {
              ...current,
              sourceUploads,
              documentStatus: "review_pending",
              reviewState: "in_review",
              extractedFieldConfidence: "medium",
              lastUpdated: nowIso(),
            },
          },
        };
      }),
    })),
}));
