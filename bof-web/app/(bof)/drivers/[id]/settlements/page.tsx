/**
 * BOF Route Owner:
 * URL: /drivers/:id/settlements
 * Type: DEMO
 * Primary component: DriverSettlementsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { AlertTriangle, ClipboardCheck, DollarSign, FileText, WalletCards } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getDriverPaySettlementMethod,
  getSettlementMethodBadge,
  type DriverPaySettlementMethod,
} from "@/lib/driver-pay-settlement-methods";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { SettlementHold, WeeklySettlement } from "@/lib/v3-operational-types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
};

type MoneyLine = {
  label: string;
  amount: number;
  detail: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function latestWeek(rows: WeeklySettlement[]) {
  return Array.from(new Set(rows.map((row) => row.weekEnding)))
    .filter(Boolean)
    .sort()
    .pop() ?? "";
}

function splitAmount(total: number, specs: Array<Omit<MoneyLine, "amount"> & { ratio: number }>): MoneyLine[] {
  let used = 0;

  return specs.map((spec, index) => {
    const amount = index === specs.length - 1 ? total - used : Math.round(total * spec.ratio * 100) / 100;
    used += amount;

    return {
      label: spec.label,
      detail: spec.detail,
      amount,
    };
  });
}

function earningsLines(settlement: WeeklySettlement, method: DriverPaySettlementMethod): MoneyLine[] {
  if (method.workerType === "Independent Contractor / Owner-Operator") {
    return splitAmount(settlement.grossPay, [
      {
        label: "Linehaul settlement",
        ratio: 0.7,
        detail: method.settlementMethod === "Percentage of Load Revenue"
          ? `${method.linehaulPercent ?? 72}% of linehaul revenue`
          : method.settlementMethod === "Hybrid"
            ? `Hybrid floor plus mileage settlement`
            : `${method.loadedMileRate?.toFixed(2) ?? "1.85"} per loaded mile`,
      },
      {
        label: "Fuel surcharge pass-through",
        ratio: 0.12,
        detail: method.fuelSurchargePassThrough ? "Fuel surcharge passed through to contractor" : "Fuel surcharge retained by fleet",
      },
      {
        label: "Accessorial pass-through",
        ratio: 0.08,
        detail: "Detention, layover, TONU, and extra stop items",
      },
      {
        label: "Approved reimbursements",
        ratio: 0.1,
        detail: "Receipts, tolls, scale tickets, parking, and lumper reimbursement",
      },
    ]);
  }

  return splitAmount(settlement.grossPay, [
    {
      label: "Mileage pay",
      ratio: 0.78,
      detail: `${method.centsPerMileRate?.toFixed(2) ?? "0.65"} per dispatched mile`,
    },
    {
      label: "Accessorial pay",
      ratio: 0.08,
      detail: "Detention, extra stop, layover, and route exception pay",
    },
    {
      label: "Safety or performance bonus",
      ratio: 0.04,
      detail: "Configurable weekly or trip-level bonus rules",
    },
    {
      label: "Approved reimbursements",
      ratio: 0.1,
      detail: "Tolls, parking, scale tickets, and company-approved expenses",
    },
  ]);
}

function deductionLines(settlement: WeeklySettlement, method: DriverPaySettlementMethod): MoneyLine[] {
  if (method.workerType === "Independent Contractor / Owner-Operator") {
    return splitAmount(settlement.totalDeductions, [
      {
        label: "Insurance and escrow",
        ratio: 0.35,
        detail: "Physical damage, occupational accident, escrow, or reserve agreements",
      },
      {
        label: "Fuel card and IFTA recovery",
        ratio: 0.3,
        detail: "Fuel card usage, IFTA allocation, and approved charge recovery",
      },
      {
        label: "Chargebacks",
        ratio: 0.2,
        detail: "Claims, trailer washout, missing proof, or customer chargeback items",
      },
      {
        label: "Maintenance reserve",
        ratio: 0.15,
        detail: "Contractor reserve, tire reserve, or maintenance program deductions",
      },
    ]);
  }

  return splitAmount(settlement.totalDeductions, [
    {
      label: "Payroll taxes and benefits",
      ratio: 0.46,
      detail: "Payroll tax, benefits, garnishment, and configured withholding buckets",
    },
    {
      label: "Fuel advance recovery",
      ratio: 0.22,
      detail: "Driver advances and fuel card balances tied to the pay cycle",
    },
    {
      label: "Equipment and uniforms",
      ratio: 0.12,
      detail: "Company equipment, uniforms, devices, and authorized deductions",
    },
    {
      label: "Safety or claim reserve",
      ratio: 0.2,
      detail: "Only applied when policy allows a claim, incident, or proof-related reserve",
    },
  ]);
}

function methodDescription(method: DriverPaySettlementMethod) {
  if (method.workerType === "Independent Contractor / Owner-Operator") {
    if (method.settlementMethod === "Percentage of Load Revenue") {
      return `${method.linehaulPercent ?? 72}% of linehaul, with fuel surcharge and accessorial pass-through controls.`;
    }
    if (method.settlementMethod === "Hybrid") {
      return `${currency(method.flatMinimumPerTrip ?? 450)} minimum plus mileage economics, with configurable pass-through and chargeback rules.`;
    }
    return `${currency(method.loadedMileRate ?? 1.85)} per loaded mile, plus configurable pass-throughs, reimbursements, reserves, and chargebacks.`;
  }

  if (method.settlementMethod === "Hourly / Salary") {
    return `${currency(method.hourlyRate ?? 25)} hourly or salary-style payroll with overtime, reimbursements, and deductions.`;
  }

  return `${currency(method.centsPerMileRate ?? 0.65)} per mile payroll with accessorials, bonuses, reimbursements, and payroll deductions.`;
}

const SUPPORTED_PAY_MODELS = [
  {
    label: "Cents per mile",
    detail: "Company driver mileage payroll with loaded, empty, practical, or dispatch miles.",
  },
  {
    label: "Hourly or salary",
    detail: "Local, yard, shuttle, training, standby, overtime, and salary-style driver pay.",
  },
  {
    label: "Rate per mile",
    detail: "Owner-operator loaded mile settlement with minimums, reserves, and chargebacks.",
  },
  {
    label: "Percentage of revenue",
    detail: "Linehaul percentage settlement with fuel surcharge and accessorial pass-through logic.",
  },
  {
    label: "Flat trip rate",
    detail: "Dedicated lanes, short haul, shuttle moves, rescue loads, and minimum trip pay.",
  },
  {
    label: "Hybrid plans",
    detail: "Mileage plus minimum, percentage plus accessorials, or route-specific exceptions.",
  },
  {
    label: "Reimbursements",
    detail: "Tolls, scale tickets, parking, lumper, washout, hotel, repair, and receipts.",
  },
  {
    label: "Deductions and holds",
    detail: "Fuel advances, escrow, insurance, garnishments, claim reserves, proof holds, and chargebacks.",
  },
];

export default function DriverSettlementsPage({ params, searchParams }: Props) {
  const { id } = use(params);
  const { week } = use(searchParams);
  const { data } = useBofDemoData();
  const [weeklySettlements, setWeeklySettlements] = useState<WeeklySettlement[]>([]);
  const [settlementHolds, setSettlementHolds] = useState<SettlementHold[]>([]);
  const [loading, setLoading] = useState(true);

  const driver = data.drivers.find((d) => d.id === id);
  if (!driver) {
    notFound();
  }

  useEffect(() => {
    let alive = true;

    async function loadSettlementData() {
      setLoading(true);
      try {
        const available = await isV3DataAvailable();
        if (!available) return;

        const v3Data = await getV3OperationalData();
        if (!alive) return;
        setWeeklySettlements(v3Data.weeklySettlements);
        setSettlementHolds(v3Data.settlementHolds);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSettlementData();

    return () => {
      alive = false;
    };
  }, []);

  const method = getDriverPaySettlementMethod(id, data);
  const methodBadge = getSettlementMethodBadge(id, data);

  const driverWeeks = useMemo(() => {
    return weeklySettlements
      .filter((settlement) => settlement.driverId === id)
      .sort((a, b) => b.weekEnding.localeCompare(a.weekEnding));
  }, [id, weeklySettlements]);

  const selectedWeek = week || latestWeek(driverWeeks);
  const settlement = driverWeeks.find((row) => row.weekEnding === selectedWeek) ?? driverWeeks[0] ?? null;
  const holdsForWeek = useMemo(() => {
    if (!settlement) return [];
    return settlementHolds.filter((hold) => hold.driverId === id && hold.weekEnding === settlement.weekEnding);
  }, [id, settlement, settlementHolds]);

  const earnings = settlement ? earningsLines(settlement, method) : [];
  const deductions = settlement ? deductionLines(settlement, method) : [];
  const earningsTotal = earnings.reduce((sum, line) => sum + line.amount, 0);
  const deductionsTotal = deductions.reduce((sum, line) => sum + line.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-7xl rounded-xl border border-slate-800 bg-slate-900/60 p-8">
          <p className="text-sm text-slate-400">Loading weekly settlement detail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/settlements" className="text-sm font-semibold text-teal-200 underline-offset-4 hover:underline">
                Back to settlement queue
              </Link>
              <h1 className="mt-3 text-3xl font-bold text-white">{driver.name} - Weekly Pay Review</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                BOF ties this pay review to the exact weekly settlement row from the queue, explains gross-to-net math,
                tracks proof or safety holds, and shows how different employee and owner-operator pay plans can be governed in one workflow.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Settlement week
                <select
                  value={settlement?.weekEnding ?? ""}
                  onChange={(event) => {
                    window.location.href = `/drivers/${id}/settlements?week=${encodeURIComponent(event.target.value)}`;
                  }}
                  className="min-w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                >
                  {driverWeeks.map((row) => (
                    <option key={row.weekEnding} value={row.weekEnding}>
                      {formatDisplayDate(row.weekEnding)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Worker type</div>
                <div className="mt-1 text-sm font-semibold text-white">{method.workerType}</div>
                <div className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  methodBadge.color === "purple" ? "bg-purple-500/15 text-purple-200" : "bg-blue-500/15 text-blue-200"
                }`}>
                  {method.settlementMethod}
                </div>
              </div>
            </div>
          </div>
        </header>

        {!settlement ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-300">No weekly settlement record was found for this driver.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Payroll week</span>
                  <ClipboardCheck className="h-4 w-4 text-blue-300" />
                </div>
                <div className="mt-3 text-2xl font-bold text-white">{formatDisplayDate(settlement.weekEnding)}</div>
                <p className="mt-2 font-mono text-xs text-slate-500">Queue week: {settlement.weekEnding}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Gross pay from queue</span>
                  <DollarSign className="h-4 w-4 text-green-300" />
                </div>
                <div className="mt-3 text-3xl font-bold text-white">{currency(settlement.grossPay)}</div>
                <p className="mt-2 text-xs text-slate-500">Matches the Gross Pay column on /settlements.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Deductions from queue</span>
                  <AlertTriangle className="h-4 w-4 text-orange-300" />
                </div>
                <div className="mt-3 text-3xl font-bold text-orange-300">{currency(settlement.totalDeductions)}</div>
                <p className="mt-2 text-xs text-slate-500">Line items below total exactly to this amount.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Pending pay release (net)</span>
                  <WalletCards className="h-4 w-4 text-teal-300" />
                </div>
                <div className="mt-3 text-3xl font-bold text-teal-300">{currency(settlement.netPay)}</div>
                <p className="mt-2 text-xs text-slate-500">This is the payable amount after weekly deductions.</p>
              </div>
            </section>

            <section className="rounded-xl border border-teal-400/25 bg-teal-400/10 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-teal-200/75">Gross pay</div>
                  <div className="mt-1 text-2xl font-bold text-white">{currency(settlement.grossPay)}</div>
                </div>
                <div className="hidden text-2xl font-bold text-teal-100/70 md:block">-</div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-teal-200/75">Deductions</div>
                  <div className="mt-1 text-2xl font-bold text-orange-200">{currency(settlement.totalDeductions)}</div>
                </div>
                <div className="hidden text-2xl font-bold text-teal-100/70 md:block">=</div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-teal-200/75">Pending net pay</div>
                  <div className="mt-1 text-2xl font-bold text-teal-100">{currency(settlement.netPay)}</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-teal-100/80">
                Reconciliation check for {formatDisplayDate(settlement.weekEnding)}: this page uses the same weekly settlement row shown in the queue.
              </p>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-teal-300" />
                  <h2 className="text-xl font-semibold text-white">Weekly Gross-to-Net Explanation</h2>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  These rows reconcile to the exact weekly settlement amount from the settlement queue.
                </p>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Earnings</h3>
                    <div className="mt-3 space-y-3">
                      {earnings.map((line) => (
                        <div key={line.label} className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-white">{line.label}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-500">{line.detail}</div>
                            </div>
                            <div className="font-bold text-green-300">{currency(line.amount)}</div>
                          </div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-green-400/30 bg-green-400/10 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-green-100">Earnings line total</div>
                            <div className="mt-1 text-xs text-green-100/75">Matches the queue Gross Pay value.</div>
                          </div>
                          <div className="font-bold text-green-100">{currency(earningsTotal)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deductions</h3>
                    <div className="mt-3 space-y-3">
                      {deductions.map((line) => (
                        <div key={line.label} className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-white">{line.label}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-500">{line.detail}</div>
                            </div>
                            <div className="font-bold text-orange-300">-{currency(line.amount)}</div>
                          </div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-orange-400/30 bg-orange-400/10 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-orange-100">Deduction line total</div>
                            <div className="mt-1 text-xs text-orange-100/75">Matches the queue Deductions value.</div>
                          </div>
                          <div className="font-bold text-orange-100">-{currency(deductionsTotal)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-lg border border-teal-400/25 bg-teal-400/10 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-teal-100">Net pay calculation</div>
                      <div className="mt-1 text-xs text-teal-200/80">Gross earnings minus deductions equals the pending weekly net pay.</div>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {currency(settlement.grossPay)} - {currency(settlement.totalDeductions)} = {currency(settlement.netPay)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-300" />
                    <h2 className="text-xl font-semibold text-white">Driver Pay Method</h2>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                    <div className="text-sm text-slate-400">Configured method</div>
                    <div className="mt-2 text-2xl font-bold text-white">{method.settlementMethod}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{methodDescription(method)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/drivers/${id}/vault`}
                      className="rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-100 hover:border-slate-400 hover:bg-slate-800"
                    >
                      Open driver vault
                    </Link>
                    <Link
                      href="/settlements"
                      className="rounded-lg border border-teal-400/40 bg-teal-400/10 px-4 py-3 text-center text-sm font-semibold text-teal-100 hover:border-teal-300 hover:bg-teal-400/20"
                    >
                      Back to all settlements
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                  <h2 className="text-xl font-semibold text-white">Holds and Release Controls</h2>
                  <div className="mt-4 space-y-3">
                    {holdsForWeek.length > 0 ? (
                      holdsForWeek.map((hold) => (
                        <div key={hold.holdId} className="rounded-lg border border-red-400/30 bg-red-500/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-red-100">{hold.holdType}</div>
                              <p className="mt-1 text-sm leading-5 text-red-100/80">{hold.holdReason}</p>
                              <p className="mt-2 text-xs text-red-100/70">Related load: {hold.loadId || "General"}</p>
                            </div>
                            <div className="font-bold text-red-100">{currency(hold.holdAmount)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-4 text-sm text-green-100">
                        No settlement hold is blocking this weekly pay release.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">BOF Pay and Settlement Coverage</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                This is the sales point: BOF can run one payroll and settlement command center across company drivers,
                owner-operators, mixed fleets, reimbursements, deductions, holds, proof gates, and export readiness.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {SUPPORTED_PAY_MODELS.map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                    <div className="font-semibold text-white">{item.label}</div>
                    <p className="mt-2 text-sm leading-5 text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
