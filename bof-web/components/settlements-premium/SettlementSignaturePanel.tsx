"use client";

import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface SettlementSignaturePanelProps {
  selectedDriver?: DriverSettlementRow | null;
  settlementDate?: string;
}

export function SettlementSignaturePanel({ selectedDriver, settlementDate }: SettlementSignaturePanelProps) {
  const currentDate = settlementDate || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-6 text-center">
        Settlement Statement Signatures
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Driver Signature Column */}
        <div className="text-center">
          <div className="mb-4">
            <div className="h-px bg-slate-400 mb-2"></div>
            <p className="text-xs text-slate-400 mb-1">Driver Signature</p>
            {selectedDriver && (
              <p className="text-sm text-slate-300 font-medium">{selectedDriver.driverName}</p>
            )}
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Disputes must be submitted in writing</p>
            <p>within 5 business days</p>
          </div>
          <div className="mt-3">
            <div className="h-px bg-slate-400 mb-1"></div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="text-xs text-slate-300">{currentDate}</p>
          </div>
        </div>

        {/* Controller Signature Column */}
        <div className="text-center">
          <div className="mb-4">
            <div className="h-12 flex items-center justify-center">
              <p className="text-2xl text-amber-400 font-dancing-script" style={{ fontFamily: 'var(--font-dancing-script)' }}>
                Earnest Roscoe
              </p>
            </div>
            <div className="h-px bg-slate-400 mb-2"></div>
            <p className="text-xs text-slate-400">Earnest Roscoe — Controller</p>
            <p className="text-xs text-slate-500">Delta Advanced Trucking, Inc.</p>
          </div>
          <div className="mt-3">
            <div className="h-px bg-slate-400 mb-1"></div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="text-xs text-slate-300">{currentDate}</p>
          </div>
        </div>

        {/* Owner Signature Column */}
        <div className="text-center">
          <div className="mb-4">
            <div className="h-12 flex items-center justify-center">
              <p className="text-2xl text-amber-400 font-dancing-script" style={{ fontFamily: 'var(--font-dancing-script)' }}>
                Robert Daley
              </p>
            </div>
            <div className="h-px bg-slate-400 mb-2"></div>
            <p className="text-xs text-slate-400">Robert Daley — Owner</p>
            <p className="text-xs text-slate-500">Delta Advanced Trucking, Inc.</p>
          </div>
          <div className="mt-3">
            <div className="h-px bg-slate-400 mb-1"></div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="text-xs text-slate-300">{currentDate}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          This settlement statement is provided for driver review. Signature indicates acknowledgment of payment amounts and agreement with the terms outlined.
        </p>
      </div>
    </div>
  );
}
