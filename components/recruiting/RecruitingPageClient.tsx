"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRecruitingStore } from "@/lib/stores/recruiting-store";
import { DEMO_JOB_POSTINGS, type JobBoardDestinationConfig } from "@/lib/job-board-distribution";

export function RecruitingPageClient() {
  const {
    positions,
    candidates,
    createPosition,
    updateCandidateStage,
    toggleOnboardingCheckitem,
    activateCandidateAsDriver,
  } = useRecruitingStore();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("CAND-001");
  const [activeTab, setActiveTab] = useState<"pipeline" | "position-builder" | "job-distribution" | "candidate-detail" | "onboarding">("pipeline");

  // Position Builder Form State
  const [posTitle, setPosTitle] = useState("CDL-A OTR Regional Driver");
  const [posOpenings, setPosOpenings] = useState(2);
  const [posLocation, setPosLocation] = useState("Cleveland, OH");
  const [posFreight, setPosFreight] = useState("Refrigerated & Dry Freight");
  const [posLanes, setPosLanes] = useState("Midwest → Southeast");
  const [posPay, setPosPay] = useState("$0.65 CPM + $1,250 Weekly Guarantee");
  const [posCreatedMessage, setPosCreatedMessage] = useState<string | null>(null);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  const selectedPosition = positions.find((p) => p.id === selectedCandidate?.positionId) || positions[0];

  const completedChecklistCount = selectedCandidate?.onboardingChecklist.filter((i) => i.completed).length || 0;
  const totalChecklistCount = selectedCandidate?.onboardingChecklist.length || 10;
  const onboardingPct = Math.round((completedChecklistCount / totalChecklistCount) * 100);

  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = createPosition({
      title: posTitle,
      department: "Fleet Operations",
      location: posLocation,
      openings: Number(posOpenings),
      employmentType: "Full-Time W-2",
      homeTime: "Weekly",
      equipment: "2024 Freightliner Cascadia",
      freightType: posFreight,
      primaryLanes: posLanes,
      schedule: "5-6 Days On, 34-Hr Restart",
      compensation: posPay,
      benefits: ["Health, Dental & Vision", "401(k) Match", "PTO"],
      minimumQualifications: ["Valid Class A CDL", "Clean MVR", "2 Years OTR Experience"],
      cdlClass: "Class A",
      experienceYears: 2,
      endorsements: [],
      safetyExpectations: "Zero recordable accidents in last 24 months.",
      physicalRequirements: "Pre-trip inspections & seal verifications.",
      applicationInstructions: "Apply via BOF Recruiting Portal.",
    });
    setPosCreatedMessage(`Position ${newId} created successfully! Job posting package is ready.`);
    setTimeout(() => setPosCreatedMessage(null), 5000);
  };

  return (
    <div className="bof-page bg-slate-950 text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-400">BOF Back-Office Workforce Engine</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              RECRUITING &amp; ONBOARDING
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage workforce need, job creation, applicant screening, qualification review, offer assembly, onboarding, and driver activation before operational dispatch.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pipeline")}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "pipeline"
                  ? "border-teal-500 bg-teal-950/60 text-teal-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              Recruiting Pipeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("position-builder")}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "position-builder"
                  ? "border-teal-500 bg-teal-950/60 text-teal-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              + Create Position
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("job-distribution")}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "job-distribution"
                  ? "border-teal-500 bg-teal-950/60 text-teal-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              Job Distribution Center
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("onboarding")}
              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "onboarding"
                  ? "border-teal-500 bg-teal-950/60 text-teal-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              Onboarding ({onboardingPct}%)
            </button>
          </div>
        </div>
      </header>

      {/* RECRUITING PIPELINE TAB */}
      {activeTab === "pipeline" && (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Positions</span>
              <p className="mt-2 text-3xl font-extrabold text-white">{positions.length}</p>
              <p className="mt-1 text-xs text-slate-400">Active workforce openings</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applicants</span>
              <p className="mt-2 text-3xl font-extrabold text-teal-400">{candidates.length}</p>
              <p className="mt-1 text-xs text-slate-400">In qualification pipeline</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding Progress</span>
              <p className="mt-2 text-3xl font-extrabold text-sky-400">{onboardingPct}%</p>
              <p className="mt-1 text-xs text-slate-400">Candidate {selectedCandidate?.name}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operations Handoff</span>
              <p className="mt-2 text-3xl font-extrabold text-emerald-400">
                {selectedCandidate?.pipelineStage === "ACTIVATED" ? "ACTIVE" : "READY"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Driver activation gate</p>
            </div>
          </div>

          {/* PIPELINE STAGES VISUAL BAR */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Driver Recruitment &amp; Qualification Pipeline</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 text-xs font-semibold text-center">
              {[
                ["01. APPLIED", "APPLICATION_RECEIVED"],
                ["02. SCREEN", "SCREENING"],
                ["03. QUALIFY", "QUALIFICATION_REVIEW"],
                ["04. INTERVIEW", "INTERVIEW"],
                ["05. OFFER SENT", "OFFER_SENT"],
                ["06. ACCEPTED", "OFFER_ACCEPTED"],
                ["07. ONBOARDING", "ONBOARDING"],
                ["08. ACTIVATED", "ACTIVATED"],
              ].map(([label, stageKey]) => {
                const isActive = selectedCandidate?.pipelineStage === stageKey;
                return (
                  <div
                    key={stageKey}
                    className={`rounded-xl border p-3 transition ${
                      isActive
                        ? "border-teal-500 bg-teal-950/80 text-teal-200 shadow-md"
                        : "border-slate-800 bg-slate-950/40 text-slate-400"
                    }`}
                  >
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CANDIDATES TABLE & DETAIL */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Candidate Roster */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Active Candidate Applications</h2>
              <div className="space-y-3">
                {candidates.map((cand) => {
                  const isSelected = cand.id === selectedCandidateId;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setActiveTab("candidate-detail");
                      }}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-teal-500 bg-teal-950/30"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong className="text-base font-bold text-white">{cand.name}</strong>
                          <span className="ml-2 font-mono text-xs text-slate-400">({cand.id})</span>
                        </div>
                        <span className="rounded-full bg-teal-900/50 border border-teal-700/50 px-3 py-0.5 text-xs font-bold text-teal-200 uppercase">
                          {cand.pipelineStage.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        {cand.positionTitle} · {cand.homeLocation} · {cand.experienceYears} Yrs CDL-A
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>Med Card: <strong className="text-emerald-400">{cand.medCardStatus}</strong></span>
                        <span>·</span>
                        <span>MVR: <strong className="text-emerald-400">{cand.mvrStatus}</strong></span>
                        <span>·</span>
                        <span>Background: <strong className="text-emerald-400">{cand.backgroundStatus}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Position Overview Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Position Overview: {selectedPosition?.title}</h2>
              <div className="space-y-4 text-xs text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <span className="font-bold text-slate-400 uppercase">Position Details</span>
                  <p className="mt-1 text-sm font-bold text-white">{selectedPosition?.title} ({selectedPosition?.id})</p>
                  <p className="mt-1 text-slate-300">Location: {selectedPosition?.location} · Openings: {selectedPosition?.openings}</p>
                  <p className="mt-1 text-slate-300">Lanes: {selectedPosition?.primaryLanes}</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <span className="font-bold text-slate-400 uppercase">Compensation &amp; Equipment</span>
                  <p className="mt-1 text-sm font-bold text-emerald-400">{selectedPosition?.compensation}</p>
                  <p className="mt-1 text-slate-300">Equipment: {selectedPosition?.equipment}</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <span className="font-bold text-slate-400 uppercase">Job Board Distribution Center</span>
                  <p className="mt-1 text-xs font-semibold text-sky-400">
                    CANONICAL POSTING JOB-001 (POS-001)
                  </p>
                  <div className="mt-3 space-y-2">
                    {Object.values(DEMO_JOB_POSTINGS[0].destinations).map((dest: JobBoardDestinationConfig) => (
                      <div key={dest.providerId} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                        <span className="font-bold text-white">{dest.providerName}</span>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          dest.status === "PUBLISHED" ? "bg-emerald-950 text-emerald-300 border border-emerald-700" :
                          dest.status === "READY_TO_POST" ? "bg-amber-950 text-amber-300 border border-amber-700" :
                          "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {dest.statusLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("job-distribution")}
                      className="text-xs font-bold text-teal-400 hover:underline"
                    >
                      Open Job Distribution Center &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CREATE POSITION TAB */}
      {activeTab === "position-builder" && (
        <section className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Step 1 &amp; 2 — Workforce Need &amp; Job Description Builder</h2>
          <p className="text-sm text-slate-400 mb-6">Create a new position and generate a structured BOF Job Description &amp; Posting Package.</p>

          {posCreatedMessage ? (
            <div className="mb-6 rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-sm font-bold text-emerald-200">
              {posCreatedMessage}
            </div>
          ) : null}

          <form onSubmit={handleCreatePosition} className="space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Position Title</label>
                <input
                  type="text"
                  value={posTitle}
                  onChange={(e) => setPosTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Openings</label>
                <input
                  type="number"
                  value={posOpenings}
                  onChange={(e) => setPosOpenings(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Home Terminal / Location</label>
                <input
                  type="text"
                  value={posLocation}
                  onChange={(e) => setPosLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Freight Type</label>
                <input
                  type="text"
                  value={posFreight}
                  onChange={(e) => setPosFreight(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Primary Lanes</label>
                <input
                  type="text"
                  value={posLanes}
                  onChange={(e) => setPosLanes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Compensation</label>
                <input
                  type="text"
                  value={posPay}
                  onChange={(e) => setPosPay(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
              >
                GENERATE JOB DESCRIPTION &amp; POSTING PACKAGE &rarr;
              </button>
            </div>
          </form>
        </section>
      )}

      {/* JOB BOARD DISTRIBUTION CENTER TAB */}
      {activeTab === "job-distribution" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Canonical Posting JOB-001 (POS-001)
                </span>
                <h2 className="text-2xl font-extrabold text-white">JOB BOARD DISTRIBUTION CENTER</h2>
                <p className="text-xs text-slate-300">
                  Review normalized job distribution packages, internal BOF Careers publication, and external API adapter connection states.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/careers"
                  className="inline-flex rounded-lg border border-emerald-500/60 bg-emerald-950/60 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-900"
                >
                  VIEW LIVE BOF CAREERS PORTAL &rarr;
                </Link>
              </div>
            </div>

            {/* DISTRIBUTION DESTINATIONS GRID */}
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.values(DEMO_JOB_POSTINGS[0].destinations).map((dest: JobBoardDestinationConfig) => (
                <div
                  key={dest.providerId}
                  className={`rounded-2xl border p-5 flex flex-col justify-between ${
                    dest.status === "PUBLISHED"
                      ? "border-emerald-500/60 bg-emerald-950/20"
                      : dest.status === "READY_TO_POST"
                        ? "border-amber-500/60 bg-amber-950/20"
                        : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-base font-bold text-white">{dest.providerName}</strong>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        dest.status === "PUBLISHED"
                          ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                          : dest.status === "READY_TO_POST"
                            ? "border-amber-500 bg-amber-950 text-amber-300"
                            : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}>
                        {dest.statusLabel}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-300">{dest.statusDetail}</p>

                    {dest.lastSyncAt ? (
                      <p className="mt-2 text-[10px] font-mono text-emerald-400">
                        Last Synced: {new Date(dest.lastSyncAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 border-t border-slate-800/80 pt-4">
                    {dest.isInternal ? (
                      <Link
                        href="/careers"
                        className="inline-block text-xs font-bold text-emerald-400 hover:underline"
                      >
                        Open Live Careers Listing &rarr;
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          alert(`${dest.providerName} API connection required. Secret token environment variable is not configured.`);
                        }}
                        className="text-xs font-bold text-amber-400 hover:underline"
                      >
                        Publish to {dest.providerName} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CANONICAL POSTING PACKAGE REVIEW */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-6 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white text-sm">Normalized Canonical BOF Job Package (JOB-001)</span>
                <span className="font-mono text-teal-400">Status: ACTIVE</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <span className="text-slate-500 block">Title &amp; Position</span>
                  <p className="text-sm font-bold text-white mt-0.5">{DEMO_JOB_POSTINGS[0].title} ({DEMO_JOB_POSTINGS[0].positionId})</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Location &amp; Home Time</span>
                  <p className="text-sm font-bold text-white mt-0.5">{DEMO_JOB_POSTINGS[0].location} · {DEMO_JOB_POSTINGS[0].homeTime}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Compensation</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{DEMO_JOB_POSTINGS[0].compensation}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CANDIDATE DETAIL TAB */}
      {activeTab === "candidate-detail" && selectedCandidate && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Candidate Profile ({selectedCandidate.id})
                </span>
                <h2 className="text-2xl font-extrabold text-white">{selectedCandidate.name}</h2>
                <p className="text-xs text-slate-300">
                  Applied: {selectedCandidate.appliedDate} · Location: {selectedCandidate.homeLocation} · Contact: {selectedCandidate.email} | {selectedCandidate.phone}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateCandidateStage(selectedCandidate.id, "QUALIFICATION_REVIEW")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  Qualify
                </button>
                <button
                  type="button"
                  onClick={() => updateCandidateStage(selectedCandidate.id, "INTERVIEW")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  Interview
                </button>
                <button
                  type="button"
                  onClick={() => updateCandidateStage(selectedCandidate.id, "OFFER_SENT")}
                  className="rounded-lg border border-teal-600 bg-teal-950 px-3 py-1.5 text-xs font-bold text-teal-200 hover:bg-teal-900"
                >
                  Send Offer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(selectedCandidate.id, "ONBOARDING");
                    setActiveTab("onboarding");
                  }}
                  className="rounded-lg border border-sky-600 bg-sky-950 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-900"
                >
                  Start Onboarding
                </button>
              </div>
            </div>

            {/* Offer Artifact Preview */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs">
              <h3 className="font-bold text-white mb-2 text-sm">Generated Employment Offer Artifact</h3>
              {selectedCandidate.offerDetails ? (
                <div className="grid gap-3 sm:grid-cols-4 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Rate / Pay</span>
                    <strong className="text-emerald-400 text-sm">{selectedCandidate.offerDetails.salaryCPM}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Weekly Guarantee</span>
                    <strong className="text-white text-sm">{selectedCandidate.offerDetails.weeklyGuarantee}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sign-On Bonus</span>
                    <strong className="text-white text-sm">{selectedCandidate.offerDetails.signOnBonus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Start Date</span>
                    <strong className="text-white text-sm">{selectedCandidate.offerDetails.startDate}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">Offer details can be generated upon completing interview &amp; qualification review.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ONBOARDING & ACTIVATION TAB */}
      {activeTab === "onboarding" && selectedCandidate && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Step 09 &amp; 10 — Onboarding &amp; Driver Activation
                </span>
                <h2 className="text-2xl font-extrabold text-white">Onboarding Checklist: {selectedCandidate.name}</h2>
                <p className="text-xs text-slate-300">
                  Progress: {completedChecklistCount} of {totalChecklistCount} Completed ({onboardingPct}%)
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const driverId = activateCandidateAsDriver(selectedCandidate.id);
                  alert(`Driver activated! Created canonical demo driver ${driverId}. Driver is now available for operations.`);
                }}
                className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
              >
                ACTIVATE DRIVER FOR OPERATIONS &rarr;
              </button>
            </div>

            {/* Checklist */}
            <div className="mt-6 space-y-2">
              {selectedCandidate.onboardingChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleOnboardingCheckitem(selectedCandidate.id, item.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition ${
                    item.completed
                      ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-200"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-bold ${
                      item.completed ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-600 bg-slate-900 text-slate-400"
                    }`}>
                      {item.completed ? "✓" : ""}
                    </span>
                    <span className="font-semibold">{item.label}</span>
                  </div>

                  {item.verifiedAt ? (
                    <span className="text-[10px] font-mono text-emerald-400">Verified: {item.verifiedAt}</span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Pending Verification</span>
                  )}
                </div>
              ))}
            </div>

            {/* CRITICAL HANDOFF TO OPERATIONS */}
            {selectedCandidate.pipelineStage === "ACTIVATED" && (
              <div className="mt-8 rounded-2xl border border-emerald-500/60 bg-emerald-950/40 p-6 text-emerald-100">
                <h3 className="text-xl font-black text-white">DRIVER ACTIVATED &amp; HANDED OFF TO OPERATIONS</h3>
                <p className="mt-2 text-xs leading-relaxed text-emerald-200">
                  Driver <strong className="text-white">{selectedCandidate.name}</strong> ({selectedCandidate.activatedDriverId}) is now active in the BOF Driver Master. All qualification documents have transitioned to the driver&apos;s BOF Vault record.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/drivers/${selectedCandidate.activatedDriverId || "DRV-001"}`}
                    className="inline-flex rounded-lg border border-emerald-400 bg-emerald-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    VIEW DRIVER PROFILE IN BOF VAULT &rarr;
                  </Link>
                  <Link
                    href="/loads"
                    className="inline-flex rounded-lg border border-teal-400 bg-teal-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                  >
                    ASSIGN LOAD IN DISPATCH &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
