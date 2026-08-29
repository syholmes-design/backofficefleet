"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DEMO_POSITIONS, type RecruitingPosition } from "@/lib/recruiting-demo-data";
import { useRecruitingStore } from "@/lib/stores/recruiting-store";

export function CareersPageClient() {
  const { addCandidate } = useRecruitingStore();
  const [selectedPosition, setSelectedPosition] = useState<RecruitingPosition | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [cdlClass, setCdlClass] = useState("Class A");
  const [cdlState, setCdlState] = useState("OH");
  const [cdlNumber, setCdlNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [consent, setConsent] = useState(false);
  const [websiteHp, setWebsiteHp] = useState(""); // Honeypot field for bot protection

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const positions = DEMO_POSITIONS.filter((p) => p.status === "OPEN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    setSubmitting(true);
    setErrorMessages([]);

    try {
      const res = await fetch("/api/recruiting/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          homeLocation,
          positionId: selectedPosition.id,
          cdlClass,
          cdlState,
          cdlNumber,
          experienceYears: Number(experienceYears),
          consentAcknowledged: consent,
          website_hp: websiteHp,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessages(json.details || [json.error || "Failed to submit application"]);
        setSubmitting(false);
        return;
      }

      // Application successfully validated on server! Persist to store.
      addCandidate(json.candidate);
      setSubmittedAppId(json.applicationId);
      setSubmitting(false);
    } catch {
      setErrorMessages(["Network error submitting application. Please try again."]);
      setSubmitting(false);
    }
  };

  return (
    <main className="bof-mkt-root bg-slate-950 text-white min-h-screen py-12">
      <div className="bof-mkt-container">
        {/* HERO */}
        <header className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-400">BOF Driver Careers Portal</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            CAREERS WITH BOF FLEET PARTNERS
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Apply directly to verified CDL-A driver openings with late-model equipment, top-tier compensation, and predictable home time.
          </p>
        </header>

        {/* APPLICATION SUCCESS CONFIRMATION */}
        {submittedAppId ? (
          <section className="mb-12 rounded-2xl border border-emerald-500/60 bg-emerald-950/40 p-8 text-emerald-100 shadow-xl">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Application Received</span>
            <h2 className="mt-2 text-3xl font-black text-white">APPLICATION SUBMITTED SUCCESSFULLY</h2>
            <p className="mt-3 text-sm text-emerald-200">
              Thank you, <strong className="text-white">{name}</strong>. Your application has been securely validated and entered into the BOF Recruiting Queue.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-800/80 bg-slate-950 p-6 text-xs space-y-2">
              <p><strong className="text-slate-400">Application ID:</strong> <span className="font-mono text-emerald-400 font-bold">{submittedAppId}</span></p>
              <p><strong className="text-slate-400">Position Applied For:</strong> {selectedPosition?.title} ({selectedPosition?.id})</p>
              <p><strong className="text-slate-400">Submission Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong className="text-slate-400">Application Source:</strong> BOF Careers Portal</p>
              <p><strong className="text-slate-400">Next Step:</strong> A BOF Recruiter will conduct an initial qualification review and follow up via email ({email}).</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedAppId(null);
                  setSelectedPosition(null);
                  setName("");
                  setEmail("");
                  setPhone("");
                  setCdlNumber("");
                }}
                className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary text-xs"
              >
                Apply for Another Position
              </button>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary text-xs">
                VIEW APPLICATION IN BOF RECRUITING &rarr;
              </Link>
            </div>
          </section>
        ) : selectedPosition ? (
          /* APPLICANT SUBMISSION FORM */
          <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl max-w-3xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Secure Driver Application</span>
                <h2 className="text-2xl font-bold text-white mt-1">Apply for {selectedPosition.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                &larr; Back to Openings
              </button>
            </div>

            {errorMessages.length > 0 ? (
              <div className="mb-6 rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
                <p className="mb-1">Submission Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errorMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Bot Honeypot Field (Hidden) */}
              <input
                type="text"
                name="website_hp"
                value={websiteHp}
                onChange={(e) => setWebsiteHp(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="e.g. Michael Anderson"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="e.g. driver@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="(216) 555-0182"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">City / State *</label>
                  <input
                    type="text"
                    value={homeLocation}
                    onChange={(e) => setHomeLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="e.g. Cleveland, OH"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">CDL Class *</label>
                  <select
                    value={cdlClass}
                    onChange={(e) => setCdlClass(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  >
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">CDL State *</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={cdlState}
                    onChange={(e) => setCdlState(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="OH"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">CDL Number *</label>
                  <input
                    type="text"
                    value={cdlNumber}
                    onChange={(e) => setCdlNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                    placeholder="OH1234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Years of Verifiable CDL-A Experience *</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950"
                    required
                  />
                  <span>
                    I certify that all information provided in this application is true and complete. I consent to BOF collecting my qualification information for initial applicant screening.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedPosition(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary disabled:opacity-50"
                >
                  {submitting ? "SUBMITTING &amp; VALIDATING..." : "SUBMIT APPLICATION &rarr;"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* OPEN POSITIONS LIST */
          <section className="space-y-6">
            <h2 className="text-2xl font-extrabold text-white">Active Open Positions ({positions.length})</h2>

            <div className="grid gap-6 md:grid-cols-2">
              {positions.map((pos) => (
                <article key={pos.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-teal-900/50 border border-teal-700/50 px-3 py-1 text-xs font-bold text-teal-300 uppercase">
                        {pos.employmentType}
                      </span>
                      <span className="font-mono text-xs text-slate-400">Posting ID: {pos.id}</span>
                    </div>

                    <h3 className="mt-4 text-2xl font-bold text-white">{pos.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-300">Location: {pos.location} · {pos.homeTime}</p>

                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs text-slate-300">
                      <p><strong className="text-slate-400">Compensation:</strong> <span className="text-emerald-400 font-bold">{pos.compensation}</span></p>
                      <p><strong className="text-slate-400">Equipment:</strong> {pos.equipment}</p>
                      <p><strong className="text-slate-400">Primary Lanes:</strong> {pos.primaryLanes}</p>
                      <p><strong className="text-slate-400">Experience Required:</strong> {pos.experienceYears} Years {pos.cdlClass} CDL</p>
                    </div>

                    <div className="mt-4">
                      <strong className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Benefits:</strong>
                      <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-300">
                        {pos.benefits.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">Application Source: BOF Careers Portal</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPosition(pos)}
                      className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary text-xs"
                    >
                      APPLY NOW &rarr;
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
