"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DispatchNav } from "./DispatchNav";
import { DispatchBoardScreen } from "./DispatchBoardScreen";
import { LoadDetailDrawer } from "./LoadDetailDrawer";
import { LoadDetailContent } from "./LoadDetailContent";
import { AssignDriverEquipmentModal } from "./AssignDriverEquipmentModal";
import { ExceptionViewScreen } from "./ExceptionViewScreen";
import { SettlementReadinessScreen } from "./SettlementReadinessScreen";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";

export function DispatchShell() {
  const { data } = useBofDemoData();
  const searchParams = useSearchParams();
  const nav = useDispatchDashboardStore((s) => s.nav);
  const setNav = useDispatchDashboardStore((s) => s.setNav);
  const selectedLoadId = useDispatchDashboardStore((s) => s.selectedLoadId);
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drawerOpen = useDispatchDashboardStore((s) => s.loadDetailDrawerOpen);
  const closeLoadDrawer = useDispatchDashboardStore((s) => s.closeLoadDrawer);
  const assignModalOpen = useDispatchDashboardStore((s) => s.assignModalOpen);
  const assignLoadId = useDispatchDashboardStore((s) => s.assignLoadId);
  const closeAssignModal = useDispatchDashboardStore((s) => s.closeAssignModal);
  const openAssignModal = useDispatchDashboardStore((s) => s.openAssignModal);
  const selectLoad = useDispatchDashboardStore((s) => s.selectLoad);
  const upsertLoad = useDispatchDashboardStore((s) => s.upsertLoad);
  const openLoadDrawer = useDispatchDashboardStore((s) => s.openLoadDrawer);
  const setBoardFilters = useDispatchDashboardStore((s) => s.setBoardFilters);

  const [assignPick, setAssignPick] = useState("");

  const selectedLoad = useMemo(
    () => loads.find((l) => l.load_id === selectedLoadId) ?? null,
    [loads, selectedLoadId]
  );

  useEffect(() => {
    const mapped = buildDispatchLoadsFromBofData(data);
    for (const row of mapped) {
      upsertLoad(row);
    }
  }, [data, upsertLoad]);

  const loadIdParam = searchParams.get("loadId");
  const driverIdParam = searchParams.get("driverId");

  useEffect(() => {
    if (loads.length === 0) return;
    if (driverIdParam) {
      setBoardFilters({ driver: driverIdParam });
      setNav("board");
    }
    if (loadIdParam && loads.some((l) => l.load_id === loadIdParam)) {
      setNav("board");
      selectLoad(loadIdParam);
      openLoadDrawer(loadIdParam);
    }
  }, [
    loads,
    loadIdParam,
    driverIdParam,
    setBoardFilters,
    setNav,
    selectLoad,
    openLoadDrawer,
  ]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "load-detail" || view === "assign" || view === "exceptions" || view === "settlement") {
      setNav(view);
    } else {
      setNav("board");
    }
  }, [searchParams, setNav]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <DispatchNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {nav === "board" && <DispatchBoardScreen />}
        {nav === "load-detail" && (
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <h1 className="text-lg font-semibold text-white">Load detail</h1>
            <p className="mt-1 text-sm text-slate-400">
              Select a load from the dispatch board row, or choose one here to review
              the same panel used in the drawer.
            </p>
            <div className="mt-4 max-w-xl space-y-3">
              <label className="block text-xs text-slate-500">
                Load
                <select
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
                  value={selectedLoadId ?? ""}
                  onChange={(e) => selectLoad(e.target.value || null)}
                >
                  <option value="">— Select —</option>
                  {loads.map((l) => (
                    <option key={l.load_id} value={l.load_id}>
                      {l.load_id} · {l.customer_name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selectedLoad}
                onClick={() =>
                  selectedLoad && openAssignModal(selectedLoad.load_id)
                }
                className="rounded border border-teal-700 bg-teal-950/40 px-3 py-2 text-sm text-teal-100 hover:bg-teal-900/40 disabled:opacity-40"
              >
                Open assign modal for this load
              </button>
            </div>
            {selectedLoad && (
              <div className="mt-6 max-h-[calc(100vh-16rem)] overflow-y-auto rounded-lg border border-slate-800">
                <LoadDetailContent load={selectedLoad} />
              </div>
            )}
          </div>
        )}
        {nav === "assign" && (
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <h1 className="text-lg font-semibold text-white">
              Assign driver &amp; equipment
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Opens the same assignment modal as from load detail. Pick a load first.
            </p>
            <div className="mt-4 max-w-md">
              <label className="block text-xs text-slate-500">
                Load
                <select
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
                  value={assignPick}
                  onChange={(e) => setAssignPick(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {loads.map((l) => (
                    <option key={l.load_id} value={l.load_id}>
                      {l.load_id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mt-3 rounded border border-teal-600 bg-teal-900/30 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900/50"
                onClick={() => {
                  if (assignPick) openAssignModal(assignPick);
                }}
              >
                Open assignment modal
              </button>
            </div>
          </div>
        )}
        {nav === "exceptions" && <ExceptionViewScreen />}
        {nav === "settlement" && <SettlementReadinessScreen />}
      </div>

      <LoadDetailDrawer
        load={selectedLoad}
        open={drawerOpen}
        onClose={closeLoadDrawer}
      />
      <AssignDriverEquipmentModal
        open={assignModalOpen}
        loadId={assignLoadId}
        onClose={closeAssignModal}
      />
    </div>
  );
}
