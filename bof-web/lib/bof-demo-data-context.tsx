"use client";

/**
 * BOF demo "source of truth": in-memory clone of demo-data.json, hydrated from
 * localStorage after mount so edits from /source-of-truth propagate to client pages
 * that consume useBofDemoData() (drivers hub, document vault, driver detail).
 *
 * Server-only pages still use getBofData() from load-bof-data.ts (seed file).
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
import type { BofData } from "@/lib/load-bof-data";
import type { DriverMedicalExpanded } from "@/lib/driver-medical-expanded";
import { EMPTY_DRIVER_MEDICAL_EXPANDED } from "@/lib/driver-medical-expanded";

const STORAGE_KEY = "bof-demo-data-v1";

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
};

const BofDemoDataContext = createContext<BofDemoDataContextValue | null>(null);

export function BofDemoDataProvider({
  seed,
  children,
}: {
  seed: BofData;
  children: ReactNode;
}) {
  const [data, setData] = useState<BofData>(() => deepClone(seed));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BofData;
        if (parsed && Array.isArray(parsed.drivers) && Array.isArray(parsed.documents)) {
          setData(parsed);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const setFullData = useCallback((next: BofData) => {
    const copy = deepClone(next);
    setData(copy);
    persistToStorage(copy);
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = deepClone(seed);
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

  const value = useMemo<BofDemoDataContextValue>(
    () => ({
      data,
      hydrated,
      setFullData,
      resetDemoData,
      updateDriver,
      updateDocument,
      updateDriverMedicalExpanded,
    }),
    [data, hydrated, setFullData, resetDemoData, updateDriver, updateDocument, updateDriverMedicalExpanded]
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
