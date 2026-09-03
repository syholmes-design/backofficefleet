import Link from "next/link";
import { RecruitingV2ActivationApiPanel } from "@/components/recruiting-v2/RecruitingV2ActivationApiPanel";
import { RecruitingV2DocumentApiPanel } from "@/components/recruiting-v2/RecruitingV2DocumentApiPanel";
import { RecruitingV2InterviewApiPanel } from "@/components/recruiting-v2/RecruitingV2InterviewApiPanel";
import { RecruitingV2OnboardingApiPanel } from "@/components/recruiting-v2/RecruitingV2OnboardingApiPanel";
import { RecruitingV2OfferApiPanel } from "@/components/recruiting-v2/RecruitingV2OfferApiPanel";
import { RecruitingV2QualificationApiPanel } from "@/components/recruiting-v2/RecruitingV2QualificationApiPanel";
import {
  RECRUITING_V2_WORKSPACES,
  getRecruitingV2Candidate,
  getRecruitingV2Position,
  recruitingV2Candidates,
  recruitingV2Positions,
  type RecruitingV2Candidate,
  type RecruitingV2RequirementStatus,
  type RecruitingV2WorkspaceKey,
} from "@/lib/recruiting-v2/recruiting-v2-demo-data";

type Props = {
  candidateId?: string;
  workspace?: RecruitingV2WorkspaceKey;
};

const actionWorkspaces = [
  { label: "Qualification", workspace: "qualification" as const },
  { label: "Documents", workspace: "documents" as const },
  { label: "Interview", workspace: "interview" as const },
  { label: "Offer", workspace: "offer" as const },
  { label: "Onboarding", workspace: "onboarding" as const },
  { label: "Activation", workspace: "activation" as const },
];

function statusClass(status: RecruitingV2RequirementStatus | string) {
  if (status === "READY" || status === "COMPLETE") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-100";
  if (status === "BLOCKED" || status === "NOT_PROVIDED") return "border-rose-500/50 bg-rose-950/40 text-rose-100";
  if (status === "UNDER_REVIEW" || status === "PENDING") return "border-amber-500/50 bg-amber-950/40 text-amber-100";
  return "border-slate-700 bg-slate-900 text-slate-200";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function workspaceTitle(workspace: RecruitingV2WorkspaceKey) {
  return `${RECRUITING_V2_WORKSPACES.find((item) => item.key === workspace)?.label ?? workspace} Workspace`;
}

function currentDecision(candidate: RecruitingV2Candidate, workspace: RecruitingV2WorkspaceKey) {
  if (workspace === "offer") {
    return "Offer decision loads from the Recruiting V2 API";
  }
  if (workspace === "onboarding") {
    return "Onboarding decision loads from the Recruiting V2 API";
  }
  if (workspace === "activation") {
    return "Activation readiness loads from the Recruiting V2 API";
  }
  if (workspace === "interview") {
    return "Interview records load from the Recruiting V2 API";
  }
  if (workspace === "documents") {
    return "Document gate state loads from the Recruiting V2 API";
  }
  if (workspace === "qualification") {
    return "Qualification decision loads from the Recruiting V2 API";
  }
  const rows = relevantRequirements(candidate, workspace);
  return rows.every((row) => row.status === "READY" || row.status === "COMPLETE")
    ? "Requirements are ready for next review"
    : "Requirements remain open";
}

function nextAction(candidate: RecruitingV2Candidate, workspace: RecruitingV2WorkspaceKey) {
  if (workspace === "offer") return "Review the API-backed offer decision and qualification prerequisite.";
  if (workspace === "interview") return "Review the latest API-backed interview record or schedule an interview if none exists.";
  if (workspace === "documents") return "Review the API-backed document gate summary and register missing document metadata.";
  if (workspace === "qualification") return "Review the API-backed candidate qualification decision and resolve the top blocking or pending item.";
  if (workspace === "onboarding") return "Review the API-backed onboarding decision and activation readiness summary.";
  if (workspace === "activation") return "Review the API-backed activation readiness result and Paylocity preview payload.";
  return relevantRequirements(candidate, workspace).find((row) => row.status === "PENDING" || row.status === "NOT_PROVIDED" || row.status === "BLOCKED")?.nextAction ?? "Advance to the next workflow step.";
}

function relevantRequirements(candidate: RecruitingV2Candidate, workspace: RecruitingV2WorkspaceKey) {
  if (workspace === "documents") return candidate.requirements;
  if (workspace === "qualification") return candidate.requirements.filter((row) => ["application", "qualification", "medical", "mvr", "fmcsa"].includes(row.workspace));
  if (["application", "fmcsa", "medical", "mvr", "i9", "w9", "onboarding"].includes(workspace)) {
    return candidate.requirements.filter((row) => row.workspace === workspace || (workspace === "application" && row.id === "app"));
  }
  return candidate.requirements.filter((row) => ["app", "cdl", "medical", "mvr", "fmcsa", "w9"].includes(row.id));
}

function RequirementRows({ candidate, workspace }: { candidate: RecruitingV2Candidate; workspace: RecruitingV2WorkspaceKey }) {
  const rows = relevantRequirements(candidate, workspace);
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Generic template</p>
              <h3 className="mt-1 font-bold text-white">{row.templateLabel}</h3>
              {row.templateHref ? (
                <Link href={row.templateHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">
                  Open Template
                </Link>
              ) : (
                <span className="mt-2 inline-flex rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-xs font-black text-amber-100">Template not configured</span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Candidate workspace</p>
              <h3 className="mt-1 font-bold text-white">{candidate.name} · {candidate.id}</h3>
              <p className="mt-1 text-sm text-slate-300">{row.candidateRecord}</p>
              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>{formatStatus(row.status)}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Review / decision</p>
              <p className="mt-1 text-sm text-slate-200"><strong>Review:</strong> {row.reviewState}</p>
              <p className="mt-1 text-sm text-slate-200"><strong>Decision:</strong> {row.decision}</p>
              <p className="mt-1 text-sm text-slate-300"><strong>Next:</strong> {row.nextAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CandidateActions({ candidate, activeWorkspace }: { candidate: RecruitingV2Candidate; activeWorkspace?: RecruitingV2WorkspaceKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actionWorkspaces.map((action) => (
        <Link key={action.workspace} href={`/recruiting-v2/candidates/${candidate.id}/${action.workspace}`} className={`rounded-md border px-3 py-2 text-xs font-black hover:bg-teal-900/50 ${activeWorkspace === action.workspace ? "border-teal-400 bg-teal-900/70 text-white" : "border-teal-700 bg-teal-950/35 text-teal-100"}`}>
          {action.label}
        </Link>
      ))}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: RecruitingV2Candidate }) {
  const position = getRecruitingV2Position(candidate.positionCode);
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Candidate</p>
          <h2 className="mt-1 text-xl font-black text-white">{candidate.name}</h2>
          <p className="mt-1 text-sm text-slate-300">{candidate.id} · {candidate.homeLocation} · {candidate.cdlClass} {candidate.cdlState}</p>
          <p className="mt-1 text-xs text-slate-400">{position?.title} · {candidate.positionCode}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(candidate.qualificationStatus)}`}>{formatStatus(candidate.activationStage)}</span>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
        <span>Application: <strong className="text-white">{formatStatus(candidate.applicationStatus)}</strong></span>
        <span>Compliance: <strong className="text-white">{formatStatus(candidate.complianceStatus)}</strong></span>
        <span>Offer: <strong className="text-white">{formatStatus(candidate.offerStatus)}</strong></span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/recruiting-v2/candidates/${candidate.id}`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800">Open Candidate</Link>
        <CandidateActions candidate={candidate} />
      </div>
    </article>
  );
}

export function RecruitingV2App({ candidateId, workspace }: Props) {
  const candidate = candidateId ? getRecruitingV2Candidate(candidateId) : null;
  const position = candidate ? getRecruitingV2Position(candidate.positionCode) : null;

  if (candidate && workspace) {
    return (
      <main className="bof-recruiting-v2-shell min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <nav className="bof-breadcrumb mb-5" aria-label="Breadcrumb">
          <Link href="/recruiting-v2">Recruiting V2</Link>
          <span aria-hidden> / </span>
          <Link href={`/recruiting-v2/candidates/${candidate.id}`}>{candidate.name}</Link>
          <span aria-hidden> / </span>
          <span>{workspaceTitle(workspace)}</span>
        </nav>

        <section className="rounded-2xl border border-teal-900/70 bg-slate-900/75 p-5 shadow-2xl md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">BOF Recruiting V2 · You are now in</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{workspaceTitle(workspace).toUpperCase()}</h1>
              <p className="mt-2 text-sm font-bold text-slate-200">{candidate.name} · {candidate.id} · {position?.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/recruiting-v2/candidates/${candidate.id}`} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800">Back to Candidate</Link>
              <CandidateActions candidate={candidate} activeWorkspace={workspace} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Workspace purpose</p>
              <h2 className="mt-1 text-xl font-black text-white">{workspaceTitle(workspace)}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operational Question</p><p className="mt-1 text-sm text-slate-100">Can this candidate move from {formatStatus(candidate.activationStage).toLowerCase()} through {workspaceTitle(workspace).toLowerCase()} without hiding missing requirements?</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operational Briefing</p><p className="mt-1 text-sm text-slate-100">Review candidate-specific records and generic templates separately. Do not treat a template as evidence.</p></div>
                <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Current Decision</p><p className="mt-1 text-sm font-bold text-amber-50">{currentDecision(candidate, workspace)}</p></div>
                <div className="rounded-lg border border-teal-800/70 bg-teal-950/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Next Required Action</p><p className="mt-1 text-sm font-bold text-teal-50">{nextAction(candidate, workspace)}</p></div>
              </div>
            </section>

            <aside className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Operational summary</p>
              <h2 className="mt-1 text-xl font-black text-white">{candidate.name}</h2>
              <div className="mt-4 grid gap-2 text-sm text-slate-200">
                <p><strong className="text-slate-500">Candidate ID:</strong> {candidate.id}</p>
                <p><strong className="text-slate-500">Position:</strong> {candidate.positionCode}</p>
                <p><strong className="text-slate-500">CDL:</strong> {candidate.cdlClass} {candidate.cdlState} · {candidate.cdlNumberMasked}</p>
                <p><strong className="text-slate-500">Application:</strong> {candidate.applicationSummary.completeness}% complete</p>
                <p><strong className="text-slate-500">Activation:</strong> {formatStatus(candidate.activationStage)}</p>
              </div>
            </aside>
          </div>

          {workspace === "interview" ? <RecruitingV2InterviewApiPanel candidateId={candidate.id} /> : null}

          {workspace === "documents" ? <RecruitingV2DocumentApiPanel candidateId={candidate.id} /> : null}

          {workspace === "qualification" ? <RecruitingV2QualificationApiPanel candidateId={candidate.id} /> : null}

          {workspace === "offer" ? <RecruitingV2OfferApiPanel candidateId={candidate.id} /> : null}

          {workspace === "activation" ? <RecruitingV2ActivationApiPanel candidateId={candidate.id} /> : null}

          {workspace === "onboarding" ? <RecruitingV2OnboardingApiPanel candidateId={candidate.id} /> : null}

          {workspace !== "documents" && workspace !== "qualification" && workspace !== "offer" && workspace !== "activation" && workspace !== "onboarding" ? <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Operational record viewer</p>
                <h2 className="mt-1 text-xl font-black text-white">Template → candidate workspace → review → decision</h2>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-200">{relevantRequirements(candidate, workspace).length} requirement rows</span>
            </div>
            <div className="mt-4"><RequirementRows candidate={candidate} workspace={workspace} /></div>
          </section> : null}

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Business impact</p><p className="mt-3 text-sm text-slate-200">Candidate progression remains gated by visible document, compliance, offer, and onboarding state.</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational queues</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">{candidate.onboarding.openIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audit trail</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">{candidate.auditTrail.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>
        </section>
      </main>
    );
  }

  if (candidate) {
    return (
      <main className="bof-recruiting-v2-shell min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <nav className="bof-breadcrumb mb-5" aria-label="Breadcrumb"><Link href="/recruiting-v2">Recruiting V2</Link><span aria-hidden> / </span><span>{candidate.name}</span></nav>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Candidate profile</p><h1 className="mt-2 text-3xl font-black text-white">{candidate.name}</h1><p className="mt-2 text-sm text-slate-300">{candidate.id} · {candidate.homeLocation} · {position?.title}</p></div>
            <CandidateActions candidate={candidate} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Application</p><p className="mt-2 text-2xl font-black text-white">{candidate.applicationSummary.completeness}%</p><p className="mt-2 text-sm text-slate-300">{candidate.applicationSummary.employmentHistory}</p><Link href={`/recruiting-v2/candidates/${candidate.id}/application`} className="mt-3 inline-flex text-sm font-black text-teal-200">Open Application Workspace →</Link></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Current decision</p><p className="mt-2 text-lg font-black text-white">{currentDecision(candidate, "qualification")}</p><p className="mt-2 text-sm text-slate-300">{nextAction(candidate, "qualification")}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Driver activation gate</p><p className="mt-2 text-lg font-black text-white">{formatStatus(candidate.activationStage)}</p><p className="mt-2 text-sm text-slate-300">Driver record is not created by this workspace; activation remains gated.</p></div>
          </div>
          <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4"><h2 className="text-xl font-black text-white">Workspace tabs</h2><div className="mt-3 flex flex-wrap gap-2">{RECRUITING_V2_WORKSPACES.map((item) => <Link key={item.key} href={`/recruiting-v2/candidates/${candidate.id}/${item.key}`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800">{item.label}</Link>)}</div></section>
        </section>
      </main>
    );
  }

  return (
    <main className="bof-recruiting-v2-shell min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-teal-900/70 bg-slate-900/75 p-5 shadow-2xl md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Isolated development namespace</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">BOF Recruiting V2</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Applicant to qualification to interview to document review to compliance to offer to onboarding to driver activation readiness. This is isolated from the current /recruiting system.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{recruitingV2Positions.map((position) => <div key={position.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><h2 className="font-black text-white">{position.title}</h2><p className="mt-1 text-sm text-slate-300">{position.positionCode} · {position.homeTerminal}</p><p className="mt-2 text-sm text-slate-400">{position.description}</p></div>)}</div>
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">{recruitingV2Candidates.map((candidateRow) => <CandidateCard key={candidateRow.id} candidate={candidateRow} />)}</section>
    </main>
  );
}