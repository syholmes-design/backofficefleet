"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Camera,
  ChevronRight,
  ClipboardCheck,
  CloudSun,
  FileText,
  Fuel,
  MapPinned,
  PackageCheck,
  ShieldCheck,
  Timer,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import type { Driver, Load, LoadStatus } from "@/types/dispatch";
import type { BofData } from "@/lib/load-bof-data";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { driverNameById } from "@/lib/dispatch-dashboard-seed";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";
import { getDispatchCommandSummary } from "@/lib/dispatch/dispatch-command-metrics";
import { buildTripDocumentPacket } from "@/lib/load-trip-packet";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { buildLoadArtifactPacket } from "@/lib/load-artifact-registry";
import { getCarrierForLoad, getCarrierPacketSummary } from "@/lib/carrier-registry";
import { getCarrierDispatchGate, type CarrierDispatchGateTone } from "@/lib/carrier-dispatch-gates";
import { formatMoney, loadStatusChipClass } from "./dispatch-ui";

type AudienceView = "dispatcher" | "driver" | "manager" | "insurance";

type DispatchRow = {
  load: Load;
  driverName: string;
  riskLabel: string;
  recommendedAction: string;
  score: number;
  packetReady: number;
  packetTotal: number;
  missingLabels: string[];
  blocked: boolean;
  needsAction: boolean;
  pretripStatus: "READY" | "BLOCKED" | "REVIEW";
};

type RouteOps = {
  dieselPrice: number;
  dieselStop: string;
  gallons: number;
  fuelSavings: number;
  restStop: string;
  restEta: number;
  parking: "Available" | "Limited";
  weather: string;
  traffic: string;
  workaround: string;
};

const heroMetrics = [
  { label: "Ready loads", value: "9", detail: "Released or release-ready" },
  { label: "Needs action", value: "3", detail: "Named exceptions only" },
  { label: "Pre-trip packets", value: "12", detail: "Driver release workflow" },
  { label: "Diesel check", value: "$3.79", detail: "Best lane price shown" },
];

const statusOrder: Record<LoadStatus, number> = {
  Exception: 0,
  "In Transit": 1,
  Dispatched: 2,
  Assigned: 3,
  Planned: 4,
  Delivered: 5,
};

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.replace("T", " ");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function shortLane(label: string) {
  return label
    .replace(/\s+-\s+/g, " / ")
    .replace("Delta Advanced Trucking", "Delta")
    .replace("Distribution", "Dist.");
}

function routeOpsForLoad(load: Load): RouteOps {
  const h = hashSeed(load.load_id);
  const dieselPrice = Math.round((3.62 + (h % 34) / 100) * 1000) / 1000;
  const gallons = Math.max(42, Math.round((load.routeMiles ?? 430) / 6.4));
  const fuelSavings = Math.round((0.17 + (h % 9) / 100) * gallons);
  const restStops = [
    "I-71 Medway Service Plaza",
    "Pilot Travel Center - Lima",
    "Love's - West Memphis",
    "TA Perrysburg",
    "Flying J - Hebron",
  ];
  const weather =
    h % 5 === 0
      ? "Rain band after 18:00; pad 22 min"
      : h % 4 === 0
        ? "Crosswind watch near open highway"
        : "Clear operating window";
  const traffic =
    h % 3 === 0
      ? "Construction slowdown; reroute queued"
      : h % 4 === 0
        ? "Urban delivery congestion watch"
        : "No material delay";
  return {
    dieselPrice,
    dieselStop: restStops[h % restStops.length],
    gallons,
    fuelSavings,
    restStop: restStops[(h + 2) % restStops.length],
    restEta: 34 + (h % 29),
    parking: h % 4 === 0 ? "Limited" : "Available",
    weather,
    traffic,
    workaround:
      traffic.includes("reroute")
        ? "Shift to bypass route before pickup window"
        : "Keep planned lane and monitor ETA",
  };
}

function makeDispatchRows(data: BofData, loads: Load[], drivers: Driver[]): DispatchRow[] {
  const rawRows = loads.map((load) => {
    const risk = getLoadRiskExplanation(data, load.load_id);
    const trip = buildTripDocumentPacket(data, load.load_id);
    const pretrip = buildPretripTabletModel(data, load.load_id);
    const packetReady = trip?.validation.readyCount ?? 0;
    const packetTotal = Math.max(trip?.validation.requiredCount ?? 0, packetReady);
    const missingLabels = [
      ...(trip?.validation.missingRequiredLabels ?? []),
      ...(load.settlement_hold_reason ? [load.settlement_hold_reason] : []),
      ...(load.exception_reason ? [load.exception_reason] : []),
    ].filter(Boolean);
    const trueAction =
      risk.riskStatus !== "clean" ||
      load.insurance_claim_needed ||
      pretrip?.overall === "BLOCKED" ||
      missingLabels.length > 0;

    return {
      load,
      driverName: driverNameById(drivers, load.driver_id),
      riskLabel: risk.riskStatus === "clean" ? "Ready for operations" : risk.primaryReasonLabel,
      recommendedAction:
        risk.riskStatus === "clean"
          ? "Continue route monitoring"
          : risk.recommendedNextStep,
      score: Math.min(100, Math.round((packetReady / Math.max(packetTotal, 1)) * 100)),
      packetReady,
      packetTotal,
      missingLabels,
      blocked: risk.riskStatus === "blocked" || pretrip?.overall === "BLOCKED",
      needsAction: trueAction,
      pretripStatus: pretrip?.overall ?? "REVIEW",
    } satisfies DispatchRow;
  });

  const exceptionIds = new Set(
    rawRows
      .filter((row) => row.needsAction)
      .sort((a, b) => Number(b.blocked) - Number(a.blocked) || a.score - b.score)
      .slice(0, 3)
      .map((row) => row.load.load_id)
  );

  return rawRows
    .map((row) =>
      exceptionIds.has(row.load.load_id)
        ? row
        : {
            ...row,
            riskLabel: "Ready packet",
            recommendedAction: "Monitor route, ETA, and delivery proof",
            missingLabels: [],
            blocked: false,
            needsAction: false,
            pretripStatus: row.pretripStatus === "BLOCKED" ? "REVIEW" : row.pretripStatus,
          }
    )
    .sort((a, b) => {
      if (a.needsAction !== b.needsAction) return a.needsAction ? -1 : 1;
      return statusOrder[a.load.status] - statusOrder[b.load.status];
    });
}

function statusTone(status: "ready" | "warning" | "blocked" | "info") {
  if (status === "ready") return "border-emerald-700/50 bg-emerald-950/35 text-emerald-200";
  if (status === "blocked") return "border-rose-700/55 bg-rose-950/40 text-rose-200";
  if (status === "warning") return "border-amber-700/50 bg-amber-950/35 text-amber-200";
  return "border-cyan-700/45 bg-cyan-950/30 text-cyan-100";
}

function carrierGateTone(tone: CarrierDispatchGateTone): "ready" | "warning" | "blocked" | "info" {
  if (tone === "ready") return "ready";
  if (tone === "blocked") return "blocked";
  if (tone === "review") return "warning";
  return "info";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "info",
}: {
  icon: typeof Truck;
  label: string;
  value: string | number;
  detail: string;
  tone?: "ready" | "warning" | "blocked" | "info";
}) {
  return (
    <div className={`rounded-lg border p-4 ${statusTone(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon className="h-5 w-5 opacity-80" aria-hidden />
      </div>
      <p className="mt-3 text-sm leading-5 opacity-85">{detail}</p>
    </div>
  );
}

function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "border-teal-500/70 bg-teal-500 text-slate-950 hover:bg-teal-300"
      : variant === "danger"
        ? "border-rose-500/60 bg-rose-950/70 text-rose-50 hover:bg-rose-900"
        : "border-slate-700 bg-slate-900/80 text-slate-100 hover:border-teal-500/60 hover:text-teal-100";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition ${cls} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300`}
    >
      {children}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function isExceptionActive(row: DispatchRow) {
  return Boolean(
    row.load.insurance_claim_needed ||
      row.load.exception_flag ||
      row.load.exception_reason ||
      row.load.settlement_hold ||
      row.missingLabels.length > 0
  );
}

function TopCommandStrip({
  selected,
  selectedRow,
  onOpenException,
}: {
  selected: Load;
  selectedRow: DispatchRow;
  onOpenException: () => void;
}) {
  const exceptionActive = isExceptionActive(selectedRow);
  const links = [
    { label: "Pre-trip packet", href: `/pretrip/${selected.load_id}`, primary: true },
    { label: "Trip release", href: `/trip-release/${selected.load_id}` },
    { label: "Driver view", href: `/portals/driver/${selected.driver_id ?? "DRV-001"}` },
    { label: "Customer proof", href: `/shipper-portal/${selected.load_id}` },
    { label: "Manager file", href: `/loads/${selected.load_id}` },
    { label: "Settlement review", href: "/settlements" },
  ];

  return (
    <section className="sticky top-0 z-30 rounded-xl border border-teal-800/55 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="rounded-lg border border-teal-500/50 bg-teal-500/10 px-3 py-2">
            <p className="font-mono text-sm font-black text-teal-200">{selected.load_id}</p>
            <p className="text-xs font-semibold text-slate-200">{selectedRow.driverName}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Load command strip</p>
            <p className="text-sm font-semibold text-white">{shortLane(selected.origin)} to {shortLane(selected.destination)}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap justify-end gap-2">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                link.primary
                  ? "border-teal-500 bg-teal-500 text-slate-950 hover:bg-teal-300"
                  : "border-slate-700 bg-slate-900 text-slate-100 hover:border-teal-500 hover:text-teal-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {exceptionActive ? (
            <button
              type="button"
              onClick={onOpenException}
              className="inline-flex min-h-10 items-center rounded-md border border-rose-500/65 bg-rose-950/70 px-3 py-2 text-sm font-bold text-rose-50 transition hover:bg-rose-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
            >
              Open exception response
            </button>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-md border border-emerald-700/50 bg-emerald-950/35 px-3 py-2 text-sm font-bold text-emerald-200">
              No claim path active
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function LoadDocumentStrip({ selected }: { selected: Load }) {
  const { data } = useBofDemoData();
  const packet = useMemo(() => buildLoadArtifactPacket(data, selected.load_id), [data, selected.load_id]);
  const artifacts = new Map((packet?.artifacts ?? []).map((artifact) => [artifact.key, artifact]));
  const docs = [
    {
      label: "Rate confirmation",
      href: artifacts.get("rate_confirmation")?.actionUrl ?? selected.rate_con_url,
      image: "/evidence/support/document-support/rate-confirmation-preview.png",
      action: "Open rate confirmation",
    },
    {
      label: "BOL",
      href: artifacts.get("bol")?.actionUrl ?? selected.bol_url,
      image: "/evidence/support/document-support/bol-preview.png",
      action: "Open BOL",
    },
    {
      label: "Pre-trip cargo photo",
      href: artifacts.get("cargo_photo")?.actionUrl ?? selected.pickup_photo_url ?? selected.cargo_photo_url,
      image: artifacts.get("cargo_photo")?.canonicalUrl ?? selected.pickup_photo_url ?? selected.cargo_photo_url,
      action: "View pickup proof",
    },
    {
      label: "Seal proof",
      href: artifacts.get("seal_pickup_photo")?.actionUrl ?? selected.seal_photo_url,
      image: artifacts.get("seal_pickup_photo")?.canonicalUrl ?? selected.seal_photo_url,
      action: "View seal proof",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {docs.map((doc) => (
        <a
          key={doc.label}
          href={doc.href ?? `/loads/${selected.load_id}`}
          target={doc.href ? "_blank" : undefined}
          rel={doc.href ? "noreferrer" : undefined}
          className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-950/65 transition hover:-translate-y-0.5 hover:border-teal-500/60 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        >
          <div className="relative aspect-[16/9] bg-slate-900">
            {doc.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                <FileText className="h-8 w-8" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          </div>
          <div className="p-3">
            <p className="text-sm font-bold text-white">{doc.label}</p>
            <p className="mt-1 text-xs font-semibold text-teal-300 group-hover:text-teal-100">{doc.action}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function ExceptionResponsePanel({
  selected,
  selectedRow,
  open,
  onToggle,
}: {
  selected: Load;
  selectedRow: DispatchRow;
  open: boolean;
  onToggle: () => void;
}) {
  const { data } = useBofDemoData();
  const packet = useMemo(() => buildLoadArtifactPacket(data, selected.load_id), [data, selected.load_id]);
  const artifactMap = new Map((packet?.artifacts ?? []).map((artifact) => [artifact.key, artifact]));
  const active = isExceptionActive(selectedRow);
  const exceptionDocs = [
    {
      key: "claim_intake",
      title: "Claim intake report",
      detail: "Initial facts, parties, claimed amount, and claim owner.",
    },
    {
      key: "insurance_notification",
      title: "Insurance notice",
      detail: "Carrier/insurance notification for cargo, liability, or safety exposure.",
    },
    {
      key: "claim_packet",
      title: "Claim proof packet",
      detail: "Proof bundle for insurer, broker, customer, and manager review.",
    },
    {
      key: "damage_photo_packet",
      title: "Damage photo packet",
      detail: "Cargo, seal, trailer, or incident photos tied to the exception.",
    },
    {
      key: "seal_mismatch_photo",
      title: "Seal mismatch proof",
      detail: "Seal discrepancy evidence when the seal chain does not match.",
    },
    {
      key: "settlement_hold_notice",
      title: "Settlement hold notice",
      detail: "Settlement impact and release conditions while the exception is open.",
    },
  ]
    .map((item) => ({ ...item, artifact: artifactMap.get(item.key) }))
    .filter((item) => item.artifact?.status !== "not_applicable");

  return (
    <section className={`rounded-xl border p-5 ${active ? "border-rose-700/50 bg-rose-950/20" : "border-slate-800 bg-slate-900/45"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${active ? "text-rose-200" : "text-emerald-300"}`}>
            Exception / insurance response
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {active ? `${selected.load_id} has an exception response file` : `${selected.load_id} has no active claim path`}
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-200">
            Claims, insurance notices, damage photos, seal variance, and settlement holds stay out of the clean dispatch
            packet until something goes wrong. When the load has an exception, this button reveals the response file.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={!active}
          className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            active
              ? "border-rose-500/70 bg-rose-950/70 text-rose-50 hover:bg-rose-900 focus-visible:outline-rose-300"
              : "border-emerald-700/50 bg-emerald-950/30 text-emerald-200 opacity-80"
          }`}
        >
          {active ? (open ? "Hide exception file" : "Open exception response") : "No claim path active"}
        </button>
      </div>

      {active && open ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-rose-800/45 bg-slate-950/70 p-4">
            <p className="text-sm font-black text-white">Why this is outside the regular packet</p>
            <div className="mt-3 space-y-3 text-sm text-slate-200">
              <p>
                <span className="font-bold text-rose-200">Exception:</span>{" "}
                {selected.exception_reason || selectedRow.riskLabel || "Insurance or settlement review is active."}
              </p>
              <p>
                <span className="font-bold text-rose-200">Dispatch action:</span>{" "}
                {selectedRow.recommendedAction}
              </p>
              <p>
                <span className="font-bold text-rose-200">Settlement impact:</span>{" "}
                {selected.settlement_hold ? selected.settlement_hold_reason || "Settlement hold active until proof is cleared." : "No settlement hold recorded."}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <LinkButton href={`/loads/${selected.load_id}`} variant="danger">Open manager claim file</LinkButton>
              <LinkButton href="/documents" variant="secondary">Open operations cabinet</LinkButton>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {exceptionDocs.map(({ key, title, detail, artifact }) => {
              const href = artifact?.actionUrl || artifact?.canonicalUrl;
              const ready = artifact?.status === "ready" && Boolean(href);
              return (
                <a
                  key={key}
                  href={ready ? href : `/loads/${selected.load_id}`}
                  target={ready ? "_blank" : undefined}
                  rel={ready ? "noreferrer" : undefined}
                  className={`rounded-lg border p-4 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 ${
                    ready
                      ? "border-rose-700/45 bg-slate-950/75 hover:border-rose-400"
                      : "border-amber-700/45 bg-amber-950/20 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-white">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{detail}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs font-bold ${ready ? statusTone("ready") : statusTone("warning")}`}>
                      {ready ? "Ready" : "Needs file"}
                    </span>
                  </div>
                  <p className={`mt-3 text-xs font-bold ${ready ? "text-rose-200" : "text-amber-200"}`}>
                    {ready ? artifact?.actionLabel || "Open evidence" : "Route to manager file"}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LoadWorkspacePanel({ selected }: { selected: Load }) {
  const driverId = selected.driver_id ?? "DRV-001";
  const workspaces = [
    {
      label: "Manager load file",
      detail: "Manager load file with packet, proof, risk, and finance context.",
      href: `/loads/${selected.load_id}`,
      icon: FileText,
    },
    {
      label: "Driver pre-trip packet",
      detail: "Driver-facing release checklist for this exact load.",
      href: `/pretrip/${selected.load_id}`,
      icon: ClipboardCheck,
      primary: true,
    },
    {
      label: "Trip release review",
      detail: "Final go / no-go gate before dispatch release.",
      href: `/trip-release/${selected.load_id}`,
      icon: PackageCheck,
    },
    {
      label: "Driver file",
      detail: "Credentials, safety, documents, and dispatch eligibility.",
      href: `/drivers/${driverId}`,
      icon: UserRoundCheck,
    },
    {
      label: "Customer proof view",
      detail: "Shipper-facing proof, status, and document visibility.",
      href: `/shipper-portal/${selected.load_id}`,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="rounded-xl border border-teal-800/55 bg-teal-950/18 p-5 shadow-[0_0_40px_rgba(20,184,166,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
            Selected load workspaces
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {selected.load_id} has its own manager, driver, release, and customer pages
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Selecting a row changes the command file above. These links open the operating pages for the active load.
          </p>
        </div>
        <LinkButton href={`/pretrip/${selected.load_id}`}>Open {selected.load_id} pre-trip packet</LinkButton>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {workspaces.map(({ label, detail, href, icon: Icon, primary }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-lg border p-4 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
              primary
                ? "border-teal-500/70 bg-teal-500 text-slate-950 hover:bg-teal-300"
                : "border-slate-800 bg-slate-950/65 text-slate-200 hover:border-teal-500/55 hover:bg-slate-900"
            }`}
          >
            <Icon className={`h-5 w-5 ${primary ? "text-slate-950" : "text-teal-300"}`} aria-hidden />
            <p className="mt-3 text-base font-black">{label}</p>
            <p className={`mt-2 text-sm leading-5 ${primary ? "text-slate-900" : "text-slate-400"}`}>
              {detail}
            </p>
            <p className={`mt-3 text-xs font-bold ${primary ? "text-slate-950" : "text-teal-300 group-hover:text-teal-100"}`}>
              {href}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PretripPacketPanel({ selected }: { selected: Load }) {
  const { data } = useBofDemoData();
  const pretrip = useMemo(() => buildPretripTabletModel(data, selected.load_id), [data, selected.load_id]);
  const sections = pretrip?.sections ?? [];
  const blocked = pretrip?.overall === "BLOCKED";
  const clearSections = sections.filter((section) => section.lines.every((line) => line.status === "OK")).length;
  const reviewCount = sections.reduce((count, section) => count + section.lines.filter((line) => line.status !== "OK").length, 0);

  return (
    <section className="rounded-xl border border-teal-800/45 bg-slate-900/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Driver pre-trip packet</p>
          <h2 className="mt-2 text-3xl font-black text-white">{selected.load_id} release checklist</h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-300">
            This is the driver-facing release packet for the selected load: load docs, proof photos, vehicle readiness,
            route conditions, compliance, and financial blockers before the truck rolls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-full border px-4 py-2 text-sm font-bold ${blocked ? statusTone("blocked") : statusTone("ready")}`}>
            {pretrip?.overall ?? "REVIEW"}
          </div>
          <LinkButton href={`/pretrip/${selected.load_id}`}>Open driver packet</LinkButton>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Packet page</p>
          <p className="mt-2 text-lg font-black text-white">/pretrip/{selected.load_id}</p>
          <p className="mt-1 text-sm text-slate-400">Separate page for this load.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sections clear</p>
          <p className="mt-2 text-lg font-black text-emerald-300">{clearSections}/{sections.length || 1}</p>
          <p className="mt-1 text-sm text-slate-400">Driver can see what is safe to proceed.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Needs review</p>
          <p className={`mt-2 text-lg font-black ${reviewCount ? "text-amber-300" : "text-emerald-300"}`}>{reviewCount}</p>
          <p className="mt-1 text-sm text-slate-400">Named blockers, not vague missing-document counts.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const openIssues = section.lines.filter((line) => line.status !== "OK").length;
          return (
            <div key={section.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-teal-300">{section.letter}</p>
                  <h3 className="mt-1 text-base font-bold text-white">{section.title}</h3>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-bold ${openIssues ? statusTone("warning") : statusTone("ready")}`}>
                  {openIssues ? `${openIssues} review` : "Clear"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {section.lines.slice(0, 3).map((line) => (
                  <Link
                    key={line.id}
                    href={line.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/65 px-3 py-2 text-sm transition hover:border-teal-500/50 hover:text-teal-100"
                  >
                    <span className="text-slate-200">{line.label}</span>
                    <span className={line.status === "OK" ? "text-emerald-300" : "text-amber-300"}>{line.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <LinkButton href={`/pretrip/${selected.load_id}`}>Open pre-trip tablet</LinkButton>
        <LinkButton href={`/trip-release/${selected.load_id}`} variant="secondary">
          Review trip release
        </LinkButton>
        <LinkButton href={`/portals/driver/${selected.driver_id ?? "DRV-001"}`} variant="secondary">
          Open driver view
        </LinkButton>
      </div>
    </section>
  );
}

function RouteOperationsPanel({ selected }: { selected: Load }) {
  const ops = routeOpsForLoad(selected);
  return (
    <section id="route-control" className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Route control</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{shortLane(selected.origin)} to {shortLane(selected.destination)}</h2>
          </div>
          <MapPinned className="h-7 w-7 text-teal-300" aria-hidden />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-sm font-bold text-slate-300">Traffic plan</p>
            <p className="mt-2 text-lg font-bold text-white">{ops.traffic}</p>
            <p className="mt-2 text-sm text-slate-400">{ops.workaround}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-sm font-bold text-slate-300">Weather watch</p>
            <p className="mt-2 text-lg font-bold text-white">{ops.weather}</p>
            <p className="mt-2 text-sm text-slate-400">Dispatcher owns reroute or appointment update.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-sm font-bold text-slate-300">Next rest stop</p>
            <p className="mt-2 text-lg font-bold text-white">{ops.restStop}</p>
            <p className="mt-2 text-sm text-slate-400">{ops.restEta} min out. Parking: {ops.parking}.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-sm font-bold text-slate-300">Diesel decision</p>
            <p className="mt-2 text-lg font-bold text-white">${ops.dieselPrice.toFixed(3)}/gal at {ops.dieselStop}</p>
            <p className="mt-2 text-sm text-emerald-300">Estimated lane savings: {formatMoney(ops.fuelSavings)} on {ops.gallons} gal.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Clean financial review</p>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-4 py-3">
            <span className="text-slate-400">Linehaul / load value</span>
            <strong className="text-white">{formatMoney(selected.total_pay)}</strong>
          </div>
          <div className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-4 py-3">
            <span className="text-slate-400">Fuel plan</span>
            <strong className="text-emerald-300">{formatMoney(ops.gallons * ops.dieselPrice)}</strong>
          </div>
          <div className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-4 py-3">
            <span className="text-slate-400">Settlement posture</span>
            <strong className={selected.settlement_hold ? "text-amber-300" : "text-emerald-300"}>
              {selected.settlement_hold ? "Hold review" : "Release eligible"}
            </strong>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <LinkButton href="/settlements" variant="secondary">Open settlement review</LinkButton>
          {selected.insurance_claim_needed ? (
            <LinkButton href={`/loads/${selected.load_id}`} variant="danger">Open insurance packet</LinkButton>
          ) : (
            <LinkButton href={`/shipper-portal/${selected.load_id}`} variant="secondary">Open customer proof view</LinkButton>
          )}
        </div>
      </div>
    </section>
  );
}

function AudienceWorkspace({ selected, view, setView }: { selected: Load; view: AudienceView; setView: (view: AudienceView) => void }) {
  const tabs: Array<{ id: AudienceView; label: string; icon: typeof Truck }> = [
    { id: "dispatcher", label: "Dispatcher", icon: ClipboardCheck },
    { id: "driver", label: "Driver", icon: UserRoundCheck },
    { id: "manager", label: "Owner / Manager", icon: Banknote },
    { id: "insurance", label: "Insurance", icon: ShieldCheck },
  ];
  const panels: Record<AudienceView, { title: string; body: string; actions: Array<{ label: string; href: string; danger?: boolean }> }> = {
    dispatcher: {
      title: "Dispatch view",
      body: "Assignment, appointment windows, packet readiness, route support, fuel decision, and ETA exceptions in one work area.",
      actions: [
        { label: "Open load file", href: `/loads/${selected.load_id}` },
        { label: "Open trip release", href: `/trip-release/${selected.load_id}` },
      ],
    },
    driver: {
      title: "Driver view",
      body: "The driver sees the pre-trip tablet, BOL, seal and cargo photo requirements, rest stop guidance, and release status.",
      actions: [
        { label: "Open pre-trip tablet", href: `/pretrip/${selected.load_id}` },
        { label: "Open driver portal", href: `/portals/driver/${selected.driver_id ?? "DRV-001"}` },
      ],
    },
    manager: {
      title: "Fleet owner / manager view",
      body: "The manager sees load value, proof readiness, settlement risk, action owner, and cash impact before approving release.",
      actions: [
        { label: "Open command center", href: "/command-center" },
        { label: "Open financials", href: "/fleet-financials" },
      ],
    },
    insurance: {
      title: "Insurance view",
      body: selected.insurance_claim_needed
        ? "Claim context is visible with damage proof, seal variance, driver statement path, and settlement hold status."
        : "No claim workflow is active for this load. Insurance stays out of the normal dispatch path.",
      actions: [
        { label: selected.insurance_claim_needed ? "Open claim load file" : "Review safety posture", href: selected.insurance_claim_needed ? `/loads/${selected.load_id}` : "/safety", danger: selected.insurance_claim_needed },
        { label: "Open documents", href: "/documents" },
      ],
    },
  };
  const active = panels[view];

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
              view === id
                ? "border-teal-500 bg-teal-500 text-slate-950"
                : "border-slate-800 bg-slate-950/65 text-slate-300 hover:border-teal-500/60 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">{active.title}</h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-300">{active.body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {active.actions.map((action) => (
            <LinkButton key={action.label} href={action.href} variant={action.danger ? "danger" : "secondary"}>
              {action.label}
            </LinkButton>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DispatchBoardScreen() {
  const { data } = useBofDemoData();
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const selectedLoadId = useDispatchDashboardStore((s) => s.selectedLoadId);
  const selectLoad = useDispatchDashboardStore((s) => s.selectLoad);
  const [audienceView, setAudienceView] = useState<AudienceView>("dispatcher");
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rows = useMemo(() => makeDispatchRows(data, loads, drivers), [data, loads, drivers]);
  const summary = useMemo(() => getDispatchCommandSummary(data), [data]);
  const selectedRow = useMemo(
    () => rows.find((row) => row.load.load_id === selectedLoadId) ?? rows[0] ?? null,
    [rows, selectedLoadId]
  );
  const selected = selectedRow?.load ?? null;
  const actionRows = rows.filter((row) => row.needsAction);
  const readyRows = rows.filter((row) => !row.needsAction);
  const selectedCarrier = useMemo(() => (selected ? getCarrierForLoad(selected.load_id) : null), [selected]);
  const selectedCarrierPacket = useMemo(
    () => (selectedCarrier ? getCarrierPacketSummary(selectedCarrier) : null),
    [selectedCarrier]
  );
  const selectedCarrierGate = useMemo(
    () => (selectedCarrier ? getCarrierDispatchGate(selectedCarrier) : null),
    [selectedCarrier]
  );

  useEffect(() => {
    setExceptionOpen(false);
  }, [selectedLoadId]);

  if (!mounted || !selected || !selectedRow || !selectedCarrier || !selectedCarrierPacket || !selectedCarrierGate) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-300">
        Loading dispatch command center...
      </div>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <Image
            src="/generated/marketing/demoheroimage-v2.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/86 to-slate-950/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-300">Delta Advanced Trucking Inc.</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Dispatch Command Center
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              One dispatch workspace for load release, driver readiness, proof capture, route decisions,
              diesel cost, weather, traffic, settlement readiness, and insurance exceptions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href={`/pretrip/${selected.load_id}`}>Open pre-trip packet</LinkButton>
              <LinkButton href={`/trip-release/${selected.load_id}`} variant="secondary">Review trip release</LinkButton>
              <LinkButton href={`/carriers/${selectedCarrier.id}/packet`} variant="secondary">Review carrier packet</LinkButton>
              <LinkButton href="/dispatch/intake" variant="secondary">Open trip packet workspace</LinkButton>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-teal-500/40 bg-teal-500/10 px-3 py-2 font-mono text-sm font-black text-teal-200">
                  {selected.load_id}
                </span>
                <Link href={`/loads/${selected.load_id}`} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">
                  Manager file
                </Link>
                <Link href={`/pretrip/${selected.load_id}`} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">
                  Pre-trip docs
                </Link>
                <Link href={`/shipper-portal/${selected.load_id}`} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">
                  Customer proof
                </Link>
                <Link href={`/carriers/${selectedCarrier.id}`} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">
                  Carrier readiness
                </Link>
                {isExceptionActive(selectedRow) ? (
                  <button
                    type="button"
                    onClick={() => setExceptionOpen(true)}
                    className="rounded-md border border-rose-500/60 bg-rose-950/80 px-3 py-2 text-sm font-bold text-rose-50 hover:bg-rose-900"
                  >
                    Exception response
                  </button>
                ) : (
                  <span className="rounded-md border border-emerald-700/45 bg-emerald-950/50 px-3 py-2 text-sm font-bold text-emerald-200">
                    No claim path active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/15 bg-slate-950/88 p-4 shadow-2xl backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
        <TopCommandStrip
          selected={selected}
          selectedRow={selectedRow}
          onOpenException={() => setExceptionOpen(true)}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Truck} label="Loads on board" value={rows.length} detail={`${readyRows.length} operating cleanly, ${actionRows.length} with named action items.`} tone="ready" />
          <MetricCard icon={AlertTriangle} label="Action queue" value={actionRows.length} detail="Only named exceptions are shown as problems; routine loads stay clean." tone={actionRows.length ? "warning" : "ready"} />
          <MetricCard icon={PackageCheck} label="Proof posture" value={`${summary.proofCompleteLoads || 9}/${rows.length}`} detail="BOL, POD, seal, cargo, RFID, and delivery proof tracked by load." tone="info" />
          <MetricCard icon={ShieldCheck} label="Release readiness" value="82%" detail="Driver, route, equipment, packet, and settlement gates aligned." tone="ready" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Selected command file</p>
                <h2 className="mt-2 text-3xl font-black text-white">{selected.load_id}</h2>
                <p className="mt-2 text-base text-slate-300">{selected.customer_name}</p>
                <p className="mt-1 text-sm text-slate-400">{shortLane(selected.origin)} to {shortLane(selected.destination)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${loadStatusChipClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Driver / unit</p>
                <p className="mt-2 text-lg font-bold text-white">{selectedRow.driverName}</p>
                <p className="text-sm text-slate-400">{selected.tractor_id} / {selected.trailer_id}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Appointment window</p>
                <p className="mt-2 text-lg font-bold text-white">{formatDateTime(selected.pickup_datetime)}</p>
                <p className="text-sm text-slate-400">Delivery {formatDateTime(selected.delivery_datetime)}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Packet</p>
                <p className="mt-2 text-lg font-bold text-white">{selectedRow.packetReady}/{selectedRow.packetTotal || 1} ready</p>
                <p className={selectedRow.needsAction ? "text-sm text-amber-300" : "text-sm text-emerald-300"}>
                  {selectedRow.needsAction ? selectedRow.riskLabel : "Operationally clean"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Next action</p>
                <p className="mt-2 text-base font-bold text-white">{selectedRow.recommendedAction}</p>
              </div>
              <Link
                href={`/carriers/${selectedCarrier.id}`}
                className={`rounded-lg border p-4 transition hover:border-teal-300/70 ${statusTone(carrierGateTone(selectedCarrierGate.tone))}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Carrier eligibility</p>
                <p className="mt-2 text-lg font-bold text-white">{selectedCarrier.dba}</p>
                <p className="text-sm text-slate-300">
                  {selectedCarrierGate.indicator} · packet {selectedCarrierPacket.percent}%
                </p>
                <p className="mt-1 text-sm font-bold text-white">{selectedCarrierGate.assignmentSimulation}</p>
                <p className="mt-2 text-xs leading-5 text-teal-100/80">
                  {selectedCarrierGate.dispatchConsequence}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Next: {selectedCarrierGate.requiredNextAction}
                </p>
              </Link>
            </div>

            {selectedRow.missingLabels.length > 0 ? (
              <div className="mt-5 rounded-lg border border-amber-700/45 bg-amber-950/25 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  Missing or blocked items
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-50/90">
                  {selectedRow.missingLabels.slice(0, 3).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href={`/loads/${selected.load_id}`} variant="secondary">Open load file</LinkButton>
              <LinkButton href={`/carriers/${selectedCarrier.id}/packet`} variant="secondary">Review carrier packet</LinkButton>
              <LinkButton href={`/drivers/${selected.driver_id ?? "DRV-001"}`} variant="secondary">Open driver file</LinkButton>
              <LinkButton href={`/shipper-portal/${selected.load_id}`} variant="secondary">Customer proof view</LinkButton>
              {isExceptionActive(selectedRow) ? (
                <button
                  type="button"
                  onClick={() => setExceptionOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-500/60 bg-rose-950/70 px-4 py-2 text-sm font-bold text-rose-50 transition hover:bg-rose-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                >
                  Open exception response
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Document and photo flow</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Proof is visible before the drawer</h2>
              </div>
              <Camera className="h-7 w-7 text-teal-300" aria-hidden />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Dispatch can see the actual packet path here: rate confirmation, BOL, cargo photo,
              seal proof, pre-trip release, trip release, customer proof, and settlement handoff.
            </p>
            <div className="mt-5">
              <LoadDocumentStrip selected={selected} />
            </div>
          </div>
        </section>

        <ExceptionResponsePanel
          selected={selected}
          selectedRow={selectedRow}
          open={exceptionOpen}
          onToggle={() => setExceptionOpen((current) => !current)}
        />
        <LoadWorkspacePanel selected={selected} />
        <PretripPacketPanel selected={selected} />
        <RouteOperationsPanel selected={selected} />
        <AudienceWorkspace selected={selected} view={audienceView} setView={setAudienceView} />

        <section className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Dispatch board</p>
              <h2 className="mt-2 text-2xl font-bold text-white">12 loads, one clean row per load</h2>
              <p className="mt-2 text-sm text-slate-400">Select a row to update the command file above. Use direct actions for the real workflow pages.</p>
            </div>
            <LinkButton href="/command-center" variant="secondary">Open enterprise queue</LinkButton>
          </div>

          <div className="mt-5 grid gap-3">
            {rows.map((row) => (
              <article
                key={row.load.load_id}
                className={`rounded-xl border p-4 transition ${
                  row.load.load_id === selected.load_id
                    ? "border-teal-500/65 bg-teal-950/20"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/75"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectLoad(row.load.load_id)}
                  className="grid w-full appearance-none gap-4 bg-transparent text-left text-inherit md:grid-cols-[0.75fr_1.25fr_1fr_0.85fr_1.15fr] md:items-center"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-teal-300">{row.load.load_id}</p>
                    <p className="mt-1 text-sm font-bold text-white">{row.load.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{shortLane(row.load.origin)}</p>
                    <p className="text-sm text-slate-400">to {shortLane(row.load.destination)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{row.driverName}</p>
                    <p className="text-sm text-slate-400">{row.load.tractor_id} / {row.load.trailer_id}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${row.needsAction ? statusTone(row.blocked ? "blocked" : "warning") : statusTone("ready")}`}>
                      {row.needsAction ? row.riskLabel : "Ready"}
                    </span>
                    <p className="mt-2 text-xs text-slate-400">Packet {row.packetReady}/{row.packetTotal || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">{row.recommendedAction}</p>
                  </div>
                </button>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                  <Link href={`/pretrip/${row.load.load_id}`} className="rounded-md border border-teal-700/70 bg-teal-950/35 px-3 py-2 text-sm font-bold text-teal-100 hover:border-teal-400 hover:text-white">Pre-trip packet</Link>
                  <Link href={`/trip-release/${row.load.load_id}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">Trip release page</Link>
                  <Link href={`/drivers/${row.load.driver_id ?? "DRV-001"}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">Driver page</Link>
                  <Link href={`/loads/${row.load.load_id}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">Manager load page</Link>
                  <Link href={`/carriers/${getCarrierForLoad(row.load.load_id).id}/packet`} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-100 hover:border-teal-500 hover:text-teal-100">Review carrier packet</Link>
                  {row.load.insurance_claim_needed ? (
                    <Link href={`/loads/${row.load.load_id}`} className="rounded-md border border-rose-600/60 bg-rose-950/55 px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-900">Insurance review</Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
            <Timer className="h-6 w-6 text-teal-300" aria-hidden />
            <h3 className="mt-3 text-lg font-bold text-white">Appointment control</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Pickup and delivery windows stay tied to the release packet, route status, and customer proof view.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
            <Fuel className="h-6 w-6 text-teal-300" aria-hidden />
            <h3 className="mt-3 text-lg font-bold text-white">Diesel and rest planning</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Fuel price, rest stop, parking, and route decisions are visible where the dispatcher works.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
            <CloudSun className="h-6 w-6 text-teal-300" aria-hidden />
            <h3 className="mt-3 text-lg font-bold text-white">Weather and traffic logic</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">The route panel explains what changed, who owns the action, and whether a workaround is queued.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
