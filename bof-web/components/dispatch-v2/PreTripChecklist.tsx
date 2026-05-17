"use client";

import { CheckCircle, AlertTriangle, CheckSquare } from "lucide-react";
import type { PreTripChecklistState, PreTripChecklistProps } from "./types";

export function PreTripChecklist({ checklistState, onChecklistChange }: PreTripChecklistProps) {
  const toggleItem = (key: keyof PreTripChecklistState) => {
    onChecklistChange({
      ...checklistState,
      [key]: !checklistState[key]
    });
  };

  const allComplete = Object.values(checklistState).every(Boolean);
  const completedCount = Object.values(checklistState).filter(Boolean).length;

  const checklistItems = [
    { key: 'hosVerified' as keyof PreTripChecklistState, label: 'HOS Verified' },
    { key: 'equipmentConditionVerified' as keyof PreTripChecklistState, label: 'Equipment Condition Verified (No Active DVIR Defects)' },
    { key: 'trailerNumberConfirmed' as keyof PreTripChecklistState, label: 'Trailer Number Confirmed' },
    { key: 'ppeConfirmed' as keyof PreTripChecklistState, label: 'PPE Confirmed (Vest, Boots, Hard Hat if Required)' },
    { key: 'loadInstructionsReviewed' as keyof PreTripChecklistState, label: 'Load Instructions Reviewed With Driver' },
    { key: 'sealRequirementsUnderstood' as keyof PreTripChecklistState, label: 'Seal Requirements Understood' },
    { key: 'pickupAppointmentConfirmed' as keyof PreTripChecklistState, label: 'Pickup Appointment Confirmed' },
    { key: 'trackingActivated' as keyof PreTripChecklistState, label: 'Tracking Activated (MacroPoint/Project44)' }
  ];

  return (
    <div className="mx-6 mb-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Pre-Trip Compliance Requirements (Must Be Completed Before Dispatch)
          </h3>
        </div>
        <div className="text-sm font-medium text-slate-400">
          {completedCount} / 8 Complete
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-4 px-4 py-3 rounded-lg border flex items-center gap-3 ${
        allComplete 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        {allComplete ? (
          <>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">
              Pre-Trip Requirements Complete — Driver Eligible for Dispatch
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium">
              Pre-Trip Requirements Incomplete — Dispatch Will Be Blocked
            </span>
          </>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <button
              onClick={() => toggleItem(item.key)}
              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                checklistState[item.key]
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-blue-400/50 hover:border-blue-400'
              }`}
            >
              {checklistState[item.key] && <CheckCircle className="w-3 h-3 text-white" />}
            </button>
            <span className={`text-sm ${
              checklistState[item.key] ? 'text-slate-500 line-through' : 'text-slate-200'
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
