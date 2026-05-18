"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Camera,
  Truck,
  AlertOctagon,
  TrendingUp,
  Building,
  FileText
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { Asset, MaintenanceWorkOrder } from "@/lib/v3-operational-types";

export function MaintenanceDashboardV4() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

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
        console.log('📊 Loading V4 operational maintenance data...');
        const v3Data = await getV3OperationalData();
        
        setAssets(v3Data.assets);
        setWorkOrders(v3Data.maintenanceWorkOrders);
        
        console.log(`✅ Loaded ${v3Data.assets.length} Assets and ${v3Data.maintenanceWorkOrders.length} Maintenance Work Orders from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 maintenance data:', err);
      setError(err instanceof Error ? err.message : "Failed to load maintenance data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback maintenance data - V4 workbook not available');
    setUsingFallback(true);
    setAssets([]);
    setWorkOrders([]);
  };

  // Calculate maintenance statistics
  const maintenanceStats = useMemo(() => {
    const totalAssets = assets.length;
    const readyAssets = assets.filter(a => a.readinessStatus === "Ready").length;
    const atRiskAssets = assets.filter(a => a.readinessStatus === "At Risk").length;
    const blockedAssets = assets.filter(a => a.readinessStatus === "Blocked").length;
    const oosAssets = assets.filter(a => a.readinessStatus === "OOS").length;
    
    const openWorkOrders = workOrders.filter(wo => wo.repairStatus === "Open" || wo.repairStatus === "In Progress").length;
    const dispatchBlockingWorkOrders = workOrders.filter(wo => wo.dispatchBlock).length;
    const dotImpactingWorkOrders = workOrders.filter(wo => wo.dotImpact).length;
    const managerActionRequired = workOrders.filter(wo => wo.managerActionRequired).length;
    
    const pmDueSoon = assets.filter(a => {
      if (!a.nextPmDue) return false;
      const pmDate = new Date(a.nextPmDue);
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      return pmDate <= twoWeeksFromNow && pmDate >= new Date();
    }).length;
    
    const pmOverdue = assets.filter(a => {
      if (!a.nextPmDue) return false;
      const pmDate = new Date(a.nextPmDue);
      return pmDate < new Date();
    }).length;
    
    const estimatedCost = workOrders.reduce((sum, wo) => sum + wo.estimatedCost, 0);
    const actualCost = workOrders.reduce((sum, wo) => sum + wo.actualCost, 0);
    
    return {
      totalAssets,
      readyAssets,
      atRiskAssets,
      blockedAssets,
      oosAssets,
      openWorkOrders,
      dispatchBlockingWorkOrders,
      dotImpactingWorkOrders,
      managerActionRequired,
      pmDueSoon,
      pmOverdue,
      estimatedCost,
      actualCost,
    };
  }, [assets, workOrders]);

  // Get work orders needing attention
  const workOrdersNeedingAttention = useMemo(() => {
    return workOrders
      .filter(wo => wo.dispatchBlock || wo.dotImpact || wo.managerActionRequired)
      .sort((a, b) => {
        // Priority: DOT Impact > Dispatch Block > Manager Action
        const getPriority = (wo: MaintenanceWorkOrder) => {
          if (wo.dotImpact) return 3;
          if (wo.dispatchBlock) return 2;
          if (wo.managerActionRequired) return 1;
          return 0;
        };
        return getPriority(b) - getPriority(a);
      })
      .slice(0, 10);
  }, [workOrders]);

  // Get asset readiness summary
  const assetReadinessSummary = useMemo(() => {
    return assets.map(asset => {
      const assetWorkOrders = workOrders.filter(wo => wo.assetId === asset.assetId);
      const openWorkOrders = assetWorkOrders.filter(wo => wo.repairStatus === "Open" || wo.repairStatus === "In Progress");
      const dispatchBlocking = assetWorkOrders.some(wo => wo.dispatchBlock);
      const dotImpacting = assetWorkOrders.some(wo => wo.dotImpact);
      
      return {
        ...asset,
        openWorkOrdersCount: openWorkOrders.length,
        dispatchBlocking,
        dotImpacting,
        workOrders: assetWorkOrders,
      };
    });
  }, [assets, workOrders]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get readiness badge color
  const getReadinessBadgeClass = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'At Risk':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Blocked':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'OOS':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading V4 maintenance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load maintenance data</p>
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
                  V4 workbook data not available - displaying sample data for demonstration
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
                <Wrench className="w-8 h-8 text-blue-400" />
                Maintenance Command Center (V4)
              </h1>
              <p className="text-slate-400 mt-2">
                Fleet asset management, work orders, and maintenance operations from V4 operational workbook
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-orange-400 font-medium">{maintenanceStats.dispatchBlockingWorkOrders}</div>
                <div className="text-slate-400 text-xs">Dispatch Blocking</div>
              </div>
              <div className="text-right">
                <div className="text-red-400 font-medium">{maintenanceStats.dotImpactingWorkOrders}</div>
                <div className="text-slate-400 text-xs">DOT Impacting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Units Ready</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {maintenanceStats.readyAssets}
            </div>
            <div className="text-xs text-slate-500 mt-1">of {maintenanceStats.totalAssets} total assets</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">PM Due Soon</span>
              <Calendar className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {maintenanceStats.pmDueSoon}
            </div>
            <div className="text-xs text-slate-500 mt-1">Next 14 days</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">PM Overdue</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {maintenanceStats.pmOverdue}
            </div>
            <div className="text-xs text-slate-500 mt-1">Preventive maintenance required</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Open Work Orders</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {maintenanceStats.openWorkOrders}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active maintenance issues</div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Estimated Cost</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(maintenanceStats.estimatedCost)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total work order estimates</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Actual Cost</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(maintenanceStats.actualCost)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Completed work order costs</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Manager Actions</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {maintenanceStats.managerActionRequired}
            </div>
            <div className="text-xs text-slate-500 mt-1">Requiring manager review</div>
          </div>
        </div>
      </div>

      {/* Work Orders Needing Attention */}
      {workOrdersNeedingAttention.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Work Orders Requiring Attention
            </h3>
            <div className="space-y-3">
              {workOrdersNeedingAttention.map((workOrder) => (
                <div key={workOrder.workOrderId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityBadgeClass(workOrder.severity)}`}>
                          {workOrder.severity}
                        </span>
                        {workOrder.dispatchBlock && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Dispatch Blocked
                          </span>
                        )}
                        {workOrder.dotImpact && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            DOT Impact
                          </span>
                        )}
                        {workOrder.managerActionRequired && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Manager Action Required
                          </span>
                        )}
                        <span className="text-slate-400 text-sm">{workOrder.issueType}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-white font-medium mb-1">{workOrder.assetId}</div>
                          <div className="text-slate-400 text-sm">
                            {workOrder.driverId && `Driver: ${workOrder.driverId} • `}
                            Reported: {formatDisplayDate(workOrder.reportedDate)}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Source: {workOrder.source} • Mileage: {workOrder.mileage.toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-slate-300 text-sm mb-1">{workOrder.defectDescription}</div>
                          <div className="text-slate-400 text-sm">
                            Vendor: {workOrder.vendorName} • Status: {workOrder.repairStatus}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Est: {formatCurrency(workOrder.estimatedCost)} • 
                            Actual: {formatCurrency(workOrder.actualCost)}
                          </div>
                        </div>
                      </div>

                      {/* Repair Schedule */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Scheduled:</span>
                          <span className="text-white ml-2">{formatDisplayDate(workOrder.scheduledRepairDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Completed:</span>
                          <span className="text-white ml-2">{formatDisplayDate(workOrder.completedDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Next PM:</span>
                          <span className="text-white ml-2">{formatDisplayDate(workOrder.nextPmDue)}</span>
                        </div>
                      </div>

                      {/* Photo Evidence */}
                      {workOrder.photoEvidenceUrl && (
                        <div className="mt-3">
                          <a 
                            href={workOrder.photoEvidenceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <Camera className="w-4 h-4" />
                            View Photo Evidence
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asset Readiness Summary */}
      {assetReadinessSummary.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Asset Readiness Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Driver</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Location</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Readiness</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Open WOs</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Issues</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Next PM</th>
                  </tr>
                </thead>
                <tbody>
                  {assetReadinessSummary.map((asset) => (
                    <tr key={asset.assetId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <Link href={`/maintenance/${asset.assetId}`} className="text-blue-400 hover:text-blue-300 font-medium">
                          {asset.assetId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{asset.assetType}</td>
                      <td className="py-3 px-4 text-slate-300">{asset.currentDriverId || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-slate-300">{asset.currentLocation}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReadinessBadgeClass(asset.readinessStatus)}`}>
                          {asset.readinessStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{asset.openWorkOrdersCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {asset.dispatchBlocking && (
                            <span className="px-1 py-0.5 rounded text-xs bg-red-500/20 text-red-400">DB</span>
                          )}
                          {asset.dotImpacting && (
                            <span className="px-1 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">DOT</span>
                          )}
                          {asset.managerActionRequired && (
                            <span className="px-1 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">MGR</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{formatDisplayDate(asset.nextPmDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
