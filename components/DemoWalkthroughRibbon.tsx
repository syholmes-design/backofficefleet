"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DemoStep = {
  match: (pathname: string) => boolean;
  label: string;
  href: string;
  proof: string;
  nextLabel: string;
  nextHref: string;
};

const DEMO_STEPS: DemoStep[] = [
  {
    match: (pathname) => pathname === "/dashboard",
    label: "Start here",
    href: "/dashboard",
    proof: "The demo lobby: one view of the operating system and the routes that prove it.",
    nextLabel: "Open Command Center",
    nextHref: "/command-center",
  },
  {
    match: (pathname) => pathname.startsWith("/command-center"),
    label: "Risk triage",
    href: "/command-center",
    proof: "Money at risk, blocked work, and owner actions are surfaced before they become emergencies.",
    nextLabel: "Release Dispatch",
    nextHref: "/dispatch",
  },
  {
    match: (pathname) => pathname.startsWith("/dispatch"),
    label: "Dispatch release",
    href: "/dispatch",
    proof: "Loads move only when driver readiness, route context, proof, and exceptions are owned.",
    nextLabel: "Review Drivers",
    nextHref: "/drivers",
  },
  {
    match: (pathname) => pathname.startsWith("/drivers"),
    label: "Driver readiness",
    href: "/drivers",
    proof: "Driver blockers, documents, acknowledgments, and eligibility are visible in one command view.",
    nextLabel: "Open Documents",
    nextHref: "/documents",
  },
  {
    match: (pathname) => pathname.startsWith("/documents"),
    label: "Proof and vault",
    href: "/documents",
    proof: "Driver files, load proof, claim support, and operating records stay tied to the workflow.",
    nextLabel: "Review Loads",
    nextHref: "/loads",
  },
  {
    match: (pathname) => pathname.startsWith("/loads"),
    label: "Load lifecycle",
    href: "/loads",
    proof: "Each load connects readiness, BOL/POD proof, exceptions, billing, and settlement confidence.",
    nextLabel: "Check Safety",
    nextHref: "/safety",
  },
  {
    match: (pathname) => pathname.startsWith("/safety"),
    label: "Safety exposure",
    href: "/safety",
    proof: "Incidents, driver risk, claims exposure, and dispatch holds become action queues.",
    nextLabel: "Review Settlements",
    nextHref: "/settlements",
  },
  {
    match: (pathname) => pathname.startsWith("/settlements"),
    label: "Settlement control",
    href: "/settlements",
    proof: "Pay release depends on proof, deductions, holds, claims, and export readiness.",
    nextLabel: "Check Maintenance",
    nextHref: "/maintenance",
  },
  {
    match: (pathname) => pathname.startsWith("/maintenance"),
    label: "Asset readiness",
    href: "/maintenance",
    proof: "Maintenance defects and work orders show exactly when equipment blocks dispatch.",
    nextLabel: "Open Trip Release",
    nextHref: "/trip-release/L001",
  },
  {
    match: (pathname) => pathname.startsWith("/trip-release"),
    label: "Driver release proof",
    href: "/trip-release/L001",
    proof: "The driver sees only the release-ready packet, route, proof, and required acknowledgments.",
    nextLabel: "Open Shipper Portal",
    nextHref: "/shipper-portal/L001",
  },
  {
    match: (pathname) => pathname.startsWith("/shipper-portal"),
    label: "Customer transparency",
    href: "/shipper-portal/L001",
    proof: "The customer sees shipment status, proof, exceptions, and invoice confidence without internal noise.",
    nextLabel: "Back to Dashboard",
    nextHref: "/dashboard",
  },
];

export function DemoWalkthroughRibbon() {
  const pathname = usePathname();
  const activeStep = DEMO_STEPS.find((step) => step.match(pathname));

  if (!activeStep) return null;

  return (
    <div className="border-t border-slate-800 bg-slate-900/95 px-6 py-2.5 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 text-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="mr-2 inline-flex rounded border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
            Owner demo path
          </span>
          <Link href={activeStep.href} className="font-semibold text-white underline-offset-4 hover:underline">
            {activeStep.label}
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-300">{activeStep.proof}</span>
        </div>
        <Link
          href={activeStep.nextHref}
          className="inline-flex shrink-0 items-center justify-center rounded border border-teal-400/40 bg-teal-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-teal-100 transition hover:border-teal-300 hover:bg-teal-400/20"
        >
          Next: {activeStep.nextLabel}
        </Link>
      </div>
    </div>
  );
}
