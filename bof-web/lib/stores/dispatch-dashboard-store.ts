"use client";

import { create } from "zustand";
import type {
  DispatchNavId,
  Driver,
  Load,
  LoadStatus,
  Tractor,
  Trailer,
} from "@/types/dispatch";
import {
  createSeedDrivers,
  createSeedLoads,
  createSeedTrailers,
  createSeedTractors,
} from "@/lib/dispatch-dashboard-seed";

export type BoardFilters = {
  dateFrom: string;
  dateTo: string;
  customer: string;
  status: "" | LoadStatus;
  driver: string;
};

type DispatchDashboardState = {
  loads: Load[];
  drivers: Driver[];
  tractors: Tractor[];
  trailers: Trailer[];
  nav: DispatchNavId;
  selectedLoadId: string | null;
  loadDetailDrawerOpen: boolean;
  assignModalOpen: boolean;
  assignLoadId: string | null;
  boardFilters: BoardFilters;

  setNav: (id: DispatchNavId) => void;
  setBoardFilters: (f: Partial<BoardFilters>) => void;
  selectLoad: (load_id: string | null) => void;
  openLoadDrawer: (load_id: string) => void;
  closeLoadDrawer: () => void;
  openAssignModal: (load_id: string) => void;
  closeAssignModal: () => void;
  /** Returns false if driver is not compliance-valid (assignment blocked). */
  assignDriverEquipment: (args: {
    load_id: string;
    driver_id: string;
    tractor_id: string;
    trailer_id: string | null;
  }) => boolean;
  setLoadStatus: (load_id: string, status: LoadStatus) => void;
  flagException: (load_id: string, reason: string) => void;
  clearExceptionFlag: (load_id: string) => void;
  setSettlementHold: (load_id: string, hold: boolean, reason?: string) => void;
  setLoadDocumentUrls: (
    load_id: string,
    patch: Partial<
      Pick<
        Load,
        | "bol_url"
        | "pod_url"
        | "invoice_url"
        | "claim_form_url"
        | "damage_photo_url"
        | "supporting_attachment_url"
      >
    >
  ) => void;
  /** Append a draft load (e.g. from BOF Intake Engine finalize). */
  appendLoad: (load: Load) => void;
  /** Merge fields onto an existing board load (e.g. intake proof stamp). */
  patchLoad: (load_id: string, patch: Partial<Load>) => void;
};

function findDriver(drivers: Driver[], id: string) {
  return drivers.find((d) => d.driver_id === id) ?? null;
}

export const useDispatchDashboardStore = create<DispatchDashboardState>(
  (set, get) => ({
    loads: createSeedLoads(),
    drivers: createSeedDrivers(),
    tractors: createSeedTractors(),
    trailers: createSeedTrailers(),
    nav: "board",
    selectedLoadId: null,
    loadDetailDrawerOpen: false,
    assignModalOpen: false,
    assignLoadId: null,
    boardFilters: {
      dateFrom: "",
      dateTo: "",
      customer: "",
      status: "",
      driver: "",
    },

    setNav: (id) => set({ nav: id }),

    setBoardFilters: (f) =>
      set((s) => ({ boardFilters: { ...s.boardFilters, ...f } })),

    selectLoad: (load_id) => set({ selectedLoadId: load_id }),

    openLoadDrawer: (load_id) =>
      set({
        selectedLoadId: load_id,
        loadDetailDrawerOpen: true,
      }),

    closeLoadDrawer: () =>
      set({
        loadDetailDrawerOpen: false,
      }),

    openAssignModal: (load_id) =>
      set({
        assignModalOpen: true,
        assignLoadId: load_id,
      }),

    closeAssignModal: () =>
      set({
        assignModalOpen: false,
        assignLoadId: null,
      }),

    assignDriverEquipment: ({
      load_id,
      driver_id,
      tractor_id,
      trailer_id,
    }) => {
      const { drivers, loads } = get();
      const dr = findDriver(drivers, driver_id);
      if (!dr || dr.status !== "Active") return false;
      if (dr.compliance_status !== "VALID") return false;
      if (!tractor_id) return false;

      set({
        loads: loads.map((l) =>
          l.load_id === load_id
            ? {
                ...l,
                driver_id,
                tractor_id,
                trailer_id,
                status: "Assigned",
              }
            : l
        ),
        assignModalOpen: false,
        assignLoadId: null,
      });
      return true;
    },

    setLoadStatus: (load_id, status) =>
      set((s) => ({
        loads: s.loads.map((l) =>
          l.load_id === load_id ? { ...l, status } : l
        ),
      })),

    flagException: (load_id, reason) =>
      set((s) => ({
        loads: s.loads.map((l) =>
          l.load_id === load_id
            ? {
                ...l,
                status: "Exception" as LoadStatus,
                exception_flag: true,
                exception_reason: reason,
              }
            : l
        ),
      })),

    clearExceptionFlag: (load_id) =>
      set((s) => ({
        loads: s.loads.map((l) =>
          l.load_id === load_id
            ? {
                ...l,
                exception_flag: false,
                exception_reason: undefined,
                status:
                  l.status === "Exception"
                    ? ("In Transit" as LoadStatus)
                    : l.status,
              }
            : l
        ),
      })),

    setSettlementHold: (load_id, hold, reason) =>
      set((s) => ({
        loads: s.loads.map((l) =>
          l.load_id === load_id
            ? {
                ...l,
                settlement_hold: hold,
                settlement_hold_reason: hold
                  ? (reason ?? l.settlement_hold_reason ?? "Hold placed")
                  : undefined,
              }
            : l
        ),
      })),

    setLoadDocumentUrls: (load_id, patch) =>
      set((s) => ({
        loads: s.loads.map((l) => (l.load_id === load_id ? { ...l, ...patch } : l)),
      })),

    appendLoad: (load) =>
      set((s) => ({
        loads: [...s.loads, load],
      })),

    patchLoad: (load_id, patch) =>
      set((s) => ({
        loads: s.loads.map((l) => (l.load_id === load_id ? { ...l, ...patch } : l)),
      })),
  })
);
