"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
import type { OperationalRiskQueue, V3OperationalData } from "@/lib/v3-operational-types";
import { L008_CANONICAL_STORY, L009_CANONICAL_STORY, L011_CANONICAL_STORY } from "@/lib/canonical-load-stories";
import { DemoPageExplainerById } from "@/components/demo/DemoPageExplainerById";
import { getCarrierRegistry, getCarrierRegistryStats } from "@/lib/carrier-registry";
import { getCarrierGateEscalations, getCarrierGateStats, type CarrierDispatchGateTone } from "@/lib/carrier-dispatch-gates";
import { getReloadEscalations } from "@/lib/carrier-reload-intelligence";
import { getCommandCenterOperationalActivity, type DispatchThreadTone } from "@/lib/dispatch-operational-threads";

type RiskAction = {
  label: string;
  href: string;
  tone?: "primary" | "warning" | "danger";
};

function normalizeLoadId(loadId: string) {
  const trimmed = String(loadId || "").trim();
  const legacyMatch = trimmed.match(/^L-(\d{3})$/i);
  if (legacyMatch) {
    const canonicalNumber = Number(legacyMatch[1]) - 500;
    if (canonicalNumber > 0 && canonicalNumber < 100) {
      return `L${String(canonicalNumber).padStart(3, "0")}`;
    }
  }
  return trimmed.replace(/^L-(\d+)$/i, "L$1");
}

function getRiskStory(risk: OperationalRiskQueue) {
  const loadId = normalizeLoadId(risk.loadId);
  const type = `${risk.riskType} ${risk.module}`.toLowerCase();

  if (loadId === L008_CANONICAL_STORY.loadId || type.includes("cargo-damage claim") || type.includes("claim escalation")) {
    return {
      headline: "Safety claim evidence needs manager review",
      urgency: "HOS review, driver statement, cargo-damage photos, and claim packet support must be completed before the claim file is ready.",
      primaryLabel: "Open claim evidence workspace",
      primaryHref: `/loads/${loadId}`,
      actions: [
        { label: "Open claim evidence workspace", href: `/loads/${loadId}`, tone: "danger" },
        { label: "Review safety action", href: "/safety", tone: "warning" },
        { label: "Driver HR action", href: `/drivers/${risk.driverId}/hr` },
        { label: "Claim exposure", href: "/money-at-risk", tone: "warning" },
      ] satisfies RiskAction[],
    };
  }

  if (type.includes("seal")) {
    return {
      headline: "Seal exception needs manager closeout",
      urgency: "Blocks settlement release until pickup seal, delivery seal, POD, BOL, and RFID scans are reviewed.",
      primaryLabel: "Open seal exception packet",
      primaryHref: `/shipper-portal/${loadId}`,
      actions: [
        { label: "Open seal exception packet", href: `/shipper-portal/${loadId}`, tone: "danger" },
        { label: "Review load record", href: `/loads/${loadId}` },
        { label: "Driver HR note", href: `/drivers/${risk.driverId}/hr` },
        { label: "Money at risk", href: "/money-at-risk", tone: "warning" },
      ] satisfies RiskAction[],
    };
  }

  if (type.includes("hos") || type.includes("safety") || type.includes("coaching")) {
    return {
      headline: "Safety coaching is blocking release",
      urgency: "Driver acknowledgment, HOS review, and safety-manager release are required before the hold clears.",
      primaryLabel: "Open safety action",
      primaryHref: "/safety",
      actions: [
        { label: "Open safety action", href: "/safety", tone: "danger" },
        { label: "Driver HR action", href: `/drivers/${risk.driverId}/hr` },
        { label: "Driver portal", href: `/portals/driver/${risk.driverId}` },
        { label: "Review settlement hold", href: "/settlements", tone: "warning" },
      ] satisfies RiskAction[],
    };
  }

  if (type.includes("tire") || type.includes("asset defect") || type.includes("maintenance") || type.includes("pre-trip")) {
    return {
      headline: "Pre-trip asset defect blocks dispatch",
      urgency: "BOF is holding the load before departure until the tire defect is repaired, the work order is closed, and RFID/pre-trip proof is rechecked.",
      primaryLabel: "Open pre-trip block",
      primaryHref: `/pretrip/${loadId}`,
      actions: [
        { label: "Open pre-trip block", href: `/pretrip/${loadId}`, tone: "danger" },
        { label: "Open maintenance board", href: "/maintenance", tone: "warning" },
        { label: "Open load record", href: `/loads/${loadId}` },
        { label: "Driver HR note", href: `/drivers/${risk.driverId}/hr` },
      ] satisfies RiskAction[],
    };
  }

  if (type.includes("lumper") || type.includes("settlement") || type.includes("receipt")) {
    return {
      headline: "Dock QR closeout missing payment proof",
      urgency: "The driver is not chasing paper. BOF needs dock-side QR authorization, empty-trailer proof, and Zelle payment confirmation tied to the load before settlement closes.",
      primaryLabel: "Open QR lumper workflow",
      primaryHref: `/shipper-portal/${loadId}#lumper-workflow`,
      actions: [
        { label: "Open QR lumper workflow", href: `/shipper-portal/${loadId}#lumper-workflow`, tone: "warning" },
        { label: "Review settlement closeout", href: "/settlements", tone: "warning" },
        { label: "Open load packet", href: `/shipper-portal/${loadId}` },
        { label: "Driver HR note", href: `/drivers/${risk.driverId}/hr` },
      ] satisfies RiskAction[],
    };
  }

  return {
    headline: risk.riskType,
    urgency: risk.businessImpact,
    primaryLabel: "Open risk workspace",
    primaryHref: "/money-at-risk",
    actions: [
      { label: "Open risk workspace", href: "/money-at-risk", tone: "warning" },
      { label: "Review load record", href: `/loads/${loadId}` },
      { label: "Driver HR note", href: `/drivers/${risk.driverId}/hr` },
    ] satisfies RiskAction[],
  };
}

function actionClass(tone: RiskAction["tone"] = "primary") {
  if (tone === "danger") {
    return "border-red-400/40 bg-red-500/15 text-red-100 hover:border-red-300 hover:bg-red-500/25";
  }
  if (tone === "warning") {
    return "border-amber-300/40 bg-amber-400/15 text-amber-100 hover:border-amber-200 hover:bg-amber-400/25";
  }
  return "border-teal-300/40 bg-teal-400/15 text-teal-100 hover:border-teal-200 hover:bg-teal-400/25";
}

function moduleHref(module: string) {
  const normalized = module.toLowerCase();
  if (normalized.includes("dispatch") || normalized.includes("rfid")) return "/dispatch";
  if (normalized.includes("settlement")) return "/settlements";
  if (normalized.includes("safety")) return "/safety";
  if (normalized.includes("maintenance")) return "/maintenance";
  if (normalized.includes("driver") || normalized.includes("compliance")) return "/drivers";
  if (normalized.includes("claim")) return "/money-at-risk";
  return "/documents";
}

function withCanonicalL008Risk(data: V3OperationalData, risks = data.operationalRiskQueue): OperationalRiskQueue[] {
  const existing = risks;
  if (existing.some((risk) => normalizeLoadId(risk.loadId) === L008_CANONICAL_STORY.loadId)) {
    return existing;
  }

  const event = data.safetyEvents.find(
    (safetyEvent) =>
      safetyEvent.eventId === L008_CANONICAL_STORY.safetyEventId ||
      (safetyEvent.driverId === L008_CANONICAL_STORY.driverId &&
        normalizeLoadId(safetyEvent.linkedLoadId) === L008_CANONICAL_STORY.loadId)
  );

  if (!event && !L008_CANONICAL_STORY.claimActive) return existing;

  const l008Risk: OperationalRiskQueue = {
    riskId: "ORQ-L008-SAFETY-CLAIM",
    module: "Claims/Safety",
    driverId: L008_CANONICAL_STORY.driverId,
    loadId: L008_CANONICAL_STORY.loadId,
    assetId: L008_CANONICAL_STORY.assetId,
    relatedEventId: [event?.eventId ?? L008_CANONICAL_STORY.safetyEventId, L008_CANONICAL_STORY.claimId]
      .filter(Boolean)
      .join(" / "),
    riskType: "HOS violation / cargo-damage claim escalation",
    severity: "Critical",
    status: "Open",
    businessImpact: "Cargo-damage claim review remains open with partial evidence and manager approval required.",
    dispatchImpact: "Delivered / claim review",
    settlementImpact: "Claim review; no settlement hold",
    complianceImpact: "HOS coaching and driver statement required",
    insuranceImpact: "Open cargo-damage claim",
    dueDate: "2026-05-23",
    assignedTo: "Claims / Safety Manager",
    recommendedAction:
      "Complete driver statement, HOS coaching acknowledgment, cargo-damage evidence, and claim packet review.",
    resolutionStatus: "Open",
    resolvedDate: "",
    managerActionRequired: true,
  };

  return [l008Risk, ...existing];
}

function withCanonicalL009Risk(data: V3OperationalData): OperationalRiskQueue[] {
  const existing = data.operationalRiskQueue;
  if (existing.some((risk) => normalizeLoadId(risk.loadId) === L009_CANONICAL_STORY.loadId)) {
    return existing;
  }

  const workOrder = data.maintenanceWorkOrders.find(
    (wo) =>
      wo.workOrderId === L009_CANONICAL_STORY.maintenanceWorkOrderId ||
      (wo.driverId === L009_CANONICAL_STORY.driverId && /tire|asset/i.test(`${wo.issueType} ${wo.defectDescription}`))
  );
  const rfid = data.rfidEvents.find(
    (event) =>
      event.rfidEventId === L009_CANONICAL_STORY.rfidEventId ||
      (normalizeLoadId(event.loadId) === L009_CANONICAL_STORY.loadId && event.driverId === L009_CANONICAL_STORY.driverId)
  );

  if (!workOrder && !rfid) return existing;

  const l009Risk: OperationalRiskQueue = {
    riskId: "ORQ-L009-PRETRIP-ASSET",
    module: "Dispatch/RFID",
    driverId: L009_CANONICAL_STORY.driverId,
    loadId: L009_CANONICAL_STORY.loadId,
    assetId: L009_CANONICAL_STORY.assetId,
    relatedEventId: [workOrder?.workOrderId, rfid?.rfidEventId].filter(Boolean).join(" / "),
    riskType: "Pre-trip tire / asset defect",
    severity: "Critical",
    status: "Open",
    businessImpact: "Dispatch is blocked before pickup until the tire defect is repaired and pre-trip proof is cleared.",
    dispatchImpact: "Blocked",
    settlementImpact: "None",
    complianceImpact: "DOT / maintenance review required",
    insuranceImpact: "None",
    dueDate: "2026-05-23",
    assignedTo: "Maintenance Lead",
    recommendedAction: "Repair tire, upload closeout photo, confirm RFID/pre-trip readiness, then release dispatch.",
    resolutionStatus: "Open",
    resolvedDate: "",
    managerActionRequired: true,
  };

  return [l009Risk, ...existing];
}

function withCanonicalFlagshipRisks(data: V3OperationalData): OperationalRiskQueue[] {
  return withCanonicalL008Risk(data, withCanonicalL009Risk(data));
}

export function CommandCenterV4() {
  const [operationalRisks, setOperationalRisks] = useState<OperationalRiskQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUsingFallback] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');

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
        console.log('📊 Loading V4 operational risk data...');
        const v3Data = await getV3OperationalData();
        
        setOperationalRisks(withCanonicalFlagshipRisks(v3Data));
        
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
    const settlementImpactingRisks = operationalRisks.filter(r => /hold|delayed|\$/i.test(r.settlementImpact)).length;
    const complianceImpactingRisks = operationalRisks.filter(r => /violation|audit|hos|review|required/i.test(r.complianceImpact)).length;
    const insuranceImpactingRisks = operationalRisks.filter(r => /claim|required|premium|medium|high/i.test(r.insuranceImpact)).length;
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
  const carrierRecords = useMemo(() => getCarrierRegistry(), []);
  const carrierStats = useMemo(() => getCarrierRegistryStats(carrierRecords), [carrierRecords]);
  const carrierGateStats = useMemo(() => getCarrierGateStats(carrierRecords), [carrierRecords]);
  const carrierEscalations = useMemo(() => getCarrierGateEscalations(carrierRecords), [carrierRecords]);
  const reloadEscalations = useMemo(() => getReloadEscalations(), []);
  const operationalActivity = useMemo(() => getCommandCenterOperationalActivity(), []);
  const blockedCarrier = carrierRecords.find((carrier) => carrier.readinessStatus === "Blocked");
  const watchCarrier = carrierRecords.find((carrier) => carrier.readinessStatus === "Watch");
  const l011Carrier = carrierRecords.find((carrier) => carrier.recentLoads.includes("L011"));

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

  const criticalRisk = risksNeedingAttention.find((risk) => risk.severity === "Critical");
  const dispatchBlockRisk = risksNeedingAttention.find((risk) => risk.dispatchImpact === "Blocked");
  const settlementHoldRisk = risksNeedingAttention.find((risk) => /hold/i.test(risk.settlementImpact));
  const actionStories = risksNeedingAttention.slice(0, 3).map((risk) => ({
    risk,
    story: getRiskStory(risk),
  }));

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

  const getCarrierGateClass = (tone: CarrierDispatchGateTone) => {
    if (tone === "ready") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    if (tone === "blocked") return "border-red-400/35 bg-red-400/10 text-red-100";
    if (tone === "watch") return "border-sky-400/35 bg-sky-400/10 text-sky-100";
    return "border-amber-400/35 bg-amber-400/10 text-amber-100";
  };

  const getOperationalActivityClass = (tone: DispatchThreadTone) => {
    if (tone === "ready") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    if (tone === "blocked") return "border-red-400/35 bg-red-400/10 text-red-100";
    if (tone === "review") return "border-amber-400/35 bg-amber-400/10 text-amber-100";
    return "border-cyan-400/35 bg-cyan-400/10 text-cyan-100";
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
              <Link
                href={criticalRisk ? getRiskStory(criticalRisk).primaryHref : "/money-at-risk"}
                className="rounded-xl border border-red-400/25 bg-slate-950/70 p-4 text-right shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:border-red-300/60 hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
              >
                <div className="text-2xl font-bold text-red-300">{riskStats.criticalRisks}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Critical risks</div>
              </Link>
              <Link
                href={dispatchBlockRisk ? getRiskStory(dispatchBlockRisk).primaryHref : "/dispatch"}
                className="rounded-xl border border-orange-400/25 bg-slate-950/70 p-4 text-right shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:border-orange-300/60 hover:bg-orange-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
              >
                <div className="text-2xl font-bold text-orange-300">{riskStats.dispatchBlockingRisks}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Dispatch blocks</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-4">
        <DemoPageExplainerById pageId="command-center" />
      </div>

      {/* Risk KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {actionStories.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {actionStories.map(({ risk, story }) => (
              <Link
                key={risk.riskId}
                href={story.primaryHref}
                className="group rounded-xl border border-teal-400/25 bg-slate-900/75 p-5 shadow-lg shadow-slate-950/25 transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                    {getModuleIcon(risk.module)}
                    {risk.module}
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getSeverityBadgeClass(risk.severity)}`}>
                    {risk.severity}
                  </span>
                </div>
                <div className="text-lg font-semibold text-white group-hover:text-teal-100">{story.headline}</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{story.urgency}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-mono text-teal-200">{normalizeLoadId(risk.loadId)} · {risk.driverId}</span>
                  <span className="font-semibold text-teal-200 group-hover:text-white">{story.primaryLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-cyan-300/25 bg-slate-900/75 p-5 shadow-lg shadow-slate-950/25">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                <Truck className="h-3.5 w-3.5" />
                Route intervention exercise
              </div>
              <h2 className="text-xl font-semibold text-white">
                I-40 storm cell and traffic backup - reroute before service failure
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                Control Tower flags a weather and congestion pocket ahead of DRV-010 / L010.
                Dispatch can move from the risk queue into the live dispatch board, compare the alternate route,
                and preserve HOS, fuel, and appointment timing before the driver hits the slowdown.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${actionClass("primary")}`} href="/dispatch">
                Open dispatch reroute
              </Link>
              <Link className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${actionClass("warning")}`} href="/safety">
                Check HOS impact
              </Link>
              <Link className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${actionClass("primary")}`} href="/portals/driver/DRV-010">
                Driver view
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/money-at-risk"
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Open Risks</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.openRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">of {riskStats.totalRisks} total risks</div>
          </Link>

          <Link
            href={criticalRisk ? getRiskStory(criticalRisk).primaryHref : "/money-at-risk"}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-red-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Critical Risks</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.criticalRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Immediate attention required</div>
          </Link>

          <Link
            href={dispatchBlockRisk ? getRiskStory(dispatchBlockRisk).primaryHref : "/dispatch"}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-orange-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Dispatch Blocking</span>
              <Truck className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.dispatchBlockingRisks}
            </div>
            <div className="text-xs text-slate-500 mt-1">Operations blocked</div>
          </Link>

          <Link
            href={settlementHoldRisk ? getRiskStory(settlementHoldRisk).primaryHref : "/settlements"}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 transition hover:-translate-y-0.5 hover:border-yellow-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Manager Action</span>
              <User className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskStats.managerActionRequired}
            </div>
            <div className="text-xs text-slate-500 mt-1">Owner review required</div>
          </Link>
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
            <Link
              href="/settlements"
              className="bg-slate-950/50 border border-slate-700 rounded-lg p-4 transition hover:border-green-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Ready to Submit</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-green-400">9</div>
              <div className="text-xs text-slate-500 mt-1">{L011_CANONICAL_STORY.loadId} factoring packet ready for finance review</div>
            </Link>
            <Link
              href="/documents"
              className="bg-slate-950/50 border border-slate-700 rounded-lg p-4 transition hover:border-red-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Missing POD/BOL</span>
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-red-400">0</div>
              <div className="text-xs text-slate-500 mt-1">No critical proof gaps</div>
            </Link>
            <Link
              href="/settlements"
              className="bg-slate-950/50 border border-slate-700 rounded-lg p-4 transition hover:border-yellow-300/50 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Held Due to Issues</span>
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <div className="text-xl font-bold text-yellow-400">{riskStats.settlementImpactingRisks}</div>
              <div className="text-xs text-slate-500 mt-1">L001, L007, and L010 require action</div>
            </Link>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              <span>Post-trip factoring packets include invoice, rate confirmation, BOL, POD, seal verification, and accessorial support documents</span>
            </div>
            <div className="mt-2">
              <Link href="/carriers/CAR-001" className="font-semibold text-teal-300 hover:text-teal-200">
                L011 carrier packet control: {l011Carrier?.financeTieIn ?? "carrier readiness supports the factoring handoff."}
              </Link>
            </div>
          </div>
        </div>

        {/* Carrier Readiness */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Truck className="h-5 w-5 text-teal-300" />
                Carrier Dispatch Gatekeeping
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                BOF now simulates carrier assignment gates before dispatch: clean carriers clear, renewal risk warns,
                reefer watch items require operations review, and blocked packets prevent assignment.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                {blockedCarrier
                  ? `${blockedCarrier.dba}: ${blockedCarrier.statusReason}`
                  : "No carrier is blocked from dispatch."}{" "}
                {watchCarrier ? `${watchCarrier.dba}: ${watchCarrier.dispatchImpact}` : ""}
              </p>
            </div>
            <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <div className="text-2xl font-bold text-white">{carrierStats.total}</div>
                <div className="text-xs text-slate-500">Carriers</div>
              </div>
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                <div className="text-2xl font-bold text-emerald-300">{carrierGateStats.allowed}</div>
                <div className="text-xs text-emerald-100/70">Cleared</div>
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
                <div className="text-2xl font-bold text-amber-300">{carrierGateStats.warning + carrierGateStats.operationsReview}</div>
                <div className="text-xs text-amber-100/70">Warning / review</div>
              </div>
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3">
                <div className="text-2xl font-bold text-red-300">{carrierGateStats.blocked}</div>
                <div className="text-xs text-red-100/70">Blocked</div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {carrierEscalations.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-teal-300/50 ${getCarrierGateClass(item.tone)}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">{item.title}</p>
                <p className="mt-2 text-sm font-bold text-white">{item.carrierName}</p>
                <p className="mt-2 text-xs leading-5 opacity-90">{item.impact}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">Next: {item.nextAction}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/carriers" className="text-teal-300 hover:text-teal-200">Open Carrier Registry</Link>
            <span className="text-slate-500">/</span>
            <Link href="/dispatch" className="text-teal-300 hover:text-teal-200">Review packet holds before dispatch</Link>
          </div>
        </div>

        {/* Reload Intelligence */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Target className="h-5 w-5 text-cyan-300" />
                Reload Intelligence
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Reload recommendations are filtered through carrier readiness, dispatch gates, equipment fit, lane fit,
                proof timing, customer release, and finance risk before they appear as operational choices.
              </p>
            </div>
            <Link href="/dispatch" className="rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-300/10">
              Review reloads in dispatch
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {reloadEscalations.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/50 ${getCarrierGateClass(item.tone)}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">{item.title}</p>
                <p className="mt-2 text-sm font-bold text-white">{item.carrierName}</p>
                <p className="mt-1 font-mono text-xs text-slate-300">{item.opportunityId}</p>
                <p className="mt-2 text-xs leading-5 opacity-90">{item.impact}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">Next: {item.nextAction}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Operational Activity Feed */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Activity className="h-5 w-5 text-teal-300" />
                Operational Activity Feed
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Dispatch communications are shown as operating decisions: reload releases, packet updates,
                proof holds, finance clearance, and customer-release consequences.
              </p>
            </div>
            <Link href="/dispatch" className="rounded-lg border border-teal-300/40 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
              Open dispatch thread
            </Link>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {operationalActivity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-lg border p-4 transition hover:-translate-y-0.5 hover:border-teal-300/50 ${getOperationalActivityClass(item.tone)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">{item.owner}</p>
                    <p className="mt-2 text-base font-bold text-white">{item.title}</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-2 py-1 text-xs font-bold">{item.tone}</span>
                </div>
                <p className="mt-3 text-sm leading-6 opacity-95">{item.summary}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">Dispatch consequence: {item.consequence}</p>
              </Link>
            ))}
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
              {risksNeedingAttention.map((risk) => {
                const story = getRiskStory(risk);
                const loadId = normalizeLoadId(risk.loadId);

                return (
                <div key={risk.riskId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-400">
                      {getModuleIcon(risk.module)}
                      <span>{risk.module}</span>
                      <span>•</span>
                      <span>{risk.riskType}</span>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-teal-400/20 bg-slate-950/60 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">{story.headline}</div>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{story.urgency}</p>
                      </div>
                      <Link
                        href={story.primaryHref}
                        className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${actionClass(story.actions[0]?.tone)}`}
                      >
                        {story.primaryLabel}
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-white font-medium mb-1">Affected Entities</div>
                      <div className="text-slate-400 text-sm">
                        {risk.driverId && (
                          <Link className="block text-teal-200 underline-offset-4 hover:underline" href={`/drivers/${risk.driverId}/hr`}>
                            Driver: {risk.driverId}
                          </Link>
                        )}
                        {risk.loadId && (
                          <Link className="block text-teal-200 underline-offset-4 hover:underline" href={`/loads/${loadId}`}>
                            Load: {loadId}
                          </Link>
                        )}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {story.actions.map((action) => (
                        <Link
                          key={`${risk.riskId}-${action.href}-${action.label}`}
                          href={action.href}
                          className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${actionClass(action.tone)}`}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                );
              })}
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
                  <Link
                    key={module}
                    href={moduleHref(module)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 transition hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                  >
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
                    <div className="mt-3 text-xs font-semibold text-teal-200">Open {module} workspace</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
