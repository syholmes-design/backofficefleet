import type { Settlement } from "@/types/settlements-payroll";

export function formatPayrollCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function settlementStatusChipClass(status: Settlement["status"]): string {
  switch (status) {
    case "Exported":
      return "border border-emerald-700/50 bg-emerald-950/45 text-emerald-100";
    case "Ready for Export":
      return "border border-teal-600/50 bg-teal-950/45 text-teal-100";
    case "Draft":
    default:
      return "border border-slate-600 bg-slate-800/80 text-slate-200";
  }
}

export function proofChipClass(
  p: "Complete" | "Incomplete" | "Missing" | null | undefined
): string {
  switch (p) {
    case "Complete":
      return "border border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    case "Incomplete":
      return "border border-amber-600/50 bg-amber-950/40 text-amber-100";
    case "Missing":
      return "border border-red-800/50 bg-red-950/40 text-red-100";
    default:
      return "border border-slate-600 bg-slate-900 text-slate-400";
  }
}
