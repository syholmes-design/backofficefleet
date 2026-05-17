"use client";

import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { loadsV2, kpiData, type LoadV2 } from "@/lib/dispatch-v2-demo-data";
import { DispatchKpiRow } from "./DispatchKpiRow";
import { DispatchFilterBar } from "./DispatchFilterBar";
import { DispatchTable } from "./DispatchTable";
import { LoadDetailModal } from "./LoadDetailModal";
import { PreTripPacketModal } from "./PreTripPacketModal";
import { PreTripChecklist } from "./PreTripChecklist";
import { PreDispatchModal } from "./PreDispatchModal";
import { sendPreTripInstructions } from "@/lib/driver/sendPreTripInstructions";
import { logDispatchEvent } from "@/lib/audit/logDispatchEvent";
import type { PreTripChecklistState, PreDispatchVerificationState } from "./types";

export function DispatchV2Page() {
  const [filteredLoads, setFilteredLoads] = useState<LoadV2[]>(loadsV2);
  const [selectedLoad, setSelectedLoad] = useState<LoadV2 | null>(null);
  const [preTripLoad, setPreTripLoad] = useState<LoadV2 | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Pre-trip compliance state
  const [checklistState, setChecklistState] = useState<PreTripChecklistState>({
    hosVerified: false,
    equipmentConditionVerified: false,
    trailerNumberConfirmed: false,
    ppeConfirmed: false,
    loadInstructionsReviewed: false,
    sealRequirementsUnderstood: false,
    pickupAppointmentConfirmed: false,
    trackingActivated: false
  });

  const [preDispatchLoad, setPreDispatchLoad] = useState<LoadV2 | null>(null);
  const [dispatchInProgress, setDispatchInProgress] = useState(false);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenDetail = (load: LoadV2) => {
    setSelectedLoad(load);
  };

  const handleCloseDetail = () => {
    setSelectedLoad(null);
  };

  const handleOpenPreTrip = (load: LoadV2) => {
    setPreTripLoad(load);
  };

  const handleClosePreTrip = () => {
    setPreTripLoad(null);
  };

  const handleDispatch = (load: LoadV2) => {
    setPreDispatchLoad(load);
  };

  const handleClosePreDispatch = () => {
    setPreDispatchLoad(null);
  };

  const handlePreDispatchConfirm = async (verificationState: PreDispatchVerificationState) => {
    if (!preDispatchLoad) return;

    setDispatchInProgress(true);

    try {
      // Send pre-trip instructions to driver
      sendPreTripInstructions(
        preDispatchLoad.id,
        preDispatchLoad.driverId,
        checklistState
      );

      // Log dispatch event to audit trail
      const auditEvent = logDispatchEvent({
        dispatcherId: "DS-001", // Current dispatcher
        timestamp: new Date().toISOString(),
        loadId: preDispatchLoad.id,
        driverId: preDispatchLoad.driverId,
        checklistState,
        modalVerification: verificationState,
        trackingActivated: checklistState.trackingActivated,
        dispatchSuccess: true
      });

      // Show success message
      alert(`✅ Driver Dispatched Successfully!\n\nLoad: ${preDispatchLoad.id}\nDriver: ${preDispatchLoad.driver}\nTime: ${new Date().toLocaleString()}\n\nAudit ID: ${auditEvent.timestamp}`);

      // Close modal and reset state
      handleClosePreDispatch();
      
      // Reset checklist after successful dispatch
      setChecklistState({
        hosVerified: false,
        equipmentConditionVerified: false,
        trailerNumberConfirmed: false,
        ppeConfirmed: false,
        loadInstructionsReviewed: false,
        sealRequirementsUnderstood: false,
        pickupAppointmentConfirmed: false,
        trackingActivated: false
      });

    } catch (error) {
      console.error('Dispatch failed:', error);
      alert('❌ Dispatch failed. Please try again.');
    } finally {
      setDispatchInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-emerald-900/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-blue-500/20 shadow-2xl">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Truck Icon */}
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">BOF</div>
              <div className="text-xs text-blue-300">Operations Portal v2</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Live Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wider">LIVE</span>
            </div>
            
            {/* Clock */}
            <div className="text-right">
              <div className="text-lg font-bold text-white font-mono">
                {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
              <div className="text-xs text-slate-400">
                {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Loading...'}
              </div>
            </div>
            
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-sm">
              DS
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10">
        {/* KPI Row */}
        <DispatchKpiRow kpiData={kpiData} />

        {/* Filter Bar */}
        <DispatchFilterBar 
          loads={loadsV2}
          onFilter={setFilteredLoads}
        />

        {/* Pre-Trip Compliance Checklist */}
        <PreTripChecklist 
          checklistState={checklistState}
          onChecklistChange={setChecklistState}
        />

        {/* Dispatch Table */}
        <DispatchTable 
          loads={filteredLoads}
          onOpenDetail={handleOpenDetail}
          onOpenPreTrip={handleOpenPreTrip}
          onDispatch={handleDispatch}
          checklistState={checklistState}
          dispatchInProgress={dispatchInProgress}
        />
      </div>

      {/* Load Detail Modal */}
      {selectedLoad && (
        <LoadDetailModal 
          load={selectedLoad}
          onClose={handleCloseDetail}
        />
      )}

      {/* Pre-Trip Packet Modal */}
      {preTripLoad && (
        <PreTripPacketModal 
          load={preTripLoad}
          onClose={handleClosePreTrip}
        />
      )}

      {/* Pre-Dispatch Verification Modal */}
      {preDispatchLoad && (
        <PreDispatchModal 
          load={preDispatchLoad}
          onClose={handleClosePreDispatch}
          onDispatch={handlePreDispatchConfirm}
        />
      )}
    </div>
  );
}
