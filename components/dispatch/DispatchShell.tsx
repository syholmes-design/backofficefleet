"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DispatchNav } from "./DispatchNav";
import { DispatchBoardScreen } from "./DispatchBoardScreen";
import { LoadDetailDrawer } from "./LoadDetailDrawer";
import { LoadDetailContent } from "./LoadDetailContent";
import { AssignDriverEquipmentModal } from "./AssignDriverEquipmentModal";
import { ExceptionViewScreen } from "./ExceptionViewScreen";
import { SettlementReadinessScreen } from "./SettlementReadinessScreen";
import { RfidProofChainV4 } from "@/components/rfid-v4/RfidProofChainV4";
import { RouteIntelligenceV4 } from "@/components/route-intelligence-v4/RouteIntelligenceV4";
import { DispatchAssetCards } from "@/components/dispatch/DispatchAssetCards";
import { DemoPageExplainerById } from "@/components/demo/DemoPageExplainerById";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  ApiError,
  type DispatchAssignmentRecord,
  type DispatchDriverOption,
  type DispatchLoadRecord,
  getErrorMessage,
  requestJson,
} from "@/lib/dispatch-workflow-ui";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

type Props = {
  fleetId: string | null;
  drivers: DispatchDriverOption[];
  driverOperationalSummaries: DriverOperationalSummary[];
};

type DispatchView = "board" | "load-detail" | "assign" | "exceptions" | "settlement";

function currentView(rawView: string | null): DispatchView {
  if (rawView === "load-detail" || rawView === "assign" || rawView === "exceptions" || rawView === "settlement") {
    return rawView;
  }
  return "board";
}

export function DispatchShell({ fleetId, drivers, driverOperationalSummaries }: Props) {
  const { data: demoData } = useBofDemoData();
  const searchParams = useSearchParams();
  const loadIdParam = searchParams.get("loadId");
  const driverIdParam = searchParams.get("driverId");
  const view = currentView(searchParams.get("view"));

  const [loads, setLoads] = useState<DispatchLoadRecord[]>([]);
  const [loadsLoading, setLoadsLoading] = useState(false);
  const [loadsError, setLoadsError] = useState<string | null>(null);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, DispatchAssignmentRecord | null>>({});
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignLoadId, setAssignLoadId] = useState<string | null>(null);
  const [assignPick, setAssignPick] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const demoLoads = useMemo<DispatchLoadRecord[]>(
    () =>
      (demoData.loads as Array<Record<string, unknown>>).map((load) => ({
        id: String(load.id ?? ""),
        fleetId: "demo-fleet",
        customerName: String(load.customerName ?? "Not available"),
        origin: String(load.origin ?? "Not available"),
        destination: String(load.destination ?? "Not available"),
        pickupWindowStart: typeof load.pickupAt === "string" ? load.pickupAt : null,
        pickupWindowEnd: typeof load.pickupAt === "string" ? load.pickupAt : null,
        deliveryWindowStart: typeof load.deliveryAt === "string" ? load.deliveryAt : null,
        deliveryWindowEnd: typeof load.deliveryAt === "string" ? load.deliveryAt : null,
        referenceNumber: typeof load.referenceNumber === "string" ? load.referenceNumber : null,
        secondaryReferenceNumber: null,
        status: String(load.status ?? "Planned"),
        createdAt: typeof load.pickupAt === "string" ? load.pickupAt : "",
        updatedAt: typeof load.deliveryAt === "string" ? load.deliveryAt : typeof load.pickupAt === "string" ? load.pickupAt : "",
      })),
    [demoData.loads],
  );
  const displayFleetId = fleetId ?? "demo-fleet";

  const fetchLoads = useCallback(async () => {
    if (!fleetId) {
      setLoads(demoLoads);
      setLoadsError(null);
      return demoLoads;
    }

    setLoadsLoading(true);
    try {
      const nextLoads = await requestJson<DispatchLoadRecord[]>(`/api/dispatch/fleet/${fleetId}/loads`);
      setLoads(nextLoads);
      setLoadsError(null);
      return nextLoads;
    } catch (error) {
      setLoadsError(getErrorMessage(error));
      return [] as DispatchLoadRecord[];
    } finally {
      setLoadsLoading(false);
    }
  }, [demoLoads, fleetId]);

  const fetchAssignmentMap = useCallback(async (nextLoads: DispatchLoadRecord[]) => {
    if (!fleetId) {
      setAssignmentMap({});
      return;
    }

    if (nextLoads.length === 0) {
      setAssignmentMap({});
      return;
    }

    try {
      const entries = await Promise.all(
        nextLoads.map(async (load) => {
          try {
            const assignment = await requestJson<DispatchAssignmentRecord | null>(
              `/api/dispatch/load/${load.id}/assignment`,
            );
            return [load.id, assignment] as const;
          } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
              return [load.id, null] as const;
            }
            throw error;
          }
        }),
      );

      setAssignmentMap(Object.fromEntries(entries));
    } catch (error) {
      setLoadsError(getErrorMessage(error));
    }
  }, [fleetId]);

  useEffect(() => {
    void fetchLoads();
  }, [fetchLoads]);

  useEffect(() => {
    void fetchAssignmentMap(loads);
  }, [loads, fetchAssignmentMap]);

  useEffect(() => {
    if (loads.length === 0) {
      setSelectedLoadId(null);
      return;
    }

    const driverMatchedLoadId =
      driverIdParam && Object.values(assignmentMap).find((assignment) => assignment?.driverId === driverIdParam)?.loadId;

    if (loadIdParam && loads.some((load) => load.id === loadIdParam)) {
      setSelectedLoadId(loadIdParam);
      if (view === "load-detail") {
        setDrawerOpen(true);
      }
      return;
    }

    if (driverMatchedLoadId && loads.some((load) => load.id === driverMatchedLoadId)) {
      setSelectedLoadId(driverMatchedLoadId);
      return;
    }

    setSelectedLoadId((current) => (current && loads.some((load) => load.id === current) ? current : loads[0]?.id ?? null));
  }, [assignmentMap, driverIdParam, loadIdParam, loads, view]);

  const selectedLoad = useMemo(
    () => loads.find((load) => load.id === selectedLoadId) ?? null,
    [loads, selectedLoadId],
  );

  const refreshBoard = useCallback(async () => {
    const nextLoads = await fetchLoads();
    await fetchAssignmentMap(nextLoads);
    setRefreshKey((current) => current + 1);
  }, [fetchAssignmentMap, fetchLoads]);

  const openAssignModal = useCallback((loadId: string) => {
    setAssignLoadId(loadId);
    setAssignModalOpen(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setAssignModalOpen(false);
    setAssignLoadId(null);
  }, []);

  const openLoadDrawer = useCallback((loadId: string) => {
    setSelectedLoadId(loadId);
    setDrawerOpen(true);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-slate-950 text-slate-100 lg:flex-row">
      <DispatchNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="px-4 pt-3">
          <DemoPageExplainerById pageId="dispatch" />
        </div>

        {view === "board" ? (
          <DispatchBoardScreen
            fleetId={displayFleetId}
            loads={loads}
            loadsLoading={loadsLoading}
            loadsError={loadsError}
            assignmentMap={assignmentMap}
            selectedLoadId={selectedLoadId}
            onSelectLoad={setSelectedLoadId}
            onOpenLoad={openLoadDrawer}
            onOpenAssign={openAssignModal}
            onRefresh={refreshBoard}
            refreshKey={refreshKey}
            demoMode={!fleetId}
            relationshipSpine={demoData.loadRelationshipSpine ?? {}}
          />
        ) : null}

        {fleetId && view === "load-detail" ? (
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <h1 className="text-lg font-semibold text-white">Load detail</h1>
            <p className="mt-1 text-sm text-slate-400">
              Select a backend load to review the same operational panel used inside dispatch.
            </p>
            <div className="mt-4 max-w-xl space-y-3">
              <label className="block text-xs text-slate-500">
                Load
                <select
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
                  value={selectedLoadId ?? ""}
                  onChange={(event) => setSelectedLoadId(event.target.value || null)}
                >
                  <option value="">— Select —</option>
                  {loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.id} · {load.customerName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selectedLoad}
                onClick={() => selectedLoad && openAssignModal(selectedLoad.id)}
                className="rounded border border-teal-700 bg-teal-950/40 px-3 py-2 text-sm text-teal-100 hover:bg-teal-900/40 disabled:opacity-40"
              >
                Open assignment modal for this load
              </button>
            </div>
            {selectedLoad ? (
              <div className="mt-6 space-y-6">
                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto rounded-lg border border-slate-800">
                    <LoadDetailContent load={selectedLoad} onOpenAssignModal={openAssignModal} refreshKey={refreshKey} />
                </div>

                <RouteIntelligenceV4 loadId={selectedLoad.id} />

                <DispatchAssetCards loadId={selectedLoad.id} />

                <RfidProofChainV4 loadId={selectedLoad.id} showAllEvents={false} maxEvents={5} />
              </div>
            ) : null}
          </div>
        ) : null}

        {fleetId && view === "assign" ? (
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <h1 className="text-lg font-semibold text-white">Assign driver &amp; equipment</h1>
            <p className="mt-1 text-sm text-slate-400">
              Choose a backend load and open the same assignment modal used from the dispatch board.
            </p>
            <div className="mt-4 max-w-md">
              <label className="block text-xs text-slate-500">
                Load
                <select
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
                  value={assignPick}
                  onChange={(event) => setAssignPick(event.target.value)}
                >
                  <option value="">— Select —</option>
                  {loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.id} · {load.customerName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mt-3 rounded border border-teal-600 bg-teal-900/30 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900/50"
                onClick={() => {
                  if (assignPick) {
                    openAssignModal(assignPick);
                  }
                }}
                disabled={!assignPick}
              >
                Open assignment modal
              </button>
            </div>
          </div>
        ) : null}

        {view === "exceptions" && <ExceptionViewScreen />}
        {view === "settlement" && <SettlementReadinessScreen />}
      </div>

      <LoadDetailDrawer
        load={selectedLoad}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenAssignModal={openAssignModal}
        refreshKey={refreshKey}
      />
      <AssignDriverEquipmentModal
        open={assignModalOpen}
        loadId={assignLoadId}
        fleetId={fleetId}
        drivers={drivers}
        driverOperationalSummaries={driverOperationalSummaries}
        onClose={closeAssignModal}
        onSaved={refreshBoard}
      />
    </div>
  );
}
