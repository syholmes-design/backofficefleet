"use client";

import { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";
import type { PreDispatchVerificationState, PreDispatchModalProps } from "./types";

export function PreDispatchModal({ load, onClose, onDispatch }: PreDispatchModalProps) {
  const [verificationState, setVerificationState] = useState<PreDispatchVerificationState>({
    driverConfirmedAvailable: null,
    driverProvidedCurrentHos: null,
    driverReportedNoEquipmentIssues: null,
    driverUnderstandsPickupDeliveryTimes: null,
    driverHasCorrectTrailer: null,
    driverAcceptedTrackingLink: null,
    driverHasRequiredPpe: null,
    driverConfirmedNoSafetyRestrictions: null
  });

  const toggleVerification = (key: keyof PreDispatchVerificationState, value: boolean) => {
    setVerificationState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const allAnswered = Object.values(verificationState).every(val => val !== null);
  const allYes = allAnswered && Object.values(verificationState).every(val => val === true);
  const hasNoAnswer = Object.values(verificationState).some(val => val === false);

  const verificationQuestions = [
    { 
      key: 'driverConfirmedAvailable' as keyof PreDispatchVerificationState, 
      question: 'Driver confirmed available' 
    },
    { 
      key: 'driverProvidedCurrentHos' as keyof PreDispatchVerificationState, 
      question: 'Driver provided current HOS' 
    },
    { 
      key: 'driverReportedNoEquipmentIssues' as keyof PreDispatchVerificationState, 
      question: 'Driver reported no equipment issues' 
    },
    { 
      key: 'driverUnderstandsPickupDeliveryTimes' as keyof PreDispatchVerificationState, 
      question: 'Driver understands pickup/delivery times' 
    },
    { 
      key: 'driverHasCorrectTrailer' as keyof PreDispatchVerificationState, 
      question: 'Driver has correct trailer' 
    },
    { 
      key: 'driverAcceptedTrackingLink' as keyof PreDispatchVerificationState, 
      question: 'Driver accepted tracking link' 
    },
    { 
      key: 'driverHasRequiredPpe' as keyof PreDispatchVerificationState, 
      question: 'Driver has required PPE' 
    },
    { 
      key: 'driverConfirmedNoSafetyRestrictions' as keyof PreDispatchVerificationState, 
      question: 'Driver confirmed no safety restrictions' 
    }
  ];

  const handleDispatch = () => {
    if (allYes) {
      onDispatch(verificationState);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Pre-Dispatch Verification Required
                </h2>
                <div className="text-sm text-slate-400">
                  {load.id} · {load.driver}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Banner */}
            {hasNoAnswer && (
              <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">
                  Dispatch cannot proceed until all pre-trip requirements are met.
                </span>
              </div>
            )}

            {/* Verification Questions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Please confirm all pre-dispatch requirements:
              </h3>
              
              {verificationQuestions.map((item) => (
                <div key={item.key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-200 mb-3">{item.question}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleVerification(item.key, true)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        verificationState[item.key] === true
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => toggleVerification(item.key, false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        verificationState[item.key] === false
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={!allYes}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  allYes
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                Dispatch Driver
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
