"use client";

import { Send } from "lucide-react";
import type { DispatchButtonProps } from "./types";

export function DispatchButton({ load, checklistState, onDispatch, dispatchInProgress }: DispatchButtonProps) {
  const allComplete = Object.values(checklistState).every(Boolean);
  const isDisabled = !allComplete || dispatchInProgress;

  const handleClick = () => {
    if (!allComplete) {
      // Show inline warning instead of opening modal
      alert("Dispatch Blocked — Complete Pre-Trip Requirements First.");
      return;
    }
    
    if (load.driverId === "DRV-000") {
      // No driver assigned
      alert("Cannot dispatch — No driver assigned to this load.");
      return;
    }
    
    onDispatch(load);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
        isDisabled
          ? 'bg-slate-700/50 text-slate-500 border border-slate-600/50 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-500/30 hover:from-blue-600 hover:to-blue-700'
      }`}
    >
      {dispatchInProgress ? (
        <>
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          Dispatching...
        </>
      ) : (
        <>
          <Send className="w-3 h-3" />
          Dispatch Driver
        </>
      )}
    </button>
  );
}
