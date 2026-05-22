"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  XCircle,
  AlertOctagon,
  FileText,
  DollarSign,
  Truck,
  User,
  Activity,
  Filter,
  Eye,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { ComplianceActionQueue } from "@/lib/v3-operational-types";

export function ComplianceDashboardV4() {
  const [complianceActions, setComplianceActions] = useState<ComplianceActionQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedComplianceArea, setSelectedComplianceArea] = useState<string>('all');

  // Load V4 workbook data
  // Workbook loaders are local async routines; keep this as a one-time bootstrap.
  useEffect(() => {
    loadWorkbookData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkbookData = async () => {
    try {
      setLoading(true);
      setUsingFallback(false);
      
      const v3Available = await isV3DataAvailable();
      
      if (v3Available) {
        console.log('📊 Loading V4 compliance action data...');
        const v3Data = await getV3OperationalData();
        
        setComplianceActions(v3Data.complianceActionQueue);
        
        console.log(`✅ Loaded ${v3Data.complianceActionQueue.length} Compliance Actions from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 compliance action data:', err);
      setError(err instanceof Error ? err.message : "Failed to load compliance action data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback compliance action data - V4 workbook not available');
    setUsingFallback(true);
    setComplianceActions([]);
  };

  // Calculate compliance statistics
  const complianceStats = useMemo(() => {
    const totalActions = complianceActions.length;
    const openActions = complianceActions.filter(a => a.status === "Open" || a.status === "In Progress").length;
    const criticalActions = complianceActions.filter(a => a.severity === "Critical").length;
    const highActions = complianceActions.filter(a => a.severity === "High").length;
    const dispatchBlockingActions = complianceActions.filter(a => a.dispatchEligibilityImpact === "Blocked").length;
    const settlementImpactingActions = complianceActions.filter(a => a.settlementImpact === "Hold" || a.settlementImpact === "Delayed").length;
    const managerActionRequired = complianceActions.filter(a => a.managerActionRequired).length;
    
    // Calculate overdue/soon due actions
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const overdueActions = complianceActions.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate < now;
    }).length;
    
    const dueSoonActions = complianceActions.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).length;
    
    // Actions by compliance area
    const actionsByComplianceArea = complianceActions.reduce((acc, action) => {
      acc[action.complianceArea] = (acc[action.complianceArea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Actions by driver
    const actionsByDriver = complianceActions.reduce((acc, action) => {
      acc[action.driverId] = (acc[action.driverId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalActions,
      openActions,
      criticalActions,
      highActions,
      dispatchBlockingActions,
      settlementImpactingActions,
      managerActionRequired,
      overdueActions,
      dueSoonActions,
      actionsByComplianceArea,
      actionsByDriver,
    };
  }, [complianceActions]);

  // Filter actions by driver and compliance area
  const filteredActions = useMemo(() => {
    let filtered = complianceActions;
    
    if (selectedDriver !== 'all') {
      filtered = filtered.filter(a => a.driverId === selectedDriver);
    }
    
    if (selectedComplianceArea !== 'all') {
      filtered = filtered.filter(a => a.complianceArea === selectedComplianceArea);
    }
    
    return filtered;
  }, [complianceActions, selectedDriver, selectedComplianceArea]);

  // Get actions needing attention (prioritized)
  const actionsNeedingAttention = useMemo(() => {
    return filteredActions
      .filter(a => a.status === "Open" || a.status === "In Progress")
      .sort((a, b) => {
        // Priority: Critical > Manager Action Required > Due Soon > Severity > Days Until Due
        const getPriority = (action: ComplianceActionQueue) => {
          let priority = 0;
          if (action.severity === "Critical") priority += 1000;
          if (action.severity === "High") priority += 800;
          if (action.managerActionRequired) priority += 500;
          if (action.dueDate) {
            const dueDate = new Date(action.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) priority += 300; // Overdue
            else if (daysUntilDue <= 3) priority += 200; // Due soon
            else if (daysUntilDue <= 7) priority += 100; // Due this week
          }
          if (action.dispatchEligibilityImpact === "Blocked") priority += 50;
          if (action.settlementImpact === "Hold") priority += 40;
          if (action.settlementImpact === "Delayed") priority += 30;
          if (action.daysUntilDue < 0) priority += 20; // Overdue
          return priority;
        };
        return getPriority(b) - getPriority(a);
      })
      .slice(0, 20);
  }, [filteredActions]);

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
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'delayed':
      case 'at risk':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'review required':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ready':
      case 'none':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getActionLinkLabel = (action: ComplianceActionQueue) => {
    const text = `${action.driverId} ${action.complianceArea} ${action.documentType} ${action.issueType}`.toLowerCase();
    if (text.includes("seal")) return "Review seal proof stack";
    if (text.includes("lumper") || text.includes("zelle")) return "Open QR lumper closeout";
    if (text.includes("hos") || text.includes("coaching")) return "Open driver follow-up";
    if (text.includes("pre-trip") || text.includes("photo")) return "Open proof workflow";
    if (text.includes("medical")) return "Open medical verification";
    return "Open fix path";
  };

  // Get compliance area icon
  const getComplianceAreaIcon = (area: string) => {
    switch (area.toLowerCase()) {
      case 'documents':
        return <FileText className="w-4 h-4" />;
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'dispatch':
        return <Truck className="w-4 h-4" />;
      case 'settlements':
        return <DollarSign className="w-4 h-4" />;
      case 'compliance':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading V4 compliance action data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load compliance action data</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Fallback Warning Banner */}
      {usingFallback && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">Using Fallback Data</p>
                <p className="text-yellow-300 text-sm">
                  V4 workbook data not available - displaying sample operating data
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                Compliance & Document Action Center (V4)
              </h1>
              <p className="text-slate-400 mt-2">
                Fix the &quot;Needs Review but why?&quot; problem - Clear compliance actions and document requirements from V4 workbook
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-red-400 font-medium">{complianceStats.criticalActions}</div>
                <div className="text-slate-400 text-xs">Critical Actions</div>
              </div>
              <div className="text-right">
                <div className="text-orange-400 font-medium">{complianceStats.dispatchBlockingActions}</div>
                <div className="text-slate-400 text-xs">Dispatch Blocking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Actions</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.totalActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Compliance actions required</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Critical & High</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.criticalActions + complianceStats.highActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Immediate attention required</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Dispatch Blocking</span>
              <Truck className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.dispatchBlockingActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Operations blocked</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Manager Action</span>
              <User className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.managerActionRequired}
            </div>
            <div className="text-xs text-slate-500 mt-1">Owner review required</div>
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
              {complianceStats.settlementImpactingActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Payment delays/holds</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Overdue</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.overdueActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Past due dates</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Due Soon</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {complianceStats.dueSoonActions}
            </div>
            <div className="text-xs text-slate-500 mt-1">Next 3 days</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm">Filter:</span>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Driver:</span>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
              >
                <option value="all">All Drivers ({complianceStats.totalActions})</option>
                {Object.entries(complianceStats.actionsByDriver).map(([driverId, count]) => (
                  <option key={driverId} value={driverId}>
                    {driverId} ({count})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Area:</span>
              <select
                value={selectedComplianceArea}
                onChange={(e) => setSelectedComplianceArea(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white"
              >
                <option value="all">All Areas ({complianceStats.totalActions})</option>
                {Object.entries(complianceStats.actionsByComplianceArea).map(([area, count]) => (
                  <option key={area} value={area}>
                    {area} ({count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Needing Attention */}
      {actionsNeedingAttention.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-400" />
              Compliance Actions Requiring Attention
              <span className="text-sm text-slate-400 font-normal">
                ({actionsNeedingAttention.length} prioritized actions)
              </span>
            </h3>
            <div className="space-y-4">
              {actionsNeedingAttention.map((action) => (
                <div key={action.actionId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityBadgeClass(action.severity)}`}>
                        {action.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(action.dispatchEligibilityImpact)}`}>
                        Dispatch: {action.dispatchEligibilityImpact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(action.settlementImpact)}`}>
                        Settlement: {action.settlementImpact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(action.status)}`}>
                        {action.status}
                      </span>
                      {action.managerActionRequired && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Manager Action Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      {getComplianceAreaIcon(action.complianceArea)}
                      <span>{action.complianceArea}</span>
                      <span>•</span>
                      <span>{action.issueType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-white font-medium mb-1">Driver Information</div>
                      <div className="text-slate-400 text-sm">
                        <div>Driver: {action.driverName} ({action.driverId})</div>
                        <div>Document: {action.documentType}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-white font-medium mb-1">Timeline</div>
                      <div className="text-slate-400 text-sm">
                        <div>Due: {formatDisplayDate(action.dueDate)}</div>
                        <div>Days until due: {action.daysUntilDue}</div>
                        {action.lastReviewedDate && (
                          <div>Last reviewed: {formatDisplayDate(action.lastReviewedDate)}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-white font-medium mb-1">Assignment</div>
                      <div className="text-slate-400 text-sm">
                        <div>Assigned to: {action.assignedTo}</div>
                        {action.lastReviewedBy && (
                          <div>Reviewed by: {action.lastReviewedBy}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-700 rounded p-3 mb-3">
                    <div className="text-white font-medium mb-2">Required Fix</div>
                    <div className="text-slate-300 text-sm">{action.requiredFix}</div>
                  </div>

                  {action.fixLink && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={action.fixLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {getActionLinkLabel(action)}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary by Compliance Area */}
      {Object.keys(complianceStats.actionsByComplianceArea).length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Compliance Summary by Area
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(complianceStats.actionsByComplianceArea).map(([area, count]) => {
                const areaActions = complianceActions.filter(a => a.complianceArea === area);
                const criticalCount = areaActions.filter(a => a.severity === "Critical").length;
                const managerActionCount = areaActions.filter(a => a.managerActionRequired).length;
                
                return (
                  <div key={area} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {getComplianceAreaIcon(area)}
                      <div className="text-white font-medium">{area}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Actions:</span>
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
