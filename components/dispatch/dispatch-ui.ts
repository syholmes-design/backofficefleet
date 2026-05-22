import type { LoadStatus, ProofStatus, SealStatus } from "@/types/dispatch";

const STATUS_ORDER: LoadStatus[] = [
  "Planned",
  "Assigned",
  "Dispatched",
  "In Transit",
  "Delivered",
  "Exception",
];

export function orderedStatusGroups(): LoadStatus[] {
  return STATUS_ORDER;
}

export function loadStatusChipClass(status: LoadStatus): string {
  switch (status) {
    case "Exception":
      return "border border-red-700/60 bg-red-950/60 text-red-100";
    case "Delivered":
      return "border border-emerald-700/50 bg-emerald-950/50 text-emerald-100";
    case "In Transit":
      return "border border-amber-600/50 bg-amber-950/45 text-amber-100";
    case "Dispatched":
      return "border border-teal-600/50 bg-teal-950/50 text-teal-100";
    case "Assigned":
      return "border border-slate-600 bg-slate-800/80 text-slate-100";
    case "Planned":
    default:
      return "border border-slate-600 bg-slate-900/80 text-slate-200";
  }
}

export function proofChipClass(proof: ProofStatus): string {
  switch (proof) {
    case "Complete":
      return "border border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    case "Incomplete":
      return "border border-amber-600/50 bg-amber-950/40 text-amber-100";
    case "Missing":
    default:
      return "border border-red-700/50 bg-red-950/40 text-red-100";
  }
}

export function sealChipClass(seal: SealStatus): string {
  switch (seal) {
    case "Match":
      return "border border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    case "Mismatch":
      return "border border-red-700/50 bg-red-950/40 text-red-100";
    case "Missing":
    default:
      return "border border-slate-600 bg-slate-900 text-slate-300";
  }
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
