"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock, 
  XCircle,
  AlertOctagon,
  FileText,
  DollarSign,
  Truck,
  Wrench,
  User,
  Target,
  Activity,
  Filter,
  Eye
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { OperationalRiskQueue } from "@/lib/v3-operational-types";

export function CommandCenterV4() {
  const [operationalRisks, setOperationalRisks] = useState<OperationalRiskQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUsingFallback] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Load V4 workbook data
  useEffect(() => {
    loadWorkbookData();
  }, []);

  const loadWorkbookData = async () => {
    try {
      setLoading(true);
      setUsingFallback(false);
      
      const v3Available = await isV3DataAvailable();
      
      if (v3Available) {
        console.log('📊 Loading V4 operational risk data...');
        const v3Data = await getV3OperationalData();
        
        setOperationalRisks(v3Data.operationalRiskQueue);
        
        console.log(`✅ Loaded ${v3Data.operationalRiskQueue.length} Operational Risks from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 operational risk data:', err);
      setError(err instanceof Error ? err.message : "Failed to load operational risk data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback operational risk data - V4 workbook not available');
    setUsingFallback(true);
    setOperationalRisks([]);
  };

  // Calculate risk statistics
  const riskStats = useMemo(() => {
    const totalRisks = operationalRisks.length;
    const openRisks = operationalRisks.filter(r => r.status === "Open" || r.status === "In Progress").length;
    const criticalRisks = operationalRisks.filter(r => r.severity === "Critical").length;
    const dispatchBlockingRisks = operationalRisks.filter(r => r.dispatchImpact === "Blocked").length;
    const settlementImpactingRisks = operationalRisks.filter(r => r.settlementImpact === "Hold" || r.settlementImpact === "Delayed").length;
    const complianceImpactingRisks = operationalRisks.filter(r => r.complianceImpact === "Violation" || r.complianceImpact === "Audit Required").length;
    const insuranceImpactingRisks = operationalRisks.filter(r => r.insuranceImpact === "Claim Required" || r.insuranceImpact === "Premium Impact").length;
    const managerActionRequired = operationalRisks.filter(r => r.managerActionRequired).length;
    
    // Calculate overdue/soon due risks
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const overdueRisks = operationalRisks.filter(r => {
      if (!r.dueDate) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate < now;
    }).length;
    
    const dueSoonRisks = operationalRisks.filter(r => {
      if (!r.dueDate) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).length;
    
    // Risks by module
    const risksByModule = operationalRisks.reduce((acc, risk) => {
      acc[risk.module] = (acc[risk.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRisks,
      openRisks,
      criticalRisks,
      dispatchBlockingRisks,
      settlementImpactingRisks,
      complianceImpactingRisks,
      insuranceImpactingRisks,
      managerActionRequired,
      overdueRisks,
      dueSoonRisks,
      risksByModule,
    };
  }, [operationalRisks]);

  // Filter risks by module
  const filteredRisks = useMemo(() => {
    if (selectedModule === 'all') return operationalRisks;
    return operationalRisks.filter(r => r.module === selectedModule);
  }, [operationalRisks, selectedModule]);

  // Get risks needing attention (prioritized)
  const risksNeedingAttention = useMemo(() => {
    return filteredRisks
      .filter(r => r.status === "Open" || r.status === "In Progress")
      .sort((a, b) => {
        // Priority: Critical > Manager Action Required > Due Soon > Severity
        const getPriority = (risk: OperationalRiskQueue) => {
          let priority = 0;
          if (risk.severity === "Critical") priority += 1000;
          if (risk.managerActionRequired) priority += 500;
          if (risk.dueDate) {
            const dueDate = new Date(risk.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) priority += 300; // Overdue
            else if (daysUntilDue <= 3) priority += 200; // Due soon
            else if (daysUntilDue <= 7) priority += 100; // Due this week
          }
          if (risk.dispatchImpact === "Blocked") priority += 50;
          if (risk.complianceImpact === "Violation") priority += 40;
          if (risk.settlementImpact === "Hold") priority += 30;
          if (risk.insuranceImpact === "Claim Required") priority += 20;
          return priority;
        };
        return getPriority(b) - getPriority(a);
      })
      .slice(0, 20);
  }, [filteredRisks]);

  // Get severity badge color
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get impact badge color
  const getImpactBadgeClass = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'blocked':
      case 'hold':
      case 'violation':
      case 'claim required':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'delayed':
      case 'audit required':
      case 'premium impact':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'at risk':
      case 'review required':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'none':
      case 'minimal':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get module icon
  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'dispatch':
        return <Truck className="w-4 h-4" />;
      case 'settlements':
        return <DollarSign className="w-4 h-4" />;
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'drivers':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading operational risk data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load operational risk data</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div
        className="relative overflow-hidden border-b border-slate-800 bg-slate-950"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(2, 6, 23, 0.97) 0%, rgba(2, 6, 23, 0.88) 45%, rgba(2, 6, 23, 0.42) 100%), url('/generated/marketing/dispatch-command-center-hero.png')",
          backgroundPosition: "center right",
          backgroundSize: "cover",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                <Activity className="h-3.5 w-3.5" />
                Fleet-owner action board
              </div>
              <h1 className="mt-5 flex items-center gap-3 text-4xl font-bold text-white">
                <Target className="h-9 w-9 text-red-400" />
                Fleet Operations Control Tower
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                One operating view for load exceptions, driver blockers, settlement holds,
                safety risk, claims exposure, and the manager actions needed to keep Delta
                Advanced Trucking moving.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-xl border border-red-400/25 bg-slate-950/70 p-4 text-right shadow-lg shadow-slate-950/30">
                <div className="text-2xl font-bold text-red-300">{riskStats.criticalRisks}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Critical risks</div>
              </div>
              <div className="rounded-xl border border-orange-400/25 bg-slate-950/70 p-4 text-right shadow-lg shadow-slate-950/30">
                <div className="text-2xl font-bold text-orange-300">{riskStats.dispatchBlockingRisks}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Dispatch blocks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Open Risks</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.openRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">of {riskStats.totalRisks} total risks</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Critical Risks</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.criticalRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Immediate attention required</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Dispatch Blocking</span>
              <Truck className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.dispatchBlockingRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Operations blocked</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Manager Action</span>
              <User className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.managerActionRequired}
            </div>
            <div className="text-xs text-slate-500 mt-1">Owner review required</div>
          </div>
        </div>

        {/* Finance Summary - Factoring Packets */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Finance Summary - Factoring Packets
            </h3>
            <span className="text-xs text-slate-500">Post-trip AR workflow status</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Ready to Submit</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-green-400">1</div>
              <div className="text-xs text-slate-500 mt-1">L011 packet complete</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Missing POD/BOL</span>
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-red-400">0</div>
              <div className="text-xs text-slate-500 mt-1">No critical proof gaps</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Held Due to Issues</span>
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-yellow-400">1</div>
              <div className="text-xs text-slate-500 mt-1">L011 settlement hold</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              <span>Post-trip factoring packets include invoice, rate confirmation, BOL, POD, seal verification, and accessorial support documents</span>
            </div>
          </div>
        </div>

        {/* Impact Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Settlement Impact</span>
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.settlementImpactingRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Payment delays/holds</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Compliance Impact</span>
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.complianceImpactingRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Violations/audits</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Insurance Impact</span>
              <FileText className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.insuranceImpactingRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Claims/premiums</div>
          </div>
        </div>

        {/* Due Date Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Overdue</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.overdueRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Past due dates</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Due Soon</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.dueSoonRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Next 3 days</div>
          </div>
        </div>
      </div>

      {/* Module Filter */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm">Filter by module:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedModule('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedModule === 'all'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                All ({riskStats.totalRisks})
              </button>
              {Object.entries(riskStats.risksByModule).map(([module, count]) => (
                <button
                  key={module}
                  onClick={() => setSelectedModule(module)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors flex items-center gap-1 ${
                    selectedModule === module
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {getModuleIcon(module)}
                  {module} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risks Needing Attention */}
      {risksNeedingAttention.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-400" />
              Risks Needing Attention
              <span className="text-sm text-slate-400 font-normal">
                ({risksNeedingAttention.length} prioritized risks)
              </span>
            </h3>
            <div className="space-y-4">
              {risksNeedingAttention.map((risk) => (
                <div key={risk.riskId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityBadgeClass(risk.severity)}`}>
                        {risk.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(risk.dispatchImpact)}`}>
                        Dispatch: {risk.dispatchImpact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(risk.settlementImpact)}`}>
                        Settlement: {risk.settlementImpact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(risk.complianceImpact)}`}>
                        Compliance: {risk.complianceImpact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(risk.insuranceImpact)}`}>
                        Insurance: {risk.insuranceImpact}
                      </span>
                      {risk.managerActionRequired && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Manager Action Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      {getModuleIcon(risk.module)}
                      <span>{risk.module}</span>
                      <span>•</span>
                      <span>{risk.riskType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-white font-medium mb-1">Affected Entities</div>
                      <div className="text-slate-400 text-sm">
                        {risk.driverId && <div>Driver: {risk.driverId}</div>}
                        {risk.loadId && <div>Load: {risk.loadId}</div>}
                        {risk.assetId && <div>Asset: {risk.assetId}</div>}
                        {risk.relatedEventId && <div>Event: {risk.relatedEventId}</div>}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-white font-medium mb-1">Business Impact</div>
                      <div className="text-slate-400 text-sm">{risk.businessImpact}</div>
                      <div className="text-slate-400 text-sm">Status: {risk.status}</div>
                      <div className="text-slate-400 text-sm">Resolution: {risk.resolutionStatus}</div>
                    </div>
                    
                    <div>
                      <div className="text-white font-medium mb-1">Action Details</div>
                      <div className="text-slate-400 text-sm">Assigned: {risk.assignedTo}</div>
                      <div className="text-slate-400 text-sm">Due: {formatDisplayDate(risk.dueDate)}</div>
                      {risk.resolvedDate && (
                        <div className="text-slate-400 text-sm">Resolved: {formatDisplayDate(risk.resolvedDate)}</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-700 rounded p-3">
                    <div className="text-white font-medium mb-2">Recommended Action</div>
                    <div className="text-slate-300 text-sm">{risk.recommendedAction}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risks by Module Summary */}
      {Object.keys(riskStats.risksByModule).length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Risk Summary by Module
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(riskStats.risksByModule).map(([module, count]) => {
                const moduleRisks = operationalRisks.filter(r => r.module === module);
                const criticalCount = moduleRisks.filter(r => r.severity === "Critical").length;
                const managerActionCount = moduleRisks.filter(r => r.managerActionRequired).length;
                
                return (
                  <div key={module} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {getModuleIcon(module)}
                      <div className="text-white font-medium">{module}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Risks:</span>
                        <span className="text-white">{count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Critical:</span>
                        <span className="text-red-400">{criticalCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Manager Action:</span>
                        <span className="text-yellow-400">{managerActionCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
