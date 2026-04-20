"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUsd } from "@/lib/format-money";
import {
  type MarketingFleetPainLevel,
  type MarketingFleetSavingsInputs,
  computeMarketingSavingsPresentation,
} from "@/lib/marketing-funnel-savings";
import { MARKETING_CALCULATOR_STORAGE_KEY } from "@/lib/marketing-funnel-constants";
import { MarketingFunnelField } from "./MarketingFunnelField";

const PAIN_OPTIONS: { value: MarketingFleetPainLevel; label: string }[] = [
  { value: "low", label: "Low — mostly under control" },
  { value: "moderate", label: "Moderate — recurring exceptions" },
  { value: "high", label: "High — frequent fire drills" },
  { value: "severe", label: "Severe — revenue or audit at risk" },
];

function loadDraft(): Partial<MarketingFleetSavingsInputs> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MARKETING_CALCULATOR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<MarketingFleetSavingsInputs>;
  } catch {
    return null;
  }
}

function saveDraft(input: MarketingFleetSavingsInputs) {
  try {
    localStorage.setItem(MARKETING_CALCULATOR_STORAGE_KEY, JSON.stringify(input));
  } catch {
    /* ignore */
  }
}

export function FleetSavingsCalculatorClient() {
  const [powerUnits, setPowerUnits] = useState(45);
  const [monthlyLoads, setMonthlyLoads] = useState(320);
  const [avgRevenuePerLoad, setAvgRevenuePerLoad] = useState(2200);
  const [compliancePain, setCompliancePain] = useState<MarketingFleetPainLevel>("moderate");
  const [proofPain, setProofPain] = useState<MarketingFleetPainLevel>("high");
  const [dispatchSettlementPain, setDispatchSettlementPain] =
    useState<MarketingFleetPainLevel>("moderate");
  const [adminOpsFte, setAdminOpsFte] = useState(4);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof computeMarketingSavingsPresentation> | null>(
    null
  );

  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    if (typeof d.powerUnits === "number") setPowerUnits(d.powerUnits);
    if (typeof d.monthlyLoads === "number") setMonthlyLoads(d.monthlyLoads);
    if (typeof d.avgRevenuePerLoad === "number") setAvgRevenuePerLoad(d.avgRevenuePerLoad);
    if (d.compliancePain) setCompliancePain(d.compliancePain);
    if (d.proofPain) setProofPain(d.proofPain);
    if (d.dispatchSettlementPain) setDispatchSettlementPain(d.dispatchSettlementPain);
    if (typeof d.adminOpsFte === "number") setAdminOpsFte(d.adminOpsFte);
  }, []);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!Number.isFinite(powerUnits) || powerUnits < 1 || powerUnits > 50000) {
      e.powerUnits = "Enter a fleet size between 1 and 50,000 power units.";
    }
    if (!Number.isFinite(monthlyLoads) || monthlyLoads < 1 || monthlyLoads > 100000) {
      e.monthlyLoads = "Enter monthly loads between 1 and 100,000.";
    }
    if (!Number.isFinite(avgRevenuePerLoad) || avgRevenuePerLoad < 200 || avgRevenuePerLoad > 50000) {
      e.avgRevenuePerLoad = "Use a realistic average revenue per load ($200–$50,000).";
    }
    if (!Number.isFinite(adminOpsFte) || adminOpsFte < 0 || adminOpsFte > 500) {
      e.adminOpsFte = "Admin / ops FTE should be between 0 and 500.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [powerUnits, monthlyLoads, avgRevenuePerLoad, adminOpsFte]);

  const runModel = useCallback(() => {
    if (!validate()) {
      setResult(null);
      return;
    }
    const input: MarketingFleetSavingsInputs = {
      powerUnits,
      monthlyLoads,
      avgRevenuePerLoad,
      compliancePain,
      proofPain,
      dispatchSettlementPain,
      adminOpsFte,
    };
    saveDraft(input);
    setResult(computeMarketingSavingsPresentation(input));
  }, [
    validate,
    powerUnits,
    monthlyLoads,
    avgRevenuePerLoad,
    compliancePain,
    proofPain,
    dispatchSettlementPain,
    adminOpsFte,
  ]);

  const headline = useMemo(() => {
    if (!result) return null;
    return formatUsd(result.totalMonthlyUsd);
  }, [result]);

  return (
    <div className="bof-mkt-funnel-calculator">
      <header className="bof-mkt-funnel-calculator-head">
        <p className="bof-mkt-hero-premium-eyebrow">Fleet economics · directional model</p>
        <h1 className="bof-mkt-funnel-h1">Fleet Savings Outlook</h1>
        <p className="bof-mkt-funnel-lead">
          Translate operational pain into the same savings categories BOF uses in the demo command center—insurance posture,
          legal exposure, revenue at risk, and settlement drag. Tune inputs to match your network; results are{" "}
          <strong>illustrative</strong>, not a guarantee.
        </p>
      </header>

      <div className="bof-mkt-funnel-calculator-grid">
        <section className="bof-mkt-funnel-panel" aria-label="Inputs">
          <h2 className="bof-mkt-funnel-h2">Fleet profile</h2>
          <MarketingFunnelField
            id="calc-pu"
            label="Power units (tractors / active linehaul assets)"
            hint="Rough count is fine — we use this to contextualize admin load, not as a direct multiplier in the BOF formulas."
            error={errors.powerUnits}
          >
            <input
              id="calc-pu"
              className="bof-mkt-funnel-input"
              type="number"
              min={1}
              value={powerUnits}
              onChange={(e) => setPowerUnits(Number(e.target.value))}
            />
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-ml"
            label="Linehaul loads per month (company-wide)"
            error={errors.monthlyLoads}
          >
            <input
              id="calc-ml"
              className="bof-mkt-funnel-input"
              type="number"
              min={1}
              value={monthlyLoads}
              onChange={(e) => setMonthlyLoads(Number(e.target.value))}
            />
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-ar"
            label="Average revenue per load (USD)"
            error={errors.avgRevenuePerLoad}
          >
            <input
              id="calc-ar"
              className="bof-mkt-funnel-input"
              type="number"
              min={200}
              step={50}
              value={avgRevenuePerLoad}
              onChange={(e) => setAvgRevenuePerLoad(Number(e.target.value))}
            />
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-cp"
            label="Credential & compliance document pain"
            hint="Med cards, MVR, CDL renewals, internal policy variance."
          >
            <select
              id="calc-cp"
              className="bof-mkt-funnel-select"
              value={compliancePain}
              onChange={(e) => setCompliancePain(e.target.value as MarketingFleetPainLevel)}
            >
              {PAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-pp"
            label="Proof / POD / photo / seal / GPS pain"
            hint="Disputes, rework, shipper chargebacks, or finance holds tied to weak proof."
          >
            <select
              id="calc-pp"
              className="bof-mkt-funnel-select"
              value={proofPain}
              onChange={(e) => setProofPain(e.target.value as MarketingFleetPainLevel)}
            >
              {PAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-ds"
            label="Dispatch, settlement & admin coordination pain"
          >
            <select
              id="calc-ds"
              className="bof-mkt-funnel-select"
              value={dispatchSettlementPain}
              onChange={(e) => setDispatchSettlementPain(e.target.value as MarketingFleetPainLevel)}
            >
              {PAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </MarketingFunnelField>
          <MarketingFunnelField
            id="calc-fte"
            label="FTE involved in manual dispatch / compliance / settlement chase"
            hint="Dispatch coordinators, safety admins, settlement analysts — fractional FTE ok (e.g. 2.5)."
            error={errors.adminOpsFte}
          >
            <input
              id="calc-fte"
              className="bof-mkt-funnel-input"
              type="number"
              min={0}
              step={0.25}
              value={adminOpsFte}
              onChange={(e) => setAdminOpsFte(Number(e.target.value))}
            />
          </MarketingFunnelField>
          <div className="bof-mkt-funnel-actions">
            <button type="button" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" onClick={runModel}>
              Run model
            </button>
          </div>
        </section>

        <section className="bof-mkt-funnel-panel bof-mkt-funnel-panel--results" aria-label="Results">
          {!result ? (
            <div className="bof-mkt-funnel-placeholder">
              <p className="bof-mkt-funnel-placeholder-title">Strategic output appears here</p>
              <p className="bof-mkt-funnel-placeholder-lead">
                Enter your fleet profile and select pain levels that match what your operations and finance teams see
                today—then run the model.
              </p>
            </div>
          ) : (
            <>
              <div className="bof-mkt-funnel-hero-metric">
                <p className="bof-mkt-funnel-hero-metric-label">Directional monthly impact</p>
                <p className="bof-mkt-funnel-hero-metric-value">{headline}</p>
                <p className="bof-mkt-funnel-hero-metric-sub">
                  Annualized: <strong>{formatUsd(result.annualizedUsd)}</strong> — sum of modeled insurance, legal,
                  recovered revenue, and cash-flow categories (see below).
                </p>
              </div>
              <ul className="bof-mkt-funnel-result-list">
                {result.lineItems.map((row) => (
                  <li key={row.key} className="bof-mkt-funnel-result-row">
                    <div>
                      <p className="bof-mkt-funnel-result-label">{row.label}</p>
                      <p className="bof-mkt-funnel-result-narrative">{row.narrative}</p>
                    </div>
                    <p className="bof-mkt-funnel-result-value">{formatUsd(row.monthlyUsd)}</p>
                  </li>
                ))}
              </ul>
              <div className="bof-mkt-funnel-metric-grid">
                <div className="bof-mkt-funnel-mini-metric">
                  <p className="bof-mkt-funnel-mini-label">Operational leakage index</p>
                  <p className="bof-mkt-funnel-mini-value">{result.operationalLeakageIndex}</p>
                  <p className="bof-mkt-funnel-mini-hint">0 = calm, 100 = acute — derived from your pain selections.</p>
                </div>
                <div className="bof-mkt-funnel-mini-metric">
                  <p className="bof-mkt-funnel-mini-label">Admin time recovered (hrs / mo)</p>
                  <p className="bof-mkt-funnel-mini-value">{result.adminHoursRecoveredMonthly}</p>
                  <p className="bof-mkt-funnel-mini-hint">
                    Heuristic from FTE and pain profile — assumes BOF-grade automation and enforcement.
                  </p>
                </div>
              </div>
              <ul className="bof-mkt-funnel-disclaimer">
                {result.disclaimers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <div className="bof-mkt-funnel-actions bof-mkt-funnel-actions--stack">
                <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                  Book fleet assessment
                </Link>
                <Link href="/apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                  Apply for qualification call
                </Link>
                <Link href="/dashboard" className="bof-mkt-funnel-entry-text">
                  Open interactive demo →
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
