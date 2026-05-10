"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface DebugInfo {
  buildSource: string;
  gitCommit?: string;
  dataSource: string;
  localStorageActive: boolean;
  staleDataDetected: boolean;
  mapboxTokenDetected: boolean;
  headerMode: "marketing" | "demo";
  pathname: string;
}

export function BofDebugBanner() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only show in development or when flag is set
    const isDevelopment = process.env.NODE_ENV === "development";
    const showDebug = process.env.NEXT_PUBLIC_BOF_SHOW_DEBUG === "1";
    
    if (!isDevelopment && !showDebug) {
      return;
    }

    // Detect header mode
    const marketingOnlyPaths = new Set([
      "/",
      "/for-hire-carriers",
      "/private-fleets", 
      "/government",
      "/bof-vault",
      "/book-assessment",
      "/apply",
      "/fleet-savings",
    ]);
    const headerMode = marketingOnlyPaths.has(pathname) ? "marketing" : "demo";

    // Check localStorage state
    let localStorageActive = false;
    let staleDataDetected = false;
    
    try {
      const stored = localStorage.getItem("bof-demo-data-v1");
      if (stored) {
        localStorageActive = true;
        const parsed = JSON.parse(stored);
        if (parsed.settlements) {
          // Check if any settlements have zero deductions but should have deductions
          staleDataDetected = parsed.settlements.some((s: { deductions?: number; totalDeductions?: number; grossPay?: number; netPay?: number }) => {
            const hasDeductionData = (s.deductions && s.deductions > 0) || (s.totalDeductions && s.totalDeductions > 0);
            const grossMinusNet = s.grossPay && s.netPay ? (s.grossPay - s.netPay) > 0 : false;
            return !hasDeductionData && grossMinusNet;
          });
        }
      }
    } catch (err) {
      console.warn("Debug: localStorage check failed", err);
    }

    // Check Mapbox token
    const mapboxTokenDetected = !!(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN);

    // Get git commit if available
    let gitCommit;
    try {
      // This would need to be injected at build time
      gitCommit = process.env.NEXT_PUBLIC_GIT_COMMIT || "unknown";
    } catch (error) {
      gitCommit = "unknown";
    }

    setDebugInfo({
      buildSource: isDevelopment ? "local/dev" : "production",
      gitCommit,
      dataSource: "main-source-v2_enhanced_bof_aligned.xlsx",
      localStorageActive,
      staleDataDetected,
      mapboxTokenDetected,
      headerMode,
      pathname,
    });
  }, [pathname]);

  // Don't render if no debug info or conditions not met
  if (!debugInfo) {
    return null;
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  const showDebug = process.env.NEXT_PUBLIC_BOF_SHOW_DEBUG === "1";
  
  if (!isDevelopment && !showDebug) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 max-w-md z-50 shadow-lg">
      <div className="font-bold text-teal-400 mb-2">🔍 BOF Debug Info</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-slate-400">Build:</span> {debugInfo.buildSource}
        </div>
        
        {debugInfo.gitCommit && debugInfo.gitCommit !== "unknown" && (
          <div>
            <span className="text-slate-400">Commit:</span> {debugInfo.gitCommit.substring(0, 8)}
          </div>
        )}
        
        <div>
          <span className="text-slate-400">Data:</span> {debugInfo.dataSource}
        </div>
        
        <div>
          <span className="text-slate-400">Storage:</span> {debugInfo.localStorageActive ? "🟢 localStorage" : "🔵 seed"}
          {debugInfo.staleDataDetected && <span className="text-amber-400 ml-1">⚠️ stale</span>}
        </div>
        
        <div>
          <span className="text-slate-400">Mapbox:</span> {debugInfo.mapboxTokenDetected ? "🟢 detected" : "🔴 missing"}
        </div>
        
        <div>
          <span className="text-slate-400">Header:</span> {debugInfo.headerMode}
        </div>
        
        <div>
          <span className="text-slate-400">Route:</span> {debugInfo.pathname}
        </div>
      </div>
      
      {(debugInfo.staleDataDetected || !debugInfo.mapboxTokenDetected) && (
        <div className="mt-2 pt-2 border-t border-slate-700 text-amber-400">
          ⚠️ Issues detected
        </div>
      )}
    </div>
  );
}
