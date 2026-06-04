"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowRight,
  AlertTriangle, 
  DollarSign,
  FileText,
  Shield, 
  TrendingUp, 
  Truck,
  Users, 
  Clock, 
  AlertOctagon,
  Ban,
  Camera,
  ClipboardCheck,
  FileWarning,
  Siren
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import { getSafetyEventEvidence } from "@/lib/safety-event-evidence";
import type { MainSafety, SafetyEvent, SafetyKpiSource } from "@/lib/v3-operational-types";
import { DemoPageExplainerById } from "@/components/demo/DemoPageExplainerById";

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function isOpenWorkflow(value: string) {
  const status = normalizeToken(value);
  return status === "open" || status === "in progress" || status === "under review";
}

function isCriticalSeverity(value: string) {
  return normalizeToken(value) === "critical";
}

function titleize(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getScoreTone(score: number) {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (score >= 80) return "bg-green-500/15 text-green-300 border-green-500/30";
  if (score >= 70) return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  return "bg-red-500/15 text-red-300 border-red-500/30";
}

function getEventPriority(event: SafetyEvent) {
  let priority = 0;
  if (isCriticalSeverity(event.severity)) priority += 100;
  if (event.dispatchBlock) priority += 75;
  if (event.settlementHold) priority += 60;
  if (event.insuranceClaimNeeded) priority += 50;
  if (event.coachingRequired) priority += 30;
  if (!event.evidencePacketComplete) priority += 20;
  if (isOpenWorkflow(event.status)) priority += 10;
  return priority;
}

function getDriverPrimaryAction(driver: MainSafety, event?: SafetyEvent) {
  if (event?.dispatchBlock) {
    return { label: "Release dispatch hold", href: "/dispatch" };
  }

  if (event?.settlementHold) {
    return { label: "Review pay hold", href: `/drivers/${driver.driverId}/settlements` };
  }

  if (event && !event.evidencePacketComplete) {
    return { label: "Complete evidence packet", href: "#recent-safety-events" };
  }

  if (event?.coachingRequired || normalizeToken(driver.coachingStatus) === "required") {
    return { label: "Open coaching file", href: `/drivers/${driver.driverId}/safety` };
  }

  return { label: "Review safety profile", href: `/drivers/${driver.driverId}/safety` };
}

function getDriverBlockerLabels(driver: MainSafety, events: SafetyEvent[]) {
  const labels = new Set<string>();

  if (events.some(event => event.dispatchBlock) || normalizeToken(driver.dispatchEligibilityImpact).includes("block")) {
    labels.add("Dispatch hold");
  }

  if (events.some(event => event.settlementHold) || normalizeToken(driver.settlementImpact).includes("hold")) {
    labels.add("Settlement hold");
  }

  if (events.some(event => event.insuranceClaimNeeded || event.claimAmount > 0)) {
    labels.add("Claim review");
  }

  if (events.some(event => !event.evidencePacketComplete) || normalizeToken(driver.evidencePacketStatus).includes("await")) {
    labels.add("Evidence needed");
  }

  if (events.some(event => event.coachingRequired) || normalizeToken(driver.coachingStatus).includes("required")) {
    labels.add("Coaching");
  }

  return Array.from(labels);
}

export function SafetyDashboardV4() {
  const [mainSafety, setMainSafety] = useState<MainSafety[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [safetyKpiSource, setSafetyKpiSource] = useState<SafetyKpiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUsingFallback] = useState(false);

  // Load V4 workbook data
  // Workbook loader is a local async routine; keep this as a one-time bootstrap.
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
    const criticalDrivers = mainSafety.filter(d => d.criticalEvents > 0 || d.safetyScore < 80).length;
    const openEvents = safetyEvents.filter(e => isOpenWorkflow(e.status)).length;
    const criticalEvents = safetyEvents.filter(e => isCriticalSeverity(e.severity)).length;
    const dispatchBlocks = safetyEvents.filter(e => e.dispatchBlock).length;
    const settlementHolds = safetyEvents.filter(e => e.settlementHold).length;
    const insuranceClaimsNeeded = safetyEvents.filter(e => e.insuranceClaimNeeded).length;
    const evidencePacketsComplete = safetyEvents.filter(e => e.evidencePacketComplete).length;
    const driverAcknowledgmentsPending = safetyEvents.filter(e => isOpenWorkflow(e.status) && !e.driverAcknowledged).length;
    const openClaimExposure = safetyEvents
      .filter(e => isOpenWorkflow(e.claimStatus) || e.insuranceClaimNeeded)
      .reduce((sum, e) => sum + e.claimAmount, 0);
    
    const avgSafetyScore = totalDrivers > 0 
      ? mainSafety.reduce((sum, d) => sum + d.safetyScore, 0) / totalDrivers 
      : 0;

    return {
      totalDrivers,
      criticalDrivers,
      openEvents,
      criticalEvents,
      dispatchBlocks,
      settlementHolds,
      insuranceClaimsNeeded,
      evidencePacketsComplete,
      driverAcknowledgmentsPending,
      openClaimExposure,
      totalEvents: safetyEvents.length,
      avgSafetyScore,
    };
  }, [mainSafety, safetyEvents]);

  const watchlistMetrics = useMemo(() => {
    const metricValue = (name: string, fallback: number) =>
      safetyKpiSource.find(kpi => kpi.kpiName === name)?.kpiValue ?? fallback;

    return [
      {
        label: "Dispatch Blocks",
        value: metricValue("Dispatch Blocks", safetyStats.dispatchBlocks),
        detail: "Events holding release until coaching or proof is complete",
        icon: Ban,
        tone: "text-red-300",
      },
      {
        label: "Settlement Holds",
        value: metricValue("Settlement Holds", safetyStats.settlementHolds),
        detail: "Driver pay items held for safety review or claim reserve",
        icon: AlertTriangle,
        tone: "text-yellow-300",
      },
      {
        label: "Claims Needing Review",
        value: metricValue("Insurance Claims Needed", safetyStats.insuranceClaimsNeeded),
        detail: `${formatMoney(safetyStats.openClaimExposure)} open claim exposure`,
        icon: FileWarning,
        tone: "text-orange-300",
      },
      {
        label: "Evidence Packets Complete",
        value: metricValue("Evidence Packets Complete", safetyStats.evidencePacketsComplete),
        detail: `${safetyStats.totalEvents} events monitored in this safety period`,
        icon: ClipboardCheck,
        tone: "text-emerald-300",
      },
      {
        label: "Driver Acknowledgments Pending",
        value: metricValue("Driver Acknowledgments Pending", safetyStats.driverAcknowledgmentsPending),
        detail: "Statements or coaching acknowledgments still required",
        icon: Camera,
        tone: "text-blue-300",
      },
    ];
  }, [safetyKpiSource, safetyStats]);

  // Get recent events
  const recentEvents = useMemo(() => {
    return [...safetyEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [safetyEvents]);

  // Get drivers needing attention
  const driversNeedingAttention = useMemo(() => {
    return mainSafety
      .filter(d => d.criticalEvents > 0 || d.openSafetyEvents > 0 || d.safetyScore < 85)
      .sort((a, b) => (b.criticalEvents - a.criticalEvents) || (b.openSafetyEvents - a.openSafetyEvents) || (a.safetyScore - b.safetyScore))
      .slice(0, 8);
  }, [mainSafety]);

  const driverAttentionRows = useMemo(() => {
    return driversNeedingAttention.map((driver) => {
      const activeEvents = safetyEvents
        .filter(event => event.driverId === driver.driverId)
        .filter(event =>
          isOpenWorkflow(event.status) ||
          event.dispatchBlock ||
          event.settlementHold ||
          event.coachingRequired ||
          event.insuranceClaimNeeded ||
          !event.evidencePacketComplete
        )
        .sort((a, b) => getEventPriority(b) - getEventPriority(a));
      const leadingEvent = activeEvents[0] ?? safetyEvents.find(event => event.driverId === driver.driverId);
      const claimExposure = activeEvents.reduce((sum, event) => sum + event.claimAmount, 0);
      const blockers = getDriverBlockerLabels(driver, activeEvents);
      const primaryAction = getDriverPrimaryAction(driver, leadingEvent);

      return {
        driver,
        activeEvents,
        leadingEvent,
        claimExposure,
        blockers,
        primaryAction,
      };
    });
  }, [driversNeedingAttention, safetyEvents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading safety data...</p>
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
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
        <Image
          src="/generated/marketing/safety-command-hero.png"
          alt=""
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/35" />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                <Siren className="h-3.5 w-3.5" />
                Live Safety Desk
              </div>
              <h1 className="flex items-center gap-3 text-4xl font-bold text-white">
                <Shield className="h-9 w-9 text-blue-300" />
                Safety risk and claims control
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                See which safety events block dispatch, hold settlements, create claim exposure, or need proof before the fleet keeps moving.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:justify-self-end">
              <div className="rounded-lg border border-slate-700/80 bg-slate-950/75 p-4">
                <div className="text-2xl font-bold text-red-300">{safetyStats.openEvents}</div>
                <div className="mt-1 text-xs text-slate-400">Open Events</div>
              </div>
              <div className="rounded-lg border border-slate-700/80 bg-slate-950/75 p-4">
                <div className="text-2xl font-bold text-orange-300">{safetyStats.criticalEvents}</div>
                <div className="mt-1 text-xs text-slate-400">Critical Events</div>
              </div>
              <div className="rounded-lg border border-slate-700/80 bg-slate-950/75 p-4">
                <div className="text-2xl font-bold text-yellow-300">{safetyStats.dispatchBlocks}</div>
                <div className="mt-1 text-xs text-slate-400">Dispatch Blocks</div>
              </div>
              <div className="rounded-lg border border-slate-700/80 bg-slate-950/75 p-4">
                <div className="text-2xl font-bold text-emerald-300">{Math.round(safetyStats.avgSafetyScore)}</div>
                <div className="mt-1 text-xs text-slate-400">Avg Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-4">
        <DemoPageExplainerById pageId="safety" />
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
              <span className="text-slate-400 text-sm">Events Monitored</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {safetyStats.totalEvents}
            </div>
            <div className="text-xs text-slate-500 mt-1">Current safety period</div>
          </div>
        </div>

        {/* Safety Operations Watchlist */}
        {watchlistMetrics.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Safety Operations Watchlist</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {watchlistMetrics.map((metric) => {
                const Icon = metric.icon;

                return (
                <div key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-400">{metric.label}</div>
                      <div className="mt-2 text-3xl font-bold text-white">{metric.value}</div>
                    </div>
                    <Icon className={`h-5 w-5 ${metric.tone}`} />
                  </div>
                  <p className="mt-4 text-sm leading-5 text-slate-400">{metric.detail}</p>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Driver Safety Work Queue */}
      {driverAttentionRows.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Driver Safety Work Queue
                </h3>
                <p className="mt-1 max-w-3xl text-sm text-slate-400">
                  Each row is tied to the next operational action: release dispatch, clear settlement holds,
                  complete evidence, or open the driver safety file.
                </p>
              </div>
              <Link
                href="/money-at-risk"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:border-orange-300/60 hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Review claims exposure
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {driverAttentionRows.map(({ driver, activeEvents, leadingEvent, claimExposure, blockers, primaryAction }) => {
                const evidence = leadingEvent ? getSafetyEventEvidence(leadingEvent) : undefined;
                const linkedLoadHref = leadingEvent?.linkedLoadId && /^L\d{3}$/.test(leadingEvent.linkedLoadId)
                  ? `/loads/${leadingEvent.linkedLoadId}`
                  : "/dispatch";

                return (
                <div
                  key={driver.driverId}
                  className="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-blue-400/40 hover:bg-slate-800/75"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.4fr)_minmax(290px,0.9fr)] xl:items-center">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/drivers/${driver.driverId}/safety`}
                          className="text-base font-semibold text-white underline-offset-4 transition hover:text-blue-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        >
                          {driver.driverName || driver.driverId}
                        </Link>
                        <span className="text-sm text-slate-500">{driver.driverId}</span>
                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getScoreTone(driver.safetyScore)}`}>
                          Score {driver.safetyScore}
                        </span>
                        {driver.criticalEvents > 0 && (
                          <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                            {driver.criticalEvents} critical
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                        <div>
                          <span className="text-slate-500">Active items</span>
                          <div className="font-semibold text-white">{activeEvents.length || driver.openSafetyEvents}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Claim exposure</span>
                          <div className="font-semibold text-white">{claimExposure > 0 ? formatMoney(claimExposure) : "No reserve"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-700/70 bg-slate-950/40 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {blockers.length > 0 ? blockers.map((blocker) => (
                          <span key={blocker} className="rounded-full border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200">
                            {blocker}
                          </span>
                        )) : (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            Monitoring
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <span className="text-slate-500">Last event</span>
                          <div className="mt-1 font-semibold text-white">{leadingEvent?.eventType || driver.lastSafetyEventType || "Safety review"}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Coaching</span>
                          <div className="mt-1 font-semibold text-white">{driver.coachingStatus || "Current"}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Action due</span>
                          <div className="mt-1 font-semibold text-white">
                            {driver.correctiveActionDue ? formatDisplayDate(driver.correctiveActionDue) : "No immediate action"}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-5 text-slate-400">
                        {leadingEvent?.correctiveAction || driver.safetyActionStatus || "Review driver safety profile and confirm the next operational action."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                      <Link
                        href={primaryAction.href}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      >
                        {primaryAction.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/drivers/${driver.driverId}/safety`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                      >
                        <FileText className="h-4 w-4" />
                        Driver safety file
                      </Link>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={linkedLoadHref}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-blue-400/50 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Dispatch
                        </Link>
                        <Link
                          href={`/drivers/${driver.driverId}/settlements`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400/50 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Pay
                        </Link>
                      </div>
                      {evidence ? (
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          Review evidence
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Safety Events */}
      {recentEvents.length > 0 && (
        <div id="recent-safety-events" className="max-w-7xl mx-auto px-6 pb-6 scroll-mt-24">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Safety Events
            </h3>
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const evidence = getSafetyEventEvidence(event);

                return (
                <div key={event.eventId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          normalizeToken(event.severity) === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : normalizeToken(event.severity) === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : normalizeToken(event.severity) === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {titleize(event.severity)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          normalizeToken(event.status) === 'open'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : normalizeToken(event.status) === 'in progress' || normalizeToken(event.status) === 'under review'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {titleize(event.status)}
                        </span>
                        <span className="text-slate-400 text-sm">{event.eventType}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-4 mb-3">
                        {evidence ? (
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group block overflow-hidden rounded-lg border border-slate-700 bg-slate-950/70"
                            aria-label={`Review evidence for ${event.eventType}`}
                          >
                            <Image
                              src={evidence.url}
                              alt={evidence.label}
                              width={360}
                              height={192}
                              className="h-24 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                            />
                            <div className="border-t border-slate-700 px-3 py-2">
                              <div className="text-xs font-semibold text-blue-300">Review evidence</div>
                              <div className="mt-0.5 text-[11px] text-slate-500">{evidence.label}</div>
                            </div>
                          </a>
                        ) : (
                          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/50 text-xs text-slate-500">
                            Evidence pending
                          </div>
                        )}
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
                              Claim: {titleize(event.claimStatus)} • ${event.claimAmount.toLocaleString()}
                            </div>
                          )}
                          {evidence ? (
                            <div className="mt-2 text-xs text-slate-500">{evidence.note}</div>
                          ) : null}
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
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
