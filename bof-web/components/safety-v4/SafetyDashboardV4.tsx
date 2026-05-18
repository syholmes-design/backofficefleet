"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertOctagon,
  FileText,
  DollarSign,
  MapPin,
  Camera
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import { SafetyAssetCards } from "@/components/safety-v4/SafetyAssetCards";
import type { MainSafety, SafetyEvent, SafetyKpiSource } from "@/lib/v3-operational-types";

export function SafetyDashboardV4() {
  const [mainSafety, setMainSafety] = useState<MainSafety[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [safetyKpiSource, setSafetyKpiSource] = useState<SafetyKpiSource[]>([]);
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
        console.log('📊 Loading V4 operational safety data...');
        const v3Data = await getV3OperationalData();
        
        setMainSafety(v3Data.mainSafety);
        setSafetyEvents(v3Data.safetyEvents);
        setSafetyKpiSource(v3Data.safetyKpiSource);
        
        console.log(`✅ Loaded ${v3Data.mainSafety.length} Main Safety records, ${v3Data.safetyEvents.length} Safety Events, and ${v3Data.safetyKpiSource.length} KPI records from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 safety data:', err);
      setError(err instanceof Error ? err.message : "Failed to load safety data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback safety data - V4 workbook not available');
    setUsingFallback(true);
    
    // Fallback data would go here - for now we'll use empty arrays
    setMainSafety([]);
    setSafetyEvents([]);
    setSafetyKpiSource([]);
  };

  // Calculate safety statistics
  const safetyStats = useMemo(() => {
    const totalDrivers = mainSafety.length;
    const criticalDrivers = mainSafety.filter(d => d.criticalEvents > 0).length;
    const openEvents = safetyEvents.filter(e => e.status === "Open").length;
    const criticalEvents = safetyEvents.filter(e => e.severity === "Critical").length;
    const eventsThisWeek = safetyEvents.filter(e => {
      const eventDate = new Date(e.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eventDate >= weekAgo;
    }).length;
    
    const avgSafetyScore = totalDrivers > 0 
      ? mainSafety.reduce((sum, d) => sum + d.safetyScore, 0) / totalDrivers 
      : 0;

    return {
      totalDrivers,
      criticalDrivers,
      openEvents,
      criticalEvents,
      eventsThisWeek,
      avgSafetyScore,
    };
  }, [mainSafety, safetyEvents]);

  // Get KPI summary
  const kpiSummary = useMemo(() => {
    const categories = [...new Set(safetyKpiSource.map(k => k.kpiCategory))];
    return categories.map(category => {
      const categoryKpis = safetyKpiSource.filter(k => k.kpiCategory === category);
      const avgPerformance = categoryKpis.reduce((sum, k) => sum + (k.kpiValue / k.kpiTarget) * 100, 0) / categoryKpis.length;
      
      return {
        category,
        kpiCount: categoryKpis.length,
        avgPerformance: avgPerformance || 0,
        kpis: categoryKpis,
      };
    });
  }, [safetyKpiSource]);

  // Get recent events
  const recentEvents = useMemo(() => {
    return safetyEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [safetyEvents]);

  // Get drivers needing attention
  const driversNeedingAttention = useMemo(() => {
    return mainSafety
      .filter(d => d.criticalEvents > 0 || d.openSafetyEvents > 0 || d.safetyScore < 70)
      .sort((a, b) => a.safetyScore - b.safetyScore)
      .slice(0, 8);
  }, [mainSafety]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading V4 safety data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load safety data</p>
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
                <Shield className="w-8 h-8 text-blue-400" />
                Safety Command Center (V4)
              </h1>
              <p className="text-slate-400 mt-2">
                Driver safety performance, events, KPIs, and compliance from V4 operational workbook
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-red-400 font-medium">{safetyStats.openEvents}</div>
                <div className="text-slate-400 text-xs">Open Events</div>
              </div>
              <div className="text-right">
                <div className="text-orange-400 font-medium">{safetyStats.criticalDrivers}</div>
                <div className="text-slate-400 text-xs">Critical Drivers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Drivers</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {safetyStats.totalDrivers}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active fleet</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Avg Safety Score</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {safetyStats.avgSafetyScore.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Fleet average</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Critical Events</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {safetyStats.criticalEvents}
            </div>
            <div className="text-xs text-slate-500 mt-1">Requiring attention</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Events This Week</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {safetyStats.eventsThisWeek}
            </div>
            <div className="text-xs text-slate-500 mt-1">Last 7 days</div>
          </div>
        </div>

        {/* KPI Performance by Category */}
        {kpiSummary.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">KPI Performance by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kpiSummary.map((category) => (
                <div key={category.category} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">{category.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.avgPerformance >= 90 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : category.avgPerformance >= 70
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {category.avgPerformance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {category.kpis.slice(0, 3).map((kpi) => (
                      <div key={kpi.kpiName} className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">{kpi.kpiName}</span>
                        <span className="text-white text-sm font-medium">
                          {kpi.kpiValue} / {kpi.kpiTarget} {kpi.kpiUnit}
                        </span>
                      </div>
                    ))}
                    {category.kpis.length > 3 && (
                      <div className="text-slate-500 text-xs">+{category.kpis.length - 3} more KPIs</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drivers Needing Attention */}
      {driversNeedingAttention.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Drivers Needing Attention
            </h3>
            <div className="space-y-3">
              {driversNeedingAttention.map((driver) => (
                <div key={driver.driverId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-medium">{driver.driverId}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          driver.safetyScore >= 80 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : driver.safetyScore >= 60
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          Score: {driver.safetyScore}
                        </span>
                        {driver.criticalEvents > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            {driver.criticalEvents} Critical
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Open Events:</span>
                          <span className="text-white ml-2">{driver.openSafetyEvents}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Last Event:</span>
                          <span className="text-white ml-2">{driver.lastSafetyEventType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Coaching:</span>
                          <span className="text-white ml-2">{driver.coachingStatus}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Action Due:</span>
                          <span className="text-white ml-2">{driver.correctiveActionDue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Safety Events */}
      {recentEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Safety Events
            </h3>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.eventId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.severity === 'Critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : event.severity === 'High'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : event.severity === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {event.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'Open'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : event.status === 'In Progress'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-slate-400 text-sm">{event.eventType}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-white font-medium mb-1">{event.driverName} ({event.driverId})</div>
                          <div className="text-slate-400 text-sm">
                            {formatDisplayDate(event.timestamp)} • {event.location}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Unit: {event.unit}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-slate-300 text-sm mb-1">{event.details}</div>
                          {event.claimStatus && (
                            <div className="text-slate-400 text-sm">
                              Claim: {event.claimStatus} • ${event.claimAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {event.coachingRequired && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-medium text-sm">Coaching Required</span>
                          </div>
                          <div className="text-slate-300 text-sm">
                            {event.correctiveAction} - Assigned to {event.coachingAssignedTo}
                          </div>
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

      {/* Safety Asset Cards */}
      <SafetyAssetCards 
        driverId={safetyEvents.length > 0 ? safetyEvents[0].driverId : "DRV-001"}
        safetyEventId={safetyEvents.length > 0 ? safetyEvents[0].eventId : undefined}
        relatedLoadId={safetyEvents.length > 0 ? safetyEvents[0].linkedLoadId : undefined}
      />
    </div>
  );
}
