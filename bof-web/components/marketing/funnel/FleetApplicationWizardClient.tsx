"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MARKETING_APPLICATION_STORAGE_KEY } from "@/lib/marketing-funnel-constants";
import { MarketingFunnelField } from "./MarketingFunnelField";

type ApplicationDraft = {
  company: string;
  website: string;
  yourRole: string;
  fleetNarrative: string;
  readiness: string;
  goals: string;
  fullName: string;
  email: string;
  phone: string;
};

const EMPTY: ApplicationDraft = {
  company: "",
  website: "",
  yourRole: "",
  fleetNarrative: "",
  readiness: "evaluation",
  goals: "",
  fullName: "",
  email: "",
  phone: "",
};

const FORM_STEPS = 4;

function loadDraft(): ApplicationDraft {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw =
      sessionStorage.getItem(MARKETING_APPLICATION_STORAGE_KEY) ??
      localStorage.getItem(MARKETING_APPLICATION_STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) } as ApplicationDraft;
  } catch {
    return { ...EMPTY };
  }
}

function persistDraft(d: ApplicationDraft) {
  try {
    const s = JSON.stringify(d);
    sessionStorage.setItem(MARKETING_APPLICATION_STORAGE_KEY, s);
    localStorage.setItem(MARKETING_APPLICATION_STORAGE_KEY, s);
  } catch {
    /* ignore */
  }
}

export function FleetApplicationWizardClient() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ApplicationDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const update = useCallback((patch: Partial<ApplicationDraft>) => {
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
        if (!draft.company.trim()) e.company = "Required.";
        if (!draft.yourRole.trim()) e.yourRole = "Required.";
      }
      if (s === 1 && draft.fleetNarrative.trim().length < 20) {
        e.fleetNarrative = "Add at least 20 characters so we can understand lanes, shippers, or risk profile.";
      }
      if (s === 2 && draft.goals.trim().length < 15) {
        e.goals = "What outcome would make this engagement a win for your leadership team?";
      }
      if (s === 3) {
        if (!draft.fullName.trim()) e.fullName = "Required.";
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

  const submit = useCallback(() => {
    if (!validateStep(3)) return;
    setStep(FORM_STEPS);
  }, [validateStep]);

  const back = useCallback(() => {
    setErrors({});
    setStep((x) => Math.max(0, x - 1));
  }, []);

  if (step >= FORM_STEPS) {
    return (
      <div className="bof-mkt-funnel-wizard">
        <nav className="bof-mkt-funnel-breadcrumb">
          <Link href="/" className="bof-mkt-inline-link">
            Home
          </Link>
          <span className="bof-mkt-funnel-bc-sep">/</span>
          <span>Application received</span>
        </nav>
        <div className="bof-mkt-funnel-success">
          <h1 className="bof-mkt-funnel-h1">You are in the qualification queue</h1>
          <p className="bof-mkt-funnel-lead">
            This demo keeps your submission client-side only. In production, this handoff would notify BOF strategists,
            attach your narrative, and schedule the next conversation. For now, use the demo to pressure-test the command
            center while your team aligns internally.
          </p>
          <div className="bof-mkt-funnel-actions bof-mkt-funnel-actions--stack">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Open BOF demo
            </Link>
            <Link href="/fleet-savings" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Share savings model internally
            </Link>
            <Link href="/book-assessment" className="bof-mkt-funnel-entry-text">
              Return to full assessment →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.round(((step + 1) / FORM_STEPS) * 100);

  return (
    <div className="bof-mkt-funnel-wizard">
      <nav className="bof-mkt-funnel-breadcrumb">
        <Link href="/" className="bof-mkt-inline-link">
          Home
        </Link>
        <span className="bof-mkt-funnel-bc-sep">/</span>
        <span>Qualification</span>
      </nav>

      <header className="bof-mkt-funnel-wizard-head">
        <p className="bof-mkt-hero-premium-eyebrow">Curated application · {FORM_STEPS} steps</p>
        <h1 className="bof-mkt-funnel-h1">Qualify for a BOF Strategy Conversation</h1>
        <p className="bof-mkt-funnel-lead">
          High-ticket fleets do not submit generic lead forms. This application captures the minimum context BOF needs to
          treat your inquiry as operational due diligence—not a mailing list signup.
        </p>
        <div className="bof-mkt-funnel-progress" aria-label="Progress">
          <div className="bof-mkt-funnel-progress-track">
            <div className="bof-mkt-funnel-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="bof-mkt-funnel-progress-label">
            Step {step + 1} of {FORM_STEPS}
          </p>
        </div>
      </header>

      <div className="bof-mkt-funnel-panel bof-mkt-funnel-panel--step">
        {step === 0 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Company &amp; sponsor</h2>
            <MarketingFunnelField id="ap-co" label="Legal entity name" error={errors.company}>
              <input
                id="ap-co"
                className="bof-mkt-funnel-input"
                value={draft.company}
                onChange={(e) => update({ company: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="ap-web" label="Website (optional)">
              <input
                id="ap-web"
                className="bof-mkt-funnel-input"
                placeholder="https://"
                value={draft.website}
                onChange={(e) => update({ website: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="ap-role" label="Your role in the decision" error={errors.yourRole}>
              <input
                id="ap-role"
                className="bof-mkt-funnel-input"
                placeholder="e.g. VP Operations, CFO, Director of Safety"
                value={draft.yourRole}
                onChange={(e) => update({ yourRole: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Fleet &amp; revenue context</h2>
            <MarketingFunnelField
              id="ap-fn"
              label="Describe your network"
              hint="Shippers, dedicated programs, regions, regulatory pressure, or settlement complexity."
              error={errors.fleetNarrative}
            >
              <textarea
                id="ap-fn"
                className="bof-mkt-funnel-textarea"
                rows={6}
                value={draft.fleetNarrative}
                onChange={(e) => update({ fleetNarrative: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Readiness &amp; outcomes</h2>
            <MarketingFunnelField id="ap-ready" label="Where is leadership today?">
              <select
                id="ap-ready"
                className="bof-mkt-funnel-select"
                value={draft.readiness}
                onChange={(e) => update({ readiness: e.target.value })}
              >
                <option value="evaluation">Evaluating vendors / benchmarks</option>
                <option value="mandate">Mandate to fix operations this quarter</option>
                <option value="incident">Driving event or audit forced urgency</option>
                <option value="scaling">Scaling and systems are breaking</option>
              </select>
            </MarketingFunnelField>
            <MarketingFunnelField
              id="ap-goals"
              label="What does success look like in the first 90 days?"
              error={errors.goals}
            >
              <textarea
                id="ap-goals"
                className="bof-mkt-funnel-textarea"
                rows={5}
                value={draft.goals}
                onChange={(e) => update({ goals: e.target.value })}
              />
            </MarketingFunnelField>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="bof-mkt-funnel-h2">Primary contact</h2>
            <MarketingFunnelField id="ap-name" label="Full name" error={errors.fullName}>
              <input
                id="ap-name"
                className="bof-mkt-funnel-input"
                value={draft.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="ap-em" label="Work email" error={errors.email}>
              <input
                id="ap-em"
                className="bof-mkt-funnel-input"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </MarketingFunnelField>
            <MarketingFunnelField id="ap-ph" label="Mobile (optional)">
              <input
                id="ap-ph"
                className="bof-mkt-funnel-input"
                type="tel"
                value={draft.phone}
                onChange={(e) => update({ phone: e.target.value })}
              />
            </MarketingFunnelField>
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
              Submit application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
