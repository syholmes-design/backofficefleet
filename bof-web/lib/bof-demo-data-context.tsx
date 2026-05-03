"use client";

/**
 * BOF demo "source of truth": in-memory clone of demo-data.json, hydrated from
 * localStorage after mount so edits from /source-of-truth propagate to client pages
 * that consume useBofDemoData() — drivers list, driver hub, document vault, dashboard,
 * command center, money at risk, loads/dispatch, RF actions, and settlement drawer proof
 * checks against live JSON.
 *
 * Server-only code paths still use getBofData() (seed import): static params, prerender,
 * `/api/bof-generated/*`, and any module-scope stores not yet re-hydrated from this provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BofData, DriverDispatchBlockerOverrideRow } from "@/lib/load-bof-data";
import type { DriverMedicalExpanded } from "@/lib/driver-medical-expanded";
import { EMPTY_DRIVER_MEDICAL_EXPANDED } from "@/lib/driver-medical-expanded";
import { collectDispatchHardBlockers } from "@/lib/driver-dispatch-eligibility";
import { applyOperationalSeedDefaults } from "@/lib/driver-operational-profile";

const STORAGE_KEY = "bof-demo-data-v1";
const RISK_OVERRIDES_STORAGE_KEY = "bof-demo-risk-overrides-v1";

function deepClone<T>(x: T): T {
  if (typeof structuredClone === "function") return structuredClone(x);
  return JSON.parse(JSON.stringify(x)) as T;
}

function persistToStorage(next: BofData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export type BofDemoDataContextValue = {
  data: BofData;
  hydrated: boolean;
  setFullData: (next: BofData) => void;
  resetDemoData: () => void;
  updateDriver: (driverId: string, patch: Record<string, unknown>) => void;
  updateDocument: (driverId: string, docType: string, patch: Record<string, unknown>) => void;
  updateDriverMedicalExpanded: (
    driverId: string,
    patch: Partial<DriverMedicalExpanded>
  ) => void;
  demoRiskOverrides: {
    loads: Record<
      string,
      {
        resolvedReasonIds: string[];
        resolvedAt: string;
        resolvedBy: "demo-editor";
        note?: string;
      }
    >;
    drivers: Record<
      string,
      {
        resolvedReasonIds: string[];
        resolvedAt: string;
        resolvedBy: "demo-editor";
        note?: string;
      }
    >;
  };
  resolveLoadRiskReason: (loadId: string, reasonId: string, note?: string) => void;
  resolveDriverRiskReason: (driverId: string, reasonId: string, note?: string) => void;
  resetDemoRiskOverrides: () => void;
  /** Dispatch hard-gate demo overrides (persisted on `data.driverDispatchBlockerOverrides`). */
  resolveDriverDispatchBlocker: (driverId: string, reasonId: string, note?: string) => void;
  resolveAllDriverDispatchBlockersForDemo: (driverId: string, note?: string) => void;
  resetDriverDispatchBlockerOverrides: (driverId: string) => void;
  resetAllDriverDispatchBlockerOverrides: () => void;
};

const BofDemoDataContext = createContext<BofDemoDataContextValue | null>(null);

export function BofDemoDataProvider({
  seed,
  children,
}: {
  seed: BofData;
  children: ReactNode;
}) {
  const [data, setData] = useState<BofData>(() => applyOperationalSeedDefaults(deepClone(seed)));
  const [demoRiskOverrides, setDemoRiskOverrides] = useState<BofDemoDataContextValue["demoRiskOverrides"]>(
    () => ({ loads: {}, drivers: {} })
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BofData;
        if (parsed && Array.isArray(parsed.drivers) && Array.isArray(parsed.documents)) {
          setData(applyOperationalSeedDefaults(parsed));
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    try {
      const rawOverrides = localStorage.getItem(RISK_OVERRIDES_STORAGE_KEY);
      if (rawOverrides) {
        const parsed = JSON.parse(rawOverrides) as BofDemoDataContextValue["demoRiskOverrides"];
        if (parsed && parsed.loads && parsed.drivers) {
          setDemoRiskOverrides(parsed);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const setFullData = useCallback((next: BofData) => {
    const copy = applyOperationalSeedDefaults(deepClone(next));
    setData(copy);
    persistToStorage(copy);
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = applyOperationalSeedDefaults(deepClone(seed));
    setData(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [seed]);

  const updateDriver = useCallback((driverId: string, patch: Record<string, unknown>) => {
    setData((prev) => {
      const next = deepClone(prev);
      const i = next.drivers.findIndex((d) => d.id === driverId);
      if (i === -1) return prev;
      next.drivers[i] = { ...(next.drivers[i] as object), ...patch } as (typeof next.drivers)[number];
      persistToStorage(next);
      return next;
    });
  }, []);

  const updateDocument = useCallback(
    (driverId: string, docType: string, patch: Record<string, unknown>) => {
      setData((prev) => {
        const next = deepClone(prev);
        const i = next.documents.findIndex(
          (d) => d.driverId === driverId && d.type === docType
        );
        if (i === -1) return prev;
        next.documents[i] = {
          ...(next.documents[i] as object),
          ...patch,
        } as (typeof next.documents)[number];
        persistToStorage(next);
        return next;
      });
    },
    []
  );

  const updateDriverMedicalExpanded = useCallback(
    (driverId: string, patch: Partial<DriverMedicalExpanded>) => {
      setData((prev) => {
        const next = deepClone(prev) as BofData & {
          driverMedicalExpanded?: Record<string, DriverMedicalExpanded>;
        };
        const map: Record<string, DriverMedicalExpanded> = {
          ...(next.driverMedicalExpanded as Record<string, DriverMedicalExpanded> | undefined),
        };
        const cur = map[driverId] ?? { ...EMPTY_DRIVER_MEDICAL_EXPANDED };
        map[driverId] = { ...cur, ...patch };
        next.driverMedicalExpanded = map as typeof next.driverMedicalExpanded;
        persistToStorage(next as BofData);
        return next as BofData;
      });
    },
    []
  );

  const persistRiskOverrides = useCallback(
    (next: BofDemoDataContextValue["demoRiskOverrides"]) => {
      try {
        localStorage.setItem(RISK_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const resolveLoadRiskReason = useCallback(
    (loadId: string, reasonId: string, note?: string) => {
      setDemoRiskOverrides((prev) => {
        const row = prev.loads[loadId] ?? {
          resolvedReasonIds: [],
          resolvedAt: new Date().toISOString(),
          resolvedBy: "demo-editor" as const,
        };
        const next = {
          ...prev,
          loads: {
            ...prev.loads,
            [loadId]: {
              ...row,
              resolvedReasonIds: Array.from(new Set([...row.resolvedReasonIds, reasonId])),
              resolvedAt: new Date().toISOString(),
              note: note ?? row.note,
            },
          },
        };
        persistRiskOverrides(next);
        return next;
      });
    },
    [persistRiskOverrides]
  );

  const resolveDriverRiskReason = useCallback(
    (driverId: string, reasonId: string, note?: string) => {
      setDemoRiskOverrides((prev) => {
        const row = prev.drivers[driverId] ?? {
          resolvedReasonIds: [],
          resolvedAt: new Date().toISOString(),
          resolvedBy: "demo-editor" as const,
        };
        const next = {
          ...prev,
          drivers: {
            ...prev.drivers,
            [driverId]: {
              ...row,
              resolvedReasonIds: Array.from(new Set([...row.resolvedReasonIds, reasonId])),
              resolvedAt: new Date().toISOString(),
              note: note ?? row.note,
            },
          },
        };
        persistRiskOverrides(next);
        return next;
      });
    },
    [persistRiskOverrides]
  );

  const resetDemoRiskOverrides = useCallback(() => {
    const next = { loads: {}, drivers: {} };
    setDemoRiskOverrides(next);
    try {
      localStorage.removeItem(RISK_OVERRIDES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const resolveDriverDispatchBlocker = useCallback((driverId: string, reasonId: string, note?: string) => {
    setData((prev) => {
      const next = deepClone(prev);
      const map = { ...(next.driverDispatchBlockerOverrides ?? {}) };
      const row: DriverDispatchBlockerOverrideRow = map[driverId] ?? {
        resolvedReasonIds: [],
        resolvedAt: new Date().toISOString(),
        resolvedBy: "demo-editor",
      };
      map[driverId] = {
        ...row,
        resolvedReasonIds: Array.from(new Set([...row.resolvedReasonIds, reasonId])),
        resolvedAt: new Date().toISOString(),
        note: note ?? row.note,
      };
      next.driverDispatchBlockerOverrides = map;
      persistToStorage(next);
      return next;
    });
  }, []);

  const resolveAllDriverDispatchBlockersForDemo = useCallback((driverId: string, note?: string) => {
    setData((prev) => {
      const ids = collectDispatchHardBlockers(prev, driverId).map((b) => b.id);
      const next = deepClone(prev);
      const map = { ...(next.driverDispatchBlockerOverrides ?? {}) };
      const row: DriverDispatchBlockerOverrideRow = map[driverId] ?? {
        resolvedReasonIds: [],
        resolvedAt: new Date().toISOString(),
        resolvedBy: "demo-editor",
      };
      map[driverId] = {
        ...row,
        resolvedReasonIds: Array.from(new Set([...row.resolvedReasonIds, ...ids])),
        resolvedAt: new Date().toISOString(),
        note: note ?? row.note ?? "Resolved all dispatch hard gates for demo",
      };
      next.driverDispatchBlockerOverrides = map;
      persistToStorage(next);
      return next;
    });
  }, []);

  const resetDriverDispatchBlockerOverrides = useCallback((driverId: string) => {
    setData((prev) => {
      const next = deepClone(prev);
      const map = { ...(next.driverDispatchBlockerOverrides ?? {}) };
      delete map[driverId];
      if (Object.keys(map).length === 0) delete next.driverDispatchBlockerOverrides;
      else next.driverDispatchBlockerOverrides = map;
      persistToStorage(next);
      return next;
    });
  }, []);

  const resetAllDriverDispatchBlockerOverrides = useCallback(() => {
    setData((prev) => {
      const next = deepClone(prev);
      delete next.driverDispatchBlockerOverrides;
      persistToStorage(next);
      return next;
    });
  }, []);

  const value = useMemo<BofDemoDataContextValue>(
    () => ({
      data,
      hydrated,
      setFullData,
      resetDemoData,
      updateDriver,
      updateDocument,
      updateDriverMedicalExpanded,
      demoRiskOverrides,
      resolveLoadRiskReason,
      resolveDriverRiskReason,
      resetDemoRiskOverrides,
      resolveDriverDispatchBlocker,
      resolveAllDriverDispatchBlockersForDemo,
      resetDriverDispatchBlockerOverrides,
      resetAllDriverDispatchBlockerOverrides,
    }),
    [
      data,
      hydrated,
      setFullData,
      resetDemoData,
      updateDriver,
      updateDocument,
      updateDriverMedicalExpanded,
      demoRiskOverrides,
      resolveLoadRiskReason,
      resolveDriverRiskReason,
      resetDemoRiskOverrides,
      resolveDriverDispatchBlocker,
      resolveAllDriverDispatchBlockersForDemo,
      resetDriverDispatchBlockerOverrides,
      resetAllDriverDispatchBlockerOverrides,
    ]
  );

  return <BofDemoDataContext.Provider value={value}>{children}</BofDemoDataContext.Provider>;
}

export function useBofDemoData(): BofDemoDataContextValue {
  const ctx = useContext(BofDemoDataContext);
  if (!ctx) {
    throw new Error("useBofDemoData must be used within BofDemoDataProvider (see (bof)/layout.tsx)");
  }
  return ctx;
}
