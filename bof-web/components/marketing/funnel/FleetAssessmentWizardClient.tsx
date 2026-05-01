"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MARKETING_ASSESSMENT_STORAGE_KEY } from "@/lib/marketing-funnel-constants";
import { MarketingFunnelField } from "./MarketingFunnelField";

export type AssessmentDraft = {
  fleetPowerUnits: string;
  activeDrivers: string;
  monthlyLoads: string;
  sector: string;
  equipmentProfile: string;
  painCompliance: boolean;
  painProof: boolean;
  painDispatch: boolean;
  painSettlements: boolean;
  painAdmin: boolean;
  techStack: string;
  urgency: string;
  fullName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
};

type SectorKey = "for_hire" | "private_fleet" | "government";

type SectorQuestionSet = {
  scaleTitle: string;
  powerUnitsLabel: string;
  activeDriversLabel: string;
  monthlyLoadsLabel: string;
  equipmentLabel: string;
  equipmentHint: string;
  painTitle: string;
  painCompliance: string;
  painProof: string;
  painDispatch: string;
  painSettlements: string;
  painAdmin: string;
  systemsLabel: string;
  systemsHint: string;
};

const sectorQuestionSets: Record<SectorKey, SectorQuestionSet> = {
  for_hire: {
    scaleTitle: "Fleet scale",
    powerUnitsLabel: "Power units / active tractors",
    activeDriversLabel: "Active drivers (CDL)",
    monthlyLoadsLabel: "Loads moved per month (linehaul)",
    equipmentLabel: "Equipment profile & lanes",
    equipmentHint: "Reefer, flatbed, tank, dedicated shipper, drayage, intermodal, etc.",
    painTitle: "Where pain shows up today",
    painCompliance: "Credential / DOT compliance drift",
    painProof: "POD, seals, photos, GPS proof gaps",
    painDispatch: "Dispatch readiness & asset assignment chaos",
    painSettlements: "Settlement holds, disputes, or finance rework",
    painAdmin: "Admin time lost to chasing documents & status",
    systemsLabel: "TMS, safety, HR, telematics, settlement tools",
    systemsHint: "Include spreadsheets, shared drives, or outsourced partners—truth beats aspiration.",
  },
  private_fleet: {
    scaleTitle: "Private fleet profile",
    powerUnitsLabel: "Owned/leased fleet size (power units and key assets)",
    activeDriversLabel: "Active drivers / operators",
    monthlyLoadsLabel: "Internal delivery volume per month",
    equipmentLabel: "Route density, facility mix, and delivery model",
    equipmentHint: "Warehouse/store/site distribution, dedicated routes, regional density, etc.",
    painTitle: "Where private-fleet pressure appears",
    painCompliance: "Driver readiness and policy variance across locations",
    painProof: "Delivery proof / custody and service-level evidence gaps",
    painDispatch: "Warehouse-facility coordination and route execution failures",
    painSettlements: "Internal chargebacks, cost allocation, or department reporting friction",
    painAdmin: "Manual branch reporting and cross-team rework",
    systemsLabel: "Routing, warehouse, maintenance, and internal reporting systems",
    systemsHint: "Include WMS, route planners, maintenance stack, and chargeback/reporting tools.",
  },
  government: {
    scaleTitle: "Government program profile",
    powerUnitsLabel: "Vehicles/assets in program scope",
    activeDriversLabel: "Operators/crews in active service",
    monthlyLoadsLabel: "Service/work-order volume per month",
    equipmentLabel: "Agency type, mission profile, and chain-of-custody model",
    equipmentHint: "Department scope, emergency readiness, and service obligations by site/region.",
    painTitle: "Where public-sector risk appears",
    painCompliance: "Public-sector compliance and inspection readiness burden",
    painProof: "Audit trail / chain-of-custody proof-of-service gaps",
    painDispatch: "Work-order response and emergency readiness coordination issues",
    painSettlements: "Procurement, grant/funding, and budget reporting friction",
    painAdmin: "Manual audit packet and cross-agency reporting overhead",
    systemsLabel: "Work-order, procurement, compliance, and audit reporting systems",
    systemsHint: "Include CMMS/work order tools, procurement systems, and audit evidence workflows.",
  },
};

const EMPTY: AssessmentDraft = {
  fleetPowerUnits: "",
  activeDrivers: "",
  monthlyLoads: "",
  sector: "for_hire",
  equipmentProfile: "",
  painCompliance: true,
  painProof: true,
  painDispatch: false,
  painSettlements: false,
  painAdmin: false,
  techStack: "",
  urgency: "30_60",
  fullName: "",
  title: "",
  company: "",
  email: "",
  phone: "",
};

/** Form steps 0–7 (review on 7); step 8 = success. */
const FORM_STEPS = 8;

function toSectorKey(input?: string): SectorKey {
  const raw = String(input || "").trim().toLowerCase();
  if (raw === "for-hire" || raw === "for_hire") return "for_hire";
  if (raw === "private-fleet" || raw === "private_fleet") return "private_fleet";
  if (raw === "government") return "government";
  return "for_hire";
}

function loadDraft(initialSector?: string): AssessmentDraft {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = sessionStorage.getItem(MARKETING_ASSESSMENT_STORAGE_KEY) ?? localStorage.getItem(MARKETING_ASSESSMENT_STORAGE_KEY);
    const fallback = { ...EMPTY, sector: toSectorKey(initialSector) };
    if (!raw) return fallback;
    const parsed = { ...fallback, ...JSON.parse(raw) } as AssessmentDraft;
    if (initialSector) parsed.sector = toSectorKey(initialSector);
    return parsed;
  } catch {
    return { ...EMPTY, sector: toSectorKey(initialSector) };
  }
}

function persistDraft(d: AssessmentDraft) {
  try {
    const s = JSON.stringify(d);
    sessionStorage.setItem(MARKETING_ASSESSMENT_STORAGE_KEY, s);
    localStorage.setItem(MARKETING_ASSESSMENT_STORAGE_KEY, s);
  } catch {
    /* ignore */
  }
}

export function FleetAssessmentWizardClient({ initialSector }: { initialSector?: string }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AssessmentDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(loadDraft(initialSector));
  }, [initialSector]);

  const activeSector = useMemo<SectorKey>(() => toSectorKey(draft.sector), [draft.sector]);
  const questionSet = useMemo(() => sectorQuestionSets[activeSector], [activeSector]);

  const update = useCallback((patch: Partial<AssessmentDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      persistDraft(next);
      return next;
    });
  }, []);

  const validateStep = useCallback(
    (s: number) => {
      const e: Record<string, string> = {};
      if (s === 0) {
        if (!draft.fleetPowerUnits.trim()) e.fleetPowerUnits = "Required.";
        if (!draft.activeDrivers.trim()) e.activeDrivers = "Required.";
        if (!draft.monthlyLoads.trim()) e.monthlyLoads = "Required.";
      }
      if (s === 2 && !draft.equipmentProfile.trim()) {
        e.equipmentProfile = "Briefly describe equipment / mode (e.g. refrigerated OTR, drayage).";
      }
      if (s === 4 && !draft.techStack.trim()) {
        e.techStack = "List TMS, safety, or settlement tools—even if it is spreadsheets.";
      }
      if (s === 6) {
        if (!draft.fullName.trim()) e.fullName = "Required.";
        if (!draft.company.trim()) e.company = "Required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) e.email = "Valid email required.";
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [draft]
  );

  const next = useCallback(() => {
    if (!validateStep(step)) return;
    if (step < FORM_STEPS - 1) setStep((x) => x + 1);
  }, [step, validateStep]);

  const validateAll = useCallback(() => {
    const e: Record<string, string> = {};
    if (!draft.fleetPowerUnits.trim()) e.fleetPowerUnits = "Required.";
    if (!draft.activeDrivers.trim()) e.activeDrivers = "Required.";
    if (!draft.monthlyLoads.trim()) e.monthlyLoads = "Required.";
    if (!draft.equipmentProfile.trim()) e.equipmentProfile = "Required.";
    if (!draft.techStack.trim()) e.techStack = "Required.";
    if (!draft.fullName.trim()) e.fullName = "Required.";
    if (!draft.company.trim()) e.company = "Required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) e.email = "Valid email required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [draft]);

  const submit = useCallback(() => {
    if (!validateAll()) return;
    setStep(8);
  }, [validateAll]);

  const back = useCallback(() => {
    setErrors({});
    setStep((x) => Math.max(0, x - 1));
  }, []);

  const progress = useMemo(() => {
    if (step >= FORM_STEPS) return 100;
    return Math.round(((step + 1) / FORM_STEPS) * 100);
  }, [step]);

  if (step >= FORM_STEPS) {
    return (
      <div className="bof-mkt-funnel-wizard">
        <nav className="bof-mkt-funnel-breadcrumb">
          <Link href="/" className="bof-mkt-inline-link">
            Home
          </Link>
          <span className="bof-mkt-funnel-bc-sep">/</span>
          <span>Assessment complete</span>
        </nav>
        <div className="bof-mkt-funnel-success">
          <h1 className="bof-mkt-funnel-h1">Thank you — your assessment is captured</h1>
          <p className="bof-mkt-funnel-lead">
            This demo does not transmit data to a server. Your answers stay in this browser (session + local storage) so
            you can refine them anytime. For a live engagement, export this summary verbally to your BOF contact.
          </p>
          <ul className="bof-mkt-funnel-summary">
            <li>
              <strong>Fleet:</strong> {draft.company} · {draft.fleetPowerUnits} power units · {draft.activeDrivers}{" "}
              drivers · ~{draft.monthlyLoads} loads / mo
            </li>
            <li>
              <strong>Sector:</strong> {draft.sector.replaceAll("_", " ")}
            </li>
            <li>
              <strong>Urgency:</strong> {draft.urgency.replaceAll("_", " ")} days to decision
            </li>
          </ul>
          <div className="bof-mkt-funnel-actions bof-mkt-funnel-actions--stack">
            <Link href="/apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Continue to qualification
            </Link>
            <Link href="/fleet-savings" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Refine with savings calculator
            </Link>
            <Link href="/dashboard" className="bof-mkt-funnel-entry-text">
              Explore the BOF demo →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bof-mkt-funnel-wizard">
      <nav className="bof-mkt-funnel-breadcrumb">
        <Link href="/" className="bof-mkt-inline-link">
          Home
        </Link>
        <span className="bof-mkt-funnel-bc-sep">/</span>
        <span>Fleet assessment</span>
      </nav>

      <header className="bof-mkt-funnel-wizard-head">
        <p className="bof-mkt-hero-premium-eyebrow">Consultative intake · {FORM_STEPS} steps</p>
        <h1 className="bof-mkt-funnel-h1">Fleet Operations Assessment</h1>
        <p className="bof-mkt-funnel-lead">
          Structured like the conversations BOF runs with elite fleets—dispatch, compliance, proof, and settlements in one
          thread. Progress saves automatically in your browser.
        </p>
        <div className="bof-mkt-funnel-progress" aria-label="Progress">
          <div className="bof-mkt-funnel-progress-track">
            <div className="bof-mkt-funnel-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="bof-mkt-funnel-progress-label">
            Step {Math.min(step + 1, FORM_STEPS)} of {FORM_STEPS}
          </p>
        </div>
      </header>

      <div className="bof-mkt-funnel-panel bof-mkt-funnel-panel--step">
        {step === 0 && (
          <>
            <h2 className="bof-mkt-funnel-h2">{questionSet.scaleTitle}</h2>
            <MarketingFunnelField id="fa-pu" label={questionSet.powerUnitsLabel} error={errors.fleetPowerUnits}>
              <input
                id="fa-pu"
                className="bof-mkt-funnel-input"
                value={draft.fleetPowerUnits}
                onChange={(e) => update({ fleetPowerUnits: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-dr" label={questionSet.activeDriversLabel} error={errors.activeDrivers}>
              <input
                id="fa-dr"
                className="bof-mkt-funnel-input"
                value={draft.activeDrivers}
                onChange={(e) => update({ activeDrivers: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-ml" label={questionSet.monthlyLoadsLabel} error={errors.monthlyLoads}>
              <input
                id="fa-ml"
                className="bof-mkt-funnel-input"
                value={draft.monthlyLoads}
                onChange={(e) => update({ monthlyLoads: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Operation type</h2>
            <MarketingFunnelField id="fa-sector" label="Primary operating model">
              <select
                id="fa-sector"
                className="bof-mkt-funnel-select"
                value={draft.sector}
                onChange={(e) => update({ sector: e.target.value })}
              >
                <option value="for_hire">For-hire carrier</option>
                <option value="private_fleet">Private / captive fleet</option>
                <option value="government">Government / regulated</option>
                <option value="broker_3pl">Broker / 3PL oversight</option>
                <option value="mixed">Mixed network</option>
              </select>
            </MarketingFunnelField>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Equipment &amp; mode</h2>
            <MarketingFunnelField
              id="fa-eq"
              label={questionSet.equipmentLabel}
              hint={questionSet.equipmentHint}
              error={errors.equipmentProfile}
            >
              <textarea
                id="fa-eq"
                className="bof-mkt-funnel-textarea"
                rows={4}
                value={draft.equipmentProfile}
                onChange={(e) => update({ equipmentProfile: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="bof-mkt-funnel-h2">{questionSet.painTitle}</h2>
            <p className="bof-mkt-funnel-hint-block">Select every area that creates weekly executive or dispatcher attention.</p>
            <label className="bof-mkt-funnel-check">
              <input
                type="checkbox"
                checked={draft.painCompliance}
                onChange={(e) => update({ painCompliance: e.target.checked })}
              />
              {questionSet.painCompliance}
            </label>
            <label className="bof-mkt-funnel-check">
              <input type="checkbox" checked={draft.painProof} onChange={(e) => update({ painProof: e.target.checked })} />
              {questionSet.painProof}
            </label>
            <label className="bof-mkt-funnel-check">
              <input
                type="checkbox"
                checked={draft.painDispatch}
                onChange={(e) => update({ painDispatch: e.target.checked })}
              />
              {questionSet.painDispatch}
            </label>
            <label className="bof-mkt-funnel-check">
              <input
                type="checkbox"
                checked={draft.painSettlements}
                onChange={(e) => update({ painSettlements: e.target.checked })}
              />
              {questionSet.painSettlements}
            </label>
            <label className="bof-mkt-funnel-check">
              <input type="checkbox" checked={draft.painAdmin} onChange={(e) => update({ painAdmin: e.target.checked })} />
              {questionSet.painAdmin}
            </label>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Current systems & workflow</h2>
            <MarketingFunnelField
              id="fa-tech"
              label={questionSet.systemsLabel}
              hint={questionSet.systemsHint}
              error={errors.techStack}
            >
              <textarea
                id="fa-tech"
                className="bof-mkt-funnel-textarea"
                rows={5}
                value={draft.techStack}
                onChange={(e) => update({ techStack: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Urgency & readiness</h2>
            <MarketingFunnelField id="fa-urg" label="When do you need a decision-grade view of operations?">
              <select
                id="fa-urg"
                className="bof-mkt-funnel-select"
                value={draft.urgency}
                onChange={(e) => update({ urgency: e.target.value })}
              >
                <option value="14">Inside 14 days</option>
                <option value="30_60">30–60 days</option>
                <option value="90">90 days (planning cycle)</option>
                <option value="explore">Exploratory / benchmarking</option>
              </select>
            </MarketingFunnelField>
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Contact</h2>
            <MarketingFunnelField id="fa-name" label="Full name" error={errors.fullName}>
              <input
                id="fa-name"
                className="bof-mkt-funnel-input"
                value={draft.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-title" label="Title">
              <input
                id="fa-title"
                className="bof-mkt-funnel-input"
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-co" label="Company" error={errors.company}>
              <input
                id="fa-co"
                className="bof-mkt-funnel-input"
                value={draft.company}
                onChange={(e) => update({ company: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-em" label="Work email" error={errors.email}>
              <input
                id="fa-em"
                className="bof-mkt-funnel-input"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="fa-ph" label="Phone (optional)">
              <input
                id="fa-ph"
                className="bof-mkt-funnel-input"
                type="tel"
                value={draft.phone}
                onChange={(e) => update({ phone: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 7 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Review</h2>
            <dl className="bof-mkt-funnel-dl">
              <dt>Fleet</dt>
              <dd>
                {draft.fleetPowerUnits} PU · {draft.activeDrivers} drivers · {draft.monthlyLoads} loads / mo
              </dd>
              <dt>Sector</dt>
              <dd>{draft.sector.replaceAll("_", " ")}</dd>
              <dt>Equipment</dt>
              <dd>{draft.equipmentProfile || "—"}</dd>
              <dt>Pain focus</dt>
              <dd>
                {[
                  draft.painCompliance && "Compliance",
                  draft.painProof && "Proof",
                  draft.painDispatch && "Dispatch",
                  draft.painSettlements && "Settlements",
                  draft.painAdmin && "Admin",
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
              <dt>Systems</dt>
              <dd>{draft.techStack || "—"}</dd>
              <dt>Urgency</dt>
              <dd>{draft.urgency.replaceAll("_", " ")}</dd>
              <dt>Contact</dt>
              <dd>
                {draft.fullName} · {draft.title} · {draft.company} · {draft.email}
              </dd>
            </dl>
          </>
        )}

        <div className="bof-mkt-funnel-actions">
          <button type="button" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" onClick={back} disabled={step === 0}>
            Back
          </button>
          {step < FORM_STEPS - 1 ? (
            <button type="button" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" onClick={next}>
              Next
            </button>
          ) : (
            <button type="button" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" onClick={submit}>
              Submit assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
